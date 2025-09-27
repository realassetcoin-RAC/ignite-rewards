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
      <DialogContent className="sm:max-w-md p-0 border-0 shadow-none bg-transparent max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4">
                <LogoIcon size="lg" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">
                Create Your Account
              </h1>
              <p className="text-sm text-gray-600">
                Join RAC Rewards and start earning today
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="block text-sm font-medium text-gray-900">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="block text-sm font-medium text-gray-900">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="block text-sm font-medium text-gray-900">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                  Password *
                </Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a password (min. 8 characters)"
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">
                  Confirm Password *
                </Label>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <Label htmlFor="acceptTerms" className="text-sm leading-relaxed text-gray-700">
                    I accept the{' '}
                    <Button type="button" variant="link" className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800">
                      Terms of Use
                    </Button>
                    {' '}and{' '}
                    <Button type="button" variant="link" className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800">
                      Privacy Policy
                    </Button>
                    *
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-black text-white hover:bg-gray-800 py-2 px-4 rounded-md font-medium transition-colors" 
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

            <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <hr className="border-gray-300" />
              <span className="text-xs text-gray-500">Or continue with</span>
              <hr className="border-gray-300" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GoogleOAuthButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-md font-medium transition-colors"
                variant="outline"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="0.98em"
                  height="1em"
                  viewBox="0 0 256 262"
                  className="mr-2"
                >
                  <path
                    fill="#4285f4"
                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                  />
                  <path
                    fill="#34a853"
                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                  />
                  <path
                    fill="#fbbc05"
                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                  />
                  <path
                    fill="#eb4335"
                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                  />
                </svg>
                Google
              </GoogleOAuthButton>
              <Button
                type="button"
                variant="outline"
                className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-md font-medium transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 256 256"
                  className="mr-2"
                >
                  <path
                    fill="#f1511b"
                    d="M121.666 121.666H0V0h121.666z"
                  />
                  <path
                    fill="#80cc28"
                    d="M256 121.666H134.335V0H256z"
                  />
                  <path
                    fill="#00adef"
                    d="M121.663 256.002H0V134.336h121.663z"
                  />
                  <path
                    fill="#fbbc09"
                    d="M256 256.002H134.335V134.336H256z"
                  />
                </svg>
                Microsoft
              </Button>
            </div>
          </div>

          <div className="px-8 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Button
                type="button"
                variant="link"
                className="px-2 text-sm text-gray-900 hover:text-gray-700 p-0 h-auto font-medium"
                onClick={onSwitchToLogin}
              >
                Sign in
              </Button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupPopup;
