// Solana Wallet Button - Connect/Disconnect Solana Wallets
// This component provides wallet connection functionality for Solana

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export const SolanaWalletButton: React.FC = () => {
  const { wallet, publicKey, connected, connecting, disconnecting } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toString());
        setCopied(true);
        toast.success('Wallet address copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy wallet address');
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!connected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Solana Wallet
          </CardTitle>
          <CardDescription>
            Connect your Solana wallet to interact with NFTs and make investments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WalletMultiButton className="w-full" />
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Supported wallets:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">Phantom</Badge>
              <Badge variant="secondary">Solflare</Badge>
              <Badge variant="secondary">Backpack</Badge>
              <Badge variant="secondary">Torus</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Connected
        </CardTitle>
        <CardDescription>
          Connected to {wallet?.adapter.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Wallet Address</label>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <code className="text-sm flex-1">
              {publicKey ? formatAddress(publicKey.toString()) : 'N/A'}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAddress}
              disabled={!publicKey}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            Connected
          </Badge>
          <Badge variant="outline">
            {wallet?.adapter.name}
          </Badge>
        </div>

        <div className="flex gap-2">
          <WalletDisconnectButton className="flex-1" />
        </div>

        {connecting && (
          <div className="text-sm text-muted-foreground">
            Connecting to wallet...
          </div>
        )}

        {disconnecting && (
          <div className="text-sm text-muted-foreground">
            Disconnecting from wallet...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SolanaWalletButton;
