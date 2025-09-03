import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera } from 'lucide-react';
import jsPDF from 'jspdf';
import Cookies from 'js-cookie';

interface MobileScannerProps {
  onScanComplete: (pdfBlob: Blob, fileName: string) => void;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

// Apple-quality scanning experience with minimal UI and luxurious design

export const MobileScanner: React.FC<MobileScannerProps> = ({ onScanComplete, onClose }) => {
  // Simplified state management for Apple-like experience
  const [processing, setProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [openCVReady, setOpenCVReady] = useState(false);
  const [documentDetected, setDocumentDetected] = useState(false);
  const [captureAnimation, setCaptureAnimation] = useState(false);

  // Core refs for camera and processing
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<Point[] | null>(null);
  const stabilityCountRef = useRef(0);

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
          setOpenCVReady(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        console.error('OpenCV loading error:', err);
        setOpenCVReady(false);
      }
    };

    loadOpenCV();
  }, []);

  // Check camera permission status with cookies
  const checkCameraPermission = useCallback(async () => {
    // Check if we already have permission cached
    const hasPermission = Cookies.get('camera_permission_granted');
    if (hasPermission === 'true') {
      return true;
    }

    try {
      // Check actual permission status
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (permissionStatus.state === 'granted') {
        // Cache the permission
        Cookies.set('camera_permission_granted', 'true', { expires: 365 });
        return true;
      }
    } catch (err) {
      // Fallback for browsers that don't support permissions API
      console.log('Permissions API not supported, will request directly');
    }

    return false;
  }, []);

  // Initialize camera with high resolution
  const initializeCamera = useCallback(async () => {
    try {
      // Check if we already have permission
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        // Only show permission dialog if not already granted
        const shouldAsk = !Cookies.get('camera_permission_asked');
        if (!shouldAsk) {
          return;
        }
        Cookies.set('camera_permission_asked', 'true', { expires: 1 }); // Expires in 1 day
      }
      
        const constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 3840, min: 1920 },
            height: { ideal: 2160, min: 1080 },
            frameRate: { ideal: 60 }
          }
        };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Cache successful permission
      Cookies.set('camera_permission_granted', 'true', { expires: 365 });

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
    }
  }, [openCVReady, checkCameraPermission]);

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

  // Enhanced multi-pass document edge detection with adaptive thresholding
  const detectDocumentEdges = (canvas: HTMLCanvasElement): Point[] | null => {
    if (!window.cv) return null;

    try {
      const cv = window.cv;
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const edged = new cv.Mat();
      const edgedFinal = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();

      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Apply advanced Gaussian blur for noise reduction
      cv.GaussianBlur(gray, blurred, new cv.Size(9, 9), 0);

      // Multi-pass Canny edge detection for better edge capture
      const edged1 = new cv.Mat();
      const edged2 = new cv.Mat();
      const edged3 = new cv.Mat();
      
      // Pass 1: Conservative thresholds for strong edges
      cv.Canny(blurred, edged1, 50, 150);
      
      // Pass 2: Moderate thresholds for medium edges  
      cv.Canny(blurred, edged2, 75, 200);
      
      // Pass 3: Aggressive thresholds for weak edges
      cv.Canny(blurred, edged3, 100, 250);
      
      // Combine all edge maps using bitwise OR
      cv.bitwise_or(edged1, edged2, edgedFinal);
      cv.bitwise_or(edgedFinal, edged3, edgedFinal);
      
      // Apply morphological operations for better contour continuity
      const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
      cv.morphologyEx(edgedFinal, edged, cv.MORPH_CLOSE, kernel);
      
      // Cleanup intermediate matrices
      edged1.delete();
      edged2.delete();
      edged3.delete();
      edgedFinal.delete();
      kernel.delete();

      // Find contours
      cv.findContours(edged, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

      let biggest = null;
      let maxArea = 0;
      const minArea = canvas.width * canvas.height * 0.1; // At least 10% of image

      // First pass: Look for perfect quadrilaterals
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

      // Second pass: If no perfect quadrilateral found, use largest contour with minAreaRect
      if (!biggest || maxArea < minArea * 2) {
        console.log('No perfect quadrilateral found, using fallback method');
        
        let largestContour = null;
        let largestArea = 0;

        for (let i = 0; i < contours.size(); i++) {
          const cnt = contours.get(i);
          const area = cv.contourArea(cnt);
          if (area > largestArea && area > minArea) {
            largestArea = area;
            if (largestContour) largestContour.delete();
            largestContour = cnt.clone();
          }
          cnt.delete();
        }

        if (largestContour) {
          // Use minAreaRect to get a rotated bounding rectangle
          const rect = cv.minAreaRect(largestContour);
          const vertices = cv.RotatedRect.points(rect);
          
          const points: Point[] = [];
          for (let i = 0; i < 4; i++) {
            points.push({ x: vertices[i].x, y: vertices[i].y });
          }

          largestContour.delete();

          // Cleanup
          src.delete();
          gray.delete();
          blurred.delete();
          edged.delete();
          contours.delete();
          hierarchy.delete();

          return orderPoints(points);
        }
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

  // Enhanced Apple-style document detection with stability
  const startDocumentDetection = useCallback(() => {
    if (!openCVReady || !videoRef.current || !cameraReady) return;

    const detectDocument = () => {
      if (!videoRef.current || !cameraReady || !overlayCanvasRef.current) return;

      try {
        const video = videoRef.current;
        const overlay = overlayCanvasRef.current;
        const ctx = overlay.getContext('2d');
        if (!ctx) return;

        // Update overlay size to match video
        const rect = video.getBoundingClientRect();
        overlay.width = rect.width;
        overlay.height = rect.height;

        // Clear previous overlay
        ctx.clearRect(0, 0, overlay.width, overlay.height);

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
          stabilityCountRef.current++;
          lastDetectionRef.current = contour;

          // Only show as detected after 3 consecutive stable detections (Apple-style stability)
          if (stabilityCountRef.current >= 3) {
            setDocumentDetected(true);
            
            // Draw elegant blue outline (Apple-style)
            const scaleX = overlay.width / video.videoWidth;
            const scaleY = overlay.height / video.videoHeight;

            const scaledPoints = contour.map(point => ({
              x: point.x * scaleX,
              y: point.y * scaleY
            }));

            // Apple-style blue outline with subtle glow
            ctx.strokeStyle = '#007AFF';
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(0, 122, 255, 0.3)';
            ctx.shadowBlur = 8;
            
            ctx.beginPath();
            ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
            for (let i = 1; i < scaledPoints.length; i++) {
              ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
            }
            ctx.closePath();
            ctx.stroke();

            // Clean corner indicators
            ctx.shadowBlur = 0;
            scaledPoints.forEach(point => {
              ctx.fillStyle = '#007AFF';
              ctx.beginPath();
              ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
              ctx.fill();
              
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
        } else {
          stabilityCountRef.current = 0;
          setDocumentDetected(false);
          lastDetectionRef.current = null;
        }

      } catch (error) {
        console.warn('Document detection error:', error);
      }
    };

    // 60fps detection for smooth Apple-like experience
    detectionIntervalRef.current = window.setInterval(detectDocument, 16);
  }, [openCVReady, cameraReady]);

  // Cleanup camera and detection
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
    stabilityCountRef.current = 0;
    lastDetectionRef.current = null;
  }, []);

  useEffect(() => {
    if (openCVReady) {
      initializeCamera();
    }
    return cleanupCamera;
  }, [openCVReady, initializeCamera, cleanupCamera]);

  // Start detection when both camera and OpenCV are ready
  useEffect(() => {
    if (cameraReady && openCVReady) {
      startDocumentDetection();
    }
  }, [cameraReady, openCVReady, startDocumentDetection]);

  // Enhanced perspective correction using proven logic
  const performPerspectiveCorrection = async (canvas: HTMLCanvasElement, contour: Point[]): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      try {
        const cv = window.cv;
        const src = cv.imread(canvas);
        
        // Order points correctly using the proven function
        const ordered = orderPoints(contour);
        const [tl, tr, br, bl] = ordered;

        // Calculate dimensions based on the distances between ordered points
        const widthA = Math.hypot(br.x - bl.x, br.y - bl.y);
        const widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y);
        const maxWidth = Math.max(widthA, widthB);

        const heightA = Math.hypot(tr.x - br.x, tr.y - br.y);
        const heightB = Math.hypot(tl.x - bl.x, tl.y - bl.y);
        const maxHeight = Math.max(heightA, heightB);

        // Create transformation matrix with correctly ordered points
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

  // Apple-style instant capture with elegant animation
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReady || processing) return;

    // Instant visual feedback
    setCaptureAnimation(true);
    setTimeout(() => setCaptureAnimation(false), 200);

    setProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setProcessing(false);
      return;
    }

    // Capture at highest resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Process immediately in background (Apple-style)
    processAndSaveDocument(canvas, lastDetectionRef.current);
  }, [cameraReady, processing]);

  // Apple-style streamlined processing: capture → enhance → save
  const processAndSaveDocument = async (originalCanvas: HTMLCanvasElement, detectedContour: Point[] | null) => {
    try {
      let processedCanvas = originalCanvas;

      // Apply perspective correction if edges were detected
      if (detectedContour && detectedContour.length === 4) {
        processedCanvas = await performPerspectiveCorrection(originalCanvas, detectedContour);
      } else {
        // Fallback: try to detect edges on captured image
        const fallbackContour = detectDocumentEdges(originalCanvas);
        if (fallbackContour && fallbackContour.length === 4) {
          processedCanvas = await performPerspectiveCorrection(originalCanvas, fallbackContour);
        }
      }

      // Apply enhancement for document quality
      const enhancedCanvas = enhanceImage(processedCanvas);
      
      // Generate PDF immediately (Apple-style single-step)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = enhancedCanvas.toDataURL('image/jpeg', 0.95);
      });

      // Calculate optimal sizing for A4
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const maxWidth = pageWidth - (margin * 2);
      const maxHeight = pageHeight - (margin * 2);
      
      const aspectRatio = img.width / img.height;
      let imgWidth, imgHeight;
      
      if (aspectRatio > maxWidth / maxHeight) {
        imgWidth = maxWidth;
        imgHeight = imgWidth / aspectRatio;
      } else {
        imgHeight = maxHeight;
        imgWidth = imgHeight * aspectRatio;
      }
      
      const xOffset = margin + (maxWidth - imgWidth) / 2;
      const yOffset = margin + (maxHeight - imgHeight) / 2;

      pdf.addImage(img.src, 'JPEG', xOffset, yOffset, imgWidth, imgHeight);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `document_${timestamp}`;
      
      const pdfBlob = pdf.output('blob');
      onScanComplete(pdfBlob, filename);

    } catch (err) {
      console.error('Document processing error:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Simplified component - no complex multi-step flow needed for Apple experience

  // Apple-quality camera interface - minimal and luxurious

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Capture animation overlay */}
      {captureAnimation && (
        <div className="absolute inset-0 bg-white opacity-70 z-30 animate-fade-out" />
      )}
      
      {/* Processing overlay with elegant design */}
      {processing && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-40">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-white text-lg font-medium tracking-wide">Processing...</p>
          </div>
        </div>
      )}

      {/* Minimal close button */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 z-30 w-10 h-10 rounded-full bg-black bg-opacity-30 hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Camera preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Elegant edge detection overlay */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Apple-style capture button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="relative flex items-center justify-center">
          {/* Outer ring with document detection feedback */}
          <div 
            className={`w-20 h-20 rounded-full border-4 transition-all duration-300 ${
              documentDetected 
                ? 'border-blue-400 shadow-lg shadow-blue-400/30' 
                : 'border-white border-opacity-40'
            }`}
          />
          
          {/* Inner capture button */}
          <button
            onClick={capturePhoto}
            disabled={!cameraReady || !openCVReady || processing}
            className={`absolute w-16 h-16 rounded-full transition-all duration-200 transform active:scale-95 disabled:opacity-50 ${
              documentDetected
                ? 'bg-blue-500 shadow-xl shadow-blue-500/30 hover:scale-105'
                : 'bg-white hover:scale-105'
            }`}
          >
            <Camera className={`w-6 h-6 mx-auto ${documentDetected ? 'text-white' : 'text-gray-800'}`} />
          </button>
        </div>
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

};

// Extend Window interface for OpenCV
declare global {
  interface Window {
    cv: any;
  }
}