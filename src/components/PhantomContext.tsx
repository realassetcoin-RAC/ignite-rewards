import React, { createContext } from 'react';

export interface PhantomProvider {
  isPhantom: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  publicKey: { toString: () => string } | null;
  on: (event: string, handler: (args: unknown) => void) => void;
  request: (method: string, params?: unknown) => Promise<unknown>;
}

export interface PhantomContextType {
  phantom: PhantomProvider | null;
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

export const PhantomContext = createContext<PhantomContextType | undefined>(undefined);

// Custom hook to use Phantom context
export const usePhantom = (): PhantomContextType => {
  const context = React.useContext(PhantomContext);
  if (context === undefined) {
    throw new Error('usePhantom must be used within a PhantomWalletProvider');
  }
  return context;
};
