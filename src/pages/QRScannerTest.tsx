import React, { useState } from 'react';
import { QRScanner } from '@/components/QRScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Camera } from 'lucide-react';

const QRScannerTest: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);

  const handleScanSuccess = (data: string) => {
    console.log('QR Scan successful:', data);
    setLastScanResult(data);
    setShowScanner(false);
  };

  const handleClose = () => {
    setShowScanner(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-6 w-6" />
              QR Scanner Test
            </CardTitle>
            <CardDescription>
              Test the QR scanner functionality with camera access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setShowScanner(true)}
              className="w-full"
              size="lg"
            >
              <Camera className="h-5 w-5 mr-2" />
              Open QR Scanner
            </Button>
            
            {lastScanResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Last Scan Result:</h3>
                <p className="text-green-700 font-mono text-sm break-all">
                  {lastScanResult}
                </p>
              </div>
            )}
            
            <div className="text-sm text-gray-600 space-y-2">
              <h4 className="font-semibold">Testing Instructions:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Click "Open QR Scanner" to test camera access</li>
                <li>Allow camera permission when prompted</li>
                <li>Check browser console for debugging logs</li>
                <li>Try dragging the scanner dialog around</li>
                <li>Click "Capture & Scan" to test the mock QR detection</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onClose={handleClose}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};

export default QRScannerTest;
