import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Download, QrCode, Copy, RefreshCw, GripVertical } from 'lucide-react';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { useToast } from '@/hooks/use-toast';
import QRCodeLib from 'qrcode';

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
  
  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  // Load saved position on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('qr-generator-position');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch (error) {
        console.error('Error loading saved position:', error);
        // Fallback to center if saved position is invalid
        const centerX = Math.max(0, (window.innerWidth - 448) / 2);
        const centerY = Math.max(0, (window.innerHeight - 400) / 2);
        setPosition({ x: centerX, y: centerY });
      }
    } else {
      // Center the dialog if no saved position
      const centerX = Math.max(0, (window.innerWidth - 448) / 2);
      const centerY = Math.max(0, (window.innerHeight - 400) / 2);
      setPosition({ x: centerX, y: centerY });
    }
  }, []);

  // Save position when it changes
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('qr-generator-position', JSON.stringify(position));
    }
  }, [position]);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep dialog within viewport bounds
        const maxX = window.innerWidth - 448; // Dialog width
        const maxY = window.innerHeight - 400; // Approximate dialog height
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

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
    // Points will be determined by the user's Loyalty NFT configuration on blockchain
    // No local calculation needed

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
        receipt_number: receiptNumber,
        expires_at: expiresAt.toISOString(),
      };

      const { data, error } = await databaseAdapter.supabase
        .from('transaction_qr_codes')
        .insert({
          merchant_id: merchantId,
          qr_code_data: JSON.stringify(qrData),
          transaction_amount: amountNum,
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

      // Note: Points tracking will be handled when the transaction is processed
      // based on the user's Loyalty NFT configuration

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
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Draggable Dialog */}
      <div
        ref={dialogRef}
        className="absolute bg-background border rounded-lg shadow-lg max-w-md w-full mx-4 transition-shadow duration-200"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'default',
          boxShadow: isDragging ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header - Only draggable when QR code is generated */}
        <div
          className={`flex items-center justify-between p-6 border-b select-none ${
            qrCodeUrl 
              ? 'cursor-grab active:cursor-grabbing' 
              : 'cursor-default'
          }`}
          onMouseDown={qrCodeUrl ? handleMouseDown : undefined}
        >
          <div className="flex items-center gap-2">
            {qrCodeUrl && <GripVertical className="w-4 h-4 text-muted-foreground" />}
            <QrCode className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Generate Transaction QR Code</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            ×
          </Button>
        </div>

        {/* Dialog Content */}
        <div className="p-6 space-y-6">
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
                      <span className="text-muted-foreground">Receipt Number:</span>
                      <span className="font-mono text-xs">{receiptNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="text-xs text-muted-foreground">
                        {qrCodeData && new Date(qrCodeData.expires_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-center text-xs text-muted-foreground mt-2">
                      Reward points will be calculated based on your Loyalty NFT
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
      </div>
    </div>
  );
};