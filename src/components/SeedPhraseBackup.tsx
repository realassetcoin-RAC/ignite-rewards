import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { SolanaWalletService } from '@/lib/solanaWalletService';
import { 
  Shield, 
  Copy, 
  Eye, 
  EyeOff, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  Wallet
} from 'lucide-react';

interface SeedPhraseBackupProps {
  onBackupComplete?: () => void;
}

const SeedPhraseBackup: React.FC<SeedPhraseBackupProps> = ({ onBackupComplete }) => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isBackedUp, setIsBackedUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkWalletStatus();
    }
  }, [user?.id]);

  const checkWalletStatus = async () => {
    try {
      // ALL users (email and Google) should have Solana wallets
      const walletExists = await SolanaWalletService.hasWallet(user?.id || '');
      setHasWallet(walletExists);
      
      if (walletExists) {
        // Check if user has already backed up their seed phrase
        const backedUp = localStorage.getItem(`seed_backed_up_${user?.id}`);
        setIsBackedUp(!!backedUp);
      }
    } catch (error) {
      console.error('Error checking wallet status:', error);
    }
  };

  const generateWallet = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const result = await SolanaWalletService.createWalletForUser(user.id);
      
      if (result.success && result.seedPhrase) {
        setSeedPhrase(result.seedPhrase);
        setHasWallet(true);
        toast({
          title: "Wallet Created! 🎉",
          description: "Your Solana custodial wallet has been created successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create wallet",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast({
        title: "Error",
        description: "Failed to create wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSeedPhrase = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const phrase = await SolanaWalletService.getUserSeedPhrase(user.id);
      
      if (phrase) {
        setSeedPhrase(phrase);
      } else {
        toast({
          title: "Error",
          description: "Failed to load seed phrase",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading seed phrase:', error);
      toast({
        title: "Error",
        description: "Failed to load seed phrase",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copySeedPhrase = async () => {
    try {
      await navigator.clipboard.writeText(seedPhrase.join(' '));
      toast({
        title: "Copied!",
        description: "Seed phrase copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy seed phrase",
        variant: "destructive"
      });
    }
  };

  const downloadSeedPhrase = () => {
    const content = `RAC Rewards - Seed Phrase Backup
Generated: ${new Date().toLocaleString()}
User: ${user?.email}

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

  const markAsBackedUp = () => {
    if (user?.id) {
      localStorage.setItem(`seed_backed_up_${user.id}`, 'true');
      setIsBackedUp(true);
      toast({
        title: "Backup Confirmed! ✅",
        description: "You have confirmed that you've safely backed up your seed phrase.",
      });
      onBackupComplete?.();
    }
  };

  if (!hasWallet) {
    // ALL users should have wallets automatically created - if no wallet exists, show loading message
    return (
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wallet className="h-5 w-5 text-blue-400" />
            Solana Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/70">
            Your Solana custodial wallet is being set up automatically. Please wait a moment...
          </p>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (seedPhrase.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-green-400" />
            Backup Your Seed Phrase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/70">
            Your Solana wallet has been created. Please backup your seed phrase to ensure you can recover your wallet if needed.
          </p>
          <Button 
            onClick={loadSeedPhrase}
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
          >
            {loading ? 'Loading...' : 'Show Seed Phrase'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5 text-orange-400" />
          Your Seed Phrase
          {isBackedUp && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Backed Up
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            onClick={copySeedPhrase}
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
              Once you've safely stored your seed phrase, confirm that you've backed it up:
            </p>
            <Button
              onClick={markAsBackedUp}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              I've Backed Up My Seed Phrase
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeedPhraseBackup;
