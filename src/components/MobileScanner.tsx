import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Check, X, Plus, FileText, Loader, RotateCw, FlashlightOff as FlashOff, Slash as Flash, ScanLine, Maximize2, ArrowLeft, Crop } from 'lucide-react';
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
  const [autoCapture, setAutoCapture] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(0);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [documentName, setDocumentName] = useState('');
  const [currentCapture, setCurrentCapture] = useState<string | null>(null);
  const [detectedCorners, setDetectedCorners] = useState<Point[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCornerIndex, setDragCornerIndex] = useState<number>(-1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const captureTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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
              startDocumentDetection();
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
  }, [cameraFacing, flashEnabled]);

  // Smart document detection with edge detection
  const startDocumentDetection = useCallback(() => {
    if (!videoRef.current || !overlayCanvasRef.current || !cameraReady) {
      return;
    }

    let stableDetectionCount = 0;
    let lastCorners: Point[] = [];

    const detectDocument = () => {
      if (!videoRef.current || !overlayCanvasRef.current || !cameraReady) return;

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

        // Create temporary canvas for edge detection
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) {
          animationFrameRef.current = requestAnimationFrame(detectDocument);
          return;
        }

        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

        // Detect document edges
        const corners = detectDocumentEdges(tempCanvas);

        if (corners && corners.length === 4) {
          // Check if detection is stable
          if (isCornersStable(corners, lastCorners)) {
            stableDetectionCount++;
            
            if (stableDetectionCount >= 10 && !processing) {
              setDocumentDetected(true);
              setDetectedCorners(corners);
              
              if (!autoCapture && !captureTimeoutRef.current) {
                setAutoCapture(true);
                startCaptureCountdown();
              }
            }
          } else {
            stableDetectionCount = 0;
          }

          drawDetectionOverlay(overlayCtx, corners);
          lastCorners = corners;
        } else {
          setDocumentDetected(false);
          setAutoCapture(false);
          setDetectedCorners([]);
          stableDetectionCount = 0;
          if (captureTimeoutRef.current) {
            clearTimeout(captureTimeoutRef.current);
            captureTimeoutRef.current = null;
            setCaptureCountdown(0);
          }
        }

      } catch (error) {
        console.warn('Document detection error:', error);
      }

      animationFrameRef.current = requestAnimationFrame(detectDocument);
    };

    animationFrameRef.current = requestAnimationFrame(detectDocument);
  }, [cameraReady, processing]);

  // Advanced edge detection algorithm
  const detectDocumentEdges = (canvas: HTMLCanvasElement): Point[] | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Convert to grayscale
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      gray[idx] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }

    // Apply Gaussian blur
    const blurred = gaussianBlur(gray, width, height, 1.0);

    // Apply Canny edge detection
    const edges = cannyEdgeDetection(blurred, width, height);

    // Find contours
    const contours = findContours(edges, width, height);

    // Find the largest quadrilateral
    const quad = findLargestQuadrilateral(contours, width, height);

    return quad;
  };

  // Gaussian blur implementation
  const gaussianBlur = (data: Uint8Array, width: number, height: number, sigma: number): Uint8Array => {
    const result = new Uint8Array(data.length);
    const kernel = createGaussianKernel(sigma);
    const radius = Math.floor(kernel.length / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weightSum = 0;

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const weight = kernel[ky + radius] * kernel[kx + radius];
            
            sum += data[py * width + px] * weight;
            weightSum += weight;
          }
        }

        result[y * width + x] = Math.round(sum / weightSum);
      }
    }

    return result;
  };

  // Create Gaussian kernel
  const createGaussianKernel = (sigma: number): number[] => {
    const size = Math.ceil(sigma * 3) * 2 + 1;
    const kernel = new Array(size);
    const center = Math.floor(size / 2);
    let sum = 0;

    for (let i = 0; i < size; i++) {
      const x = i - center;
      kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
      sum += kernel[i];
    }

    // Normalize
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum;
    }

    return kernel;
  };

  // Canny edge detection
  const cannyEdgeDetection = (data: Uint8Array, width: number, height: number): Uint8Array => {
    const edges = new Uint8Array(width * height);
    
    // Sobel operators
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    const gradientMagnitude = new Float32Array(width * height);
    const gradientDirection = new Float32Array(width * height);

    // Calculate gradients
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = data[(y + ky) * width + (x + kx)];
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            gx += pixel * sobelX[kernelIdx];
            gy += pixel * sobelY[kernelIdx];
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const direction = Math.atan2(gy, gx);

        gradientMagnitude[y * width + x] = magnitude;
        gradientDirection[y * width + x] = direction;
      }
    }

    // Non-maximum suppression and thresholding
    const lowThreshold = 50;
    const highThreshold = 150;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const magnitude = gradientMagnitude[idx];

        if (magnitude > lowThreshold) {
          // Simplified non-maximum suppression
          const angle = gradientDirection[idx];
          const angle45 = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

          let neighbor1, neighbor2;
          if (Math.abs(angle45) < Math.PI / 8) {
            neighbor1 = gradientMagnitude[idx - 1];
            neighbor2 = gradientMagnitude[idx + 1];
          } else if (Math.abs(angle45 - Math.PI / 2) < Math.PI / 8) {
            neighbor1 = gradientMagnitude[(y - 1) * width + x];
            neighbor2 = gradientMagnitude[(y + 1) * width + x];
          } else if (Math.abs(angle45 - Math.PI / 4) < Math.PI / 8) {
            neighbor1 = gradientMagnitude[(y - 1) * width + (x + 1)];
            neighbor2 = gradientMagnitude[(y + 1) * width + (x - 1)];
          } else {
            neighbor1 = gradientMagnitude[(y - 1) * width + (x - 1)];
            neighbor2 = gradientMagnitude[(y + 1) * width + (x + 1)];
          }

          if (magnitude >= neighbor1 && magnitude >= neighbor2) {
            edges[idx] = magnitude > highThreshold ? 255 : 128;
          }
        }
      }
    }

    return edges;
  };

  // Find contours
  const findContours = (edges: Uint8Array, width: number, height: number): Point[][] => {
    const contours: Point[][] = [];
    const visited = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (edges[idx] > 0 && !visited[idx]) {
          const contour = traceContour(edges, visited, width, height, x, y);
          if (contour.length > 50) { // Minimum contour size
            contours.push(contour);
          }
        }
      }
    }

    return contours;
  };

  // Trace contour
  const traceContour = (edges: Uint8Array, visited: Uint8Array, width: number, height: number, startX: number, startY: number): Point[] => {
    const contour: Point[] = [];
    const stack: Point[] = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const point = stack.pop()!;
      const idx = point.y * width + point.x;

      if (visited[idx] || edges[idx] === 0) continue;

      visited[idx] = 1;
      contour.push(point);

      // Check 8-connected neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nx = point.x + dx;
          const ny = point.y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (!visited[nIdx] && edges[nIdx] > 0) {
              stack.push({ x: nx, y: ny });
            }
          }
        }
      }
    }

    return contour;
  };

  // Find largest quadrilateral
  const findLargestQuadrilateral = (contours: Point[][], width: number, height: number): Point[] | null => {
    let bestQuad: Point[] | null = null;
    let bestArea = 0;

    for (const contour of contours) {
      // Approximate contour to polygon
      const approx = approximatePolygon(contour, 0.02);

      if (approx.length === 4) {
        const area = calculatePolygonArea(approx);
        const minArea = (width * height) * 0.1; // At least 10% of image
        const maxArea = (width * height) * 0.9; // At most 90% of image

        if (area > minArea && area < maxArea && area > bestArea) {
          // Check if it's roughly rectangular
          if (isRoughlyRectangular(approx)) {
            bestQuad = approx;
            bestArea = area;
          }
        }
      }
    }

    return bestQuad;
  };

  // Approximate polygon using Douglas-Peucker algorithm
  const approximatePolygon = (points: Point[], epsilon: number): Point[] => {
    if (points.length < 3) return points;

    const epsilonSquared = epsilon * epsilon * points.length * points.length;

    const simplify = (start: number, end: number): Point[] => {
      if (end - start < 2) return [points[start], points[end]];

      let maxDist = 0;
      let maxIndex = start;

      for (let i = start + 1; i < end; i++) {
        const dist = pointToLineDistanceSquared(points[i], points[start], points[end]);
        if (dist > maxDist) {
          maxDist = dist;
          maxIndex = i;
        }
      }

      if (maxDist > epsilonSquared) {
        const left = simplify(start, maxIndex);
        const right = simplify(maxIndex, end);
        return [...left.slice(0, -1), ...right];
      } else {
        return [points[start], points[end]];
      }
    };

    const simplified = simplify(0, points.length - 1);
    return simplified.length > 2 ? simplified : points;
  };

  // Point to line distance squared
  const pointToLineDistanceSquared = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return A * A + B * B;

    const param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return dx * dx + dy * dy;
  };

  // Calculate polygon area
  const calculatePolygonArea = (points: Point[]): number => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  };

  // Check if polygon is roughly rectangular
  const isRoughlyRectangular = (points: Point[]): boolean => {
    if (points.length !== 4) return false;

    // Calculate angles between consecutive sides
    const angles: number[] = [];
    for (let i = 0; i < 4; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % 4];
      const p3 = points[(i + 2) % 4];

      const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
      const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

      if (mag1 === 0 || mag2 === 0) return false;

      const angle = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))));
      angles.push(angle);
    }

    // Check if all angles are close to 90 degrees (π/2 radians)
    const rightAngle = Math.PI / 2;
    const tolerance = Math.PI / 6; // 30 degrees tolerance

    return angles.every(angle => Math.abs(angle - rightAngle) < tolerance);
  };

  // Check if corners are stable
  const isCornersStable = (newCorners: Point[], lastCorners: Point[]): boolean => {
    if (lastCorners.length !== 4) return true;

    const threshold = 20; // pixels

    for (let i = 0; i < 4; i++) {
      const dx = Math.abs(newCorners[i].x - lastCorners[i].x);
      const dy = Math.abs(newCorners[i].y - lastCorners[i].y);
      if (dx > threshold || dy > threshold) {
        return false;
      }
    }

    return true;
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

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReady || processing) return;

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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCurrentCapture(imageData);
    setCurrentStep('crop');
    setProcessing(false);
  }, [cameraReady, processing]);

  // Cleanup camera
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

  // Crop the captured image
  const cropImage = (corners: Point[]): string => {
    if (!currentCapture || !cropCanvasRef.current) return '';

    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const img = new Image();
    img.onload = () => {
      // Set canvas size for the cropped document
      const targetWidth = 800;
      const targetHeight = 1000;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Create transformation matrix for perspective correction
      const srcCorners = corners;
      const dstCorners = [
        { x: 0, y: 0 },
        { x: targetWidth, y: 0 },
        { x: targetWidth, y: targetHeight },
        { x: 0, y: targetHeight }
      ];

      // Apply perspective transformation
      applyPerspectiveTransform(ctx, img, srcCorners, dstCorners, targetWidth, targetHeight);
    };
    img.src = currentCapture;

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Apply perspective transformation
  const applyPerspectiveTransform = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    srcCorners: Point[],
    dstCorners: Point[],
    width: number,
    height: number
  ) => {
    // Simple perspective transformation using canvas transform
    // This is a simplified version - for production, you'd want a more accurate implementation
    
    ctx.clearRect(0, 0, width, height);
    
    // Calculate the transformation matrix
    const matrix = calculatePerspectiveMatrix(srcCorners, dstCorners);
    
    // Apply transformation and draw
    ctx.save();
    ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  };

  // Calculate perspective transformation matrix (simplified)
  const calculatePerspectiveMatrix = (src: Point[], dst: Point[]) => {
    // Simplified transformation - in production, use a proper perspective transform library
    const scaleX = (dst[1].x - dst[0].x) / (src[1].x - src[0].x);
    const scaleY = (dst[3].y - dst[0].y) / (src[3].y - src[0].y);
    
    return {
      a: scaleX,
      b: 0,
      c: 0,
      d: scaleY,
      e: dst[0].x - src[0].x * scaleX,
      f: dst[0].y - src[0].y * scaleY
    };
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

  // Generate PDF
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

  // Render camera view
  const renderCameraView = () => (
    <div className="relative h-full flex flex-col bg-black overflow-hidden">
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
        
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-8 w-8 h-8 border-l-4 border-t-4 border-white opacity-60"></div>
          <div className="absolute top-8 right-8 w-8 h-8 border-r-4 border-t-4 border-white opacity-60"></div>
          <div className="absolute bottom-8 left-8 w-8 h-8 border-l-4 border-b-4 border-white opacity-60"></div>
          <div className="absolute bottom-8 right-8 w-8 h-8 border-r-4 border-b-4 border-white opacity-60"></div>
          
          {cameraReady && !documentDetected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
            </div>
          )}
        </div>

        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          {!cameraReady && (
            <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Kamera indítása...</span>
            </div>
          )}
          
          {documentDetected && !autoCapture && (
            <div className="bg-green-500 bg-opacity-90 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 animate-pulse">
              <Check className="h-4 w-4" />
              <span>Dokumentum észlelve</span>
            </div>
          )}
          
          {autoCapture && captureCountdown > 0 && (
            <div className="bg-red-500 bg-opacity-90 text-white px-6 py-3 rounded-full text-xl font-bold flex items-center justify-center min-w-[120px]">
              <span>{captureCountdown}</span>
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

      <div className="bg-black bg-opacity-90 p-4">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          <div className="flex items-center space-x-4">
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

            <button
              onClick={capturePhoto}
              disabled={!cameraReady || processing}
              className="p-4 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
              <Camera className="h-8 w-8 text-black" />
            </button>

            <button
              onClick={switchCamera}
              className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <RotateCw className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="w-12"></div>
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