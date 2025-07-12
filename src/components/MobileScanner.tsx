import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Check, X, Plus, FileText, Loader, Zap, AlertCircle } from 'lucide-react';
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
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [currentStep, setCurrentStep] = useState<'camera' | 'preview'>('camera');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [openCVReady, setOpenCVReady] = useState(false);
  const [documentDetected, setDocumentDetected] = useState(false);
  const [autoCapture, setAutoCapture] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const captureTimeoutRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<any>(null);
  const stableDetectionCountRef = useRef(0);

  // Load OpenCV.js
  useEffect(() => {
    const loadOpenCV = async () => {
      try {
        if (window.cv) {
          setOpenCVReady(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
        script.async = true;
        
        script.onload = () => {
          const checkOpenCV = () => {
            if (window.cv && window.cv.Mat) {
              console.log('OpenCV loaded successfully');
              setOpenCVReady(true);
            } else {
              setTimeout(checkOpenCV, 100);
            }
          };
          checkOpenCV();
        };

        script.onerror = () => {
          console.error('Failed to load OpenCV');
          setError('Nem sikerült betölteni a dokumentum felismerő rendszert');
          setOpenCVReady(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        console.error('OpenCV loading error:', err);
        setError('Dokumentum felismerő rendszer betöltési hiba');
        setOpenCVReady(false);
      }
    };

    loadOpenCV();
  }, []);

  // Initialize camera with high resolution
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera ready, starting document detection');
          setCameraReady(true);
          if (openCVReady) {
            startDocumentDetection();
          }
        };
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      setError('Kamera hozzáférés megtagadva. Engedélyezze a kamera használatát.');
    }
  }, [openCVReady]);

  // Start continuous document detection
  const startDocumentDetection = useCallback(() => {
    if (!openCVReady || !videoRef.current || !overlayCanvasRef.current || !cameraReady) {
      console.log('Cannot start detection - missing requirements');
      return;
    }

    console.log('Starting document detection');

    const detectDocument = () => {
      if (!videoRef.current || !overlayCanvasRef.current || !cameraReady) return;

      try {
        const video = videoRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const overlayCtx = overlayCanvas.getContext('2d');

        if (!overlayCtx) return;

        // Set overlay canvas size to match video display size
        const rect = video.getBoundingClientRect();
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;
        overlayCanvas.style.width = rect.width + 'px';
        overlayCanvas.style.height = rect.height + 'px';

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

        // Detect document edges
        const contour = detectDocumentEdges(tempCanvas);

        if (contour && contour.length === 4) {
          // Check if detection is stable
          if (isDetectionStable(contour)) {
            stableDetectionCountRef.current++;
            
            if (stableDetectionCountRef.current >= 10 && !processing) { // 1 second of stable detection
              setDocumentDetected(true);
              lastDetectionRef.current = contour;
              
              // Start auto-capture countdown
              if (!autoCapture && !captureTimeoutRef.current) {
                setAutoCapture(true);
                startCaptureCountdown();
              }
            }
          } else {
            stableDetectionCountRef.current = 0;
          }

          // Draw detection overlay
          drawDetectionOverlay(overlayCtx, contour);
        } else {
          setDocumentDetected(false);
          setAutoCapture(false);
          stableDetectionCountRef.current = 0;
          if (captureTimeoutRef.current) {
            clearTimeout(captureTimeoutRef.current);
            captureTimeoutRef.current = null;
            setCaptureCountdown(0);
          }
        }

      } catch (error) {
        console.warn('Document detection error:', error);
      }
    };

    // Run detection every 100ms (10 FPS)
    detectionIntervalRef.current = window.setInterval(detectDocument, 100);
  }, [openCVReady, cameraReady, processing]);

  // Check if detection is stable (similar position)
  const isDetectionStable = (newContour: any[]) => {
    if (!lastDetectionRef.current) {
      lastDetectionRef.current = newContour;
      return true;
    }

    const threshold = 30; // pixels
    const lastContour = lastDetectionRef.current;

    for (let i = 0; i < 4; i++) {
      const dx = Math.abs(newContour[i].x - lastContour[i].x);
      const dy = Math.abs(newContour[i].y - lastContour[i].y);
      if (dx > threshold || dy > threshold) {
        return false;
      }
    }

    return true;
  };

  // Start capture countdown
  const startCaptureCountdown = () => {
    setCaptureCountdown(3);
    
    const countdown = (count: number) => {
      if (count > 0) {
        setCaptureCountdown(count);
        captureTimeoutRef.current = window.setTimeout(() => countdown(count - 1), 1000);
      } else {
        setCaptureCountdown(0);
        capturePhoto();
      }
    };

    captureTimeoutRef.current = window.setTimeout(() => countdown(2), 1000);
  };

  // Draw detection overlay
  const drawDetectionOverlay = (ctx: CanvasRenderingContext2D, contour: any[]) => {
    // Draw document outline
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    
    for (let i = 0; i < contour.length; i++) {
      const point = contour[i];
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.closePath();
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw corner indicators
    contour.forEach((point) => {
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
      ctx.fill();
      
      // Inner white dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Advanced document edge detection
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

      // Apply bilateral filter to reduce noise while keeping edges sharp
      cv.bilateralFilter(gray, blur, 9, 75, 75);

      // Adaptive threshold for better edge detection
      const thresh = new cv.Mat();
      cv.adaptiveThreshold(blur, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

      // Edge detection with optimized parameters
      cv.Canny(thresh, edges, 50, 150, 3);

      // Morphological operations to close gaps
      const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
      cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel);

      // Find contours
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      // Find the best rectangular contour
      let maxArea = 0;
      let bestContour = null;
      const minArea = canvas.width * canvas.height * 0.1; // At least 10% of image
      const maxArea_limit = canvas.width * canvas.height * 0.9; // At most 90% of image

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        
        if (area > minArea && area < maxArea_limit && area > maxArea) {
          const peri = cv.arcLength(contour, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(contour, approx, 0.02 * peri, true);
          
          if (approx.rows === 4) {
            // Check if it's roughly rectangular
            const points = [];
            for (let j = 0; j < 4; j++) {
              const point = approx.data32S.slice(j * 2, j * 2 + 2);
              points.push({ x: point[0], y: point[1] });
            }
            
            if (isRoughlyRectangular(points)) {
              maxArea = area;
              if (bestContour) bestContour.delete();
              bestContour = approx.clone();
            }
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
      thresh.delete();
      edges.delete();
      kernel.delete();
      contours.delete();
      hierarchy.delete();

      return points;
    } catch (error) {
      console.error('Edge detection error:', error);
      return null;
    }
  };

  // Check if points form a roughly rectangular shape
  const isRoughlyRectangular = (points: any[]) => {
    if (points.length !== 4) return false;

    // Calculate angles between consecutive sides
    const angles = [];
    for (let i = 0; i < 4; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % 4];
      const p3 = points[(i + 2) % 4];
      
      const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
      const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
      
      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      
      const angle = Math.acos(dot / (mag1 * mag2)) * 180 / Math.PI;
      angles.push(angle);
    }

    // Check if angles are close to 90 degrees (allow 20 degree tolerance)
    return angles.every(angle => Math.abs(angle - 90) < 20);
  };

  // Cleanup camera and detection
  const cleanupCamera = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setCameraReady(false);
    setDocumentDetected(false);
    setAutoCapture(false);
    setCaptureCountdown(0);
    stableDetectionCountRef.current = 0;
    lastDetectionRef.current = null;
  }, []);

  useEffect(() => {
    if (currentStep === 'camera') {
      if (openCVReady) {
        initializeCamera();
      }
    } else {
      cleanupCamera();
    }

    return () => {
      cleanupCamera();
    };
  }, [currentStep, openCVReady, initializeCamera, cleanupCamera]);

  // Start detection when both camera and OpenCV are ready
  useEffect(() => {
    if (cameraReady && openCVReady && currentStep === 'camera') {
      startDocumentDetection();
    }
  }, [cameraReady, openCVReady, currentStep, startDocumentDetection]);

  // Capture and process photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReady || processing) return;

    console.log('Capturing photo...');
    setProcessing(true);
    setAutoCapture(false);
    setCaptureCountdown(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setProcessing(false);
      return;
    }

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Process the image
    setTimeout(() => {
      processImage(canvas);
    }, 100);
  }, [cameraReady, processing]);

  // Process captured image with automatic cropping
  const processImage = async (originalCanvas: HTMLCanvasElement) => {
    try {
      let processedCanvas = originalCanvas;
      const imageData = originalCanvas.toDataURL('image/jpeg', 0.9);

      // Detect document edges in the captured image
      const detectedContour = detectDocumentEdges(originalCanvas);
      
      if (detectedContour && detectedContour.length === 4) {
        console.log('Document edges detected, applying perspective correction');
        processedCanvas = await performPerspectiveCorrection(originalCanvas, detectedContour);
      } else {
        console.log('No document edges detected, using original image');
      }

      // Enhance image quality
      const enhancedCanvas = enhanceImage(processedCanvas);
      const enhancedImageData = enhancedCanvas.toDataURL('image/jpeg', 0.95);

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
      setError('Kép feldolgozási hiba. Próbálja újra.');
    } finally {
      setProcessing(false);
    }
  };

  // Perspective correction with improved algorithm
  const performPerspectiveCorrection = async (canvas: HTMLCanvasElement, contour: any[]): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      try {
        const cv = window.cv;
        const src = cv.imread(canvas);
        
        // Sort points to get correct order: top-left, top-right, bottom-right, bottom-left
        const points = [...contour];
        
        // Find center point
        const centerX = points.reduce((sum, p) => sum + p.x, 0) / 4;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / 4;
        
        // Sort points by angle from center
        points.sort((a, b) => {
          const angleA = Math.atan2(a.y - centerY, a.x - centerX);
          const angleB = Math.atan2(b.y - centerY, b.x - centerX);
          return angleA - angleB;
        });
        
        // Reorder to top-left, top-right, bottom-right, bottom-left
        const orderedPoints = [
          points.find(p => p.x < centerX && p.y < centerY) || points[0], // top-left
          points.find(p => p.x > centerX && p.y < centerY) || points[1], // top-right
          points.find(p => p.x > centerX && p.y > centerY) || points[2], // bottom-right
          points.find(p => p.x < centerX && p.y > centerY) || points[3]  // bottom-left
        ];

        // Calculate output dimensions based on the document
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

  // Enhanced image processing for better scan quality
  const enhanceImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply advanced image enhancement
    const brightness = 15;
    const contrast = 1.3;
    const gamma = 0.8;

    for (let i = 0; i < data.length; i += 4) {
      // Apply gamma correction first
      let r = Math.pow(data[i] / 255, gamma) * 255;
      let g = Math.pow(data[i + 1] / 255, gamma) * 255;
      let b = Math.pow(data[i + 2] / 255, gamma) * 255;

      // Apply contrast and brightness
      r = Math.min(255, Math.max(0, (r - 128) * contrast + 128 + brightness));
      g = Math.min(255, Math.max(0, (g - 128) * contrast + 128 + brightness));
      b = Math.min(255, Math.max(0, (b - 128) * contrast + 128 + brightness));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
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

        const canvas = page.canvas || document.createElement('canvas');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(page.processedImage, 'JPEG', 0, 0, imgWidth, imgHeight);
        isFirstPage = false;
      }

      const pdfBlob = pdf.output('blob');
      const fileName = `scanned_document_${new Date().toISOString().slice(0, 10)}.pdf`;

      onScanComplete(pdfBlob, fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('PDF készítési hiba. Próbálja újra.');
    } finally {
      setProcessing(false);
    }
  };

  // Render camera view
  const renderCameraView = () => (
    <div className="relative h-full flex flex-col bg-black">
      {/* Camera preview */}
      <div className="flex-1 relative overflow-hidden">
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
        />
        
        {/* Status indicators */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          {!openCVReady && (
            <div className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Dokumentum felismerő betöltése...</span>
            </div>
          )}
          
          {openCVReady && !cameraReady && (
            <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Kamera inicializálása...</span>
            </div>
          )}
          
          {documentDetected && !autoCapture && (
            <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
              <Check className="h-4 w-4" />
              <span>Dokumentum felismerve</span>
            </div>
          )}
          
          {autoCapture && captureCountdown > 0 && (
            <div className="bg-red-500 text-white px-6 py-3 rounded-full text-lg font-bold flex items-center space-x-2">
              <span>Fényképezés {captureCountdown} másodperc múlva</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        {cameraReady && openCVReady && !documentDetected && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center text-white z-10">
            <div className="bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              <p className="text-sm">Helyezze a dokumentumot a kamera elé</p>
              <p className="text-xs opacity-75">A rendszer automatikusan felismeri és lefényképezi</p>
            </div>
          </div>
        )}

        {/* Processing overlay */}
        {processing && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
            <div className="text-white text-center">
              <Loader className="h-12 w-12 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">Dokumentum feldolgozása...</p>
              <p className="text-sm opacity-75">Kivágás és minőség javítás</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-black">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          <div className="flex items-center space-x-4">
            {/* Manual capture button */}
            <button
              onClick={capturePhoto}
              disabled={!cameraReady || !openCVReady || processing}
              className="p-4 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Camera className="h-8 w-8 text-black" />
            </button>
          </div>

          <div className="w-12 h-12 flex items-center justify-center">
            {openCVReady && (
              <div className="text-xs text-green-400 text-center">
                <Zap className="h-4 w-4 mx-auto mb-1" />
                <span>AI</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-900 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  // Render preview view
  const renderPreviewView = () => (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Beolvasott dokumentumok ({scannedPages.length})
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
          <div key={page.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                className="w-full h-auto rounded border border-gray-200 shadow-sm"
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
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Újabb oldal beolvasása
          </button>

          <button
            onClick={generatePDF}
            disabled={scannedPages.length === 0 || processing}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                PDF készítése...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                PDF készítése ({scannedPages.length} oldal)
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
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