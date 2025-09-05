import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import MFAVerification from "@/components/MFAVerification";
import WalletSelector from "@/components/WalletSelector";
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
  const [showWalletSelector, setShowWalletSelector] = useState(false);
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
        // Get user role for redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        
        // Navigate to centralized dashboard route for consistent role handling
        navigate('/dashboard');
        
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
          redirectTo: `${window.location.origin}/auth/callback`,
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
  const handleMFASuccess = async () => {
    if (pendingUserId) {
      // Get user role for redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', pendingUserId)
        .single();

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });

      // Navigate to centralized dashboard route for consistent role handling
      navigate('/dashboard');
    }
    
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

  const handleWalletConnect = () => {
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
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Welcome to PointBridge
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
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
              className="w-full border-border/50 hover:bg-accent/50 hover:border-primary/50 transition-all duration-300"
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
              className="w-full border-border/50 hover:bg-accent/50 hover:border-primary/50 transition-all duration-300"
              onClick={handleWalletConnect}
              disabled={loading || googleLoading}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
              <span className="ml-auto text-xs text-muted-foreground">
                Phantom • Solflare • MetaMask
              </span>
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
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
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-colors duration-300"
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
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-colors duration-300"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full relative overflow-hidden group transition-all duration-300 transform hover:scale-[1.02]" 
                disabled={loading || googleLoading}
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
                }}
              >
                <span className="relative z-10 flex items-center justify-center text-primary-foreground">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-glow to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            {/* Google Sign In Button */}
            <Button 
              type="button"
              variant="outline"
              className="w-full border-border/50 hover:bg-accent/50 hover:border-primary/50 transition-all duration-300"
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
              className="w-full border-border/50 hover:bg-accent/50 hover:border-primary/50 transition-all duration-300"
              onClick={handleWalletConnect}
              disabled={loading || googleLoading}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
              <span className="ml-auto text-xs text-muted-foreground">
                Phantom • Solflare • MetaMask
              </span>
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
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
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-colors duration-300"
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
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-colors duration-300"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full relative overflow-hidden group transition-all duration-300 transform hover:scale-[1.02]" 
                disabled={loading || googleLoading}
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
                }}
              >
                <span className="relative z-10 flex items-center justify-center text-primary-foreground">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-glow to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </form>
          </TabsContent>
        </Tabs>
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