import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';

interface MobileScannerProps {
  onScanComplete: (pdfBlob: Blob, fileName: string) => void;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

export const MobileScanner: React.FC<MobileScannerProps> = ({ onScanComplete, onClose }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [openCVReady, setOpenCVReady] = useState(false);
  const [documentDetected, setDocumentDetected] = useState(false);
  const [detectionStable, setDetectionStable] = useState(false);
  const [autoCapturing, setAutoCapturing] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<Point[] | null>(null);
  const stableDetectionRef = useRef<Point[] | null>(null);
  const stableFrameCountRef = useRef(0);
  const autoCaptureTimeoutRef = useRef<number | null>(null);

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
              setOpenCVReady(true);
            } else {
              setTimeout(checkOpenCV, 100);
            }
          };
          checkOpenCV();
        };

        script.onerror = () => {
          setError('Failed to load document scanner');
          setOpenCVReady(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        setError('Document scanner loading error');
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
          frameRate: { ideal: 60 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
          if (openCVReady) {
            startDocumentDetection();
          }
        };
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      setError('Camera access denied');
    }
  }, [openCVReady]);

  // Order points helper function
  const orderPoints = (pts: Point[]): Point[] => {
    if (pts.length !== 4) return pts;
    
    // Order: [topLeft, topRight, bottomRight, bottomLeft]
    const sum = pts.map((p) => p.x + p.y);
    const diff = pts.map((p) => p.y - p.x);

    return [
      pts[sum.indexOf(Math.min(...sum))], // Top-left
      pts[diff.indexOf(Math.min(...diff))], // Top-right
      pts[sum.indexOf(Math.max(...sum))], // Bottom-right
      pts[diff.indexOf(Math.max(...diff))], // Bottom-left
    ];
  };

  // Enhanced document edge detection with smooth tracking
  const detectDocumentEdges = (canvas: HTMLCanvasElement): Point[] | null => {
    if (!window.cv) return null;

    try {
      const cv = window.cv;
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const edged = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();

      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Gaussian blur for noise reduction
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Canny edge detection with optimized thresholds
      cv.Canny(blurred, edged, 75, 200);

      // Find contours
      cv.findContours(edged, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

      let biggest = null;
      let maxArea = 0;
      const minArea = canvas.width * canvas.height * 0.1; // At least 10% of image

      // Look for quadrilaterals
      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const peri = cv.arcLength(cnt, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

        if (approx.rows === 4) {
          const area = cv.contourArea(approx);
          if (area > maxArea && area > minArea) {
            maxArea = area;
            if (biggest) biggest.delete();
            biggest = approx.clone();
          }
        }
        approx.delete();
        cnt.delete();
      }

      let points: Point[] | null = null;
      if (biggest) {
        points = [];
        for (let i = 0; i < biggest.rows; i++) {
          const pt = biggest.intPtr(i);
          points.push({ x: pt[0], y: pt[1] });
        }
        
        // Order the points correctly
        points = orderPoints(points);
        biggest.delete();
      }

      // Cleanup
      src.delete();
      gray.delete();
      blurred.delete();
      edged.delete();
      contours.delete();
      hierarchy.delete();

      return points;
    } catch (error) {
      console.error('Edge detection error:', error);
      return null;
    }
  };

  // Start real-time document detection with stability tracking
  const startDocumentDetection = useCallback(() => {
    if (!cameraReady || !openCVReady || detectionIntervalRef.current) return;

    detectionIntervalRef.current = window.setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      
      if (!video || !canvas || !overlayCanvas || video.videoWidth === 0) return;

      // Set canvas sizes to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      overlayCanvas.width = video.videoWidth;
      overlayCanvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      const overlayCtx = overlayCanvas.getContext('2d');
      if (!ctx || !overlayCtx) return;

      // Draw current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Clear overlay
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      
      // Detect document edges
      const detectedPoints = detectDocumentEdges(canvas);
      
      if (detectedPoints && detectedPoints.length === 4) {
        // Check stability - compare with previous detection
        const isStable = stableDetectionRef.current && 
          detectedPoints.every((point, i) => {
            const prev = stableDetectionRef.current![i];
            return Math.abs(point.x - prev.x) < 20 && Math.abs(point.y - prev.y) < 20;
          });

        if (isStable) {
          stableFrameCountRef.current++;
          if (stableFrameCountRef.current >= 30 && !autoCapturing) { // 0.5s at 60fps
            setDetectionStable(true);
            startAutoCapture();
          }
        } else {
          stableFrameCountRef.current = 0;
          setDetectionStable(false);
          if (autoCaptureTimeoutRef.current) {
            clearTimeout(autoCaptureTimeoutRef.current);
            autoCaptureTimeoutRef.current = null;
            setAutoCapturing(false);
          }
        }

        stableDetectionRef.current = detectedPoints;
        lastDetectionRef.current = detectedPoints;
        setDocumentDetected(true);
        
        // Draw thin, smooth overlay
        drawDetectionOverlay(overlayCtx, detectedPoints, overlayCanvas.width, overlayCanvas.height);
      } else {
        lastDetectionRef.current = null;
        stableDetectionRef.current = null;
        stableFrameCountRef.current = 0;
        setDocumentDetected(false);
        setDetectionStable(false);
        if (autoCaptureTimeoutRef.current) {
          clearTimeout(autoCaptureTimeoutRef.current);
          autoCaptureTimeoutRef.current = null;
          setAutoCapturing(false);
        }
      }
    }, 16); // ~60fps for smooth detection
  }, [cameraReady, openCVReady]);

  // Auto-capture function
  const startAutoCapture = useCallback(() => {
    if (autoCapturing || !detectionStable) return;
    
    setAutoCapturing(true);
    autoCaptureTimeoutRef.current = window.setTimeout(() => {
      captureDocument();
    }, 1500); // 1.5s delay
  }, [autoCapturing, detectionStable]);

  // Draw clean detection overlay
  const drawDetectionOverlay = (
    ctx: CanvasRenderingContext2D, 
    points: Point[], 
    _canvasWidth: number, 
    _canvasHeight: number
  ) => {
    if (points.length !== 4) return;

    // Set styles for thin, smooth lines
    ctx.strokeStyle = detectionStable ? '#22C55E' : '#3B82F6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);

    // Draw the document outline
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw corner indicators - small, clean circles
    points.forEach((point) => {
      ctx.fillStyle = detectionStable ? '#22C55E' : '#3B82F6';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Process document image with perspective correction
  const processDocumentImage = async (canvas: HTMLCanvasElement, points: Point[]): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      try {
        const cv = window.cv;
        const src = cv.imread(canvas);
        
        // Order points correctly
        const ordered = orderPoints(points);
        const [tl, tr, br, bl] = ordered;

        // Calculate dimensions
        const widthA = Math.hypot(br.x - bl.x, br.y - bl.y);
        const widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y);
        const maxWidth = Math.max(widthA, widthB);

        const heightA = Math.hypot(tr.x - br.x, tr.y - br.y);
        const heightB = Math.hypot(tl.x - bl.x, tl.y - bl.y);
        const maxHeight = Math.max(heightA, heightB);

        // Create transformation matrix
        const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
          tl.x, tl.y,
          tr.x, tr.y,
          br.x, br.y,
          bl.x, bl.y,
        ]);
        
        const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          maxWidth, 0,
          maxWidth, maxHeight,
          0, maxHeight,
        ]);

        const transformMatrix = cv.getPerspectiveTransform(srcTri, dstTri);
        const dst = new cv.Mat();
        const dsize = new cv.Size(maxWidth, maxHeight);

        cv.warpPerspective(src, dst, transformMatrix, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

        // Create output canvas
        const outputCanvas = document.createElement('canvas');
        cv.imshow(outputCanvas, dst);

        // Cleanup
        src.delete();
        dst.delete();
        srcTri.delete();
        dstTri.delete();
        transformMatrix.delete();

        resolve(outputCanvas);
      } catch (err) {
        console.error('Perspective correction error:', err);
        resolve(canvas);
      }
    });
  };

  // Capture high-quality document image
  const captureDocument = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !lastDetectionRef.current) return;

    setProcessing(true);
    setFlashEffect(true);
    
    try {
      // Flash effect
      setTimeout(() => setFlashEffect(false), 200);
      
      // Capture high-res frame
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;
      const captureCtx = captureCanvas.getContext('2d');
      
      if (!captureCtx) throw new Error('Could not get canvas context');
      
      captureCtx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      
      // Get detected points and order them properly
      const detectedPoints = orderPoints(lastDetectionRef.current);
      
      // Process the image with perspective correction
      const processedCanvas = await processDocumentImage(captureCanvas, detectedPoints);
      
      // Generate PDF immediately
      const pdf = new jsPDF();
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (processedCanvas.height * imgWidth) / processedCanvas.width;
      
      pdf.addImage(processedCanvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // Generate filename
      const now = new Date();
      const filename = `document_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Convert to blob and complete scan
      const pdfBlob = pdf.output('blob');
      onScanComplete(pdfBlob, filename);
      
    } catch (error) {
      console.error('Document capture error:', error);
      setError('Capture failed');
    } finally {
      setProcessing(false);
      setAutoCapturing(false);
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
        autoCaptureTimeoutRef.current = null;
      }
    }
  };

  // Cleanup function
  const cleanup = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (autoCaptureTimeoutRef.current) {
      clearTimeout(autoCaptureTimeoutRef.current);
      autoCaptureTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Initialize when both camera and OpenCV are ready
  useEffect(() => {
    if (cameraReady && openCVReady) {
      startDocumentDetection();
    }
  }, [cameraReady, openCVReady, startDocumentDetection]);

  // Initialize camera when OpenCV is ready
  useEffect(() => {
    if (openCVReady && !cameraReady) {
      initializeCamera();
    }
  }, [openCVReady, cameraReady, initializeCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Main camera view - Apple-style minimal design
  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Camera View */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Edge detection overlay */}
        <canvas 
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        
        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Flash effect */}
        {flashEffect && (
          <div className="absolute inset-0 bg-white animate-[opacity_0.2s_ease-out]" />
        )}
        
        {/* Minimal controls */}
        <div className="absolute top-8 left-6 right-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            {autoCapturing && (
              <div className="px-3 py-1 rounded-full bg-green-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-white font-medium">Auto</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom capture button */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <button
            onClick={captureDocument}
            disabled={processing}
            className={`w-16 h-16 rounded-full border-4 transition-all ${
              processing
                ? 'bg-white/20 border-white/40'
                : documentDetected
                ? 'bg-white border-white/80 scale-110'
                : 'bg-white/20 border-white/40'
            }`}
          >
            {processing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800 mx-auto" />
            ) : (
              <div className="w-6 h-6 bg-gray-800 rounded-full mx-auto" />
            )}
          </button>
        </div>
        
        {/* Loading/Error states */}
        {(!cameraReady || !openCVReady || error) && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white">
            {error ? (
              <>
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-center px-6 mb-6">{error}</p>
                <button
                  onClick={initializeCamera}
                  className="px-6 py-2 bg-white/20 rounded-lg backdrop-blur-sm"
                >
                  Retry
                </button>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
                <p className="text-center px-6">
                  {!openCVReady ? 'Loading...' : 'Starting camera...'}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Extend Window interface for OpenCV
declare global {
  interface Window {
    cv: any;
  }
}