import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Check, X, Plus, FileText, Loader, AlertCircle, Edit, RotateCcw } from 'lucide-react';
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

interface Point {
  x: number;
  y: number;
}

interface ManualCropperProps {
  imageData: string;
  initialPoints: Point[];
  onApply: (points: Point[]) => void;
  onCancel: () => void;
}

// Manual Cropper Component using Konva
const ManualCropper: React.FC<ManualCropperProps> = ({ imageData, initialPoints, onApply, onCancel }) => {
  const [points, setPoints] = useState<Point[]>(initialPoints);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState<number | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const containerWidth = window.innerWidth - 32; // Account for padding
      const containerHeight = window.innerHeight - 200; // Account for header and buttons

      const scaleX = containerWidth / img.width;
      const scaleY = containerHeight / img.height;
      const newScale = Math.min(scaleX, scaleY, 1);

      const displayWidth = img.width * newScale;
      const displayHeight = img.height * newScale;

      canvas.width = displayWidth;
      canvas.height = displayHeight;

      setImageSize({ width: displayWidth, height: displayHeight });
      setScale(newScale);

      // Scale the initial points to match the display size
      const scaledPoints = initialPoints.map(point => ({
        x: point.x * newScale,
        y: point.y * newScale
      }));
      setPoints(scaledPoints);

      // Draw the image
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        drawOverlay(ctx, scaledPoints);
      }
    };
    img.src = imageData;
    imageRef.current = img;
  }, [imageData, initialPoints]);

  const drawOverlay = (ctx: CanvasRenderingContext2D, currentPoints: Point[]) => {
    if (currentPoints.length !== 4) return;

    // Clear previous overlay
    const img = imageRef.current;
    if (img) {
      ctx.clearRect(0, 0, imageSize.width, imageSize.height);
      ctx.drawImage(img, 0, 0, imageSize.width, imageSize.height);
    }

    // Draw crop area
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    
    ctx.beginPath();
    ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
    for (let i = 1; i < currentPoints.length; i++) {
      ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Draw corner handles
    currentPoints.forEach((point, index) => {
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 15, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Add corner labels
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText((index + 1).toString(), point.x, point.y + 4);
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find the closest point
    let closestIndex = -1;
    let minDistance = Infinity;

    points.forEach((point, index) => {
      const distance = Math.hypot(x - point.x, y - point.y);
      if (distance < 30 && distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== -1) {
      setIsDragging(closestIndex);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(imageSize.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(imageSize.height, e.clientY - rect.top));

    const newPoints = [...points];
    newPoints[isDragging] = { x, y };
    setPoints(newPoints);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawOverlay(ctx, newPoints);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Find the closest point
    let closestIndex = -1;
    let minDistance = Infinity;

    points.forEach((point, index) => {
      const distance = Math.hypot(x - point.x, y - point.y);
      if (distance < 40 && distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== -1) {
      setIsDragging(closestIndex);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDragging === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(imageSize.width, touch.clientX - rect.left));
    const y = Math.max(0, Math.min(imageSize.height, touch.clientY - rect.top));

    const newPoints = [...points];
    newPoints[isDragging] = { x, y };
    setPoints(newPoints);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawOverlay(ctx, newPoints);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(null);
  };

  const handleApply = () => {
    // Scale points back to original image size
    const originalPoints = points.map(point => ({
      x: point.x / scale,
      y: point.y / scale
    }));
    onApply(originalPoints);
  };

  const resetPoints = () => {
    const scaledPoints = initialPoints.map(point => ({
      x: point.x * scale,
      y: point.y * scale
    }));
    setPoints(scaledPoints);

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      drawOverlay(ctx, scaledPoints);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-black border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Manuális vágás</h3>
          <button
            onClick={resetPoints}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Visszaállítás"
          >
            <RotateCcw className="h-5 w-5 text-white" />
          </button>
        </div>
        <p className="text-sm text-gray-300 mt-1">
          Húzza a sarkok pontjait a pontos vágáshoz
        </p>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full border border-gray-600 rounded-lg cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Controls */}
      <div className="p-4 bg-black border-t border-gray-700">
        <div className="flex items-center justify-between space-x-4">
          <button
            onClick={onCancel}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Mégse
          </button>
          <button
            onClick={handleApply}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            <Check className="h-4 w-4 mr-2" />
            Alkalmazás
          </button>
        </div>
      </div>
    </div>
  );
};

export const MobileScanner: React.FC<MobileScannerProps> = ({ onScanComplete, onClose }) => {
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [currentStep, setCurrentStep] = useState<'camera' | 'preview' | 'naming' | 'manualCrop'>('camera');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [openCVReady, setOpenCVReady] = useState(false);
  const [documentDetected, setDocumentDetected] = useState(false);
  const [fileName, setFileName] = useState('');
  
  // Manual cropping state
  const [manualCropData, setManualCropData] = useState<{
    imageData: string;
    originalCanvas: HTMLCanvasElement;
    detectedPoints: Point[];
  } | null>(null);
  
  // Track if PDF creation has started (for mobile preview hiding)
  const [pdfCreationStarted, setPdfCreationStarted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<Point[] | null>(null);

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

  // Enhanced document edge detection with fallback
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

      // Apply Gaussian blur with enhanced kernel
      cv.GaussianBlur(gray, blurred, new cv.Size(7, 7), 0);

      // Apply Canny edge detection with proven thresholds
      cv.Canny(blurred, edged, 75, 200);

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

  // Start continuous document detection
  const startDocumentDetection = useCallback(() => {
    if (!openCVReady || !videoRef.current || !overlayCanvasRef.current || !cameraReady) {
      console.log('Cannot start detection - missing requirements');
      return;
    }

    console.log('Starting enhanced document detection');

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
          setDocumentDetected(true);
          lastDetectionRef.current = contour;
          
          // Draw detection overlay
          drawDetectionOverlay(overlayCtx, contour);
        } else {
          setDocumentDetected(false);
          lastDetectionRef.current = null;
        }

      } catch (error) {
        console.warn('Document detection error:', error);
      }
    };

    // Run detection every 150ms for smoother performance
    detectionIntervalRef.current = window.setInterval(detectDocument, 150);
  }, [openCVReady, cameraReady]);

  // Draw detection overlay
  const drawDetectionOverlay = (ctx: CanvasRenderingContext2D, contour: Point[]) => {
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
    contour.forEach((point, index) => {
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
      ctx.fill();
      
      // Inner white dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Corner number
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText((index + 1).toString(), point.x, point.y + 3);
    });
  };

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

  // Capture and process photo using live-detected edges
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReady || processing) return;

    console.log('Capturing photo...');
    setProcessing(true);

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

    // Process the image using the live-detected contour
    setTimeout(() => {
      processImage(canvas, lastDetectionRef.current);
    }, 100);
  }, [cameraReady, processing]);

  // Process captured image with live-detected contour
  const processImage = async (originalCanvas: HTMLCanvasElement, detectedContour: Point[] | null) => {
    try {
      let processedCanvas = originalCanvas;
      const imageData = originalCanvas.toDataURL('image/jpeg', 0.9);

      // Use the live-detected contour if available
      if (detectedContour && detectedContour.length === 4) {
        console.log('Using live-detected edges for cropping');
        processedCanvas = await performPerspectiveCorrection(originalCanvas, detectedContour);
      } else {
        console.log('No live detection available, attempting edge detection on captured image');
        // Fallback: try to detect edges on the captured image
        const fallbackContour = detectDocumentEdges(originalCanvas);
        if (fallbackContour && fallbackContour.length === 4) {
          processedCanvas = await performPerspectiveCorrection(originalCanvas, fallbackContour);
          detectedContour = fallbackContour;
        } else {
          console.log('No document edges detected, offering manual crop');
          // If no edges detected, use full image corners for manual cropping
          detectedContour = [
            { x: 0, y: 0 },
            { x: originalCanvas.width, y: 0 },
            { x: originalCanvas.width, y: originalCanvas.height },
            { x: 0, y: originalCanvas.height }
          ];
        }
      }

      // Set up manual cropping data
      setManualCropData({
        imageData,
        originalCanvas,
        detectedPoints: detectedContour || []
      });

      // Go to manual crop step
      setCurrentStep('manualCrop');

    } catch (err) {
      console.error('Image processing error:', err);
      setError('Kép feldolgozási hiba. Próbálja újra.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle manual crop apply
  const handleManualCropApply = async (adjustedPoints: Point[]) => {
    if (!manualCropData) return;

    setProcessing(true);
    try {
      // Apply perspective correction with user-adjusted points
      let processedCanvas = await performPerspectiveCorrection(manualCropData.originalCanvas, adjustedPoints);
      
      // Enhance image quality
      const enhancedCanvas = enhanceImage(processedCanvas);
      const enhancedImageData = enhancedCanvas.toDataURL('image/jpeg', 0.95);

      // Create new scanned page
      const newPage: ScannedPage = {
        id: Date.now().toString(),
        originalImage: manualCropData.imageData,
        processedImage: enhancedImageData,
        canvas: enhancedCanvas
      };

      setScannedPages(prev => [...prev, newPage]);
      setManualCropData(null);
      setCurrentStep('preview');
    } catch (err) {
      console.error('Manual crop processing error:', err);
      setError('Manuális vágás feldolgozási hiba. Próbálja újra.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle manual crop cancel
  const handleManualCropCancel = () => {
    setManualCropData(null);
    setCurrentStep('camera');
  };

  // Remove a scanned page
  const removePage = (pageId: string) => {
    setScannedPages(prev => prev.filter(page => page.id !== pageId));
  };

  // Add another page
  const addAnotherPage = () => {
    setCurrentStep('camera');
  };

  // Generate default filename
  const generateDefaultFilename = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    return `scanned_document_${dateStr}`;
  };

  // Generate PDF from scanned pages
  const generatePDF = async () => {
    if (scannedPages.length === 0) return;

    // Set PDF creation started for mobile preview hiding
    setPdfCreationStarted(true);

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
      const finalFileName = fileName.trim() || generateDefaultFilename();

      onScanComplete(pdfBlob, finalFileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('PDF készítési hiba. Próbálja újra.');
    } finally {
      setProcessing(false);
    }
  };

  // Render camera view
  const renderCameraView = () => (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Exit button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors"
        >
          <X className="h-6 w-6 text-white" />
        </button>
      </div>

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

      {/* Camera controls - positioned higher */}
      <div className="p-4 pb-12 bg-black">
        <div className="flex items-center justify-center">
          {/* Manual capture button - always visible */}
          <button
            onClick={capturePhoto}
            disabled={!cameraReady || !openCVReady || processing}
            className="p-4 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            <Camera className="h-8 w-8 text-black" />
          </button>
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
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${pdfCreationStarted ? 'hidden md:block' : ''}`}>
        {scannedPages.map((page, index) => (
          <div key={page.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Oldal {index + 1}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Set up manual cropping for this page
                    setManualCropData({
                      imageData: page.originalImage,
                      originalCanvas: page.canvas || document.createElement('canvas'),
                      detectedPoints: [
                        { x: 0, y: 0 },
                        { x: page.canvas?.width || 0, y: 0 },
                        { x: page.canvas?.width || 0, y: page.canvas?.height || 0 },
                        { x: 0, y: page.canvas?.height || 0 }
                      ]
                    });
                    setCurrentStep('manualCrop');
                  }}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Manuális vágás"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removePage(page.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
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

      {/* Mobile-only page count indicator */}
      <div className={`md:hidden p-4 bg-gray-50 border-t border-gray-200 ${pdfCreationStarted ? '' : 'hidden'}`}>
        <div className="text-center">
          {scannedPages.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {scannedPages.length} oldal beolvasva - PDF készítése folyamatban...
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
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
            onClick={() => {
              setCurrentStep('naming');
            }}
            disabled={scannedPages.length === 0}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            Tovább ({scannedPages.length} oldal)
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

  // Render naming view
  const renderNamingView = () => (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Dokumentum neve
          </h3>
          <button
            onClick={() => setCurrentStep('preview')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Naming form */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fájl neve
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={generateDefaultFilename()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              A .pdf kiterjesztés automatikusan hozzáadódik
            </p>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Gyors javaslatok:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                'szamla_' + new Date().toISOString().split('T')[0],
                'bizonylat_' + new Date().toISOString().split('T')[0],
                'dokumentum_' + new Date().toISOString().split('T')[0],
                'beolvasott_' + new Date().toISOString().split('T')[0]
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setFileName(suggestion)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p className="mb-2">Előnézet:</p>
            <p className="font-mono bg-gray-100 px-3 py-2 rounded border">
              {(fileName.trim() || generateDefaultFilename()) + '.pdf'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between space-x-3">
          <button
            onClick={() => setCurrentStep('preview')}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Vissza
          </button>

          <button
            onClick={generatePDF}
            disabled={processing}
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
      {currentStep === 'naming' && renderNamingView()}
      {currentStep === 'manualCrop' && manualCropData && (
        <ManualCropper
          imageData={manualCropData.imageData}
          initialPoints={manualCropData.detectedPoints}
          onApply={handleManualCropApply}
          onCancel={handleManualCropCancel}
        />
      )}
    </div>
  );
};

// Extend Window interface for OpenCV
declare global {
  interface Window {
    cv: any;
  }
}