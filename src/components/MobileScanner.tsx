import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Square, RotateCcw, Check, X, Plus, FileText, Loader, Crop, Zap, Download } from 'lucide-react';
import jsPDF from 'jspdf';

interface ScannedPage {
  id: string;
  originalImage: string;
  processedImage: string;
  canvas?: HTMLCanvasElement;
}

interface MobileScannerProps {
  onScanComplete: (pdfBlob: Blob, fileName: string) => void;
  onClose: () => void;
}

export const MobileScanner: React.FC<MobileScannerProps> = ({ onScanComplete, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [currentStep, setCurrentStep] = useState<'camera' | 'preview' | 'processing'>('camera');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [openCVReady, setOpenCVReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load OpenCV.js
  useEffect(() => {
    const loadOpenCV = async () => {
      try {
        // Check if OpenCV is already loaded
        if (window.cv) {
          setOpenCVReady(true);
          return;
        }

        // Load OpenCV.js from CDN
        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
        script.async = true;
        
        script.onload = () => {
          // Wait for OpenCV to be ready
          const checkOpenCV = () => {
            if (window.cv && window.cv.Mat) {
              setOpenCVReady(true);
            } else {
              setTimeout(checkOpenCV, 100);
            }
          };
          checkOpenCV();
        };

        script.onerror = () => {
          setError('Failed to load OpenCV. Edge detection will be limited.');
          setOpenCVReady(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        setError('Failed to load OpenCV. Edge detection will be limited.');
        setOpenCVReady(false);
      }
    };

    loadOpenCV();
  }, []);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      
      const constraints = {
        video: {
          facingMode: 'environment', // Use rear camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  }, []);

  // Cleanup camera
  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (currentStep === 'camera') {
      initializeCamera();
    } else {
      cleanupCamera();
    }

    return () => {
      cleanupCamera();
    };
  }, [currentStep, initializeCamera, cleanupCamera]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    // Process the image
    processImage(imageData, canvas);
  }, [cameraReady]);

  // Process image with edge detection and enhancement
  const processImage = async (imageData: string, originalCanvas: HTMLCanvasElement) => {
    setProcessing(true);
    
    try {
      let processedCanvas = originalCanvas;
      let processedImageData = imageData;

      // If OpenCV is available, perform edge detection and cropping
      if (openCVReady && window.cv) {
        processedCanvas = await performEdgeDetection(originalCanvas);
        processedImageData = processedCanvas.toDataURL('image/jpeg', 0.9);
      }

      // Enhance image quality
      const enhancedCanvas = enhanceImage(processedCanvas);
      const enhancedImageData = enhancedCanvas.toDataURL('image/jpeg', 0.9);

      // Create new scanned page
      const newPage: ScannedPage = {
        id: Date.now().toString(),
        originalImage: imageData,
        processedImage: enhancedImageData,
        canvas: enhancedCanvas
      };

      setScannedPages(prev => [...prev, newPage]);
      setCurrentStep('preview');
    } catch (err) {
      console.error('Image processing error:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Edge detection using OpenCV
  const performEdgeDetection = async (canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      try {
        const cv = window.cv;
        const src = cv.imread(canvas);
        const dst = new cv.Mat();
        const gray = new cv.Mat();
        const blur = new cv.Mat();
        const edges = new cv.Mat();
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();

        // Convert to grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // Apply Gaussian blur
        cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);

        // Edge detection
        cv.Canny(blur, edges, 50, 150);

        // Find contours
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // Find the largest rectangular contour (document)
        let maxArea = 0;
        let bestContour = null;

        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i);
          const area = cv.contourArea(contour);
          
          if (area > maxArea && area > 10000) { // Minimum area threshold
            const peri = cv.arcLength(contour, true);
            const approx = new cv.Mat();
            cv.approxPolyDP(contour, approx, 0.02 * peri, true);
            
            if (approx.rows === 4) { // Rectangular shape
              maxArea = area;
              bestContour = approx;
            }
            approx.delete();
          }
          contour.delete();
        }

        // If we found a good contour, perform perspective correction
        if (bestContour) {
          const resultCanvas = performPerspectiveCorrection(canvas, bestContour);
          
          // Cleanup
          src.delete();
          dst.delete();
          gray.delete();
          blur.delete();
          edges.delete();
          contours.delete();
          hierarchy.delete();
          bestContour.delete();
          
          resolve(resultCanvas);
        } else {
          // No good contour found, return original
          src.delete();
          dst.delete();
          gray.delete();
          blur.delete();
          edges.delete();
          contours.delete();
          hierarchy.delete();
          
          resolve(canvas);
        }
      } catch (err) {
        console.error('Edge detection error:', err);
        resolve(canvas);
      }
    });
  };

  // Perspective correction
  const performPerspectiveCorrection = (canvas: HTMLCanvasElement, contour: any): HTMLCanvasElement => {
    try {
      const cv = window.cv;
      const src = cv.imread(canvas);
      
      // Extract corner points
      const points = [];
      for (let i = 0; i < contour.rows; i++) {
        const point = contour.data32S.slice(i * 2, i * 2 + 2);
        points.push([point[0], point[1]]);
      }

      // Sort points: top-left, top-right, bottom-right, bottom-left
      points.sort((a, b) => a[1] - b[1]); // Sort by y
      const topPoints = points.slice(0, 2).sort((a, b) => a[0] - b[0]); // Sort top by x
      const bottomPoints = points.slice(2, 4).sort((a, b) => a[0] - b[0]); // Sort bottom by x

      const orderedPoints = [
        topPoints[0],    // top-left
        topPoints[1],    // top-right
        bottomPoints[1], // bottom-right
        bottomPoints[0]  // bottom-left
      ];

      // Calculate output dimensions
      const width = Math.max(
        Math.sqrt(Math.pow(orderedPoints[1][0] - orderedPoints[0][0], 2) + Math.pow(orderedPoints[1][1] - orderedPoints[0][1], 2)),
        Math.sqrt(Math.pow(orderedPoints[2][0] - orderedPoints[3][0], 2) + Math.pow(orderedPoints[2][1] - orderedPoints[3][1], 2))
      );
      
      const height = Math.max(
        Math.sqrt(Math.pow(orderedPoints[3][0] - orderedPoints[0][0], 2) + Math.pow(orderedPoints[3][1] - orderedPoints[0][1], 2)),
        Math.sqrt(Math.pow(orderedPoints[2][0] - orderedPoints[1][0], 2) + Math.pow(orderedPoints[2][1] - orderedPoints[1][1], 2))
      );

      // Create transformation matrix
      const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, orderedPoints.flat());
      const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        width, 0,
        width, height,
        0, height
      ]);

      const transformMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);
      const dst = new cv.Mat();

      cv.warpPerspective(src, dst, transformMatrix, new cv.Size(width, height));

      // Create output canvas
      const outputCanvas = document.createElement('canvas');
      cv.imshow(outputCanvas, dst);

      // Cleanup
      src.delete();
      dst.delete();
      srcPoints.delete();
      dstPoints.delete();
      transformMatrix.delete();

      return outputCanvas;
    } catch (err) {
      console.error('Perspective correction error:', err);
      return canvas;
    }
  };

  // Enhance image quality
  const enhanceImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply brightness and contrast enhancement
    const brightness = 20;
    const contrast = 1.2;

    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast and brightness
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + brightness));     // Red
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness)); // Green
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness)); // Blue
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  // Remove a scanned page
  const removePage = (pageId: string) => {
    setScannedPages(prev => prev.filter(page => page.id !== pageId));
  };

  // Add another page
  const addAnotherPage = () => {
    setCurrentStep('camera');
  };

  // Generate PDF from scanned pages
  const generatePDF = async () => {
    if (scannedPages.length === 0) return;

    setProcessing(true);
    
    try {
      const pdf = new jsPDF();
      let isFirstPage = true;

      for (const page of scannedPages) {
        if (!isFirstPage) {
          pdf.addPage();
        }

        // Calculate dimensions to fit page
        const canvas = page.canvas || document.createElement('canvas');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(page.processedImage, 'JPEG', 0, 0, imgWidth, imgHeight);
        isFirstPage = false;
      }

      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      const fileName = `scanned_invoice_${new Date().toISOString().slice(0, 10)}.pdf`;

      onScanComplete(pdfBlob, fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Render camera view
  const renderCameraView = () => (
    <div className="relative h-full flex flex-col">
      {/* Camera preview */}
      <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Overlay guide */}
        <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
          <div className="text-white text-center">
            <Square className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm opacity-75">Helyezze a számlát a keretbe</p>
          </div>
        </div>

        {/* Loading overlay */}
        {(!cameraReady || processing) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">
                {!cameraReady ? 'Kamera inicializálása...' : 'Kép feldolgozása...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>

          <button
            onClick={capturePhoto}
            disabled={!cameraReady || processing}
            className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Camera className="h-8 w-8 text-white" />
          </button>

          <div className="w-12 h-12 flex items-center justify-center">
            {!openCVReady && (
              <div className="text-xs text-orange-600 text-center">
                <Crop className="h-4 w-4 mx-auto mb-1" />
                <span>Alap</span>
              </div>
            )}
            {openCVReady && (
              <div className="text-xs text-green-600 text-center">
                <Zap className="h-4 w-4 mx-auto mb-1" />
                <span>AI</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  // Render preview view
  const renderPreviewView = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Beolvasott oldalak ({scannedPages.length})
          </h3>
          <button
            onClick={() => setCurrentStep('camera')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Scanned pages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {scannedPages.map((page, index) => (
          <div key={page.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Oldal {index + 1}
              </span>
              <button
                onClick={() => removePage(page.id)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <img
                src={page.processedImage}
                alt={`Scanned page ${index + 1}`}
                className="w-full h-auto rounded border border-gray-200"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between space-x-3">
          <button
            onClick={addAnotherPage}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Újabb oldal
          </button>

          <button
            onClick={generatePDF}
            disabled={scannedPages.length === 0 || processing}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                PDF készítése...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                PDF készítése
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black z-50">
      {currentStep === 'camera' && renderCameraView()}
      {currentStep === 'preview' && renderPreviewView()}
    </div>
  );
};

// Extend Window interface for OpenCV
declare global {
  interface Window {
    cv: any;
  }
}