import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LogoIcon } from '@/components/logo';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface SignupPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export const SignupPopup: React.FC<SignupPopupProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    acceptTerms: false,
    acceptPrivacy: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { signUp } = useSecureAuth();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      toast({
        title: "Terms Required",
        description: "Please accept the Terms of Use and Privacy Policy.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await signUp(
        formData.email,
        formData.password,
        {
          first_name: formData.firstName,
          last_name: formData.lastName
        }
      );
      
      toast({
        title: "Account Created!",
        description: "Welcome to RAC Rewards! Please check your email to verify your account.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : "Unable to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    toast({
      title: "Account Created!",
      description: "Welcome to RAC Rewards! Your account has been created with Google.",
    });
    onClose();
  };

  const handleGoogleError = (error: string) => {
    toast({
      title: "Google Sign Up Failed",
      description: error,
      variant: "destructive"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-center">
            <div className="mx-auto mb-4">
              <LogoIcon size="lg" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Create Your Account
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Join RAC Rewards and start earning today
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="block text-sm">
                First Name *
              </Label>
              <Input
                type="text"
                required
                name="firstName"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="First name"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="block text-sm">
                Last Name *
              </Label>
              <Input
                type="text"
                required
                name="lastName"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Last name"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="block text-sm">
              Email *
            </Label>
            <Input
              type="email"
              required
              name="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm">
                Password *
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
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Create a password (min. 8 characters)"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="confirmPassword" className="text-sm">
                Confirm Password *
              </Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-sm"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Input
              type={showConfirmPassword ? "text" : "password"}
              required
              name="confirmPassword"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="acceptTerms" className="text-sm leading-relaxed">
                I accept the{' '}
                <Button type="button" variant="link" className="p-0 h-auto text-sm">
                  Terms of Use
                </Button>
                {' '}and{' '}
                <Button type="button" variant="link" className="p-0 h-auto text-sm">
                  Privacy Policy
                </Button>
                *
              </Label>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Create Account
              </>
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
            Already have an account?{' '}
            <Button
              type="button"
              variant="link"
              className="px-2 text-sm"
              onClick={onSwitchToLogin}
            >
              Sign in
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupPopup;
