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
    // Store reference for cleanup
    (imageRef as any).current = img;
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
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Manuális vágás</h3>
          <button
            onClick={resetPoints}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Visszaállítás"
          >
            <RotateCcw className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Húzza a sarkok pontjait a pontos vágáshoz
        </p>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-gray-50">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full border border-gray-300 rounded-lg cursor-crosshair bg-white shadow-lg"
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
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between space-x-4">
          <button
            onClick={onCancel}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Mégse
          </button>
          <button
            onClick={handleApply}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
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
  const [, setDocumentDetected] = useState(false);
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

  // Initialize camera with high resolution and better settings
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 2560, min: 1920 },
          height: { ideal: 1440, min: 1080 },
          frameRate: { ideal: 60, min: 30 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera ready with enhanced settings, starting detection');
          setCameraReady(true);
          if (openCVReady) {
            startDocumentDetection();
          }
        };
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      const errorMsg = err instanceof Error && err.name === 'NotAllowedError' 
        ? 'Kamera hozzáférés megtagadva. Engedélyezze a kamera használatát a böngésző beállításaiban.'
        : 'Kamera inicializálási hiba. Próbálja újra.';
      setError(errorMsg);
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

  // Enhanced document edge detection with multiple algorithms
  const detectDocumentEdges = (canvas: HTMLCanvasElement): Point[] | null => {
    if (!window.cv) return null;

    try {
      const cv = window.cv;
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const edged = new cv.Mat();
      const morphed = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();

      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Multiple blur passes for better noise reduction
      cv.GaussianBlur(gray, blurred, new cv.Size(9, 9), 2);
      cv.bilateralFilter(blurred, gray, 9, 80, 80);

      // Enhanced edge detection with multiple methods
      const edges1 = new cv.Mat();
      const edges2 = new cv.Mat();
      
      // Primary Canny detection with adaptive thresholds
      const mean = cv.mean(gray);
      const meanVal = mean[0];
      const lowerThresh = Math.max(50, meanVal * 0.5);
      const upperThresh = Math.min(200, meanVal * 1.5);
      
      cv.Canny(gray, edges1, lowerThresh, upperThresh);
      
      // Secondary Canny with different thresholds for different lighting
      cv.Canny(gray, edges2, 50, 150);
      
      // Combine edge results
      cv.bitwise_or(edges1, edges2, edged);
      
      // Morphological operations to connect broken edges
      const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
      cv.morphologyEx(edged, morphed, cv.MORPH_CLOSE, kernel);
      cv.dilate(morphed, edged, kernel, new cv.Point(-1, -1), 1);

      // Find contours with better hierarchy
      cv.findContours(edged, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let bestContour = null;
      let maxArea = 0;
      const minArea = canvas.width * canvas.height * 0.1;
      const maxAreaThreshold = canvas.width * canvas.height * 0.95;

      // Multi-pass contour analysis
      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt);
        
        if (area > minArea && area < maxAreaThreshold) {
          const peri = cv.arcLength(cnt, true);
          const approx = new cv.Mat();
          
          // Try multiple approximation levels
          const epsilons = [0.01, 0.02, 0.03, 0.04];
          
          for (const eps of epsilons) {
            cv.approxPolyDP(cnt, approx, eps * peri, true);
            
            if (approx.rows === 4) {
              const convexHull = new cv.Mat();
              cv.convexHull(approx, convexHull);
              
              if (convexHull.rows === 4) {
                const aspectRatio = calculateAspectRatio(approx);
                
                // Prefer rectangles with reasonable aspect ratios
                if (aspectRatio > 0.2 && aspectRatio < 5.0 && area > maxArea) {
                  maxArea = area;
                  if (bestContour) bestContour.delete();
                  bestContour = approx.clone();
                }
              }
              convexHull.delete();
              break;
            }
          }
          approx.delete();
        }
        cnt.delete();
      }

      // Fallback: Use largest reasonable rectangle if no perfect match
      if (!bestContour || maxArea < minArea * 1.5) {
        console.log('Using fallback rectangle detection');
        
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
          morphed.delete();
          edges1.delete();
          edges2.delete();
          kernel.delete();
          contours.delete();
          hierarchy.delete();

          return orderPoints(points);
        }
      }

      let points: Point[] | null = null;
      if (bestContour && bestContour.rows === 4) {
        points = [];
        for (let i = 0; i < bestContour.rows; i++) {
          const pt = bestContour.intPtr(i);
          points.push({ x: pt[0], y: pt[1] });
        }
        
        points = orderPoints(points);
        bestContour.delete();
      }

      // Cleanup
      src.delete();
      gray.delete();
      blurred.delete();
      edged.delete();
      morphed.delete();
      edges1.delete();
      edges2.delete();
      kernel.delete();
      contours.delete();
      hierarchy.delete();

      return points;
    } catch (error) {
      console.error('Enhanced edge detection error:', error);
      return null;
    }
  };

  // Calculate aspect ratio for contour validation
  const calculateAspectRatio = (contour: any): number => {
    if (!window.cv || !contour || contour.rows !== 4) return 0;
    
    try {
      const points: Point[] = [];
      for (let i = 0; i < contour.rows; i++) {
        const pt = contour.intPtr(i);
        points.push({ x: pt[0], y: pt[1] });
      }
      
      const ordered = orderPoints(points);
      const [tl, tr, br, bl] = ordered;
      
      const width = Math.max(
        Math.hypot(tr.x - tl.x, tr.y - tl.y),
        Math.hypot(br.x - bl.x, br.y - bl.y)
      );
      
      const height = Math.max(
        Math.hypot(bl.x - tl.x, bl.y - tl.y),
        Math.hypot(br.x - tr.x, br.y - tr.y)
      );
      
      return Math.min(width, height) / Math.max(width, height);
    } catch (error) {
      return 0;
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

    // Run detection every 100ms for ultra-smooth performance
    detectionIntervalRef.current = window.setInterval(detectDocument, 100);
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
      const imageData = originalCanvas.toDataURL('image/jpeg', 0.9);

      // Use the live-detected contour if available
      if (detectedContour && detectedContour.length === 4) {
        console.log('Using live-detected edges for cropping');
        await performPerspectiveCorrection(originalCanvas, detectedContour);
      } else {
        console.log('No live detection available, attempting edge detection on captured image');
        // Fallback: try to detect edges on the captured image
        const fallbackContour = detectDocumentEdges(originalCanvas);
        if (fallbackContour && fallbackContour.length === 4) {
          await performPerspectiveCorrection(originalCanvas, fallbackContour);
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
      // Create PDF with A4 format
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // A4 dimensions in mm
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10; // Margin around the image in mm
      const maxWidth = pageWidth - (margin * 2);
      const maxHeight = pageHeight - (margin * 2);
      
      let isFirstPage = true;

      for (const page of scannedPages) {
        if (!isFirstPage) {
          pdf.addPage();
        }

        // Load image to get dimensions
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = page.processedImage;
        });
        
        // Calculate aspect ratio
        const aspectRatio = img.width / img.height;
        
        // Calculate dimensions that fit within the page while maintaining aspect ratio
        let imgWidth, imgHeight;
        
        if (aspectRatio > maxWidth / maxHeight) {
          // Image is wider than the page ratio
          imgWidth = maxWidth;
          imgHeight = imgWidth / aspectRatio;
        } else {
          // Image is taller than the page ratio
          imgHeight = maxHeight;
          imgWidth = imgHeight * aspectRatio;
        }
        
        // Calculate centering offsets
        const xOffset = margin + (maxWidth - imgWidth) / 2;
        const yOffset = margin + (maxHeight - imgHeight) / 2;

        // Add image to PDF centered with margins
        pdf.addImage(page.processedImage, 'JPEG', xOffset, yOffset, imgWidth, imgHeight);
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

  // Render camera view with clean white interface
  const renderCameraView = () => (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Clean header with exit button */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4">
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-md"
        >
          <X className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      {/* Camera preview */}
      <div className="flex-1 relative overflow-hidden bg-black">
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
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-20">
            <div className="text-white text-center bg-black/50 backdrop-blur-sm rounded-2xl p-6">
              <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-400" />
              <p className="text-lg font-medium">Dokumentum feldolgozása...</p>
              <p className="text-sm opacity-75">Kivágás és minőség javítás</p>
            </div>
          </div>
        )}
        
        {/* Status indicator */}
        <div className="absolute top-20 left-4 right-4 z-10">
          <div className="text-center">
            {cameraReady && openCVReady && (
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md inline-flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Dokumentum keresése...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clean white capture button area */}
      <div className="bg-white p-6 border-t border-gray-200 relative">
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Main capture button */}
            <button
              onClick={capturePhoto}
              disabled={!cameraReady || !openCVReady || processing}
              className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg flex items-center justify-center group"
            >
              <Camera className="h-10 w-10 text-gray-700 group-hover:text-blue-600 transition-colors" />
            </button>
            
            {/* Pulse animation when ready */}
            {cameraReady && openCVReady && !processing && (
              <div className="absolute -inset-1 rounded-full border-2 border-blue-400 opacity-60 animate-ping"></div>
            )}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Pozícionálja a dokumentumot a keretbe és érintse meg a gombot
          </p>
          {lastDetectionRef.current && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Dokumentum észlelve
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
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