import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Download,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { useToast } from '@/hooks/use-toast';

interface WalletManagerProps {
  userId: string;
}

const WalletManager: React.FC<WalletManagerProps> = ({ userId }) => {
  const {
    wallet,
    balance,
    loading,
    generateWallet,
    connectWallet,
    disconnectWallet,
    refreshBalance
  } = useSolanaWallet(userId);

  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [connectAddress, setConnectAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const formatAmount = (amount: number) => {
    return amount.toFixed(4);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard.`,
    });
  };

  const downloadSeedPhrase = () => {
    if (!wallet) return;
    
    const element = document.createElement('a');
    const file = new Blob([wallet.encrypted_seed_phrase], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'wallet-seed-phrase.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Downloaded",
      description: "Seed phrase downloaded. Keep it safe!",
    });
  };

  const handleConnectWallet = async () => {
    if (!connectAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid wallet address.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      await connectWallet(connectAddress.trim());
      setConnectAddress('');
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading wallet...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <div className="space-y-6">
        {/* Generate New Wallet */}
        <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Generate New Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Generate a new Solana wallet to start earning rewards. This will create a new keypair for you.
              </p>
              <Button
                onClick={generateWallet}
                className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
              >
                <Key className="h-4 w-4 mr-2" />
                Generate New Wallet
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connect Existing Wallet */}
        <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              Connect Existing Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Connect an existing Solana wallet using your public key.
              </p>
              <div className="space-y-2">
                <Input
                  placeholder="Enter your Solana wallet address"
                  value={connectAddress}
                  onChange={(e) => setConnectAddress(e.target.value)}
                />
                <Button
                  onClick={handleConnectWallet}
                  disabled={isConnecting || !connectAddress.trim()}
                  className="w-full"
                  variant="outline"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Info */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Wallet Information
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={wallet.wallet_type === 'generated' ? 'default' : 'secondary'}>
                {wallet.wallet_type}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshBalance}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Wallet Address */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Wallet Address</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={wallet.public_key}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(wallet.public_key, 'Wallet address')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Seed Phrase (for generated wallets) */}
            {wallet.wallet_type === 'generated' && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Seed Phrase</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type={showSeedPhrase ? 'text' : 'password'}
                    value={wallet.encrypted_seed_phrase}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                  >
                    {showSeedPhrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadSeedPhrase}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Keep your seed phrase safe and never share it!</span>
                </div>
              </div>
            )}

            {/* Wallet Status */}
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Wallet is active and ready</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance */}
      {balance && (
        <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">SOL</span>
                  </div>
                  <div>
                    <div className="font-medium">Solana (SOL)</div>
                    <div className="text-sm text-muted-foreground">Native token</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{formatAmount(balance.sol)}</div>
                  <div className="text-sm text-muted-foreground">SOL</div>
                </div>
              </div>

              {Object.entries(balance.tokens).map(([mint, amount]) => (
                <div key={mint} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-500 font-bold text-sm">T</span>
                    </div>
                    <div>
                      <div className="font-medium">Token</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {mint.slice(0, 8)}...{mint.slice(-8)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatAmount(amount)}</div>
                    <div className="text-sm text-muted-foreground">tokens</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Disconnect your wallet. You can reconnect it later using the same address.
            </p>
            <Button
              variant="destructive"
              onClick={disconnectWallet}
              className="w-full"
            >
              Disconnect Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletManager;
