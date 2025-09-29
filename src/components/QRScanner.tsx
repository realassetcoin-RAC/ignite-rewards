import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Camera, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose, isOpen }) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Add a small delay to ensure the modal is fully rendered
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const checkCameraPermission = async () => {
    try {
      if (!navigator.permissions) {
        return 'unknown';
      }
      
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return permission.state;
    } catch (error) {
      return 'unknown';
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }
      
      // Check camera permission first
      const permissionState = await checkCameraPermission();
      if (permissionState === 'denied') {
        throw new Error('Camera permission denied');
      }
      
      // Request camera permission with more specific constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setScanning(true);
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err.message);
      
      // Handle different types of camera errors gracefully
      let errorMessage = 'Camera is not available.';
      let showPermissionHelp = false;
      
      if (err.name === 'NotAllowedError' || err.message.includes('permission denied')) {
        errorMessage = 'Camera permission denied. Please allow camera access to scan QR codes.';
        showPermissionHelp = true;
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported on this device.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported.';
      }
      
      setError(errorMessage);
      
      // Show appropriate toast message
      if (showPermissionHelp) {
        toast({
          title: "Camera Permission Required",
          description: "Please allow camera access in your browser settings to scan QR codes.",
          variant: "destructive",
          duration: 8000,
        });
      } else {
        toast({
          title: "Camera Unavailable",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const captureAndScan = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Simple QR code detection simulation
    // In a real implementation, you would use a QR code library like jsQR
    const mockQRData = simulateQRDetection(imageData);
    
    if (mockQRData) {
      setScanning(false);
      onScanSuccess(mockQRData);
      toast({
        title: "QR Code Scanned",
        description: "Transaction data captured successfully!",
      });
    } else {
      toast({
        title: "No QR Code Found",
        description: "Please ensure the QR code is clearly visible in the camera view.",
        variant: "destructive",
      });
    }
  };

  // Mock QR code detection - replace with real QR library
  const simulateQRDetection = (imageData: ImageData): string | null => {
    // This is a mock implementation
    // In reality, you would use a library like jsQR to detect QR codes
    const mockData = "RAC_TRANSACTION:merchant_123:amount_50:timestamp_" + Date.now();
    return Math.random() > 0.7 ? mockData : null; // 30% chance of "detecting" a QR code
  };


  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan QR Code
          </DialogTitle>
          <DialogDescription>
            Point your camera at the QR code to process the transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
                {error.includes('permission denied') && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-gray-600">To enable camera access:</p>
                    <ul className="text-xs text-gray-500 space-y-1 ml-4">
                      <li>• Click the camera icon in your browser's address bar</li>
                      <li>• Or go to browser settings → Privacy → Camera</li>
                      <li>• Allow access for this website</li>
                      <li>• Refresh the page and try again</li>
                    </ul>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        onClick={startCamera} 
                        variant="outline" 
                        size="sm"
                      >
                        Try Again
                      </Button>
                      <Button 
                        onClick={() => window.location.reload()} 
                        variant="outline" 
                        size="sm"
                      >
                        Refresh Page
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover rounded-lg"
                      playsInline
                      muted
                    />
                    {scanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          Scanning...
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  onClick={captureAndScan}
                  disabled={!scanning}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture & Scan
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          <div className="text-xs text-gray-500 text-center">
            Make sure the QR code is clearly visible and well-lit
          </div>
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};
