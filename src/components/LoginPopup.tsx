import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { LogoIcon } from '@/components/logo';
import { SeedPhraseLoginModal } from '@/components/SeedPhraseLoginModal';
import WalletSelector from '@/components/WalletSelector';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { ReferralService } from '@/lib/referralService';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import { Loader2, Key, Wallet, Gift } from 'lucide-react';

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
  const [referralCode, setReferralCode] = useState('');
  const [showPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSeedPhraseModal, setShowSeedPhraseModal] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const { toast } = useToast();
  const { refreshAuth } = useSecureAuth();

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
      const { data, error } = await databaseAdapter.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const result = { user: data.user };
      
      // Process referral code if provided (for existing users)
      if (referralCode.trim() && result?.user?.id) {
        try {
          const referralResult = await ReferralService.processReferralSignup(
            referralCode.trim(), 
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
            description: "Referral code could not be processed, but you're signed in successfully.",
            variant: "destructive"
          });
        }
      }
      
      toast({
        title: "Welcome Back!",
        description: "You have successfully signed in.",
      });
      refreshAuth();
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



  const handleSeedPhraseSuccess = () => {
    toast({
      title: "Login Successful",
      description: "Welcome back! You've successfully logged in using your seed phrase.",
    });
    onClose();
  };

  const handleWalletConnect = () => {
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
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-0 border-0 shadow-none bg-transparent">
        <DialogTitle className="sr-only">Sign In to RAC Rewards</DialogTitle>
        <DialogDescription className="sr-only">Welcome back! Sign in to continue</DialogDescription>
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
                <h1 className="mb-1 text-lg font-semibold text-gray-900">Sign In to RAC Rewards</h1>
                <p className="text-sm text-gray-700">Welcome back! Sign in to continue</p>
              </div>

              <div className="mt-4 space-y-2">
                <GoogleOAuthButton
                  onSuccess={(user) => {
                    console.log('Google sign in successful:', user);
                    onClose();
                  }}
                  onError={(error) => {
                    console.error('Google sign in error:', error);
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
                <div className="space-y-2">
                  <Label htmlFor="email" className="block text-sm text-gray-900 font-medium">
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

                <div className="space-y-2">
                  <Label htmlFor="password" className="block text-sm text-gray-900 font-medium">
                    Password
                  </Label>
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

                <div className="space-y-2">
                  <Label htmlFor="referral" className="block text-sm text-gray-900 font-medium flex items-center gap-2">
                    <Gift className="h-4 w-4 text-purple-600" />
                    Referral Code (Optional)
                  </Label>
                  <Input
                    type="text"
                    name="referral"
                    id="referral"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Enter referral code"
                    disabled={loading}
                  />
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
                      Signing In...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>

            </div>

            <p className="text-gray-600 text-center text-sm">
              Don't have an account?{' '}
              <Button
                type="button"
                variant="link"
                className="px-2 text-blue-600 hover:text-blue-800"
                onClick={onSwitchToSignup}
              >
                Create account
              </Button>
            </p>
          </form>
        </div>
      </DialogContent>

      {/* Wallet Selector Modal */}
      <WalletSelector
        isOpen={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
        onWalletConnected={handleWalletConnected}
      />
    </Dialog>

    {/* Seed Phrase Login Modal - Outside main dialog to avoid z-index conflicts */}
    <SeedPhraseLoginModal
      isOpen={showSeedPhraseModal}
      onClose={() => setShowSeedPhraseModal(false)}
      onSuccess={handleSeedPhraseSuccess}
    />
  </>
  );
};

export default LoginPopup;
