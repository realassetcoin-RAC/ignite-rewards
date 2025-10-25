import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createModuleLogger } from '@/utils/consoleReplacer';
import { Loader2, Wallet } from 'lucide-react';
import { localAuthService } from '@/lib/localAuthService';

interface WalletConnectButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  network?: 'solana' | 'ethereum';
}

const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  onSuccess,
  onError,
  className,
  variant = 'default',
  size = 'default',
  children,
  network = 'solana',
}) => {
  const logger = createModuleLogger('WalletConnectButton');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleWalletConnect = async () => {
    logger.info('Starting wallet connection with local authentication service');
    setLoading(true);

    try {
      // Check if wallet is available
      if (network === 'solana') {
        await connectSolanaWallet();
      } else if (network === 'ethereum') {
        await connectEthereumWallet();
      } else {
        throw new Error('Unsupported network');
      }

    } catch (error) {
      logger.error('Wallet connection error:', error);
      
      toast({
        title: "Wallet Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });

      if (onError) {
        onError(error instanceof Error ? error.message : 'Wallet connection failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const connectSolanaWallet = async () => {
    try {
      // Check if Phantom wallet is available
      if (typeof window !== 'undefined' && (window as any).solana?.isPhantom) {
        const phantom = (window as any).solana;
        
        // Request connection
        const response = await phantom.connect();
        const publicKey = response.publicKey.toString();
        
        logger.info('Phantom wallet connected:', publicKey);

        // Create a simple signature for verification (in production, use proper message signing)
        const message = `Connect to RAC Rewards - ${Date.now()}`;
        const encodedMessage = new TextEncoder().encode(message);
        const signature = await phantom.signMessage(encodedMessage, 'utf8');
        
        // Use local authentication service to create wallet user
        const { user, error } = await localAuthService.signInWithWallet({
          address: publicKey,
          network: 'solana',
          signature: signature.signature.toString()
        });

        if (error) {
          throw new Error(error);
        }

        if (user) {
          toast({
            title: "Wallet Connected",
            description: `Successfully connected ${network} wallet!`,
            variant: "default"
          });

          if (onSuccess) {
            onSuccess();
          }
        }
      } else {
        throw new Error('Phantom wallet not found. Please install Phantom wallet extension.');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('User rejected')) {
        throw new Error('Wallet connection was cancelled by user');
      }
      throw error;
    }
  };

  const connectEthereumWallet = async () => {
    try {
      // Check if MetaMask is available
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        
        // Request connection
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        
        logger.info('MetaMask wallet connected:', address);

        // Create a simple signature for verification (in production, use proper message signing)
        const message = `Connect to RAC Rewards - ${Date.now()}`;
        const signature = await ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        });
        
        // Use local authentication service to create wallet user
        const { user, error } = await localAuthService.signInWithWallet({
          address,
          network: 'ethereum',
          signature
        });

        if (error) {
          throw new Error(error);
        }

        if (user) {
          toast({
            title: "Wallet Connected",
            description: `Successfully connected ${network} wallet!`,
            variant: "default"
          });

          if (onSuccess) {
            onSuccess();
          }
        }
      } else {
        throw new Error('MetaMask wallet not found. Please install MetaMask extension.');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('User rejected')) {
        throw new Error('Wallet connection was cancelled by user');
      }
      throw error;
    }
  };

  return (
    <Button
      onClick={handleWalletConnect}
      disabled={loading}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className || ''}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      {children || `Connect ${network === 'solana' ? 'Solana' : 'Ethereum'} Wallet`}
    </Button>
  );
};

export default WalletConnectButton;
