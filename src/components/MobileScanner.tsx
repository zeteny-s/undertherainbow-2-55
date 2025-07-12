import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Check, X, Plus, FileText, Loader, RotateCw, FlashlightOff as FlashOff, Slash as Flash, ArrowLeft, Crop } from 'lucide-react';
import jsPDF from 'jspdf';

interface ScannedPage {
  id: string;
  originalImage: string;
  croppedImage: string;
  corners: Point[];
}

interface Point {
  x: number;
  y: number;
}

interface MobileScannerProps {
  onScanComplete: (pdfBlob: Blob, fileName: string) => void;
  onClose: () => void;
}

export const MobileScanner: React.FC<MobileScannerProps> = ({ onScanComplete, onClose }) => {
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [currentStep, setCurrentStep] = useState<'camera' | 'crop' | 'preview' | 'naming'>('camera');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [documentDetected, setDocumentDetected] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [documentName, setDocumentName] = useState('');
  const [currentCapture, setCurrentCapture] = useState<string | null>(null);
  const [detectedCorners, setDetectedCorners] = useState<Point[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCornerIndex, setDragCornerIndex] = useState<number>(-1);
  const [opencvReady, setOpencvReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load OpenCV.js
  useEffect(() => {
    const loadOpenCV = async () => {
      try {
        if (window.cv) {
          setOpencvReady(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
        script.async = true;
        
        script.onload = () => {
          const checkOpenCV = () => {
            if (window.cv && window.cv.Mat) {
              console.log('OpenCV.js loaded successfully');
              setOpencvReady(true);
            } else {
              setTimeout(checkOpenCV, 100);
            }
          };
          checkOpenCV();
        };

        script.onerror = () => {
          console.error('Failed to load OpenCV.js');
          setError('Failed to load document detection library');
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading OpenCV:', error);
        setError('Failed to initialize document detection');
      }
    };

    loadOpenCV();
  }, []);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      setCameraReady(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 15 }
        }
      };

      if (flashEnabled && cameraFacing === 'environment') {
        (constraints.video as any).torch = true;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setCameraReady(true);
              if (opencvReady) {
                startDocumentDetection();
              }
            }).catch(err => {
              console.error('Video play error:', err);
              setError('Kamera indítási hiba');
            });
          }
        };
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Kamera hozzáférés megtagadva. Engedélyezze a kamera használatát.');
        } else if (err.name === 'NotFoundError') {
          setError('Nem található kamera.');
        } else if (err.name === 'NotReadableError') {
          setError('Kamera már használatban van.');
        } else {
          setError('Kamera hiba: ' + err.message);
        }
      }
    }
  }, [cameraFacing, flashEnabled, opencvReady]);

  // Smart document detection with OpenCV.js
  const startDocumentDetection = useCallback(() => {
    if (!videoRef.current || !overlayCanvasRef.current || !cameraReady || !opencvReady || !window.cv) {
      return;
    }

    const detectDocument = () => {
      if (!videoRef.current || !overlayCanvasRef.current || !cameraReady || !window.cv) return;

      try {
        const video = videoRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const overlayCtx = overlayCanvas.getContext('2d');

        if (!overlayCtx || video.videoWidth === 0 || video.videoHeight === 0) {
          animationFrameRef.current = requestAnimationFrame(detectDocument);
          return;
        }

        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        // Create temporary canvas for OpenCV processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) {
          animationFrameRef.current = requestAnimationFrame(detectDocument);
          return;
        }

        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

        // Detect document edges using OpenCV
        const corners = detectDocumentEdgesOpenCV(tempCanvas);

        if (corners && corners.length === 4) {
          setDocumentDetected(true);
          setDetectedCorners(corners);
          drawDetectionOverlay(overlayCtx, corners);
        } else {
          setDocumentDetected(false);
          setDetectedCorners([]);
        }

      } catch (error) {
        console.warn('Document detection error:', error);
      }

      animationFrameRef.current = requestAnimationFrame(detectDocument);
    };

    animationFrameRef.current = requestAnimationFrame(detectDocument);
  }, [cameraReady, opencvReady]);

  // OpenCV.js document edge detection
  const detectDocumentEdgesOpenCV = (canvas: HTMLCanvasElement): Point[] | null => {
    if (!window.cv) return null;

    try {
      const cv = window.cv;
      
      // Convert canvas to OpenCV Mat
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const edges = new cv.Mat();
      const hierarchy = new cv.Mat();
      const contours = new cv.MatVector();

      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Apply Gaussian blur
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Apply Canny edge detection
      cv.Canny(blurred, edges, 50, 150);

      // Find contours
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let bestContour = null;
      let maxArea = 0;
      const minArea = (canvas.width * canvas.height) * 0.1; // At least 10% of image
      const maxAreaLimit = (canvas.width * canvas.height) * 0.9; // At most 90% of image

      // Find the largest contour that could be a document
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        
        if (area > minArea && area < maxAreaLimit && area > maxArea) {
          // Approximate contour to polygon
          const epsilon = 0.02 * cv.arcLength(contour, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(contour, approx, epsilon, true);
          
          // Check if it's a quadrilateral
          if (approx.rows === 4) {
            maxArea = area;
            if (bestContour) bestContour.delete();
            bestContour = approx.clone();
          }
          
          approx.delete();
        }
        contour.delete();
      }

      let corners: Point[] | null = null;

      if (bestContour) {
        // Extract corner points
        corners = [];
        for (let i = 0; i < bestContour.rows; i++) {
          const point = bestContour.data32S.slice(i * 2, i * 2 + 2);
          corners.push({ x: point[0], y: point[1] });
        }

        // Sort corners in clockwise order starting from top-left
        corners = sortCorners(corners);
        bestContour.delete();
      }

      // Clean up
      src.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      hierarchy.delete();
      contours.delete();

      return corners;
    } catch (error) {
      console.error('OpenCV detection error:', error);
      return null;
    }
  };

  // Sort corners in clockwise order: top-left, top-right, bottom-right, bottom-left
  const sortCorners = (corners: Point[]): Point[] => {
    // Calculate center point
    const centerX = corners.reduce((sum, p) => sum + p.x, 0) / corners.length;
    const centerY = corners.reduce((sum, p) => sum + p.y, 0) / corners.length;

    // Sort by angle from center
    return corners.sort((a, b) => {
      const angleA = Math.atan2(a.y - centerY, a.x - centerX);
      const angleB = Math.atan2(b.y - centerY, b.x - centerX);
      return angleA - angleB;
    });
  };

  // Draw detection overlay
  const drawDetectionOverlay = (ctx: CanvasRenderingContext2D, corners: Point[]) => {
    // Draw document outline
    ctx.strokeStyle = documentDetected ? '#00ff00' : '#ffff00';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 2;
    ctx.beginPath();
    
    for (let i = 0; i < corners.length; i++) {
      const point = corners[i];
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
    corners.forEach((point, index) => {
      ctx.fillStyle = documentDetected ? '#00ff00' : '#ffff00';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Inner dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Capture photo with automatic cropping
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReady || processing) return;

    setProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setProcessing(false);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCurrentCapture(imageData);
    
    // Use detected corners or default to full image
    if (detectedCorners.length === 4) {
      // Automatically crop using detected corners
      const croppedImage = cropImage(detectedCorners, imageData);
      
      const newPage: ScannedPage = {
        id: Date.now().toString(),
        originalImage: imageData,
        croppedImage,
        corners: detectedCorners
      };

      setScannedPages(prev => [...prev, newPage]);
      setCurrentCapture(null);
      setDetectedCorners([]);
      setCurrentStep('preview');
    } else {
      // If no corners detected, use full image corners
      setDetectedCorners([
        { x: 0, y: 0 },
        { x: canvas.width, y: 0 },
        { x: canvas.width, y: canvas.height },
        { x: 0, y: canvas.height }
      ]);
      setCurrentStep('crop');
    }
    
    setProcessing(false);
  }, [cameraReady, processing, detectedCorners]);

  // Crop the captured image using OpenCV perspective transform
  const cropImage = (corners: Point[], imageData?: string): string => {
    const sourceImage = imageData || currentCapture;
    if (!sourceImage || !cropCanvasRef.current || !window.cv) return '';

    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const img = new Image();
    img.onload = () => {
      try {
        const cv = window.cv;
        
        // Set target size (A4 ratio)
        const targetWidth = 800;
        const targetHeight = 1000;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Create source image mat
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx?.drawImage(img, 0, 0);
        
        const src = cv.imread(tempCanvas);
        const dst = new cv.Mat();

        // Define source and destination points
        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          corners[0].x, corners[0].y,
          corners[1].x, corners[1].y,
          corners[2].x, corners[2].y,
          corners[3].x, corners[3].y
        ]);

        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          targetWidth, 0,
          targetWidth, targetHeight,
          0, targetHeight
        ]);

        // Get perspective transform matrix
        const M = cv.getPerspectiveTransform(srcPoints, dstPoints);

        // Apply perspective transform
        cv.warpPerspective(src, dst, M, new cv.Size(targetWidth, targetHeight));

        // Draw result to canvas
        cv.imshow(canvas, dst);

        // Clean up
        src.delete();
        dst.delete();
        srcPoints.delete();
        dstPoints.delete();
        M.delete();
      } catch (error) {
        console.error('Crop error:', error);
        // Fallback: just draw the original image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    img.src = sourceImage;

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Handle corner dragging
  const handleCornerDrag = (e: React.TouchEvent | React.MouseEvent, index: number) => {
    e.preventDefault();
    setIsDragging(true);
    setDragCornerIndex(index);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || dragCornerIndex === -1 || !cropCanvasRef.current) return;

    const canvas = cropCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    const newCorners = [...detectedCorners];
    newCorners[dragCornerIndex] = { x, y };
    setDetectedCorners(newCorners);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragCornerIndex(-1);
  };

  // Confirm crop
  const confirmCrop = () => {
    if (!currentCapture || detectedCorners.length !== 4) return;

    const croppedImage = cropImage(detectedCorners);
    
    const newPage: ScannedPage = {
      id: Date.now().toString(),
      originalImage: currentCapture,
      croppedImage,
      corners: detectedCorners
    };

    setScannedPages(prev => [...prev, newPage]);
    setCurrentCapture(null);
    setDetectedCorners([]);
    setCurrentStep('preview');
  };

  // Add another page
  const addAnotherPage = () => {
    setCurrentStep('camera');
  };

  // Remove a page
  const removePage = (pageId: string) => {
    setScannedPages(prev => prev.filter(page => page.id !== pageId));
  };

  // Proceed to naming
  const proceedToNaming = () => {
    if (scannedPages.length === 0) return;
    
    const defaultName = `scanned_document_${new Date().toISOString().slice(0, 10)}`;
    setDocumentName(defaultName);
    setCurrentStep('naming');
  };

  // Generate PDF using jsPDF
  const generatePDF = async (finalName?: string) => {
    if (scannedPages.length === 0) return;

    setProcessing(true);
    
    try {
      const pdf = new jsPDF();
      let isFirstPage = true;

      for (const page of scannedPages) {
        if (!isFirstPage) {
          pdf.addPage();
        }

        const imgWidth = 210; // A4 width in mm
        const imgHeight = 297; // A4 height in mm

        pdf.addImage(page.croppedImage, 'JPEG', 0, 0, imgWidth, imgHeight);
        isFirstPage = false;
      }

      const pdfBlob = pdf.output('blob');
      const fileName = `${finalName || documentName || 'scanned_document'}.pdf`;

      onScanComplete(pdfBlob, fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('PDF készítési hiba. Próbálja újra.');
    } finally {
      setProcessing(false);
    }
  };

  // Toggle flash
  const toggleFlash = async () => {
    setFlashEnabled(!flashEnabled);
    if (cameraReady) {
      await initializeCamera();
    }
  };

  // Switch camera
  const switchCamera = async () => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
    if (cameraReady) {
      await initializeCamera();
    }
  };

  // Cleanup camera
  const cleanupCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setCameraReady(false);
    setDocumentDetected(false);
  }, []);

  useEffect(() => {
    if (currentStep === 'camera' && opencvReady) {
      initializeCamera();
    } else {
      cleanupCamera();
    }

    return () => {
      cleanupCamera();
    };
  }, [currentStep, initializeCamera, cleanupCamera, opencvReady]);

  // Render camera view
  const renderCameraView = () => (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Exit button - Top Left */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors"
        >
          <X className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Camera view - Full screen */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        
        {/* Status indicators */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          {!cameraReady && (
            <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Kamera indítása...</span>
            </div>
          )}
          
          {!opencvReady && cameraReady && (
            <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Dokumentum felismerés betöltése...</span>
            </div>
          )}
          
          {documentDetected && (
            <div className="bg-green-500 bg-opacity-90 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
              <Check className="h-4 w-4" />
              <span>Dokumentum észlelve</span>
            </div>
          )}
        </div>

        {processing && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
            <div className="text-white text-center">
              <Loader className="h-12 w-12 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">Feldolgozás...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls - Moved up to avoid Google window overlap */}
      <div className="bg-black bg-opacity-90 p-4 pb-8 z-10">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {/* Flash toggle */}
          {cameraFacing === 'environment' && (
            <button
              onClick={toggleFlash}
              className={`p-3 rounded-full transition-colors ${
                flashEnabled ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {flashEnabled ? (
                <Flash className="h-5 w-5 text-white" />
              ) : (
                <FlashOff className="h-5 w-5 text-white" />
              )}
            </button>
          )}

          {/* Capture button - Always visible and prominent */}
          <button
            onClick={capturePhoto}
            disabled={!cameraReady || !opencvReady || processing}
            className="p-4 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg"
          >
            <Camera className="h-8 w-8 text-black" />
          </button>

          {/* Camera switch */}
          <button
            onClick={switchCamera}
            className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <RotateCw className="h-5 w-5 text-white" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-900 bg-opacity-90 border border-red-700 rounded-lg max-w-sm mx-auto">
            <p className="text-sm text-red-200 text-center">{error}</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  // Render crop view
  const renderCropView = () => (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep('camera')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Crop className="h-5 w-5 mr-2 text-blue-600" />
            Dokumentum vágása
          </h3>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative max-w-full max-h-full">
          {currentCapture && (
            <div className="relative">
              <img
                src={currentCapture}
                alt="Captured document"
                className="max-w-full max-h-[60vh] object-contain"
              />
              <canvas
                ref={cropCanvasRef}
                className="absolute inset-0 w-full h-full object-contain pointer-events-auto"
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * e.currentTarget.width;
                  const y = ((e.clientY - rect.top) / rect.height) * e.currentTarget.height;
                  
                  // Find closest corner
                  let closestIndex = 0;
                  let closestDist = Infinity;
                  detectedCorners.forEach((corner, index) => {
                    const dist = Math.sqrt((corner.x - x) ** 2 + (corner.y - y) ** 2);
                    if (dist < closestDist) {
                      closestDist = dist;
                      closestIndex = index;
                    }
                  });
                  
                  if (closestDist < 30) {
                    handleCornerDrag(e, closestIndex);
                  }
                }}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onTouchStart={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const touch = e.touches[0];
                  const x = ((touch.clientX - rect.left) / rect.width) * e.currentTarget.width;
                  const y = ((touch.clientY - rect.top) / rect.height) * e.currentTarget.height;
                  
                  let closestIndex = 0;
                  let closestDist = Infinity;
                  detectedCorners.forEach((corner, index) => {
                    const dist = Math.sqrt((corner.x - x) ** 2 + (corner.y - y) ** 2);
                    if (dist < closestDist) {
                      closestDist = dist;
                      closestIndex = index;
                    }
                  });
                  
                  if (closestDist < 30) {
                    handleCornerDrag(e, closestIndex);
                  }
                }}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center mb-4">
          Húzza a sarkok pontokat a dokumentum határainak pontosításához
        </p>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentStep('camera')}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Újra
          </button>
          <button
            onClick={confirmCrop}
            disabled={detectedCorners.length !== 4}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="h-4 w-4 mr-2" />
            Vágás
          </button>
        </div>
      </div>
    </div>
  );

  // Render preview view
  const renderPreviewView = () => (
    <div className="h-full flex flex-col bg-gray-100">
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
                src={page.croppedImage}
                alt={`Scanned page ${index + 1}`}
                className="w-full h-auto rounded border border-gray-200 shadow-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between space-x-3">
          <button
            onClick={addAnotherPage}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Újabb oldal
          </button>

          <button
            onClick={proceedToNaming}
            disabled={scannedPages.length === 0 || processing}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            Tovább ({scannedPages.length})
          </button>
        </div>
      </div>
    </div>
  );

  // Render naming view
  const renderNamingView = () => (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep('preview')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            Dokumentum neve
          </h3>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6">
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="text-center">
            <div className="inline-block p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{scannedPages.length} oldal</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dokumentum neve
              </label>
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="Adja meg a dokumentum nevét"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                A .pdf kiterjesztés automatikusan hozzáadódik
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gyors javaslatok
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  `szamla_${new Date().toISOString().slice(0, 10)}`,
                  `bizonylat_${new Date().toISOString().slice(0, 10)}`,
                  `dokumentum_${new Date().toISOString().slice(0, 10)}`,
                  `beolvasott_${new Date().toISOString().slice(0, 10)}`
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setDocumentName(suggestion)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentStep('preview')}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Vissza
          </button>

          <button
            onClick={() => generatePDF(documentName)}
            disabled={!documentName.trim() || processing}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                PDF készítése...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                PDF készítése
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black z-50">
      {currentStep === 'camera' && renderCameraView()}
      {currentStep === 'crop' && renderCropView()}
      {currentStep === 'preview' && renderPreviewView()}
      {currentStep === 'naming' && renderNamingView()}
    </div>
  );
};

// Extend Window interface for OpenCV
declare global {
  interface Window {
    cv: any;
  }
}