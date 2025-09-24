import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// MetaMask provider types based on official documentation
interface EthereumProvider {
  isMetaMask: boolean;
  isConnected: () => boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (...args: any[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
  removeAllListeners: () => void;
  _metamask?: {
    isUnlocked: () => Promise<boolean>;
  };
}

interface MetaMaskContextType {
  ethereum: EthereumProvider | null;
  connected: boolean;
  connecting: boolean;
  accounts: string[];
  currentAccount: string | null;
  chainId: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: string) => Promise<void>;
  addChain: (chainConfig: any) => Promise<void>;
}

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

export const useMetaMask = () => {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error('useMetaMask must be used within a MetaMaskProvider');
  }
  return context;
};

interface MetaMaskProviderProps {
  children: React.ReactNode;
}

export const MetaMaskProvider: React.FC<MetaMaskProviderProps> = ({ children }) => {
  const [ethereum, setEthereum] = useState<EthereumProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const { toast } = useToast();

  // Detect MetaMask provider
  const detectMetaMask = useCallback(() => {
    try {
      const provider = (window as any)?.ethereum;
      
      if (provider?.isMetaMask) {
        setEthereum(provider);
        return provider;
      }
      
      return null;
    } catch (error) {
      console.warn('Error detecting MetaMask wallet:', error);
      return null;
    }
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback((newAccounts: string[]) => {
    console.log('MetaMask accounts changed:', newAccounts);
    setAccounts(newAccounts);
    
    if (newAccounts.length === 0) {
      // MetaMask is locked or user has disconnected
      setConnected(false);
      setCurrentAccount(null);
      console.log('MetaMask disconnected - no accounts');
    } else {
      // Update current account (first account is the selected one)
      const newCurrentAccount = newAccounts[0];
      setCurrentAccount(newCurrentAccount);
      setConnected(true);
      console.log('MetaMask account changed to:', newCurrentAccount);
    }
  }, []);

  // Handle chain changes
  const handleChainChanged = useCallback((newChainId: string) => {
    console.log('MetaMask chain changed:', newChainId);
    setChainId(newChainId);
    // Reload the page as recommended by MetaMask docs
    // window.location.reload();
  }, []);

  // Handle connection
  const handleConnect = useCallback((connectInfo: { chainId: string }) => {
    console.log('MetaMask connected:', connectInfo);
    setChainId(connectInfo.chainId);
  }, []);

  // Handle disconnection
  const handleDisconnect = useCallback((error: any) => {
    console.log('MetaMask disconnected:', error);
    setConnected(false);
    setAccounts([]);
    setCurrentAccount(null);
    setChainId(null);
  }, []);

  // Check for existing connection
  // const _checkConnection = useCallback(async () => {
  //   const provider = detectMetaMask();
  //   
  //   if (!provider) {
  //     console.log('MetaMask not detected');
  //     return;
  //   }

  //   try {
  //     // Check if already connected
  //     const existingAccounts = await provider.request({
  //       method: 'eth_accounts'
  //     });
  //     
  //     if (existingAccounts && existingAccounts.length > 0) {
  //       handleAccountsChanged(existingAccounts);
  //       
  //       // Get current chain ID
  //       const currentChainId = await provider.request({
  //         method: 'eth_chainId'
  //       });
  //       setChainId(currentChainId);
  //       
  //       console.log('MetaMask auto-connected:', existingAccounts[0]);
  //     }
  //   } catch (error) {
  //     console.error('Error checking MetaMask connection:', error);
  //   }
  // }, [detectMetaMask, handleAccountsChanged]);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    const provider = detectMetaMask();
    
    if (!provider) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install the MetaMask browser extension",
        variant: "destructive"
      });
      throw new Error('MetaMask not found');
    }

    setConnecting(true);

    try {
      // Request account access
      const requestedAccounts = await provider.request({
        method: 'eth_requestAccounts'
      });
      
      if (requestedAccounts && requestedAccounts.length > 0) {
        handleAccountsChanged(requestedAccounts);
        
        // Get current chain ID
        const currentChainId = await provider.request({
          method: 'eth_chainId'
        });
        setChainId(currentChainId);
        
        toast({
          title: "MetaMask Connected",
          description: `Connected: ${requestedAccounts[0].slice(0, 6)}...${requestedAccounts[0].slice(-4)}`,
        });
        
        console.log('MetaMask connected successfully:', requestedAccounts[0]);
      } else {
        throw new Error('No accounts returned from MetaMask');
      }
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      
      // Handle specific error codes
      if (error.code === 4001) {
        // User rejected the request
        toast({
          title: "Connection Rejected",
          description: "You rejected the connection request",
          variant: "destructive"
        });
      } else if (error.code === -32602) {
        // Invalid parameters
        toast({
          title: "Invalid Request",
          description: "Invalid connection parameters",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect to MetaMask",
          variant: "destructive"
        });
      }
      
      throw error;
    } finally {
      setConnecting(false);
    }
  }, [detectMetaMask, handleAccountsChanged, toast]);

  // Disconnect from MetaMask
  const disconnect = useCallback(async () => {
    if (!ethereum) return;

    try {
      // MetaMask doesn't have a direct disconnect method
      // We can revoke permissions instead
      await ethereum.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }]
      });
      
      setConnected(false);
      setAccounts([]);
      setCurrentAccount(null);
      
      toast({
        title: "MetaMask Disconnected",
        description: "Your wallet has been disconnected",
      });
      
      console.log('MetaMask disconnected');
    } catch (error) {
      console.error('MetaMask disconnect error:', error);
      // Even if revoke fails, we can still update local state
      setConnected(false);
      setAccounts([]);
      setCurrentAccount(null);
    }
  }, [ethereum, toast]);

  // Switch to a different chain
  const switchChain = useCallback(async (targetChainId: string) => {
    if (!ethereum) {
      throw new Error('MetaMask not available');
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (error: any) {
      console.error('Error switching chain:', error);
      
      if (error.code === 4902) {
        // Chain not added to MetaMask
        toast({
          title: "Chain Not Found",
          description: "This chain is not added to MetaMask. Please add it first.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Switch Chain Failed",
          description: error.message || "Failed to switch chain",
          variant: "destructive"
        });
      }
      
      throw error;
    }
  }, [ethereum, toast]);

  // Add a new chain to MetaMask
  const addChain = useCallback(async (chainConfig: any) => {
    if (!ethereum) {
      throw new Error('MetaMask not available');
    }

    try {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [chainConfig],
      });
      
      toast({
        title: "Chain Added",
        description: "New chain has been added to MetaMask",
      });
    } catch (error: any) {
      console.error('Error adding chain:', error);
      
      toast({
        title: "Add Chain Failed",
        description: error.message || "Failed to add chain",
        variant: "destructive"
      });
      
      throw error;
    }
  }, [ethereum, toast]);

  // Set up event listeners
  useEffect(() => {
    if (!ethereum) return;

    // Add event listeners
    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);
    ethereum.on('connect', handleConnect);
    ethereum.on('disconnect', handleDisconnect);

    return () => {
      // Clean up event listeners
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
      ethereum.removeListener('connect', handleConnect);
      ethereum.removeListener('disconnect', handleDisconnect);
    };
  }, [ethereum, handleAccountsChanged, handleChainChanged, handleConnect, handleDisconnect]);

  // Initialize on mount - only detect MetaMask, don't auto-connect
  useEffect(() => {
    let initTimeout: NodeJS.Timeout;
    
    // Wait for page to load before detecting MetaMask
    const initializeMetaMask = () => {
      // Debounce initialization to prevent multiple calls
      clearTimeout(initTimeout);
      initTimeout = setTimeout(() => {
        detectMetaMask();
        // Removed checkConnection() to prevent any auto-connection behavior
      }, 100);
    };

    if (document.readyState === 'loading') {
      window.addEventListener('load', initializeMetaMask);
    } else {
      initializeMetaMask();
    }

    return () => {
      clearTimeout(initTimeout);
      window.removeEventListener('load', initializeMetaMask);
    };
  }, [detectMetaMask]);

  const value: MetaMaskContextType = {
    ethereum,
    connected,
    connecting,
    accounts,
    currentAccount,
    chainId,
    connect,
    disconnect,
    switchChain,
    addChain,
  };

  return (
    <MetaMaskContext.Provider value={value}>
      {children}
    </MetaMaskContext.Provider>
  );
};

export default MetaMaskProvider;