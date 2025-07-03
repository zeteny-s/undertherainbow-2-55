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
  const [documentDetected, setDocumentDetected] = useState(false);
  const [detectionOverlay, setDetectionOverlay] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);

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
          startDocumentDetection();
        };
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  }, []);

  // Start real-time document detection
  const startDocumentDetection = useCallback(() => {
    if (!openCVReady || !videoRef.current || !overlayCanvasRef.current) return;

    const detectDocument = () => {
      if (!videoRef.current || !overlayCanvasRef.current || !cameraReady) return;

      try {
        const video = videoRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const overlayCtx = overlayCanvas.getContext('2d');

        if (!overlayCtx) return;

        // Set overlay canvas size to match video
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;

        // Clear overlay
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        // Create temporary canvas for processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) return;

        // Draw current video frame
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

        // Detect document edges using OpenCV
        const contour = detectDocumentEdges(tempCanvas);

        if (contour && contour.length === 4) {
          // Document detected - draw overlay
          setDocumentDetected(true);
          setDetectionOverlay(contour);

          // Draw detection overlay
          overlayCtx.strokeStyle = '#00ff00';
          overlayCtx.lineWidth = 4;
          overlayCtx.beginPath();
          
          for (let i = 0; i < contour.length; i++) {
            const point = contour[i];
            if (i === 0) {
              overlayCtx.moveTo(point.x, point.y);
            } else {
              overlayCtx.lineTo(point.x, point.y);
            }
          }
          overlayCtx.closePath();
          overlayCtx.stroke();

          // Add corner indicators
          contour.forEach((point, index) => {
            overlayCtx.fillStyle = '#00ff00';
            overlayCtx.beginPath();
            overlayCtx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
            overlayCtx.fill();
          });

        } else {
          setDocumentDetected(false);
          setDetectionOverlay(null);
        }

      } catch (error) {
        console.warn('Document detection error:', error);
      }
    };

    // Run detection every 100ms
    detectionIntervalRef.current = window.setInterval(detectDocument, 100);
  }, [openCVReady, cameraReady]);

  // Detect document edges using OpenCV
  const detectDocumentEdges = (canvas: HTMLCanvasElement) => {
    if (!window.cv) return null;

    try {
      const cv = window.cv;
      const src = cv.imread(canvas);
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

      // Find the largest rectangular contour
      let maxArea = 0;
      let bestContour = null;

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        
        if (area > maxArea && area > canvas.width * canvas.height * 0.1) { // At least 10% of image
          const peri = cv.arcLength(contour, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(contour, approx, 0.02 * peri, true);
          
          if (approx.rows === 4) { // Rectangular shape
            maxArea = area;
            if (bestContour) bestContour.delete();
            bestContour = approx.clone();
          }
          approx.delete();
        }
        contour.delete();
      }

      // Convert contour to points array
      let points = null;
      if (bestContour) {
        points = [];
        for (let i = 0; i < bestContour.rows; i++) {
          const point = bestContour.data32S.slice(i * 2, i * 2 + 2);
          points.push({ x: point[0], y: point[1] });
        }
        bestContour.delete();
      }

      // Cleanup
      src.delete();
      gray.delete();
      blur.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();

      return points;
    } catch (error) {
      console.error('Edge detection error:', error);
      return null;
    }
  };

  // Cleanup camera
  const cleanupCamera = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    setDocumentDetected(false);
    setDetectionOverlay(null);
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

  // Capture photo with automatic cropping
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

    // Process the image with automatic cropping
    processImage(imageData, canvas);
  }, [cameraReady, detectionOverlay]);

  // Process image with edge detection and enhancement
  const processImage = async (imageData: string, originalCanvas: HTMLCanvasElement) => {
    setProcessing(true);
    
    try {
      let processedCanvas = originalCanvas;
      let processedImageData = imageData;

      // If we have detected edges and OpenCV is available, perform perspective correction
      if (openCVReady && window.cv && detectionOverlay && detectionOverlay.length === 4) {
        processedCanvas = await performPerspectiveCorrection(originalCanvas, detectionOverlay);
        processedImageData = processedCanvas.toDataURL('image/jpeg', 0.9);
      } else if (openCVReady && window.cv) {
        // Try to detect edges in the captured image
        const detectedContour = detectDocumentEdges(originalCanvas);
        if (detectedContour && detectedContour.length === 4) {
          processedCanvas = await performPerspectiveCorrection(originalCanvas, detectedContour);
          processedImageData = processedCanvas.toDataURL('image/jpeg', 0.9);
        }
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

  // Perspective correction
  const performPerspectiveCorrection = async (canvas: HTMLCanvasElement, contour: any[]): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      try {
        const cv = window.cv;
        const src = cv.imread(canvas);
        
        // Sort points: top-left, top-right, bottom-right, bottom-left
        const points = [...contour];
        points.sort((a, b) => a.y - b.y); // Sort by y
        const topPoints = points.slice(0, 2).sort((a, b) => a.x - b.x); // Sort top by x
        const bottomPoints = points.slice(2, 4).sort((a, b) => a.x - b.x); // Sort bottom by x

        const orderedPoints = [
          topPoints[0],    // top-left
          topPoints[1],    // top-right
          bottomPoints[1], // bottom-right
          bottomPoints[0]  // bottom-left
        ];

        // Calculate output dimensions
        const width = Math.max(
          Math.sqrt(Math.pow(orderedPoints[1].x - orderedPoints[0].x, 2) + Math.pow(orderedPoints[1].y - orderedPoints[0].y, 2)),
          Math.sqrt(Math.pow(orderedPoints[2].x - orderedPoints[3].x, 2) + Math.pow(orderedPoints[2].y - orderedPoints[3].y, 2))
        );
        
        const height = Math.max(
          Math.sqrt(Math.pow(orderedPoints[3].x - orderedPoints[0].x, 2) + Math.pow(orderedPoints[3].y - orderedPoints[0].y, 2)),
          Math.sqrt(Math.pow(orderedPoints[2].x - orderedPoints[1].x, 2) + Math.pow(orderedPoints[2].y - orderedPoints[1].y, 2))
        );

        // Create transformation matrix
        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          orderedPoints[0].x, orderedPoints[0].y,
          orderedPoints[1].x, orderedPoints[1].y,
          orderedPoints[2].x, orderedPoints[2].y,
          orderedPoints[3].x, orderedPoints[3].y
        ]);
        
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

        resolve(outputCanvas);
      } catch (err) {
        console.error('Perspective correction error:', err);
        resolve(canvas);
      }
    });
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
        
        {/* Detection overlay */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ mixBlendMode: 'screen' }}
        />
        
        {/* Guide overlay */}
        {!documentDetected && (
          <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
            <div className="text-white text-center">
              <Square className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">Helyezze a számlát a keretbe</p>
              <p className="text-xs opacity-60 mt-1">A rendszer automatikusan felismeri a dokumentumot</p>
            </div>
          </div>
        )}

        {/* Document detected indicator */}
        {documentDetected && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>Dokumentum felismerve</span>
          </div>
        )}

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
            className={`p-4 rounded-full transition-all duration-200 ${
              documentDetected 
                ? 'bg-green-600 hover:bg-green-700 scale-110' 
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100`}
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

        {/* Instructions */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-600">
            {documentDetected 
              ? 'Dokumentum automatikusan felismerve és kivágva lesz' 
              : 'Helyezze a dokumentumot a keretbe az automatikus felismeréshez'
            }
          </p>
        </div>
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