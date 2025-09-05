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

  // Wallet icon components
  const getWalletIcon = (iconType: string, size = 32) => {
    const uniqueId = Math.random().toString(36).substr(2, 9);
    
    switch (iconType) {
      case "phantom":
        return (
          <svg width={size} height={size} viewBox="0 0 108 108" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="54" cy="54" r="54" fill="url(#phantom-gradient-${uniqueId})"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M54 94.5C76.5914 94.5 94.5 76.5914 94.5 54C94.5 31.4086 76.5914 13.5 54 13.5C31.4086 13.5 13.5 31.4086 13.5 54C13.5 76.5914 31.4086 94.5 54 94.5ZM54 108C84.3757 108 108 84.3757 108 54C108 23.6243 84.3757 0 54 0C23.6243 0 0 23.6243 0 54C0 84.3757 23.6243 108 54 108Z" fill="url(#phantom-gradient-${uniqueId})"/>
            <path d="M30 54C30 40.7452 40.7452 30 54 30C67.2548 30 78 40.7452 78 54C78 67.2548 67.2548 78 54 78C40.7452 78 30 67.2548 30 54Z" fill="white"/>
            <defs>
              <linearGradient id={`phantom-gradient-${uniqueId}`} x1="0" y1="0" x2="108" y2="108" gradientUnits="userSpaceOnUse">
                <stop stopColor="#AB9FF2"/>
                <stop offset="1" stopColor="#4E44CE"/>
              </linearGradient>
            </defs>
          </svg>
        );
      case "metamask":
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#metamask-clip-${uniqueId})">
              <path d="M37.0703 3.31738L22.168 14.3887L24.8945 7.31738L37.0703 3.31738Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.92969 3.31738L17.6914 14.4824L15.1055 7.31738L2.92969 3.31738Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M31.5781 26.1113L27.6992 32.1113L36.3516 34.7051L38.9922 26.2988L31.5781 26.1113Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1.01563 26.2988L3.64844 34.7051L12.3008 32.1113L8.42188 26.1113L1.01563 26.2988Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.8555 17.5488L9.53125 21.2051L18.1367 21.6426L17.8242 12.2051L11.8555 17.5488Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M28.1445 17.5488L22.0820 12.1113L21.8633 21.6426L30.4688 21.2051L28.1445 17.5488Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12.3008 32.1113L17.2070 29.7051L13.0508 26.3613L12.3008 32.1113Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22.793 29.7051L27.6992 32.1113L26.9492 26.3613L22.793 29.7051Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M27.6992 32.1113L22.793 29.7051L23.1992 33.0488L23.1523 34.6113L27.6992 32.1113Z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12.3008 32.1113L16.8477 34.6113L16.8008 33.0488L17.2070 29.7051L12.3008 32.1113Z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.9414 24.1738L12.9570 23.0488L15.8008 21.7363L16.9414 24.1738Z" fill="#233447" stroke="#233447" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23.0586 24.1738L24.1992 21.7363L27.043 23.0488L23.0586 24.1738Z" fill="#233447" stroke="#233447" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12.3008 32.1113L13.0977 26.1113L8.42188 26.2988L12.3008 32.1113Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M26.9023 26.1113L27.6992 32.1113L31.5781 26.2988L26.9023 26.1113Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M30.4688 21.2051L21.8633 21.6426L23.0586 24.1738L24.1992 21.7363L27.043 23.0488L30.4688 21.2051Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12.9570 23.0488L15.8008 21.7363L16.9414 24.1738L18.1367 21.6426L9.53125 21.2051L12.9570 23.0488Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.53125 21.2051L13.0508 26.3613L12.9570 23.0488L9.53125 21.2051Z" fill="#E27525" stroke="#E27525" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M27.043 23.0488L26.9492 26.3613L30.4688 21.2051L27.043 23.0488Z" fill="#E27525" stroke="#E27525" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.1367 21.6426L16.9414 24.1738L18.4180 29.0176L18.7305 22.7676L18.1367 21.6426Z" fill="#E27525" stroke="#E27525" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21.8633 21.6426L21.2695 22.7676L21.582 29.0176L23.0586 24.1738L21.8633 21.6426Z" fill="#E27525" stroke="#E27525" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23.0586 24.1738L21.582 29.0176L22.793 29.7051L26.9492 26.3613L27.043 23.0488L23.0586 24.1738Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12.9570 23.0488L13.0508 26.3613L17.2070 29.7051L18.4180 29.0176L16.9414 24.1738L12.9570 23.0488Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23.1523 34.6113L23.1992 33.0488L22.8398 32.7363H17.1602L16.8008 33.0488L16.8477 34.6113L12.3008 32.1113L14.0508 33.5488L17.1133 35.7988H22.8867L25.9492 33.5488L27.6992 32.1113L23.1523 34.6113Z" fill="#C0AC9D" stroke="#C0AC9D" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22.793 29.7051L21.582 29.0176H18.4180L17.2070 29.7051L16.8008 33.0488L17.1602 32.7363H22.8398L23.1992 33.0488L22.793 29.7051Z" fill="#161616" stroke="#161616" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M37.6445 14.8613L39 8.42383L37.0703 3.31738L22.793 13.7988L28.1445 17.5488L35.8320 19.7363L37.7617 17.4551L36.9648 16.8926L38.2305 15.7676L37.2305 15.0176L38.4961 14.0801L37.6445 14.8613Z" fill="#763E1A" stroke="#763E1A" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 8.42383L2.35547 14.8613L1.50391 14.0801L2.76953 15.0176L1.76953 15.7676L3.03516 16.8926L2.23828 17.4551L4.16797 19.7363L11.8555 17.5488L17.207 13.7988L2.92969 3.31738L1 8.42383Z" fill="#763E1A" stroke="#763E1A" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <defs>
              <clipPath id={`metamask-clip-${uniqueId}`}>
                <rect width="40" height="40" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        );
      case "solflare":
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="20" fill="url(#solflare-gradient-${uniqueId})"/>
            <path d="M8.5 15.5L20 4L31.5 15.5H8.5Z" fill="url(#solflare-inner-${uniqueId})"/>
            <path d="M8.5 24.5L20 36L31.5 24.5H8.5Z" fill="url(#solflare-inner2-${uniqueId})"/>
            <path d="M8.5 20L20 8.5L31.5 20H8.5Z" fill="url(#solflare-inner3-${uniqueId})"/>
            <defs>
              <linearGradient id={`solflare-gradient-${uniqueId}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFC947"/>
                <stop offset="1" stopColor="#FC4C02"/>
              </linearGradient>
              <linearGradient id={`solflare-inner-${uniqueId}`} x1="8.5" y1="9.75" x2="31.5" y2="9.75" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDB4D"/>
                <stop offset="1" stopColor="#FF8A00"/>
              </linearGradient>
              <linearGradient id={`solflare-inner2-${uniqueId}`} x1="8.5" y1="30.25" x2="31.5" y2="30.25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDB4D"/>
                <stop offset="1" stopColor="#FF8A00"/>
              </linearGradient>
              <linearGradient id={`solflare-inner3-${uniqueId}`} x1="8.5" y1="14.25" x2="31.5" y2="14.25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDB4D"/>
                <stop offset="1" stopColor="#FF8A00"/>
              </linearGradient>
            </defs>
          </svg>
        );
      default:
        return <Wallet className="h-8 w-8" />;
    }
  };

  const walletOptions: WalletOption[] = [
    {
      name: "Phantom",
      icon: "phantom",
      type: "solana",
      adapter: "Phantom",
      detectFunction: () => !!(phantom?.isPhantom)
    },
    {
      name: "Solflare", 
      icon: "solflare",
      type: "solana",
      adapter: "Solflare",
      detectFunction: () => !!(window.solflare)
    },
    {
      name: "MetaMask",
      icon: "metamask",
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
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm border-border/50 card-shadow">
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
                  className="w-full h-14 flex items-center justify-between border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 backdrop-blur-sm transition-smooth"
                  onClick={() => isAvailable ? handleWalletClick(wallet) : window.open(getInstallUrl(wallet.name), '_blank')}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getWalletIcon(wallet.icon, 32)}
                    </div>
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