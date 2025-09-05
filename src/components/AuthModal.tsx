import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import MFAVerification from "@/components/MFAVerification";
import { canUserUseMFA } from "@/lib/mfa";

/**
 * Authentication modal component props
 * @interface AuthModalProps
 */
interface AuthModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
}

/**
 * Authentication modal component that handles user sign in, sign up, and Google OAuth
 * @param {AuthModalProps} props - The component props
 * @returns {JSX.Element} The authentication modal component
 */
const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  // Form state management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  
  // Hooks
  const { toast } = useToast();
  const { user, loading: authLoading } = useSecureAuth();
  const navigate = useNavigate();
  const { connect, connected, disconnect, publicKey } = useWallet();

  /**
   * Reset form state when modal opens/closes
   */
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setLoading(false);
      setGoogleLoading(false);
      setShowMFAVerification(false);
      setPendingUserId(null);
    }
  }, [isOpen]);

  /**
   * Close modal automatically when user becomes authenticated
   */
  useEffect(() => {
    if (user && !authLoading) {
      onClose();
    }
  }, [user, authLoading, onClose]);

  /**
   * Handle email/password sign up
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Set redirect URL for email confirmation
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { error } = await supabase.auth.signUp({
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
      } else {
        toast({
          title: "Account created",
          description: "Please check your email to verify your account.",
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle email/password sign in
   * @param {React.FormEvent} e - Form submission event
   */
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
        // Check if user can use MFA and if MFA is enabled
        const canUseMFA = await canUserUseMFA(data.user.id);
        
        if (canUseMFA) {
          // Check if MFA is enabled for this user
          const { data: profile } = await supabase
            .from('profiles')
            .select('mfa_enabled')
            .eq('id', data.user.id)
            .single();
          
          if (profile?.mfa_enabled) {
            // User has MFA enabled, show verification step
            setPendingUserId(data.user.id);
            setShowMFAVerification(true);
            return;
          }
        }
        
        // No MFA required, complete sign in
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google OAuth sign in
   */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        toast({
          title: "Google sign in failed",
          description: error.message || "Unable to connect to Google. Please try again.",
          variant: "destructive"
        });
        setGoogleLoading(false);
      } else if (data?.url) {
        // Redirect to Google OAuth page
        window.location.href = data.url;
      } else {
        toast({
          title: "Configuration Error",
          description: "Google OAuth is not properly configured. Please contact support.",
          variant: "destructive"
        });
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error('Google signin error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in with Google. Please try again.",
        variant: "destructive"
      });
      setGoogleLoading(false);
    }
  };

  /**
   * Handle MFA verification success
   */
  const handleMFASuccess = () => {
    toast({
      title: "Welcome back!",
      description: "You have been signed in successfully.",
    });
    setShowMFAVerification(false);
    setPendingUserId(null);
    onClose();
  };

  /**
   * Handle MFA verification cancel
   */
  const handleMFACancel = () => {
    setShowMFAVerification(false);
    setPendingUserId(null);
    // Sign out the user since they didn't complete MFA
    supabase.auth.signOut();
  };

  const handleWalletConnect = async () => {
    try {
      if (!connect) {
        toast({ 
          title: "Wallet Not Available", 
          description: "Please install Phantom or Solflare wallet extension", 
          variant: "destructive" 
        });
        return;
      }

      await connect();
      
      // Wait a moment for the connection to establish
      setTimeout(() => {
        if (publicKey) {
          toast({ 
            title: "Wallet Connected", 
            description: `Connected: ${publicKey.toBase58().slice(0,6)}...` 
          });
          onClose();
          navigate('/user');
        } else {
          toast({ 
            title: "Connection Failed", 
            description: "Please try connecting your wallet again", 
            variant: "destructive" 
          });
        }
      }, 1000);
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to connect wallet", 
        variant: "destructive" 
      });
    }
  };

  // Show MFA verification if needed
  if (showMFAVerification && pendingUserId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <MFAVerification
            userId={pendingUserId}
            onSuccess={handleMFASuccess}
            onCancel={handleMFACancel}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Welcome to PointBridge
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to your account or create a new one
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            {/* Google Sign In Button */}
            <Button 
              type="button"
              variant="outline"
              className="w-full border-border hover:bg-accent"
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
              Continue with Google
            </Button>
            <Button 
              type="button"
              variant="outline"
              className="w-full border-border"
              onClick={handleWalletConnect}
              disabled={loading || googleLoading}
            >
              {connected ? (
                <>
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Wallet Connected
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  Connect Solana Wallet (Phantom/Solflare)
                </>
              )}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-popover px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="bg-input border-border"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                disabled={loading || googleLoading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            {/* Google Sign In Button */}
            <Button 
              type="button"
              variant="outline"
              className="w-full border-border hover:bg-accent"
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
              Continue with Google
            </Button>
            <Button 
              type="button"
              variant="outline"
              className="w-full border-border"
              onClick={handleWalletConnect}
              disabled={loading || googleLoading}
            >
              {connected ? (
                <>
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Wallet Connected
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  Connect Solana Wallet (Phantom/Solflare)
                </>
              )}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-popover px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min. 6 characters)"
                  required
                  minLength={6}
                  className="bg-input border-border"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                disabled={loading || googleLoading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;