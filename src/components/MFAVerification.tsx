import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { verifyTOTPForLogin, verifyBackupCode } from '@/lib/mfa';
import { 
  Shield, 
  Smartphone, 
  Key, 
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';

interface MFAVerificationProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
  onBack?: () => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({ 
  userId, 
  onSuccess, 
  onCancel, 
  onBack 
}) => {
  const { toast } = useToast();
  
  const [step, setStep] = useState<'totp' | 'backup'>('totp');
  const [loading, setLoading] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  // Countdown timer for TOTP code
  useEffect(() => {
    if (step === 'totp') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 30; // Reset to 30 seconds
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step]);

  // Auto-submit TOTP code when 6 digits are entered
  useEffect(() => {
    if (totpCode.length === 6 && step === 'totp') {
      handleTOTPVerification();
    }
  }, [totpCode, step]);

  // Auto-submit backup code when 8 characters are entered
  useEffect(() => {
    if (backupCode.length === 8 && step === 'backup') {
      handleBackupVerification();
    }
  }, [backupCode, step]);

  const handleTOTPVerification = async () => {
    if (totpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await verifyTOTPForLogin(userId, totpCode);
      
      if (result.success) {
        toast({
          title: "Verification Successful",
          description: "You have been signed in successfully."
        });
        onSuccess();
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Invalid verification code",
          variant: "destructive"
        });
        setTotpCode('');
      }
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      toast({
        title: "Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive"
      });
      setTotpCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupVerification = async () => {
    if (backupCode.length !== 8) {
      toast({
        title: "Invalid Code",
        description: "Please enter an 8-character backup code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await verifyBackupCode(userId, backupCode);
      
      if (result.success) {
        toast({
          title: "Verification Successful",
          description: "You have been signed in successfully using a backup code."
        });
        onSuccess();
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Invalid backup code",
          variant: "destructive"
        });
        setBackupCode('');
      }
    } catch (error) {
      console.error('Error verifying backup code:', error);
      toast({
        title: "Error",
        description: "Failed to verify backup code. Please try again.",
        variant: "destructive"
      });
      setBackupCode('');
    } finally {
      setLoading(false);
    }
  };

  const switchToBackup = () => {
    setStep('backup');
    setTotpCode('');
  };

  const switchToTOTP = () => {
    setStep('totp');
    setBackupCode('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter your verification code to continue
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* TOTP Verification */}
        {step === 'totp' && (
          <div className="space-y-4">
            <div className="text-center">
              <Smartphone className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Enter Authenticator Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open your authenticator app and enter the 6-digit code for PointBridge
              </p>
              
              {/* Timer indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">
                  Code refreshes in {timeLeft}s
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totp-code">Verification Code</Label>
              <Input
                id="totp-code"
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="text-center">
              <Button
                variant="link"
                onClick={switchToBackup}
                className="text-sm text-muted-foreground"
                disabled={loading}
              >
                Can't access your authenticator app? Use a backup code
              </Button>
            </div>
          </div>
        )}

        {/* Backup Code Verification */}
        {step === 'backup' && (
          <div className="space-y-4">
            <div className="text-center">
              <Key className="h-12 w-12 text-orange-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Enter Backup Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter one of your 8-character backup codes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup-code">Backup Code</Label>
              <Input
                id="backup-code"
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                placeholder="XXXXXXXX"
                className="text-center text-lg font-mono tracking-wider"
                maxLength={8}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-700">
                  <p className="font-medium mb-1">Important:</p>
                  <p>Each backup code can only be used once. After using this code, it will be permanently removed from your account.</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="link"
                onClick={switchToTOTP}
                className="text-sm text-muted-foreground"
                disabled={loading}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to authenticator app
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Verifying...</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onBack && (
            <Button onClick={onBack} disabled={loading} className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300 text-white border-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button onClick={onCancel} disabled={loading} className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300 text-white border-0">
            Cancel
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Having trouble? Contact support for assistance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MFAVerification;