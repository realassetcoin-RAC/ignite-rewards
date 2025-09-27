// Solana Wallet Provider - React Context for Solana Wallet Integration
// This component provides Solana wallet connection using wallet adapters

import React, { useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaWalletProviderProps {
  children: React.ReactNode;
  network?: WalletAdapterNetwork;
  rpcUrl?: string;
}

export const SolanaWalletProvider: React.FC<SolanaWalletProviderProps> = ({
  children,
  network = WalletAdapterNetwork.Devnet,
  rpcUrl,
}) => {
  // Configure the network and RPC endpoint
  const endpoint = useMemo(() => {
    if (rpcUrl) return rpcUrl;
    return clusterApiUrl(network);
  }, [network, rpcUrl]);

  // Configure the wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  // Handle wallet connection errors
  const onError = useCallback((error: Error) => {
    console.error('Solana wallet error:', error);
    // You can add custom error handling here
    // For example, show a toast notification
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletProvider;
