import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { SolanaWalletService } from '@/lib/solanaWalletService';
import { 
  Wallet, 
  Shield, 
  Key, 
  Copy, 
  Download, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Lock,
  RefreshCw
} from 'lucide-react';

interface WalletManagementTabProps {
  className?: string;
}

interface WalletData {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const WalletManagementTab: React.FC<WalletManagementTabProps> = ({ className = '' }) => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isBackedUp, setIsBackedUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showDisableAuthDialog, setShowDisableAuthDialog] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [canDisableGoogleAuth, setCanDisableGoogleAuth] = useState(false);
  const [googleAuthDisabled, setGoogleAuthDisabled] = useState(false);

  const loadWalletData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // ✅ FIXED: Wallets are now created during signup, not dashboard load
      // Just load existing wallet data
      const walletData = await SolanaWalletService.getUserWallet(user.id);
      setWallet(walletData);

      // Check backup status
      const backedUp = await SolanaWalletService.hasBackedUpSeedPhrase(user.id);
      setIsBackedUp(backedUp);

      // Get Google auth status
      const authStatus = await SolanaWalletService.getGoogleAuthStatus(user.id);
      if (authStatus) {
        setCanDisableGoogleAuth(authStatus.can_disable);
        setGoogleAuthDisabled(authStatus.google_auth_disabled);
      }

    } catch {
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const loadSeedPhrase = async () => {
    if (!user?.id) return;

    try {
      const phrase = await SolanaWalletService.getUserSeedPhrase(user.id);
      if (phrase) {
        setSeedPhrase(phrase);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load seed phrase",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const downloadSeedPhrase = () => {
    const content = `RAC Rewards - Seed Phrase Backup
Generated: ${new Date().toLocaleString()}
User: ${user?.email}
Wallet Address: ${wallet?.public_key}

IMPORTANT: Keep this information secure and never share it with anyone.

Your 12-word seed phrase:
${seedPhrase.join(' ')}

Instructions:
1. Store this information in a secure location
2. Never share your seed phrase with anyone
3. This seed phrase can be used to recover your wallet
4. If you lose this seed phrase, you may lose access to your wallet permanently

Security Tips:
- Write it down on paper and store it safely
- Consider using a hardware wallet for additional security
- Never store it in digital form on unsecured devices
- Make multiple copies and store them in different secure locations`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rac-rewards-seed-phrase-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Seed phrase backup file downloaded",
    });
  };

  const generateBackupCode = async () => {
    if (!user?.id) return;

    try {
      const code = await SolanaWalletService.generateBackupCode(user.id);
      if (code) {
        setBackupCode(code);
        toast({
          title: "Backup Code Generated",
          description: "Use this code to verify your seed phrase backup",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate backup code",
        variant: "destructive"
      });
    }
  };

  const verifyBackupCode = async () => {
    if (!user?.id || !verificationCode) return;

    try {
      const isValid = await SolanaWalletService.verifyBackupCode(user.id, verificationCode);
      if (isValid) {
        setIsBackedUp(true);
        setShowBackupDialog(false);
        toast({
          title: "Backup Verified!",
          description: "Your seed phrase backup has been verified",
        });
      } else {
        toast({
          title: "Invalid Code",
          description: "The verification code is invalid or expired",
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to verify backup code",
        variant: "destructive"
      });
    }
  };

  const disableGoogleAuth = async () => {
    if (!user?.id) return;

    try {
      const success = await SolanaWalletService.disableGoogleAuth(user.id);
      if (success) {
        setGoogleAuthDisabled(true);
        setShowDisableAuthDialog(false);
        toast({
          title: "Google Auth Disabled",
          description: "You can now only log in using your seed phrase",
        });
      } else {
        throw new Error('Failed to disable Google authentication');
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to disable Google authentication",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Wallet Overview */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wallet className="h-5 w-5 text-blue-400" />
            Solana Wallet
            {wallet && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {wallet ? (
            <>
              <div>
                <Label className="text-white/70">Wallet Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={wallet.public_key}
                    readOnly
                    className="font-mono text-sm bg-white/5 border-white/10 text-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(wallet.public_key, 'Wallet address')}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/70">Created:</span>
                  <p className="text-white">{new Date(wallet.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-white/70">Status:</span>
                  <p className="text-white">{wallet.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-white/70">No wallet found. Creating wallet...</p>
              <div className="flex items-center justify-center mt-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seed Phrase Management */}
      <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-green-400" />
            Seed Phrase
            {isBackedUp && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {seedPhrase.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-white/70 mb-4">
                Your seed phrase is the master key to your wallet. Load it to backup securely.
              </p>
              <Button 
                onClick={loadSeedPhrase}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Key className="h-4 w-4 mr-2" />
                Load Seed Phrase
              </Button>
            </div>
          ) : (
            <>
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  <strong>IMPORTANT:</strong> Write down these 12 words in the exact order shown. 
                  Store them in a secure location. Anyone with access to these words can control your wallet.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {seedPhrase.map((word, index) => (
                  <div
                    key={index}
                    className="bg-white/5 border border-white/10 rounded-lg p-3 text-center"
                  >
                    <div className="text-xs text-white/50 mb-1">{index + 1}</div>
                    <div className="text-sm font-mono text-white">
                      {isVisible ? word : '••••••'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVisible(!isVisible)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {isVisible ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {isVisible ? 'Hide' : 'Show'} Words
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(seedPhrase.join(' '), 'Seed phrase')}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSeedPhrase}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              {!isBackedUp && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-white/70 text-sm mb-3">
                    Verify that you've safely backed up your seed phrase:
                  </p>
                  <Button
                    onClick={() => setShowBackupDialog(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Backup
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Authentication Settings */}
      <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5 text-orange-400" />
            Authentication Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Google Authentication</p>
                <p className="text-white/70 text-sm">
                  {googleAuthDisabled 
                    ? 'Disabled - You can only log in with seed phrase'
                    : 'Enabled - You can log in with Google or seed phrase'
                  }
                </p>
              </div>
              <Badge className={googleAuthDisabled ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
                {googleAuthDisabled ? 'Disabled' : 'Enabled'}
              </Badge>
            </div>

            {!googleAuthDisabled && canDisableGoogleAuth && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/70 text-sm mb-3">
                  You can disable Google authentication once you've verified your seed phrase backup.
                  This will make your account more secure by requiring seed phrase login only.
                </p>
                <Button
                  onClick={() => setShowDisableAuthDialog(true)}
                  variant="outline"
                  className="border-orange-500/20 text-orange-400 hover:bg-orange-500/10"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Disable Google Auth
                </Button>
              </div>
            )}

            {!canDisableGoogleAuth && (
              <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  You must verify your seed phrase backup before disabling Google authentication.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Backup Verification Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verify Seed Phrase Backup
            </DialogTitle>
            <DialogDescription>
              Generate a verification code to confirm you've safely backed up your seed phrase.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!backupCode ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Click the button below to generate a verification code.
                </p>
                <Button onClick={generateBackupCode} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Verification Code
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Verification Code</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={backupCode}
                      readOnly
                      className="font-mono text-center text-lg"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(backupCode, 'Verification code')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    This code expires in 10 minutes. Enter it below to verify your backup.
                  </p>
                </div>
                
                <div>
                  <Label>Enter Verification Code</Label>
                  <Input
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter the 6-digit code"
                    className="font-mono text-center text-lg"
                    maxLength={6}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowBackupDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={verifyBackupCode}
                    disabled={verificationCode.length !== 6}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Backup
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable Google Auth Dialog */}
      <Dialog open={showDisableAuthDialog} onOpenChange={setShowDisableAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Disable Google Authentication
            </DialogTitle>
            <DialogDescription>
              This will disable Google authentication for your account. You will only be able to log in using your seed phrase.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                <strong>Warning:</strong> Once disabled, you can only log in using your seed phrase. 
                Make sure you have securely backed up your seed phrase before proceeding.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDisableAuthDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={disableGoogleAuth}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Lock className="h-4 w-4 mr-2" />
                Disable Google Auth
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletManagementTab;
