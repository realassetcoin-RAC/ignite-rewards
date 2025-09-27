import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SMSService } from '@/lib/smsService';
import { Phone, Shield, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface SMSServiceProps {
  userId: string;
  phoneNumber: string;
  networkName: string;
  onOTPVerified: (otpId: string) => void;
  onOTPError: (error: string) => void;
}

export const SMSServiceComponent: React.FC<SMSServiceProps> = ({
  userId,
  phoneNumber,
  networkName,
  onOTPVerified,
  onOTPError
}) => {
  const { toast } = useToast();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const sendOTP = async () => {
    setLoading(true);
    try {
      const result = await SMSService.sendLoyaltyLinkOTP(userId, phoneNumber, networkName);
      
      if (result.success) {
        setOtpSent(true);
        setTimeRemaining(300); // 5 minutes
        setAttempts(0);
        toast({
          title: "OTP Sent Successfully",
          description: `Verification code sent to ${phoneNumber}`,
          variant: "default"
        });
      } else {
        throw new Error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      
      toast({
        title: "OTP Send Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      onOTPError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode.trim()) {
      toast({
        title: "OTP Required",
        description: "Please enter the verification code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await SMSService.verifyLoyaltyLinkOTP(userId, phoneNumber, otpCode);
      
      if (result.success) {
        toast({
          title: "Verification Successful!",
          description: "Your phone number has been verified.",
          variant: "default"
        });
        onOTPVerified(result.otpId!);
      } else {
        setAttempts(prev => prev + 1);
        throw new Error(result.error || 'Invalid OTP code');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'OTP verification failed';
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      if (attempts >= maxAttempts - 1) {
        onOTPError('Maximum verification attempts exceeded');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (timeRemaining > 0) {
      toast({
        title: "Please Wait",
        description: `You can resend OTP in ${Math.ceil(timeRemaining / 60)} minutes.`,
        variant: "destructive"
      });
      return;
    }
    
    await sendOTP();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Phone Verification
        </CardTitle>
        <CardDescription>
          Verify your phone number to link your {networkName} loyalty account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phone Number Display */}
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-lg font-medium">
            {phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}
          </div>
          <div className="text-sm text-muted-foreground">
            {networkName} Loyalty Account
          </div>
        </div>

        {/* OTP Input */}
        {otpSent && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="otpCode">Enter Verification Code</Label>
              <Input
                id="otpCode"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              <div className="text-sm text-muted-foreground mt-1">
                6-digit code sent to your phone
              </div>
            </div>

            {/* Timer */}
            {timeRemaining > 0 && (
              <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock className="w-4 h-4 text-orange-600" />
                <div className="text-sm text-orange-800">
                  Code expires in {formatTime(timeRemaining)}
                </div>
              </div>
            )}

            {/* Attempts Counter */}
            {attempts > 0 && (
              <div className="flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <div className="text-sm text-red-800">
                  {maxAttempts - attempts} attempts remaining
                </div>
              </div>
            )}

            {/* Verify Button */}
            <Button
              onClick={verifyOTP}
              disabled={loading || otpCode.length !== 6 || timeRemaining === 0 || attempts >= maxAttempts}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Code
                </>
              )}
            </Button>

            {/* Resend Button */}
            <Button
              onClick={resendOTP}
              disabled={timeRemaining > 0 || loading}
              variant="outline"
              className="w-full"
            >
              {timeRemaining > 0 ? (
                `Resend in ${formatTime(timeRemaining)}`
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Code
                </>
              )}
            </Button>
          </div>
        )}

        {/* Send OTP Button */}
        {!otpSent && (
          <Button
            onClick={sendOTP}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-2" />
                Send Verification Code
              </>
            )}
          </Button>
        )}

        {/* Security Notice */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <div className="font-medium">Secure Verification</div>
            <div>Your phone number is only used for verification and will not be shared.</div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <div>Didn't receive the code?</div>
          <div>Check your SMS messages or try resending.</div>
        </div>
      </CardContent>
    </Card>
  );
};
