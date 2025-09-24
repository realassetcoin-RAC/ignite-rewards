import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { 
  generateTOTPSecret, 
  generateQRCodeURL, 
  enableMFA, 
  verifyTOTPCode,
  canUserUseMFA 
} from '@/lib/mfa';
import { 
  Shield, 
  Smartphone, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Download,
  AlertCircle,
  QrCode
} from 'lucide-react';
import QRCode from 'qrcode';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'check' | 'setup' | 'verify' | 'backup' | 'complete'>('check');
  const [loading, setLoading] = useState(false);
  const [canUseMFA, setCanUseMFA] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Check if user can use MFA
  useEffect(() => {
    const checkMFAAvailability = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const canUse = await canUserUseMFA(user.id);
        setCanUseMFA(canUse);
        if (canUse) {
          setStep('setup');
        }
      } catch (error) {
        console.error('Error checking MFA availability:', error);
        toast({
          title: "Error",
          description: "Failed to check MFA availability",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    checkMFAAvailability();
  }, [user?.id, toast]);

  // Generate TOTP secret and QR code
  const generateSecretAndQR = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      const secret = generateTOTPSecret();
      setTotpSecret(secret);
      
      const qrCodeURL = generateQRCodeURL(secret, user.email);
      const qrDataURL = await QRCode.toDataURL(qrCodeURL, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataURL(qrDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify the TOTP code
  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const isValid = await verifyTOTPCode(totpSecret, verificationCode);
      
      if (isValid) {
        // Enable MFA
        const result = await enableMFA(user!.id, totpSecret);
        
        if (result.success) {
          setBackupCodes(result.backupCodes || []);
          setStep('backup');
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to enable MFA",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy secret to clipboard
  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(totpSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
      toast({
        title: "Copied",
        description: "Secret key copied to clipboard"
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy secret key",
        variant: "destructive"
      });
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    const content = `PointBridge - Backup Codes\n\nYour backup codes for MFA recovery:\n\n${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nImportant:\n- Store these codes in a safe place\n- Each code can only be used once\n- Generate new codes if you run out\n\nGenerated on: ${new Date().toLocaleString()}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pointbridge-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Complete setup
  const completeSetup = () => {
    toast({
      title: "MFA Enabled",
      description: "Two-factor authentication has been successfully enabled for your account."
    });
    onComplete?.();
  };

  if (loading && step === 'check') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Checking MFA availability...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canUseMFA) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            MFA Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Multi-factor authentication is only available for users who signed up with email or social authentication (Google, GitHub, etc.).
          </p>
          <p className="text-sm text-muted-foreground">
            Wallet-based authentication users do not need MFA as their wallet provides the additional security layer.
          </p>
          {onCancel && (
            <Button onClick={onCancel} className="mt-4 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300 text-white border-0">
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Setup */}
      {step === 'setup' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Enable Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Secure your account with an authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Smartphone className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Step 1: Install an Authenticator App</h3>
              <p className="text-muted-foreground mb-4">
                Download and install an authenticator app on your mobile device:
              </p>
              <div className="flex justify-center gap-4 mb-6">
                <Badge variant="outline">Google Authenticator</Badge>
                <Badge variant="outline">Microsoft Authenticator</Badge>
                <Badge variant="outline">Authy</Badge>
                <Badge variant="outline">1Password</Badge>
              </div>
            </div>

            <Separator />

            <div className="text-center">
              <Button onClick={generateSecretAndQR} disabled={loading} className="mb-4 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
                {loading ? "Generating..." : "Generate QR Code"}
              </Button>
            </div>

            {qrCodeDataURL && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Step 2: Scan QR Code</h3>
                  <p className="text-muted-foreground mb-4">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg border">
                      <img src={qrCodeDataURL} alt="QR Code" className="w-64 h-64" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Can't scan? Enter manually</h3>
                  <p className="text-muted-foreground mb-4">
                    If you can't scan the QR code, enter this secret key manually:
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="bg-muted px-3 py-2 rounded text-sm font-mono">
                      {totpSecret}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copySecret}
                      className="flex items-center gap-2"
                    >
                      {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedSecret ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="text-center">
                  <Button onClick={() => setStep('verify')} className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
                    Continue to Verification
                  </Button>
                </div>
              </div>
            )}

            {onCancel && (
              <div className="text-center">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Verification */}
      {step === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Verify Setup
            </CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Smartphone className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Enter Verification Code</h3>
              <p className="text-muted-foreground mb-6">
                Open your authenticator app and enter the 6-digit code for PointBridge:
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep('setup')}>
                Back
              </Button>
              <Button onClick={verifyCode} disabled={loading || verificationCode.length !== 6}>
                {loading ? "Verifying..." : "Verify & Enable MFA"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Backup Codes */}
      {step === 'backup' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Backup Codes
            </CardTitle>
            <CardDescription>
              Save these backup codes in a safe place
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">Important Security Information</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Each backup code can only be used once</li>
                    <li>• Store these codes in a secure location</li>
                    <li>• You can regenerate new codes anytime</li>
                    <li>• Use these codes if you lose access to your authenticator app</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Your Backup Codes</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                    className="flex items-center gap-2"
                  >
                    {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showBackupCodes ? "Hide" : "Show"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadBackupCodes}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>

              {showBackupCodes && (
                <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm text-center py-2">
                      {code}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center">
              <Button onClick={completeSetup} className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
                Complete Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MFASetup;