import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Check, X, Plus, FileText, Loader, RotateCw, FlashlightOff as FlashOff, Slash as Flash, ScanLine, Maximize2, ArrowLeft } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState<'camera' | 'preview' | 'naming'>('camera');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [documentDetected, setDocumentDetected] = useState(false);
  const [autoCapture, setAutoCapture] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(0);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [documentName, setDocumentName] = useState('');
  const [customNaming, setCustomNaming] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const captureTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize camera with better error handling
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      setCameraReady(false);
      
      // Stop existing stream
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

      // Add flash constraint if supported and enabled
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
          setError('Kamera hozzáférés megtagadva. Engedélyezze a kamera használatát a böngésző beállításaiban.');
        } else if (err.name === 'NotFoundError') {
          setError('Nem található kamera. Ellenőrizze, hogy az eszköz rendelkezik-e kamerával.');
        } else if (err.name === 'NotReadableError') {
          setError('Kamera már használatban van másik alkalmazás által.');
        } else {
          setError('Kamera hiba: ' + err.message);
        }
      } else {
        setError('Ismeretlen kamera hiba történt.');
      }
    }
  }, [cameraFacing, flashEnabled]);

  // Improved document detection using simple edge detection
  const startDocumentDetection = useCallback(() => {
    if (!videoRef.current || !overlayCanvasRef.current || !cameraReady) {
      return;
    }

    let stableDetectionCount = 0;
    let lastDetection: any = null;

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

        // Set overlay canvas size to match video
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;

        // Clear overlay
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        // Simple document detection using canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) {
          animationFrameRef.current = requestAnimationFrame(detectDocument);
          return;
        }

        // Draw current video frame
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

        // Simple edge detection
        const contour = detectDocumentEdgesSimple(tempCanvas);

        if (contour && contour.length === 4) {
          // Check if detection is stable
          if (isDetectionStable(contour, lastDetection)) {
            stableDetectionCount++;
            
            if (stableDetectionCount >= 15 && !processing) { // 1 second of stable detection at 15fps
              setDocumentDetected(true);
              lastDetection = contour;
              
              // Start auto-capture countdown
              if (!autoCapture && !captureTimeoutRef.current) {
                setAutoCapture(true);
                startCaptureCountdown();
              }
            }
          } else {
            stableDetectionCount = 0;
          }

          // Draw detection overlay
          drawDetectionOverlay(overlayCtx, contour);
          lastDetection = contour;
        } else {
          setDocumentDetected(false);
          setAutoCapture(false);
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

      // Continue detection
      animationFrameRef.current = requestAnimationFrame(detectDocument);
    };

    // Start detection loop
    animationFrameRef.current = requestAnimationFrame(detectDocument);
  }, [cameraReady, processing]);

  // Simple document edge detection without OpenCV
  const detectDocumentEdgesSimple = (canvas: HTMLCanvasElement) => {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // Convert to grayscale and apply simple edge detection
      const edges: number[] = [];
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          
          // Convert to grayscale
          const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          
          // Simple Sobel edge detection
          const gx = 
            -1 * getGray(data, x-1, y-1, width) + 1 * getGray(data, x+1, y-1, width) +
            -2 * getGray(data, x-1, y, width) + 2 * getGray(data, x+1, y, width) +
            -1 * getGray(data, x-1, y+1, width) + 1 * getGray(data, x+1, y+1, width);
          
          const gy = 
            -1 * getGray(data, x-1, y-1, width) + -2 * getGray(data, x, y-1, width) + -1 * getGray(data, x+1, y-1, width) +
            1 * getGray(data, x-1, y+1, width) + 2 * getGray(data, x, y+1, width) + 1 * getGray(data, x+1, y+1, width);
          
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          edges.push(magnitude > 50 ? 255 : 0);
        }
      }

      // Find the largest rectangular contour
      return findLargestRectangle(edges, width - 2, height - 2);
    } catch (error) {
      console.error('Simple edge detection error:', error);
      return null;
    }
  };

  const getGray = (data: Uint8ClampedArray, x: number, y: number, width: number): number => {
    const idx = (y * width + x) * 4;
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  };

  // Find largest rectangle in edge-detected image
  const findLargestRectangle = (edges: number[], width: number, height: number) => {
    // Simple approach: look for a rectangular region with high edge density
    const minArea = width * height * 0.1;
    const maxArea = width * height * 0.8;
    
    // Sample some potential rectangles
    const candidates = [];
    
    for (let attempts = 0; attempts < 20; attempts++) {
      const x1 = Math.floor(Math.random() * width * 0.3);
      const y1 = Math.floor(Math.random() * height * 0.3);
      const x2 = Math.floor(width * 0.7 + Math.random() * width * 0.3);
      const y2 = Math.floor(height * 0.7 + Math.random() * height * 0.3);
      
      const area = (x2 - x1) * (y2 - y1);
      if (area < minArea || area > maxArea) continue;
      
      // Check edge density around the perimeter
      let edgeCount = 0;
      let totalChecked = 0;
      
      // Check top and bottom edges
      for (let x = x1; x <= x2; x += 5) {
        if (y1 < height && x < width) {
          edgeCount += edges[y1 * width + x] > 0 ? 1 : 0;
          totalChecked++;
        }
        if (y2 < height && x < width) {
          edgeCount += edges[y2 * width + x] > 0 ? 1 : 0;
          totalChecked++;
        }
      }
      
      // Check left and right edges
      for (let y = y1; y <= y2; y += 5) {
        if (y < height && x1 < width) {
          edgeCount += edges[y * width + x1] > 0 ? 1 : 0;
          totalChecked++;
        }
        if (y < height && x2 < width) {
          edgeCount += edges[y * width + x2] > 0 ? 1 : 0;
          totalChecked++;
        }
      }
      
      const edgeDensity = totalChecked > 0 ? edgeCount / totalChecked : 0;
      
      if (edgeDensity > 0.3) { // At least 30% edge density
        candidates.push({
          points: [
            { x: x1, y: y1 },
            { x: x2, y: y1 },
            { x: x2, y: y2 },
            { x: x1, y: y2 }
          ],
          score: edgeDensity * area
        });
      }
    }
    
    if (candidates.length === 0) return null;
    
    // Return the best candidate
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].points;
  };

  // Check if detection is stable
  const isDetectionStable = (newContour: any[], lastContour: any) => {
    if (!lastContour) return true;

    const threshold = 30; // pixels

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

  // Capture and process photo
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

  // Process captured image
  const processImage = async (originalCanvas: HTMLCanvasElement) => {
    try {
      const imageData = originalCanvas.toDataURL('image/jpeg', 0.9);

      // Enhance image quality
      const enhancedCanvas = enhanceImage(originalCanvas);
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

  // Enhanced image processing
  const enhanceImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply image enhancement
    const brightness = 20;
    const contrast = 1.4;

    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast and brightness
      let r = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + brightness));
      let g = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness));
      let b = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  // Toggle flash
  const toggleFlash = async () => {
    setFlashEnabled(!flashEnabled);
    // Reinitialize camera with new flash setting
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

  // Remove a scanned page
  const removePage = (pageId: string) => {
    setScannedPages(prev => prev.filter(page => page.id !== pageId));
  };

  // Add another page
  const addAnotherPage = () => {
    setCurrentStep('camera');
  };

  // Generate PDF from scanned pages
  const proceedToNaming = () => {
    if (scannedPages.length === 0) return;
    
    // Set default name based on current date
    const defaultName = `szamla_${new Date().toISOString().slice(0, 10)}`;
    setDocumentName(defaultName);
    setCurrentStep('naming');
  };

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

        const canvas = page.canvas || document.createElement('canvas');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(page.processedImage, 'JPEG', 0, 0, imgWidth, imgHeight);
        isFirstPage = false;
      }

      const pdfBlob = pdf.output('blob');
      const fileName = `${finalName || documentName || 'szamla'}.pdf`;

      onScanComplete(pdfBlob, fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('PDF készítési hiba. Próbálja újra.');
    } finally {
      setProcessing(false);
    }
  };

  // Render camera view with improved UI
  const renderCameraView = () => (
    <div className="relative h-full flex flex-col bg-black overflow-hidden">
      {/* Camera preview */}
      <div className="flex-1 relative">
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
        
        {/* Scanning guide overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner guides */}
          <div className="absolute top-8 left-8 w-8 h-8 border-l-4 border-t-4 border-white opacity-60"></div>
          <div className="absolute top-8 right-8 w-8 h-8 border-r-4 border-t-4 border-white opacity-60"></div>
          <div className="absolute bottom-8 left-8 w-8 h-8 border-l-4 border-b-4 border-white opacity-60"></div>
          <div className="absolute bottom-8 right-8 w-8 h-8 border-r-4 border-b-4 border-white opacity-60"></div>
          
          {/* Center scanning line animation */}
          {cameraReady && !documentDetected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Status indicators */}
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

        {/* Processing overlay */}
        {processing && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
            <div className="text-white text-center">
              <Loader className="h-12 w-12 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">Feldolgozás...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black bg-opacity-90 p-4">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Camera controls */}
          <div className="flex items-center space-x-4">
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

            {/* Manual capture button */}
            <button
              onClick={capturePhoto}
              disabled={!cameraReady || processing}
              className="p-4 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
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

          {/* Placeholder for symmetry */}
          <div className="w-12"></div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-900 bg-opacity-90 border border-red-700 rounded-lg max-w-sm mx-auto">
            <p className="text-sm text-red-200 text-center">{error}</p>
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

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 text-center">{error}</p>
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

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center p-6">
        <div className="max-w-md mx-auto w-full space-y-6">
          {/* Preview thumbnail */}
          <div className="text-center">
            <div className="inline-block p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{scannedPages.length} oldal</p>
            </div>
          </div>

          {/* Naming options */}
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

            {/* Quick name suggestions */}
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

      {/* Actions */}
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

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 text-center">{error}</p>
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
    </div>
  );
};