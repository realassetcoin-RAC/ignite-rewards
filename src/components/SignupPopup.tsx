import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LogoIcon } from '@/components/logo';
import { SeedPhraseLoginModal } from '@/components/SeedPhraseLoginModal';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { supabase } from '@/integrations/supabase/client';
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
  const { toast } = useToast();
  const { refreshAuth } = useSecureAuth();
  const { saveAcceptance } = useTermsPrivacy();

  // Real-time validation
  const emailValidation = useFieldValidation(emailSchema, formData.email);
  const passwordValidation = useFieldValidation(passwordSchema, formData.password);
  const firstNameValidation = useFieldValidation(nameSchema, formData.firstName);
  const lastNameValidation = useFieldValidation(nameSchema, formData.lastName);
  const referralValidation = useFieldValidation(referralCodeSchema, formData.referralCode);

  // Auto-fill referral code from URL parameters
  useEffect(() => {
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      if (refCode) {
        setFormData(prev => ({
          ...prev,
          referralCode: refCode
        }));
      }
    }
  }, [isOpen]);

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
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      if (error) {
        throw error;
      }

      const result = { user: data.user };
      
      // Save terms and privacy acceptance
      await saveAcceptance(formData.acceptTerms, formData.acceptPrivacy);
      
      // ✅ IMPLEMENT REQUIREMENT: Create custodial wallet for email signup
      if (result?.user?.id) {
        try {
          // Create user profile with custodial type
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: result.user.id,
              email: formData.email,
              full_name: `${formData.firstName} ${formData.lastName}`,
              first_name: formData.firstName,
              last_name: formData.lastName,
              user_type: 'custodial',
              provider: 'email',
              terms_accepted: formData.acceptTerms,
              privacy_accepted: formData.acceptPrivacy,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }

          // Create custodial wallet
          const { error: walletError } = await supabase
            .from('user_solana_wallets')
            .insert({
              user_id: result.user.id,
              address: `custodial_${result.user.id}_${Date.now()}`,
              seed_phrase: 'custodial_wallet_managed_by_platform',
              wallet_type: 'custodial',
              is_active: true,
              created_at: new Date().toISOString()
            });

          if (walletError) {
            console.error('Wallet creation error:', walletError);
          }

          // ✅ IMPLEMENT REQUIREMENT: Assign free Pearl White NFT to custodial users
          try {
            const { NFTAssignmentService } = await import('@/lib/nftAssignmentService');
            const nftResult = await NFTAssignmentService.assignFreeNFT(result.user.id);
            
            if (!nftResult.success) {
              console.error('Free NFT assignment error:', nftResult.error);
            } else {
              console.log('✅ Successfully assigned free Pearl White NFT');
            }
          } catch (nftError) {
            console.error('Free NFT assignment failed:', nftError);
          }

        } catch (walletError) {
          console.error('Wallet creation failed:', walletError);
          // Don't fail the signup if wallet creation fails
        }
      }
      
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
        } catch {
          // Console statement removed
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

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      
      // Store referral code in sessionStorage for post-OAuth processing
      if (formData.referralCode.trim()) {
        sessionStorage.setItem('pending_referral_code', formData.referralCode.trim());
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/popup-callback`,
          skipBrowserRedirect: true // This enables popup mode
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open OAuth in popup window with minimal parameters to avoid fullscreen
        const popup = window.open(
          data.url,
          'google-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes,left=100,top=100'
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Security note: URL will be visible but we'll monitor for manipulation
        // Console statement removed

        // Additional security: Monitor popup for URL changes
        const urlCheckInterval = setInterval(() => {
          try {
            if (popup && !popup.closed) {
              // Check if URL has been manipulated
              const currentUrl = popup.location.href;
              if (currentUrl && !currentUrl.includes('accounts.google.com') && !currentUrl.includes('supabase.co')) {
                // Console statement removed
                popup.close();
                clearInterval(urlCheckInterval);
                toast({
                  title: "Security Alert",
                  description: "Suspicious activity detected. Please try again.",
                  variant: "destructive"
                });
              }
            } else {
              clearInterval(urlCheckInterval);
            }
          } catch {
            // Expected - cross-origin access blocked
          }
        }, 1000);

        // Track authentication state to prevent race conditions
        let authCompleted = false;

        // Listen for messages from the popup
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'OAUTH_SUCCESS') {
            authCompleted = true;
            clearTimeout(timeoutId);
            toast({
              title: "Sign Up Successful",
              description: "Welcome to RAC Rewards! Your account has been created with Google.",
            });
            onClose();
            window.removeEventListener('message', handleMessage);
          } else if (event.data.type === 'OAUTH_ERROR') {
            authCompleted = true;
            clearTimeout(timeoutId);
            toast({
              title: "Sign Up Failed",
              description: event.data.error || "Google sign-up failed. Please try again.",
              variant: "destructive"
            });
            window.removeEventListener('message', handleMessage);
          }
        };

        window.addEventListener('message', handleMessage);

        // Set a timeout to handle cases where the popup doesn't respond
        // This avoids Cross-Origin-Opener-Policy errors from checking popup.closed
        const timeoutId = setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          
          // Only show error if authentication was not completed successfully
          if (!authCompleted) {
            toast({
              title: "Sign Up Timeout",
              description: "Google sign-up timed out. Please try again.",
              variant: "destructive"
            });
          }
        }, 30000); // 30 second timeout
      } else {
        throw new Error('No OAuth URL received');
      }
    } catch (error) {
      // Console statement removed
      toast({
        title: "Google Sign Up Failed",
        description: error instanceof Error ? error.message : "Unable to sign up with Google. Please try again.",
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
    
    // Wallet selector removed - users sign up with email/OAuth first
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
                  <LogoIcon size="md" />
                </div>
                <h1 className="mb-1 text-lg font-semibold text-gray-900">Create Your Account</h1>
                <p className="text-sm text-gray-700">Join RAC Rewards and start earning today</p>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                  className="w-full h-9 bg-gray-800 text-white hover:bg-gray-700 border border-gray-800 rounded-md"
                  variant="outline"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285f4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34a853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#fbbc05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#eb4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-white">
                    {loading ? 'Signing up...' : 'Google'}
                  </span>
                </Button>
                
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
                      autoComplete="given-name"
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
                      autoComplete="family-name"
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
                    autoComplete="email"
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
                    autoComplete="new-password"
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
                    Loyalty Number (Optional)
                  </Label>
                  <Input
                    type="text"
                    name="referral"
                    id="referral"
                    value={formData.referralCode}
                    onChange={(e) => handleInputChange('referralCode', e.target.value.toUpperCase())}
                    placeholder="Enter loyalty number"
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

      {/* Wallet Selector Modal - Temporarily disabled */}
      {/* <WalletSelector
        isOpen={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
      /> */}
    </Dialog>
  );
};

export default SignupPopup;
