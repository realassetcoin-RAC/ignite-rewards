import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, QrCode, Copy, RefreshCw } from 'lucide-react';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { useToast } from '@/hooks/use-toast';
import QRCodeLib from 'qrcode';
import { updateMerchantPoints } from '@/components/MerchantPointsTracker';

interface QrCodeGeneratorProps {
  merchantId: string;
  onClose: () => void;
  onTransactionCreated: (transactionId: string) => void;
  currencySymbol?: string;
}

interface QrCodeData {
  id: string;
  merchant_id: string;
  amount: number;
  reward_points: number;
  receipt_number: string;
  expires_at: string;
}

export const QrCodeGenerator: React.FC<QrCodeGeneratorProps> = ({
  merchantId,
  onClose,
  // onTransactionCreated: _onTransactionCreated,
  currencySymbol = '$',
}) => {
  const [amount, setAmount] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeData, setQrCodeData] = useState<QrCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  // const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const generateQrCode = async () => {
    if (!amount || !receiptNumber) {
      toast({
        title: "Missing Information",
        description: "Please enter transaction amount and receipt number.",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    // Calculate reward points automatically based on transaction amount (1 point per dollar)
    const pointsNum = Math.floor(amountNum);

    if (amountNum <= 0) {
      toast({
        title: "Invalid Values",
        description: "Transaction amount must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Create QR code data in database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

      const qrData = {
        merchant_id: merchantId,
        amount: amountNum,
        reward_points: pointsNum,
        receipt_number: receiptNumber,
        expires_at: expiresAt.toISOString(),
      };

      const { data, error } = await databaseAdapter.supabase
        .from('transaction_qr_codes')
        .insert({
          merchant_id: merchantId,
          qr_code_data: JSON.stringify(qrData),
          transaction_amount: amountNum,
          reward_points: pointsNum,
          receipt_number: receiptNumber,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating QR code:', error);
        toast({
          title: "Error",
          description: "Failed to generate QR code.",
          variant: "destructive",
        });
        return;
      }

      setQrCodeData(data as QrCodeData);

      // Generate QR code image
      const qrCodeDataString = JSON.stringify({
        ...qrData,
        qr_id: (data as any)?.id,
      });

      const qrCodeDataUrl = await QRCodeLib.toDataURL(qrCodeDataString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrCodeUrl(qrCodeDataUrl);

      // Update monthly points tracking
      const pointsUpdated = await updateMerchantPoints(merchantId, pointsNum);
      if (!pointsUpdated) {
        toast({
          title: "Warning",
          description: "QR code generated but points tracking failed. Please check your monthly points limit.",
          variant: "destructive",
        });
      }

      toast({
        title: "QR Code Generated",
        description: "QR code has been successfully generated and is ready for use.",
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQrCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `qr-code-${qrCodeData?.id || Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const copyQrCode = async () => {
    if (!qrCodeUrl) return;

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      toast({
        title: "Copied",
        description: "QR code copied to clipboard.",
      });
    } catch (error) {
      console.error('Error copying QR code:', error);
      toast({
        title: "Error",
        description: "Failed to copy QR code to clipboard.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setAmount('');
    setReceiptNumber('');
    setQrCodeUrl('');
    setQrCodeData(null);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Generate Transaction QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!qrCodeUrl ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Transaction Amount ({currencySymbol})</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>


                <div>
                  <Label htmlFor="receiptNumber">Receipt Number</Label>
                  <Input
                    id="receiptNumber"
                    type="text"
                    placeholder="Enter receipt number"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={generateQrCode}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-6 text-center">
                  <img
                    src={qrCodeUrl}
                    alt="Transaction QR Code"
                    className="mx-auto mb-4 rounded-lg"
                  />
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">{currencySymbol}{amount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reward Points:</span>
                      <Badge variant="default">{Math.floor(parseFloat(amount) || 0)} pts</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Receipt Number:</span>
                      <span className="font-mono text-xs">{receiptNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="text-xs text-muted-foreground">
                        {qrCodeData && new Date(qrCodeData.expires_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={downloadQrCode}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={copyQrCode}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1"
                >
                  Generate Another
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};