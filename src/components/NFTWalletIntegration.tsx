import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  Plus, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  CreditCard,
  Coins,
  Shield,
  Eye,
  RefreshCw
} from 'lucide-react';
import { nftWalletService, WalletConnection } from '@/lib/nftWalletService';
import { useSecureAuth } from '@/hooks/useSecureAuth';

interface NFTWalletIntegrationProps {
  userId?: string;
}

export default function NFTWalletIntegration({ userId }: NFTWalletIntegrationProps) {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [custodialNFTs, setCustodialNFTs] = useState<any[]>([]);
  const [nonCustodialNFTs, setNonCustodialNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  
  // Form states
  const [verificationData, setVerificationData] = useState({
    tokenId: '',
    contractAddress: '',
    walletAddress: ''
  });
  
  const [purchaseData, setPurchaseData] = useState({
    nftTypeId: '',
    paymentMethod: 'credit_card' as 'credit_card' | 'crypto' | 'usdt',
    amount: 0
  });

  const currentUserId = userId || user?.id;

  useEffect(() => {
    if (currentUserId) {
      loadUserNFTs();
    }
  }, [currentUserId]);

  const loadUserNFTs = async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      const [allNFTs, custodial, nonCustodial] = await Promise.all([
        nftWalletService.getUserNFTs(currentUserId),
        nftWalletService.getUserCustodialNFTs(currentUserId),
        nftWalletService.getUserNonCustodialNFTs(currentUserId)
      ]);
      
      setUserNFTs(allNFTs);
      setCustodialNFTs(custodial);
      setNonCustodialNFTs(nonCustodial);
    } catch {
      console.error('Error loading user NFTs');
      toast({
        title: "Error",
        description: "Failed to load NFT data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async (walletType: 'phantom' | 'metamask' | 'solflare') => {
    try {
      setLoading(true);
      const connection = await nftWalletService.connectWallet(walletType);
      setWalletConnection(connection);
      setIsConnectDialogOpen(false);
      
      toast({
        title: "Success",
        description: `Connected to ${walletType} wallet`,
      });
    } catch {
      console.error('Error connecting wallet');
      toast({
        title: "Error",
        description: `Failed to connect to ${walletType} wallet`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    nftWalletService.disconnectWallet();
    setWalletConnection(null);
    toast({
      title: "Success",
      description: "Wallet disconnected",
    });
  };

  const verifyNonCustodialNFT = async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      await nftWalletService.verifyNonCustodialNFT(
        currentUserId,
        verificationData.tokenId,
        verificationData.contractAddress,
        verificationData.walletAddress
      );
      
      setIsVerifyDialogOpen(false);
      setVerificationData({ tokenId: '', contractAddress: '', walletAddress: '' });
      await loadUserNFTs();
      
      toast({
        title: "Success",
        description: "NFT verified successfully",
      });
    } catch {
      console.error('Error verifying NFT');
      toast({
        title: "Error",
        description: "Failed to verify NFT",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const purchaseCustodialNFT = async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      await nftWalletService.purchaseCustodialNFT({
        nftTypeId: purchaseData.nftTypeId,
        userId: currentUserId,
        paymentMethod: purchaseData.paymentMethod,
        amount: purchaseData.amount
      });
      
      setIsPurchaseDialogOpen(false);
      setPurchaseData({ nftTypeId: '', paymentMethod: 'credit_card', amount: 0 });
      await loadUserNFTs();
      
      toast({
        title: "Success",
        description: "Custodial NFT purchased successfully",
      });
    } catch {
      console.error('Error purchasing NFT');
      toast({
        title: "Error",
        description: "Failed to purchase NFT",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'bg-gray-500';
      case 'less common': return 'bg-green-500';
      case 'rare': return 'bg-blue-500';
      case 'very rare': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // const _getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return <CreditCard className="w-4 h-4" />;
      case 'crypto': return <Coins className="w-4 h-4" />;
      case 'usdt': return <Coins className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  if (!currentUserId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Please log in to view your NFTs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Connection
          </CardTitle>
          <CardDescription>
            Connect your Web3 wallet to manage non-custodial NFTs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {walletConnection ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">Connected to {walletConnection.walletType}</p>
                  <p className="text-sm text-muted-foreground">
                    {walletConnection.address.slice(0, 6)}...{walletConnection.address.slice(-4)}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={disconnectWallet}>
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <p className="text-muted-foreground">No wallet connected</p>
              </div>
              <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect Web3 Wallet</DialogTitle>
                    <DialogDescription>
                      Choose your preferred wallet to connect
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => connectWallet('phantom')}
                      disabled={loading}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Connect Phantom
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => connectWallet('metamask')}
                      disabled={loading}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Connect MetaMask
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => connectWallet('solflare')}
                      disabled={loading}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Connect Solflare
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NFT Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>NFT Management</CardTitle>
          <CardDescription>
            Purchase custodial NFTs or verify non-custodial NFTs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Purchase Custodial NFT
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Purchase Custodial NFT</DialogTitle>
                  <DialogDescription>
                    Buy a custodial NFT directly from the application
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>NFT Type</Label>
                    <Select value={purchaseData.nftTypeId} onValueChange={(value) => setPurchaseData({...purchaseData, nftTypeId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select NFT type" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* This would be populated with available NFT types */}
                        <SelectItem value="1">Pearl White - $0</SelectItem>
                        <SelectItem value="2">Lava Orange - $100</SelectItem>
                        <SelectItem value="3">Silver - $200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={purchaseData.paymentMethod} onValueChange={(value: any) => setPurchaseData({...purchaseData, paymentMethod: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                        <SelectItem value="usdt">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (USDT)</Label>
                    <Input
                      type="number"
                      value={purchaseData.amount}
                      onChange={(e) => setPurchaseData({...purchaseData, amount: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  <Button onClick={purchaseCustodialNFT} disabled={loading} className="w-full">
                    {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Purchase NFT
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Verify Non-Custodial NFT
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Verify Non-Custodial NFT</DialogTitle>
                  <DialogDescription>
                    Verify an NFT you purchased from a crypto marketplace
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Token ID</Label>
                    <Input
                      value={verificationData.tokenId}
                      onChange={(e) => setVerificationData({...verificationData, tokenId: e.target.value})}
                      placeholder="Enter NFT token ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contract Address</Label>
                    <Input
                      value={verificationData.contractAddress}
                      onChange={(e) => setVerificationData({...verificationData, contractAddress: e.target.value})}
                      placeholder="Enter contract address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Wallet Address</Label>
                    <Input
                      value={verificationData.walletAddress}
                      onChange={(e) => setVerificationData({...verificationData, walletAddress: e.target.value})}
                      placeholder="Enter wallet address"
                    />
                  </div>
                  <Button onClick={verifyNonCustodialNFT} disabled={loading} className="w-full">
                    {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Verify NFT
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* NFT Collection */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All NFTs ({userNFTs.length})</TabsTrigger>
          <TabsTrigger value="custodial">Custodial ({custodialNFTs.length})</TabsTrigger>
          <TabsTrigger value="non-custodial">Non-Custodial ({nonCustodialNFTs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {userNFTs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No NFTs found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userNFTs.map((nft) => (
                <Card key={nft.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{nft.nft_types?.display_name}</CardTitle>
                      <Badge className={getRarityColor(nft.nft_types?.rarity)}>
                        {nft.nft_types?.rarity}
                      </Badge>
                    </div>
                    <CardDescription>
                      {nft.is_custodial ? 'Custodial NFT' : 'Non-Custodial NFT'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Token ID:</span>
                        <span className="text-sm font-mono">{nft.token_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Earn Rate:</span>
                        <span className="text-sm">{(nft.nft_types?.earn_on_spend_ratio * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={nft.is_verified ? "default" : "secondary"}>
                          {nft.is_verified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                      {!nft.is_custodial && nft.contract_address && (
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="w-3 h-3 mr-2" />
                          View on Explorer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custodial" className="space-y-4">
          {custodialNFTs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No custodial NFTs found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {custodialNFTs.map((nft) => (
                <Card key={nft.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{nft.nft_types?.display_name}</CardTitle>
                      <Badge className={getRarityColor(nft.nft_types?.rarity)}>
                        {nft.nft_types?.rarity}
                      </Badge>
                    </div>
                    <CardDescription>
                      Custodial NFT - Managed by platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Investment:</span>
                        <span className="text-sm">${nft.current_investment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Earn Rate:</span>
                        <span className="text-sm">{(nft.nft_types?.earn_on_spend_ratio * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Upgradeable:</span>
                        <Badge variant={nft.nft_types?.is_upgradeable ? "default" : "secondary"}>
                          {nft.nft_types?.is_upgradeable ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="non-custodial" className="space-y-4">
          {nonCustodialNFTs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No non-custodial NFTs found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nonCustodialNFTs.map((nft) => (
                <Card key={nft.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{nft.nft_types?.display_name}</CardTitle>
                      <Badge className={getRarityColor(nft.nft_types?.rarity)}>
                        {nft.nft_types?.rarity}
                      </Badge>
                    </div>
                    <CardDescription>
                      Non-Custodial NFT - Self-managed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Wallet:</span>
                        <span className="text-sm font-mono">
                          {nft.wallet_address?.slice(0, 6)}...{nft.wallet_address?.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Earn Rate:</span>
                        <span className="text-sm">{(nft.nft_types?.earn_on_spend_ratio * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={nft.is_verified ? "default" : "secondary"}>
                          {nft.is_verified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                      {nft.contract_address && (
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="w-3 h-3 mr-2" />
                          View on Explorer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
