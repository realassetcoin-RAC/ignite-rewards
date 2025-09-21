import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import MFAVerification from "@/components/MFAVerification";
import WalletSelector from "@/components/WalletSelector";
import { canUserUseMFA } from "@/lib/mfa";
import { Checkbox } from "@/components/ui/checkbox";
import { useTermsPrivacy } from "@/hooks/useTermsPrivacy";
import { createModuleLogger } from "@/utils/consoleReplacer";
import { ReferralService } from "@/lib/referralService";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const logger = createModuleLogger('AuthModal');
  
  // Form state management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('signin');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  
  // Hooks
  const { toast } = useToast();
  const { user, loading: authLoading } = useSecureAuth();
  const { 
    hasAcceptedTerms, 
    hasAcceptedPrivacy, 
    isLoading: termsLoading, 
    saveAcceptance 
  } = useTermsPrivacy();
  const navigate = useNavigate();
  useWallet();

  // Clear form fields function
  const clearFormFields = () => {
    logger.debug('Clearing all auth form fields');
    setEmail("");
    setPassword("");
    setReferralCode("");
    setLoading(false);
    setGoogleLoading(false);
    setShowMFAVerification(false);
    setPendingUserId(null);
    setAcceptedTerms(false);
    setAcceptedPrivacy(false);
  };

  // Reset form state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      clearFormFields();
    }
  }, [isOpen]);

  // Sync local checkbox state with hook state when user is authenticated
  useEffect(() => {
    if (user && !termsLoading) {
      setAcceptedTerms(hasAcceptedTerms);
      setAcceptedPrivacy(hasAcceptedPrivacy);
    }
  }, [user, termsLoading, hasAcceptedTerms, hasAcceptedPrivacy]);

  // Clear form fields when user signs out
  useEffect(() => {
    if (!user && !authLoading) {
      clearFormFields();
    }
  }, [user, authLoading]);

  // Close modal automatically when user becomes authenticated
  useEffect(() => {
    if (user && !authLoading && user.email_confirmed_at) {
      onClose();
    }
  }, [user, authLoading, onClose]);

  // Handle email/password sign up with referral code
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate terms and privacy acceptance
    if (!acceptedTerms || !acceptedPrivacy) {
      toast({
        title: "Terms and Privacy Required",
        description: "Please accept the Terms of Service and Privacy Policy to continue.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);

    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else if (data.user) {
        // Save terms and privacy acceptance
        await saveAcceptance(acceptedTerms, acceptedPrivacy);
        
        // Process referral code if provided
        if (referralCode.trim()) {
          try {
            const referralResult = await ReferralService.processReferralSignup(
              referralCode.trim(), 
              data.user.id
            );
            
            if (referralResult.success) {
              toast({
                title: "Referral Applied!",
                description: `You've earned ${referralResult.pointsAwarded} bonus points!`,
              });
            } else {
              toast({
                title: "Referral Code Issue",
                description: referralResult.error || "Invalid referral code",
                variant: "destructive"
              });
            }
          } catch (referralError) {
            console.error('Referral processing error:', referralError);
            toast({
              title: "Referral Processing Error",
              description: "Referral code could not be processed, but your account was created successfully.",
              variant: "destructive"
            });
          }
        }
        
        toast({
          title: "Account created",
          description: "Your account has been created and verified automatically for testing.",
        });
        
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle email/password sign in with referral code
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (data.user) {
        // Check if user can use MFA
        const canUseMFA = await canUserUseMFA(data.user.id);
        
        if (canUseMFA) {
          // MFA logic here if needed
        }
        
        // Save terms and privacy acceptance if newly accepted
        if (acceptedTerms && acceptedPrivacy && (!hasAcceptedTerms || !hasAcceptedPrivacy)) {
          await saveAcceptance(acceptedTerms, acceptedPrivacy);
        }

        // Process referral code if provided (for existing users)
        if (referralCode.trim()) {
          try {
            const referralResult = await ReferralService.processReferralSignup(
              referralCode.trim(), 
              data.user.id
            );
            
            if (referralResult.success) {
              toast({
                title: "Referral Applied!",
                description: `You've earned ${referralResult.pointsAwarded} bonus points!`,
              });
            } else {
              toast({
                title: "Referral Code Issue",
                description: referralResult.error || "Invalid referral code",
                variant: "destructive"
              });
            }
          } catch (referralError) {
            console.error('Referral processing error:', referralError);
          }
        }

        // Get user role for redirect
        await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        
        navigate('/dashboard');
        onClose();
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth sign in
  const handleGoogleSignIn = async () => {
    logger.info('Starting Google OAuth sign in');
    
    // Validate terms and privacy acceptance for sign-up
    if (activeTab === 'signup' && (!acceptedTerms || !acceptedPrivacy)) {
      toast({
        title: "Terms and Privacy Required",
        description: "Please accept the Terms of Service and Privacy Policy to continue.",
        variant: "destructive"
      });
      return;
    }
    
    setGoogleLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        logger.error('Google OAuth error', error);
        
        let errorMessage = error.message || "Unable to connect to Google. Please try again.";
        
        if (error.message?.includes("provider is not enabled")) {
          errorMessage = "Google sign-in is not configured. Please contact support or use email signup.";
        } else if (error.message?.includes("configuration")) {
          errorMessage = "Google sign-in configuration error. Please try again later.";
        }
        
        toast({
          title: "Google sign in failed",
          description: errorMessage,
          variant: "destructive"
        });
        setGoogleLoading(false);
      } else if (data?.url) {
        logger.info('Google OAuth URL generated, redirecting', { url: data.url });
        // Store referral code in sessionStorage for post-OAuth processing
        if (referralCode.trim()) {
          sessionStorage.setItem('pending_referral_code', referralCode.trim());
        }
        window.location.href = data.url;
      } else {
        logger.error('No OAuth URL generated');
        toast({
          title: "Configuration Error",
          description: "Google OAuth is not properly configured. Please contact support.",
          variant: "destructive"
        });
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error('💥 Google signin error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in with Google. Please try again.",
        variant: "destructive"
      });
      setGoogleLoading(false);
    }
  };

  // Handle MFA verification success
  const handleMFASuccess = async () => {
    if (pendingUserId) {
      await supabase
        .from('profiles')
        .select('role')
        .eq('id', pendingUserId)
        .single();

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });

      navigate('/dashboard');
    }
    
    setShowMFAVerification(false);
    setPendingUserId(null);
    onClose();
  };

  // Handle MFA verification cancel
  const handleMFACancel = () => {
    setShowMFAVerification(false);
    setPendingUserId(null);
    supabase.auth.signOut();
  };

  const handleWalletConnect = () => {
    // Validate terms and privacy acceptance for sign-up
    if (activeTab === 'signup' && (!acceptedTerms || !acceptedPrivacy)) {
      toast({
        title: "Terms and Privacy Required",
        description: "Please accept the Terms of Service and Privacy Policy to continue.",
        variant: "destructive"
      });
      return;
    }
    
    setShowWalletSelector(true);
  };

  const handleWalletConnected = () => {
    setShowWalletSelector(false);
    onClose();
  };

  // Show MFA verification if needed
  if (showMFAVerification && pendingUserId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-md mx-auto bg-transparent border-0 shadow-none p-0 overflow-hidden">
          <div className="rounded-lg p-[1px] bg-gradient-to-r from-primary via-purple-500 to-blue-500 animate-gradient-x">
            <div className="bg-card/95 backdrop-blur-sm border border-border/50 card-shadow rounded-lg p-4 sm:p-6">
              <MFAVerification
                userId={pendingUserId}
                onSuccess={handleMFASuccess}
                onCancel={handleMFACancel}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-md mx-auto bg-transparent border-0 shadow-none p-0">
        <div className="rounded-lg p-[1px] bg-gradient-to-r from-primary via-purple-500 to-blue-500 animate-gradient-x">
          <div className="bg-card/95 backdrop-blur-sm border border-border/50 card-shadow rounded-lg max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-center text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient-x">
                Welcome to PointBridge
              </DialogTitle>
              <DialogDescription className="text-center text-sm sm:text-base text-muted-foreground px-2">
                Sign in to your account or create a new one
              </DialogDescription>
            </DialogHeader>
            
            <div className="w-full mt-4">
              <div className="w-full bg-background/60 backdrop-blur-md border border-primary/20 rounded-lg p-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab('signin')}
                    className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex-1 min-w-0 ${
                      activeTab === 'signin'
                        ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setActiveTab('signup')}
                    className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex-1 min-w-0 ${
                      activeTab === 'signup'
                        ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
              
              {/* Sign In Tab */}
              {activeTab === 'signin' && (
                <div className="space-y-6 sm:space-y-8 mt-4">
                  <div className="max-w-md mx-auto text-left w-full overflow-hidden">
                    {/* Google Sign In Button */}
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full h-11 sm:h-12 border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 backdrop-blur-sm transition-smooth"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading || loading}
                    >
                      {googleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {!googleLoading && (
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      )}
                      <span className="text-sm sm:text-base">Continue with Google</span>
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full h-11 sm:h-12 border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 backdrop-blur-sm transition-smooth"
                      onClick={handleWalletConnect}
                      disabled={loading || googleLoading}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      <span className="text-sm sm:text-base">Connect Wallet</span>
                      <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
                        Phantom • Solflare • MetaMask
                      </span>
                    </Button>
                    
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card/95 px-2 text-muted-foreground">
                          Or with email
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-sm text-left">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                          className="h-10 sm:h-11 bg-card/50 border-border/50 focus:border-primary/50 transition-smooth text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-sm text-left">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="h-10 sm:h-11 bg-card/50 border-border/50 focus:border-primary/50 transition-smooth text-sm sm:text-base"
                        />
                      </div>
                      
                      {/* Referral Code Field */}
                      <div className="space-y-2">
                        <Label htmlFor="signin-referral" className="text-sm text-left flex items-center gap-2">
                          <Gift className="h-4 w-4 text-primary" />
                          Referral Code (Optional)
                        </Label>
                        <Input
                          id="signin-referral"
                          type="text"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="Enter referral code"
                          className="h-10 sm:h-11 bg-card/50 border-border/50 focus:border-primary/50 transition-smooth text-sm sm:text-base"
                        />
                        <p className="text-xs text-muted-foreground">
                          Have a referral code? Enter it to earn bonus points!
                        </p>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground glow-shadow transition-smooth text-sm sm:text-base" 
                        disabled={loading || googleLoading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                      </Button>
                    </form>
                  </div>
                </div>
              )}

              {/* Sign Up Tab */}
              {activeTab === 'signup' && (
                <div className="space-y-6 sm:space-y-8 mt-4">
                  <div className="max-w-md mx-auto text-left w-full overflow-hidden">
                    {/* Google Sign In Button */}
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full h-11 sm:h-12 border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 backdrop-blur-sm transition-smooth"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading || loading}
                    >
                      {googleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {!googleLoading && (
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      )}
                      <span className="text-sm sm:text-base">Continue with Google</span>
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full h-11 sm:h-12 border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 backdrop-blur-sm transition-smooth"
                      onClick={handleWalletConnect}
                      disabled={loading || googleLoading}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      <span className="text-sm sm:text-base">Connect Wallet</span>
                      <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
                        Phantom • Solflare • MetaMask
                      </span>
                    </Button>
                    
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card/95 px-2 text-muted-foreground">
                          Or with email
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm text-left">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                          className="h-10 sm:h-11 bg-card/50 border-border/50 focus:border-primary/50 transition-smooth text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm text-left">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a password (min. 6 characters)"
                          required
                          minLength={6}
                          className="h-10 sm:h-11 bg-card/50 border-border/50 focus:border-primary/50 transition-smooth text-sm sm:text-base"
                        />
                      </div>
                      
                      {/* Referral Code Field */}
                      <div className="space-y-2">
                        <Label htmlFor="signup-referral" className="text-sm text-left flex items-center gap-2">
                          <Gift className="h-4 w-4 text-primary" />
                          Referral Code (Optional)
                        </Label>
                        <Input
                          id="signup-referral"
                          type="text"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="Enter referral code"
                          className="h-10 sm:h-11 bg-card/50 border-border/50 focus:border-primary/50 transition-smooth text-sm sm:text-base"
                        />
                        <p className="text-xs text-muted-foreground">
                          Have a referral code? Enter it to earn bonus points!
                        </p>
                      </div>
                      
                      {/* Terms and Privacy Checkboxes */}
                      {email && (
                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <Checkbox 
                              id="terms-signup" 
                              checked={acceptedTerms}
                              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                              required
                            />
                            <label 
                              htmlFor="terms-signup" 
                              className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                            >
                              I agree to the{' '}
                              <a href="/terms" target="_blank" className="text-primary hover:underline">
                                Terms of Service
                              </a>
                            </label>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Checkbox 
                              id="privacy-signup" 
                              checked={acceptedPrivacy}
                              onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                              required
                            />
                            <label 
                              htmlFor="privacy-signup" 
                              className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                            >
                              I agree to the{' '}
                              <a href="/privacy" target="_blank" className="text-primary hover:underline">
                                Privacy Policy
                              </a>
                            </label>
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground glow-shadow transition-smooth text-sm sm:text-base" 
                        disabled={loading || googleLoading || (email && (!acceptedTerms || !acceptedPrivacy))}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign Up
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Wallet Selector Modal */}
    <WalletSelector 
      isOpen={showWalletSelector}
      onClose={() => setShowWalletSelector(false)}
      onWalletConnected={handleWalletConnected}
    />
    </>
  );
};

export default AuthModal;
