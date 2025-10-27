import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
// import { LogoIcon } from '@/components/logo';
import { SeedPhraseLoginModal } from '@/components/SeedPhraseLoginModal';
import WalletSelector from '@/components/WalletSelector';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import { useTermsPrivacy } from '@/hooks/useTermsPrivacy';
import { ReferralService } from '@/lib/referralService';
import { Loader2, CheckCircle, Key, Gift, Wallet, AlertCircle } from 'lucide-react';
import { signupFormSchema, validateFormData, useFieldValidation, emailSchema, passwordSchema, nameSchema, referralCodeSchema } from '@/utils/validation';

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
    referralCode: '',
    acceptTerms: false,
    acceptPrivacy: false
  });
  const [showPassword] = useState(false);
  const [showConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSeedPhraseModal, setShowSeedPhraseModal] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const { toast } = useToast();
  const { refreshAuth } = useSecureAuth();
  const { saveAcceptance } = useTermsPrivacy();

  // Real-time validation
  const emailValidation = useFieldValidation(emailSchema, formData.email);
  const passwordValidation = useFieldValidation(passwordSchema, formData.password);
  const firstNameValidation = useFieldValidation(nameSchema, formData.firstName);
  const lastNameValidation = useFieldValidation(nameSchema, formData.lastName);
  const referralValidation = useFieldValidation(referralCodeSchema, formData.referralCode);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const validation = validateFormData(signupFormSchema, formData);
    
    if (!validation.success) {
      const firstError = validation.errors?.[0] || 'Please check your input';
      toast({
        title: "Validation Error",
        description: firstError,
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
      // Mock signup for direct authentication
      const mockUser = {
        id: 'mock-user-' + Date.now(),
        email: formData.email,
        user_metadata: {
          first_name: formData.firstName,
          last_name: formData.lastName
        }
      };

      const result = { user: mockUser };
      
      // Save terms and privacy acceptance
      await saveAcceptance(formData.acceptTerms, formData.acceptPrivacy);
      
      // Process referral code if provided
      if (formData.referralCode.trim() && result?.user?.id) {
        try {
          const referralResult = await ReferralService.processReferralSignup(
            formData.referralCode.trim(), 
            result.user.id
          );
          
          if (referralResult.success) {
            toast({
              title: "Referral Code Applied!",
              description: "You've earned bonus points from the referral!",
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
        title: "Account Created!",
        description: "Welcome to RAC Rewards! Please check your email to verify your account.",
      });
      refreshAuth();
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



  const handleSeedPhraseSuccess = () => {
    toast({
      title: "Account Created!",
      description: "Welcome to RAC Rewards! Your account has been created.",
    });
    onClose();
  };

  const handleWalletConnect = () => {
    // Validate terms and privacy acceptance for sign-up
    if (!formData.acceptTerms || !formData.acceptPrivacy) {
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
    toast({
      title: "Wallet Connected!",
      description: "Your wallet has been successfully connected.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-0 border-0 shadow-none bg-transparent max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Sign Up for RAC Rewards</DialogTitle>
        <DialogDescription className="sr-only">Join RAC Rewards and start earning today</DialogDescription>
        <div className="bg-white/80 backdrop-blur-md rounded-lg border border-white/20">
          <form className="max-w-sm m-auto h-fit w-full">
            <div className="p-4">
              <div>
                <div className="mb-3">
                  <img 
                    src="/bridgepoint-logo.jpg" 
                    alt="PointBridge Logo" 
                    className="w-8 h-8 rounded-lg object-contain"
                  />
                </div>
                <h1 className="mb-1 text-lg font-semibold text-gray-900">Create Your Account</h1>
                <p className="text-sm text-gray-700">Join RAC Rewards and start earning today</p>
              </div>

              <div className="mt-4 space-y-2">
                <GoogleOAuthButton
                  onSuccess={() => {
                    onClose();
                  }}
                  onError={(error) => {
                    console.error('Google OAuth error:', error);
                  }}
                  className="w-full"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 bg-gray-800 text-white hover:bg-gray-700 border border-gray-800 rounded-md"
                  onClick={() => setShowSeedPhraseModal(true)}
                >
                  <Key className="mr-2 h-3 w-3 text-white" />
                  Seed Phrase
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 bg-gray-800 text-white hover:bg-gray-700 border border-gray-800 rounded-md"
                  onClick={handleWalletConnect}
                  disabled={loading}
                >
                  <Wallet className="mr-2 h-3 w-3 text-white" />
                  Connect Wallet
                </Button>
              </div>

              <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <hr className="border-dashed" />
                <span className="text-gray-600 text-xs">Or continue With</span>
                <hr className="border-dashed" />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="firstName" className="block text-sm text-gray-900 font-medium">
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
                      className={`h-9 ${firstNameValidation.error ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {firstNameValidation.error && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        {firstNameValidation.error}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="block text-sm text-gray-900 font-medium">
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
                      className={`h-9 ${lastNameValidation.error ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {lastNameValidation.error && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        {lastNameValidation.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="block text-sm text-gray-900 font-medium">
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
                    className={`h-9 ${emailValidation.error ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {emailValidation.error && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {emailValidation.error}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="block text-sm text-gray-900 font-medium">
                    Password *
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Create a password (min. 8 characters, uppercase, lowercase, number, special char)"
                    disabled={loading}
                    className={`h-9 ${passwordValidation.error ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {passwordValidation.error && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {passwordValidation.error}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="block text-sm text-gray-900 font-medium">
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
                    className={`h-9 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      Passwords don't match
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="referral" className="block text-sm text-gray-900 font-medium flex items-center gap-2">
                    <Gift className="h-3 w-3 text-purple-600" />
                    Referral Code (Optional)
                  </Label>
                  <Input
                    type="text"
                    name="referral"
                    id="referral"
                    value={formData.referralCode}
                    onChange={(e) => handleInputChange('referralCode', e.target.value.toUpperCase())}
                    placeholder="Enter referral code"
                    disabled={loading}
                    className={`h-9 ${referralValidation.error ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {referralValidation.error && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {referralValidation.error}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                      disabled={loading}
                      className="mt-0.5"
                    />
                    <Label htmlFor="acceptTerms" className="text-xs leading-relaxed">
                      I accept the{' '}
                      <Button type="button" variant="link" className="p-0 h-auto text-xs">
                        Terms of Use
                      </Button>
                      {' '}and{' '}
                      <Button type="button" variant="link" className="p-0 h-auto text-xs">
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
                  onClick={handleSubmit}
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
              </div>

            </div>

            <p className="text-gray-600 text-center text-sm">
              Already have an account?{' '}
              <Button
                type="button"
                variant="link"
                className="px-2 text-blue-600 hover:text-blue-800"
                onClick={onSwitchToLogin}
              >
                Sign in
              </Button>
            </p>
          </form>
        </div>
      </DialogContent>

      {/* Seed Phrase Login Modal */}
      <SeedPhraseLoginModal
        isOpen={showSeedPhraseModal}
        onClose={() => setShowSeedPhraseModal(false)}
        onSuccess={handleSeedPhraseSuccess}
      />

      {/* Wallet Selector Modal */}
      <WalletSelector
        isOpen={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
        onWalletConnected={handleWalletConnected}
      />
    </Dialog>
  );
};

export default SignupPopup;
