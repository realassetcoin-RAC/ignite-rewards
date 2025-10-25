import React, { useState, useEffect } from 'react';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Copy, Eye, EyeOff, Download, Key, Shield, AlertTriangle } from 'lucide-react';

interface UserWallet {
  id: string;
  address: string;
  seed_phrase?: string;
  created_at: string;
}

interface WalletAddressDisplayProps {
  userId: string;
  className?: string;
}

export const WalletAddressDisplay: React.FC<WalletAddressDisplayProps> = ({ userId, className }) => {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, [userId]);

  const fetchWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('user_solana_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setWallet(data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const downloadSeedPhrase = () => {
    if (!wallet?.seed_phrase) return;

    const element = document.createElement('a');
    const file = new Blob([wallet.seed_phrase], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `pointbridge-seed-phrase-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Downloaded",
      description: "Seed phrase saved to your device.",
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No wallet found for this user.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Address
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet Address */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Address</span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddress(!showAddress)}
                >
                  {showAddress ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(wallet.address, 'Wallet address')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
              {showAddress ? wallet.address : formatAddress(wallet.address)}
            </div>
          </div>

          {/* Seed Phrase Section */}
          {wallet.seed_phrase && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Seed Phrase
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                  >
                    {showSeedPhrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(wallet.seed_phrase!, 'Seed phrase')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                {showSeedPhrase ? (
                  <div className="font-mono text-sm space-y-1">
                    {wallet.seed_phrase.split(' ').map((word, index) => (
                      <span key={index} className="inline-block mr-2">
                        {index + 1}. {word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="font-mono text-sm text-muted-foreground">
                    ••••• ••••• ••••• ••••• ••••• ••••• ••••• ••••• ••••• ••••• ••••• •••••
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Backup Options */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Security Options</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBackupDialog(true)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Backup Seed Phrase
              </Button>
            </div>
          </div>

          {/* Created Date */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Created: {new Date(wallet.created_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Backup Seed Phrase
            </DialogTitle>
            <DialogDescription>
              Your seed phrase is the master key to your wallet. Store it safely and never share it with anyone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium text-destructive">Important Security Warning</p>
                  <ul className="text-sm text-destructive/80 space-y-1">
                    <li>• Never share your seed phrase with anyone</li>
                    <li>• Store it in a secure, offline location</li>
                    <li>• Anyone with your seed phrase can access your wallet</li>
                    <li>• PointBridge will never ask for your seed phrase</li>
                  </ul>
                </div>
              </div>
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
                onClick={() => {
                  downloadSeedPhrase();
                  setShowBackupDialog(false);
                }}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Backup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
