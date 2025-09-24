import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useSecureAuth } from "@/hooks/useSecureAuth";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userRole?: string;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ 
  isOpen, 
  onClose, 
  userEmail,
  userRole = "user"
}) => {
  const [isResending, setIsResending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  const { user, refreshAuth } = useSecureAuth();

  // Check if user is verified
  const isVerified = user?.email_confirmed_at !== null;

  // Get the actual user email from the auth context
  const email = userEmail || user?.email || "";

  // Check if enough time has passed to allow resending (5 minutes)
  useEffect(() => {
    if (lastSentTime) {
      const now = new Date();
      const timeDiff = now.getTime() - lastSentTime.getTime();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      if (timeDiff < fiveMinutes) {
        setCanResend(false);
        const remainingTime = Math.ceil((fiveMinutes - timeDiff) / 1000);
        const timer = setTimeout(() => {
          setCanResend(true);
        }, remainingTime * 1000);
        
        return () => clearTimeout(timer);
      } else {
        setCanResend(true);
      }
    }
  }, [lastSentTime]);

  // Auto-check verification status every 10 seconds
  useEffect(() => {
    if (isOpen && !isVerified) {
      const interval = setInterval(async () => {
        await checkVerificationStatus();
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen, isVerified]);

  const checkVerificationStatus = async () => {
    if (!user) return;
    
    setIsChecking(true);
    try {
      // Refresh the auth state to get updated user info
      await refreshAuth();
      
      // Check if user is now verified
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser?.email_confirmed_at) {
        toast({
          title: "Email Verified!",
          description: "Your email has been successfully verified. You can now access all features.",
        });
        onClose();
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email || !canResend) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      setLastSentTime(new Date());
      toast({
        title: "Verification Email Sent",
        description: `A new verification email has been sent to ${email}. Please check your inbox and spam folder.`,
      });
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'merchant':
        return 'Merchant';
      case 'admin':
        return 'Administrator';
      case 'user':
      default:
        return 'User';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role.toLowerCase()) {
      case 'merchant':
        return 'Access your merchant dashboard, manage your business, and view analytics.';
      case 'admin':
        return 'Access the admin panel to manage users, merchants, and system settings.';
      case 'user':
      default:
        return 'Access your loyalty rewards, view transactions, and manage your account.';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Verification Required
          </DialogTitle>
          <DialogDescription>
            Please verify your email address to access all features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium">{email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Badge variant="outline">{getRoleDisplayName(userRole)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={isVerified ? "default" : "secondary"}>
                  {isVerified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Verification Instructions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Verification Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Check Your Email</p>
                  <p className="text-xs text-muted-foreground">
                    Look for a verification email from PointBridge in your inbox
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Click the Verification Link</p>
                  <p className="text-xs text-muted-foreground">
                    Click the link in the email to verify your account
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Access Your Features</p>
                  <p className="text-xs text-muted-foreground">
                    {getRoleDescription(userRole)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={checkVerificationStatus}
              disabled={isChecking || isVerified}
              className="w-full"
              variant="outline"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Verification Status
                </>
              )}
            </Button>

            <Button
              onClick={resendVerificationEmail}
              disabled={isResending || !canResend || isVerified}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : !canResend ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Wait to Resend
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailVerificationModal;
