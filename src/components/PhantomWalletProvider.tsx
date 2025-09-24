import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Phantom provider types based on official documentation
interface PhantomProvider {
  isPhantom: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  publicKey: { toString: () => string } | null;
  on: (event: string, handler: (args: any) => void) => void;
  request: (method: string, params?: any) => Promise<any>;
}

interface PhantomContextType {
  phantom: PhantomProvider | null;
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

const PhantomContext = createContext<PhantomContextType | undefined>(undefined);

export const usePhantom = () => {
  const context = useContext(PhantomContext);
  if (!context) {
    throw new Error('usePhantom must be used within a PhantomWalletProvider');
  }
  return context;
};

interface PhantomWalletProviderProps {
  children: React.ReactNode;
}

export const PhantomWalletProvider: React.FC<PhantomWalletProviderProps> = ({ children }) => {
  const [phantom, setPhantom] = useState<PhantomProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const { toast } = useToast();

  // Detect Phantom provider
  const detectPhantom = useCallback(() => {
    try {
      const provider = (window as any)?.phantom?.solana;
      
      if (provider?.isPhantom) {
        setPhantom(provider);
        return provider;
      }
      
      return null;
    } catch (error) {
      console.warn('Error detecting Phantom wallet:', error);
      return null;
    }
  }, []);

  // Check for existing connection on load
  const checkConnection = useCallback(async () => {
    const provider = detectPhantom();
    
    if (!provider) {
      console.log('Phantom wallet not detected');
      return;
    }

    try {
      // Try to connect only if already trusted (auto-reconnect)
      const response = await provider.connect({ onlyIfTrusted: true });
      
      if (response?.publicKey) {
        setConnected(true);
        setPublicKey(response.publicKey.toString());
        console.log('Auto-reconnected to Phantom:', response.publicKey.toString());
      }
    } catch {
      // User hasn't connected before or rejected auto-connect
      console.log('No existing Phantom connection');
      setConnected(false);
      setPublicKey(null);
    }
  }, [detectPhantom]);

  // Connect to Phantom
  const connect = useCallback(async () => {
    const provider = detectPhantom();
    
    if (!provider) {
      toast({
        title: "Phantom Not Found",
        description: "Please install the Phantom wallet extension",
        variant: "destructive"
      });
      throw new Error('Phantom wallet not found');
    }

    setConnecting(true);

    try {
      const response = await provider.connect();
      
      if (response?.publicKey) {
        setConnected(true);
        setPublicKey(response.publicKey.toString());
        
        toast({
          title: "Phantom Connected",
          description: `Connected: ${response.publicKey.toString().slice(0, 6)}...`,
        });
        
        console.log('Connected to Phantom:', response.publicKey.toString());
      } else {
        throw new Error('Failed to get public key from Phantom');
      }
    } catch (error) {
      console.error('Phantom connection error:', error);
      
      // Handle user rejection
      if (error instanceof Error && error.message.includes('User rejected')) {
        toast({
          title: "Connection Rejected",
          description: "You rejected the connection request",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "Failed to connect to Phantom",
          variant: "destructive"
        });
      }
      
      throw error;
    } finally {
      setConnecting(false);
    }
  }, [detectPhantom, toast]);

  // Disconnect from Phantom
  const disconnect = useCallback(async () => {
    if (!phantom) return;

    try {
      await phantom.disconnect();
      setConnected(false);
      setPublicKey(null);
      
      toast({
        title: "Phantom Disconnected",
        description: "Your wallet has been disconnected",
      });
      
      console.log('Disconnected from Phantom');
    } catch (error) {
      console.error('Phantom disconnect error:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect from Phantom",
        variant: "destructive"
      });
    }
  }, [phantom, toast]);

  // Set up event listeners
  useEffect(() => {
    if (!phantom) return;

    const handleAccountChanged = (publicKey: any) => {
      if (publicKey) {
        setPublicKey(publicKey.toString());
        setConnected(true);
        console.log('Phantom account changed:', publicKey.toString());
      } else {
        setPublicKey(null);
        setConnected(false);
        console.log('Phantom account disconnected');
      }
    };

    const handleDisconnect = () => {
      setConnected(false);
      setPublicKey(null);
      console.log('Phantom disconnected');
    };

    // Listen for account changes and disconnections
    phantom.on('accountChanged', handleAccountChanged);
    phantom.on('disconnect', handleDisconnect);

    return () => {
      // Clean up event listeners would go here if Phantom provided removeListener
      // Currently, Phantom doesn't provide a way to remove listeners
    };
  }, [phantom]);

  // Initialize on mount - only detect Phantom, don't auto-connect
  useEffect(() => {
    let initTimeout: NodeJS.Timeout;
    
    // Wait for page to load before detecting Phantom
    const initializePhantom = () => {
      // Debounce initialization to prevent multiple calls
      clearTimeout(initTimeout);
      initTimeout = setTimeout(() => {
        detectPhantom();
        // Removed checkConnection() to prevent auto-launching Phantom wallet
      }, 100);
    };

    if (document.readyState === 'loading') {
      window.addEventListener('load', initializePhantom);
    } else {
      initializePhantom();
    }

    return () => {
      clearTimeout(initTimeout);
      window.removeEventListener('load', initializePhantom);
    };
  }, [detectPhantom]);

  const value: PhantomContextType = {
    phantom,
    connected,
    connecting,
    publicKey,
    connect,
    disconnect,
    checkConnection,
  };

  return (
    <PhantomContext.Provider value={value}>
      {children}
    </PhantomContext.Provider>
  );
};

export default PhantomWalletProvider;