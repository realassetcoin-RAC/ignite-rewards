import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

/**
 * Test component to verify wallet connection functionality
 */
const WalletConnectionTest: React.FC = () => {
  const { connect, disconnect, connected, publicKey, wallet } = useWallet();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!connect) {
      toast({
        title: "Wallet Not Available",
        description: "Please install Phantom or Solflare wallet extension",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      await connect();
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${wallet?.adapter.name || 'wallet'}`,
      });
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnect) return;
    
    try {
      await disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet",
      });
    } catch (error) {
      console.error('Disconnection error:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Wallet Connection Test</CardTitle>
        <CardDescription>
          Test the Solana wallet connection functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Connection Status:</p>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {connected && publicKey && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Wallet Address:</p>
            <p className="text-xs font-mono bg-muted p-2 rounded break-all">
              {publicKey.toBase58()}
            </p>
          </div>
        )}

        {connected && wallet && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Wallet Name:</p>
            <p className="text-sm">{wallet.adapter.name}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!connected ? (
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="flex-1"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          ) : (
            <Button 
              onClick={handleDisconnect}
              variant="outline"
              className="flex-1"
            >
              Disconnect
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Supported wallets: Phantom, Solflare</p>
          <p>Network: Solana Devnet</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletConnectionTest;