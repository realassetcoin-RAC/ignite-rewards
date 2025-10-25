import React, { useState } from 'react';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Key, Shield, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

interface SeedPhraseManagerProps {
  userId: string;
  onLoginSuccess?: () => void;
}

export const SeedPhraseManager: React.FC<SeedPhraseManagerProps> = ({ userId, onLoginSuccess }) => {
  const { toast } = useToast();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(true);
  const [emailAuthEnabled, setEmailAuthEnabled] = useState(true);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'input' | 'verifying' | 'success' | 'error'>('input');

  const handleSeedPhraseLogin = async () => {
    if (!seedPhrase.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter your seed phrase.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setVerificationStep('verifying');

    try {
      // Get user's wallet from seed phrase
      const { data: wallet, error: walletError } = await supabase
        .from('user_solana_wallets')
        .select('user_id, seed_phrase_encrypted')
        .eq('seed_phrase_encrypted', seedPhrase.trim())
        .single();

      if (walletError || !wallet) {
        setVerificationStep('error');
        toast({
          title: "Invalid Seed Phrase",
          description: "The seed phrase you entered is not valid.",
          variant: "destructive"
        });
        return;
      }

      // Verify the user ID matches
      if (wallet.user_id !== userId) {
        setVerificationStep('error');
        toast({
          title: "Access Denied",
          description: "This seed phrase does not belong to your account.",
          variant: "destructive"
        });
        return;
      }

      // Success - user is authenticated
      setVerificationStep('success');
      toast({
        title: "Login Successful",
        description: "You have been authenticated using your seed phrase.",
      });

      setTimeout(() => {
        setShowLoginDialog(false);
        setSeedPhrase('');
        setVerificationStep('input');
        onLoginSuccess?.();
      }, 1500);

    } catch (error) {
      console.error('Seed phrase login error:', error);
      setVerificationStep('error');
      toast({
        title: "Login Failed",
        description: "An error occurred during authentication.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableGoogleAuth = async () => {
    setLoading(true);

    try {
      // Update user profile to disable Google auth
      const { error } = await supabase
        .from('profiles')
        .update({ 
          google_auth_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      setGoogleAuthEnabled(false);
      toast({
        title: "Google Auth Disabled",
        description: "Google authentication has been disabled. You can now only login with your seed phrase.",
      });

      setShowDisableDialog(false);
    } catch (error) {
      console.error('Error disabling Google auth:', error);
      toast({
        title: "Error",
        description: "Failed to disable Google authentication.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableEmailAuth = async () => {
    setLoading(true);

    try {
      // Update user profile to disable email auth
      const { error } = await supabase
        .from('profiles')
        .update({ 
          email_auth_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      setEmailAuthEnabled(false);
      toast({
        title: "Email Auth Disabled",
        description: "Email authentication has been disabled. You can now only login with your seed phrase.",
      });

      setShowDisableDialog(false);
    } catch (error) {
      console.error('Error disabling email auth:', error);
      toast({
        title: "Error",
        description: "Failed to disable email authentication.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setSeedPhrase('');
    setVerificationStep('input');
    setShowSeedPhrase(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Seed Phrase Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Seed Phrase Login</p>
                <p className="text-sm text-muted-foreground">
                  Login using your 12-word seed phrase
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  resetDialog();
                  setShowLoginDialog(true);
                }}
              >
                Login with Seed Phrase
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Google Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {googleAuthEnabled 
                    ? "Currently enabled - you can login with Google or seed phrase"
                    : "Disabled - you can only login with seed phrase"
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={googleAuthEnabled}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      setShowDisableDialog(true);
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {googleAuthEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {emailAuthEnabled 
                    ? "Currently enabled - you can login with email or seed phrase"
                    : "Disabled - you can only login with seed phrase"
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={emailAuthEnabled}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      setShowDisableDialog(true);
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {emailAuthEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {(!googleAuthEnabled || !emailAuthEnabled) && (
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Authentication Disabled</p>
                  <p className="text-destructive/80">
                    You can only login using your seed phrase. Make sure you have it backed up safely.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seed Phrase Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={(open) => {
        if (!open) {
          resetDialog();
        }
        setShowLoginDialog(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Seed Phrase Login
            </DialogTitle>
            <DialogDescription>
              Enter your 12-word seed phrase to authenticate. This is the master key to your wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {verificationStep === 'input' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="seed-phrase">Seed Phrase</Label>
                  <div className="relative">
                    <Input
                      id="seed-phrase"
                      type={showSeedPhrase ? 'text' : 'password'}
                      value={seedPhrase}
                      onChange={(e) => setSeedPhrase(e.target.value)}
                      placeholder="Enter your 12-word seed phrase"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                    >
                      {showSeedPhrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Security Note:</strong> Your seed phrase is never stored or transmitted. 
                    It's only used locally to verify your identity.
                  </p>
                </div>
              </>
            )}

            {verificationStep === 'verifying' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Verifying seed phrase...</p>
              </div>
            )}

            {verificationStep === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-green-600 font-medium">Authentication Successful!</p>
                <p className="text-sm text-muted-foreground">Redirecting...</p>
              </div>
            )}

            {verificationStep === 'error' && (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive font-medium">Authentication Failed</p>
                <p className="text-sm text-muted-foreground">Please check your seed phrase and try again.</p>
              </div>
            )}

            {verificationStep === 'input' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetDialog();
                    setShowLoginDialog(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSeedPhraseLogin}
                  disabled={loading || !seedPhrase.trim()}
                  className="flex-1"
                >
                  {loading ? 'Verifying...' : 'Login'}
                </Button>
              </div>
            )}

            {verificationStep === 'error' && (
              <Button
                onClick={() => setVerificationStep('input')}
                className="w-full"
              >
                Try Again
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable Auth Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Disable Authentication
            </DialogTitle>
            <DialogDescription>
              This will disable the selected authentication method for your account. You will only be able to login using your seed phrase.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium text-destructive">Important Security Warning</p>
                  <ul className="text-sm text-destructive/80 space-y-1">
                    <li>• You will only be able to login with your seed phrase</li>
                    <li>• Make sure you have your seed phrase backed up safely</li>
                    <li>• If you lose your seed phrase, you will lose access to your account</li>
                    <li>• This action cannot be easily undone</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDisableDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  // Determine which auth to disable based on current state
                  if (!googleAuthEnabled) {
                    handleDisableEmailAuth();
                  } else {
                    handleDisableGoogleAuth();
                  }
                }}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Disabling...' : 'Disable Authentication'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
