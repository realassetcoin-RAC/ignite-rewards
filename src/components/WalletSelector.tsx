import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePhantom } from "@/components/PhantomWalletProvider";
import { useMetaMask } from "@/components/MetaMaskProvider";

declare global {
  interface Window {
    ethereum?: any;
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        isConnected: boolean;
        publicKey: { toString: () => string } | null;
      };
    };
    solflare?: any;
  }
}

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnected?: () => void;
}

interface WalletOption {
  name: string;
  icon: string;
  type: 'solana' | 'ethereum';
  adapter?: string;
  detectFunction?: () => boolean;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ 
  isOpen, 
  onClose, 
  onWalletConnected 
}) => {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletOption[]>([]);
  const { toast } = useToast();
  const { connect, connected, disconnect, publicKey, wallets, select } = useWallet();
  const { phantom, connect: phantomConnect, connected: phantomConnected, publicKey: phantomPublicKey } = usePhantom();
  const { ethereum, connect: metaMaskConnect, connected: metaMaskConnected, currentAccount: metaMaskAccount } = useMetaMask();
  const navigate = useNavigate();

  const walletOptions: WalletOption[] = [
    {
      name: "Phantom",
      icon: "🟣",
      type: "solana",
      adapter: "Phantom",
      detectFunction: () => !!(phantom?.isPhantom)
    },
    {
      name: "Solflare", 
      icon: "🟡",
      type: "solana",
      adapter: "Solflare",
      detectFunction: () => !!(window.solflare)
    },
    {
      name: "MetaMask",
      icon: "🦊",
      type: "ethereum", 
      detectFunction: () => !!(ethereum?.isMetaMask)
    }
  ];

  useEffect(() => {
    // Check which wallets are available
    const available = walletOptions.filter(wallet => {
      if (wallet.detectFunction) {
        return wallet.detectFunction();
      }
      return true; // Show all wallets by default
    });
    setAvailableWallets(available);
  }, [phantom, ethereum]);

  const handlePhantomConnect = async () => {
    setConnecting("Phantom");
    
    try {
      if (!phantom) {
        throw new Error("Phantom wallet not found! Please install Phantom wallet extension.");
      }

      await phantomConnect();
      
      if (phantomPublicKey) {
        // Check if this wallet is associated with a user
        const { data: walletData } = await supabase
          .from('user_wallets')
          .select('user_id')
          .eq('wallet_address', phantomPublicKey)
          .single();
        
        let redirectPath = '/user';
        
        if (walletData?.user_id) {
          // Get user role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', walletData.user_id)
            .single();
          
          if (profile?.role === 'admin') {
            redirectPath = '/admin';
          } else if (profile?.role === 'merchant') {
            redirectPath = '/merchant';
          }
        }
        
        onWalletConnected?.();
        onClose();
        navigate(redirectPath);
      }
      
    } catch (error) {
      console.error('Phantom connection error:', error);
      setConnecting(null);
    }
  };

  const handleSolanaWalletConnect = async (walletName: string) => {
    if (walletName === "Phantom") {
      await handlePhantomConnect();
      return;
    }
    
    setConnecting(walletName);
    
    try {
      // Find the wallet adapter
      const walletAdapter = wallets.find(w => w.adapter.name === walletName);
      
      if (!walletAdapter) {
        throw new Error(`${walletName} wallet adapter not found`);
      }

      // Select the wallet
      select(walletAdapter.adapter.name);
      
      // Wait a moment for wallet selection
      setTimeout(async () => {
        try {
          await connect();
          
          // Wait for connection to establish
          setTimeout(async () => {
            if (publicKey) {
              const walletAddress = publicKey.toBase58();
              
              // Check if this wallet is associated with a user
              const { data: walletData } = await supabase
                .from('user_wallets')
                .select('user_id')
                .eq('wallet_address', walletAddress)
                .single();
              
              let redirectPath = '/user';
              
              if (walletData?.user_id) {
                // Get user role
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('role')
                  .eq('id', walletData.user_id)
                  .single();
                
                if (profile?.role === 'admin') {
                  redirectPath = '/admin';
                } else if (profile?.role === 'merchant') {
                  redirectPath = '/merchant';
                }
              }
              
              toast({ 
                title: "Wallet Connected", 
                description: `${walletName} connected: ${walletAddress.slice(0,6)}...` 
              });
              
              onWalletConnected?.();
              onClose();
              navigate(redirectPath);
            } else {
              throw new Error("Failed to get wallet address");
            }
          }, 1500);
        } catch (error) {
          console.error('Connection error:', error);
          throw error;
        }
      }, 500);
      
    } catch (error) {
      console.error(`${walletName} connection error:`, error);
      toast({ 
        title: "Connection Failed", 
        description: error instanceof Error ? error.message : `Failed to connect ${walletName}`, 
        variant: "destructive" 
      });
      setConnecting(null);
    }
  };

  const handleMetaMaskConnect = async () => {
    setConnecting("MetaMask");
    
    try {
      if (!ethereum) {
        throw new Error("MetaMask not found! Please install MetaMask browser extension.");
      }

      await metaMaskConnect();
      
      if (metaMaskAccount) {
        // Check if this wallet is associated with a user
        const { data: walletData } = await supabase
          .from('user_wallets')
          .select('user_id')
          .eq('wallet_address', metaMaskAccount.toLowerCase())
          .single();
        
        let redirectPath = '/user';
        
        if (walletData?.user_id) {
          // Get user role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', walletData.user_id)
            .single();
          
          if (profile?.role === 'admin') {
            redirectPath = '/admin';
          } else if (profile?.role === 'merchant') {
            redirectPath = '/merchant';
          }
        }
        
        onWalletConnected?.();
        onClose();
        navigate(redirectPath);
      }
      
    } catch (error) {
      console.error('MetaMask connection error:', error);
      setConnecting(null);
    }
  };

  const handleWalletClick = async (wallet: WalletOption) => {
    if (wallet.type === 'solana' && wallet.adapter) {
      await handleSolanaWalletConnect(wallet.adapter);
    } else if (wallet.type === 'ethereum' && wallet.name === 'MetaMask') {
      await handleMetaMaskConnect();
    }
  };

  const getInstallUrl = (walletName: string) => {
    const urls: Record<string, string> = {
      'Phantom': 'https://phantom.app/',
      'Solflare': 'https://solflare.com/',
      'MetaMask': 'https://metamask.io/'
    };
    return urls[walletName] || '#';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose your preferred wallet to sign in
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {walletOptions.map((wallet) => {
            const isAvailable = availableWallets.some(w => w.name === wallet.name);
            const isConnecting = connecting === wallet.name || connecting === wallet.adapter;
            
            return (
              <div key={wallet.name} className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full h-14 flex items-center justify-between border-border hover:bg-accent"
                  onClick={() => isAvailable ? handleWalletClick(wallet) : window.open(getInstallUrl(wallet.name), '_blank')}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="text-left">
                      <div className="font-medium">{wallet.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {wallet.type === 'solana' ? 'Solana Network' : 'Ethereum Network'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {!isAvailable && (
                      <span className="text-xs text-muted-foreground">Install</span>
                    )}
                    {isAvailable && !isConnecting && (
                      <span className="text-xs text-green-600">Available</span>
                    )}
                  </div>
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Don't have a wallet? Click on any wallet above to install it.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelector;