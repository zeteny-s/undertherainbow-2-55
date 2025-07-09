import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Check, X, Plus, FileText, Loader, Zap, AlertCircle, RotateCw, ZoomIn, ZoomOut, Square } from 'lucide-react';
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

interface DetectedCorners {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
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
  const [detectedCorners, setDetectedCorners] = useState<DetectedCorners | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [stableFrameCount, setStableFrameCount] = useState(0);
  const [flashEnabled, setFlashEnabled] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const captureTimeoutRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<DetectedCorners | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check for existing camera permission
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permission.state === 'granted') {
          setPermissionGranted(true);
        } else if (permission.state === 'denied') {
          setPermissionDenied(true);
        }
        
        // Listen for permission changes
        permission.onchange = () => {
          if (permission.state === 'granted') {
            setPermissionGranted(true);
            setPermissionDenied(false);
          } else if (permission.state === 'denied') {
            setPermissionDenied(true);
            setPermissionGranted(false);
          }
        };
      } catch (error) {
        console.log('Permission API not supported, will request camera access directly');
      }
    };

    checkCameraPermission();
  }, []);

  // Load OpenCV.js with better error handling
  useEffect(() => {
    const loadOpenCV = async () => {
      try {
        if (window.cv && window.cv.Mat) {
          setOpenCVReady(true);
          return;
        }

        // Check if script is already loading
        if (document.querySelector('script[src*="opencv.js"]')) {
          const checkOpenCV = () => {
            if (window.cv && window.cv.Mat) {
              setOpenCVReady(true);
            } else {
              setTimeout(checkOpenCV, 100);
            }
          };
          checkOpenCV();
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
        };

        document.head.appendChild(script);
      } catch (err) {
        console.error('OpenCV loading error:', err);
        setError('Dokumentum felismerő rendszer betöltési hiba');
      }
    };

    loadOpenCV();
  }, []);

  // Initialize camera with better permission handling
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 15 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPermissionGranted(true);
      setPermissionDenied(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera ready, video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          setCameraReady(true);
        };
      }
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Kamera hozzáférés megtagadva. Engedélyezze a kamera használatát a böngésző beállításaiban.');
      } else if (err.name === 'NotFoundError') {
        setError('Nem található kamera. Ellenőrizze, hogy az eszköz rendelkezik kamerával.');
      } else {
        setError('Kamera inicializálási hiba. Próbálja újra.');
      }
    }
  }, []);

  // Enhanced document detection with better stability
  const detectDocumentEdges = useCallback((canvas: HTMLCanvasElement): DetectedCorners | null => {
    if (!window.cv || !canvas) return null;

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

      // Apply Gaussian blur to reduce noise
      cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);

      // Adaptive threshold for better edge detection in various lighting
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
      let bestCorners: DetectedCorners | null = null;
      const minArea = canvas.width * canvas.height * 0.15; // At least 15% of image
      const maxAreaLimit = canvas.width * canvas.height * 0.85; // At most 85% of image

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        
        if (area > minArea && area < maxAreaLimit && area > maxArea) {
          const peri = cv.arcLength(contour, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(contour, approx, 0.02 * peri, true);
          
          if (approx.rows === 4) {
            // Extract corner points
            const points = [];
            for (let j = 0; j < 4; j++) {
              const point = approx.data32S.slice(j * 2, j * 2 + 2);
              points.push({ x: point[0], y: point[1] });
            }
            
            // Order points: top-left, top-right, bottom-right, bottom-left
            const orderedCorners = orderCorners(points);
            
            if (orderedCorners && isValidRectangle(orderedCorners, canvas.width, canvas.height)) {
              maxArea = area;
              bestCorners = orderedCorners;
            }
          }
          approx.delete();
        }
        contour.delete();
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

      return bestCorners;
    } catch (error) {
      console.error('Edge detection error:', error);
      return null;
    }
  }, []);

  // Order corners in a consistent way
  const orderCorners = (points: Array<{ x: number; y: number }>): DetectedCorners | null => {
    if (points.length !== 4) return null;

    // Calculate center point
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / 4;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / 4;

    // Find corners based on position relative to center
    const topLeft = points.find(p => p.x < centerX && p.y < centerY);
    const topRight = points.find(p => p.x > centerX && p.y < centerY);
    const bottomRight = points.find(p => p.x > centerX && p.y > centerY);
    const bottomLeft = points.find(p => p.x < centerX && p.y > centerY);

    if (!topLeft || !topRight || !bottomRight || !bottomLeft) {
      return null;
    }

    return { topLeft, topRight, bottomRight, bottomLeft };
  };

  // Validate if detected shape is a reasonable rectangle
  const isValidRectangle = (corners: DetectedCorners, width: number, height: number): boolean => {
    const { topLeft, topRight, bottomRight, bottomLeft } = corners;

    // Check if corners are within reasonable bounds
    const margin = Math.min(width, height) * 0.05; // 5% margin
    if (topLeft.x < margin || topLeft.y < margin ||
        topRight.x > width - margin || topRight.y < margin ||
        bottomRight.x > width - margin || bottomRight.y > height - margin ||
        bottomLeft.x < margin || bottomLeft.y > height - margin) {
      return false;
    }

    // Check if angles are roughly 90 degrees
    const angles = [
      calculateAngle(topLeft, topRight, bottomRight),
      calculateAngle(topRight, bottomRight, bottomLeft),
      calculateAngle(bottomRight, bottomLeft, topLeft),
      calculateAngle(bottomLeft, topLeft, topRight)
    ];

    return angles.every(angle => Math.abs(angle - 90) < 25); // Allow 25 degree tolerance
  };

  // Calculate angle between three points
  const calculateAngle = (p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): number => {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    const angle = Math.acos(dot / (mag1 * mag2)) * 180 / Math.PI;
    return isNaN(angle) ? 90 : angle;
  };

  // Check if detection is stable
  const isDetectionStable = useCallback((newCorners: DetectedCorners): boolean => {
    if (!lastDetectionRef.current) {
      lastDetectionRef.current = newCorners;
      return false;
    }

    const threshold = 15; // pixels
    const lastCorners = lastDetectionRef.current;

    const corners = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const;
    
    for (const corner of corners) {
      const dx = Math.abs(newCorners[corner].x - lastCorners[corner].x);
      const dy = Math.abs(newCorners[corner].y - lastCorners[corner].y);
      if (dx > threshold || dy > threshold) {
        lastDetectionRef.current = newCorners;
        return false;
      }
    }

    return true;
  }, []);

  // Start document detection with smooth animation
  const startDocumentDetection = useCallback(() => {
    if (!openCVReady || !videoRef.current || !overlayCanvasRef.current || !cameraReady) {
      return;
    }

    const detectFrame = () => {
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
        const corners = detectDocumentEdges(tempCanvas);

        if (corners) {
          if (isDetectionStable(corners)) {
            setStableFrameCount(prev => prev + 1);
            
            if (stableFrameCount >= 15 && !processing) { // 0.5 seconds of stable detection at 30fps
              setDocumentDetected(true);
              setDetectedCorners(corners);
              
              // Start auto-capture countdown
              if (!autoCapture && !captureTimeoutRef.current) {
                setAutoCapture(true);
                startCaptureCountdown();
              }
            }
          } else {
            setStableFrameCount(0);
          }

          // Draw detection overlay with smooth animation
          drawDetectionOverlay(overlayCtx, corners, stableFrameCount >= 15);
        } else {
          setDocumentDetected(false);
          setAutoCapture(false);
          setStableFrameCount(0);
          setDetectedCorners(null);
          if (captureTimeoutRef.current) {
            clearTimeout(captureTimeoutRef.current);
            captureTimeoutRef.current = null;
            setCaptureCountdown(0);
          }
        }

      } catch (error) {
        console.warn('Document detection error:', error);
      }

      // Continue detection
      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    // Start detection loop
    animationFrameRef.current = requestAnimationFrame(detectFrame);
  }, [openCVReady, cameraReady, processing, detectDocumentEdges, isDetectionStable, stableFrameCount]);

  // Draw detection overlay with professional styling
  const drawDetectionOverlay = (ctx: CanvasRenderingContext2D, corners: DetectedCorners, isStable: boolean) => {
    const { topLeft, topRight, bottomRight, bottomLeft } = corners;
    
    // Set up styling
    ctx.lineWidth = 3;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    
    // Use different colors for stable vs unstable detection
    const strokeColor = isStable ? '#00ff00' : '#ffaa00';
    const fillColor = isStable ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 170, 0, 0.1)';
    
    // Draw filled area
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw corner indicators with animation
    const cornerRadius = isStable ? 16 : 12;
    const corners_array = [topLeft, topRight, bottomRight, bottomLeft];
    
    corners_array.forEach((corner, index) => {
      // Outer circle
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, cornerRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Inner circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, cornerRadius - 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Corner number
      ctx.fillStyle = strokeColor;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), corner.x, corner.y);
    });
  };

  // Start capture countdown with smooth animation
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
    setAutoCapture(false);
    setCaptureCountdown(0);
    setStableFrameCount(0);
    setDetectedCorners(null);
    lastDetectionRef.current = null;
  }, []);

  // Initialize camera when ready
  useEffect(() => {
    if (currentStep === 'camera' && (permissionGranted || !permissionDenied)) {
      if (openCVReady && !cameraReady) {
        initializeCamera();
      }
    } else {
      cleanupCamera();
    }

    return () => {
      cleanupCamera();
    };
  }, [currentStep, openCVReady, permissionGranted, permissionDenied, cameraReady, initializeCamera, cleanupCamera]);

  // Start detection when ready
  useEffect(() => {
    if (cameraReady && openCVReady && currentStep === 'camera') {
      startDocumentDetection();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraReady, openCVReady, currentStep, startDocumentDetection]);

  // Capture and process photo with enhanced quality
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

  // Enhanced image processing with automatic cropping
  const processImage = async (originalCanvas: HTMLCanvasElement) => {
    try {
      let processedCanvas = originalCanvas;
      const imageData = originalCanvas.toDataURL('image/jpeg', 0.95);

      // Use detected corners if available, otherwise detect again
      let corners = detectedCorners;
      if (!corners) {
        corners = detectDocumentEdges(originalCanvas);
      }
      
      if (corners) {
        console.log('Document edges detected, applying perspective correction');
        processedCanvas = await performPerspectiveCorrection(originalCanvas, corners);
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

  // Enhanced perspective correction
  const performPerspectiveCorrection = async (canvas: HTMLCanvasElement, corners: DetectedCorners): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      try {
        const cv = window.cv;
        const src = cv.imread(canvas);
        
        const { topLeft, topRight, bottomRight, bottomLeft } = corners;

        // Calculate output dimensions based on the document
        const width = Math.max(
          Math.sqrt(Math.pow(topRight.x - topLeft.x, 2) + Math.pow(topRight.y - topLeft.y, 2)),
          Math.sqrt(Math.pow(bottomRight.x - bottomLeft.x, 2) + Math.pow(bottomRight.y - bottomLeft.y, 2))
        );
        
        const height = Math.max(
          Math.sqrt(Math.pow(bottomLeft.x - topLeft.x, 2) + Math.pow(bottomLeft.y - topLeft.y, 2)),
          Math.sqrt(Math.pow(bottomRight.x - topRight.x, 2) + Math.pow(bottomRight.y - topRight.y, 2))
        );

        // Create transformation matrix
        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          topLeft.x, topLeft.y,
          topRight.x, topRight.y,
          bottomRight.x, bottomRight.y,
          bottomLeft.x, bottomLeft.y
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
    const brightness = 20;
    const contrast = 1.4;
    const gamma = 0.75;

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

  // Toggle flash (if supported)
  const toggleFlash = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'getCapabilities' in track) {
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          try {
            await track.applyConstraints({
              advanced: [{ torch: !flashEnabled } as any]
            });
            setFlashEnabled(!flashEnabled);
          } catch (error) {
            console.log('Flash not supported on this device');
          }
        }
      }
    }
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

  // Request camera permission
  const requestCameraPermission = async () => {
    setError(null);
    await initializeCamera();
  };

  // Render camera view
  const renderCameraView = () => (
    <div className="relative h-full flex flex-col bg-black">
      {/* Camera preview */}
      <div className="flex-1 relative overflow-hidden">
        {permissionDenied ? (
          <div className="flex-1 flex items-center justify-center bg-gray-900 text-white p-8">
            <div className="text-center max-w-sm">
              <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Kamera hozzáférés szükséges</h3>
              <p className="text-sm text-gray-300 mb-6">
                A dokumentum beolvasásához engedélyezze a kamera használatát.
              </p>
              <button
                onClick={requestCameraPermission}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Kamera engedélyezése
              </button>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
        
        {/* Status indicators */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          {!openCVReady && (
            <div className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>AI betöltése...</span>
            </div>
          )}
          
          {openCVReady && !cameraReady && permissionGranted && (
            <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Kamera inicializálása...</span>
            </div>
          )}
          
          {documentDetected && !autoCapture && (
            <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 animate-pulse">
              <Check className="h-4 w-4" />
              <span>Dokumentum felismerve</span>
            </div>
          )}
          
          {autoCapture && captureCountdown > 0 && (
            <div className="bg-red-500 text-white px-6 py-3 rounded-full text-lg font-bold flex items-center space-x-2 animate-bounce">
              <span className="text-2xl">{captureCountdown}</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        {cameraReady && openCVReady && !documentDetected && !permissionDenied && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-center text-white z-10">
            <div className="bg-black bg-opacity-60 px-6 py-4 rounded-xl backdrop-blur-sm">
              <Square className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <p className="text-sm font-medium">Helyezze a dokumentumot a keretbe</p>
              <p className="text-xs opacity-75 mt-1">A rendszer automatikusan felismeri és lefényképezi</p>
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
            {/* Flash toggle */}
            <button
              onClick={toggleFlash}
              className={`p-3 rounded-full transition-colors ${
                flashEnabled ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <Zap className="h-5 w-5 text-white" />
            </button>

            {/* Manual capture button */}
            <button
              onClick={capturePhoto}
              disabled={!cameraReady || !openCVReady || processing || permissionDenied}
              className="p-4 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
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