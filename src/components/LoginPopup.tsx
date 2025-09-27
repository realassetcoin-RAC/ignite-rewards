import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoIcon } from '@/components/logo';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup?: () => void;
}

export const LoginPopup: React.FC<LoginPopupProps> = ({
  isOpen,
  onClose,
  onSwitchToSignup
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useSecureAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      await signIn(email, password);
      toast({
        title: "Welcome Back!",
        description: "You have successfully signed in.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "Unable to sign in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    toast({
      title: "Welcome Back!",
      description: "You have successfully signed in with Google.",
    });
    onClose();
  };

  const handleGoogleError = (error: string) => {
    toast({
      title: "Google Sign In Failed",
      description: error,
      variant: "destructive"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="text-center">
            <div className="mx-auto mb-4">
              <LogoIcon size="lg" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Sign In to RAC Rewards
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back! Sign in to continue
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="block text-sm">
              Email
            </Label>
            <Input
              type="email"
              required
              name="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              required
              name="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <hr className="border-dashed" />
          <span className="text-muted-foreground text-xs">Or continue with</span>
          <hr className="border-dashed" />
        </div>

        <div className="space-y-3">
          <GoogleOAuthButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            className="w-full"
            variant="outline"
          />
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Button
              type="button"
              variant="link"
              className="px-2 text-sm"
              onClick={onSwitchToSignup}
            >
              Create account
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPopup;
