import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  TrendingUp, 
  Zap, 
  Shield, 
  Wallet, 
  CheckCircle, 
  DollarSign,
  Users,
  Clock
} from 'lucide-react';
import { 
  LoyaltyNFTService, 
  NFTType, 
  UserLoyaltyCard, 
  NFTRarity 
} from '@/lib/loyaltyNFTService';
import { useUser } from '@/hooks/useUser';

export default function UserNFTManager() {
  const { user } = useUser();
  const [nftTypes, setNftTypes] = useState<NFTType[]>([]);
  const [userNFTs, setUserNFTs] = useState<UserLoyaltyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isEvolveDialogOpen, setIsEvolveDialogOpen] = useState(false);
  const [isAutoStakingDialogOpen, setIsAutoStakingDialogOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTType | null>(null);
  const [selectedUserNFT, setSelectedUserNFT] = useState<UserLoyaltyCard | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [nftTypesData, userNFTsData] = await Promise.all([
        LoyaltyNFTService.getAllNFTTypes(),
        LoyaltyNFTService.getUserNFTs(user.id)
      ]);

      setNftTypes(nftTypesData);
      setUserNFTs(userNFTsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load NFT data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseNFT = async () => {
    if (!user || !selectedNFT) return;

    try {
      await LoyaltyNFTService.purchaseNFT(user.id, selectedNFT.id);
      
      toast({
        title: "Success",
        description: `${selectedNFT.display_name} NFT purchased successfully!`,
      });

      setIsPurchaseDialogOpen(false);
      setSelectedNFT(null);
      loadData();
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to purchase NFT",
        variant: "destructive",
      });
    }
  };

  const handleUpgradeNFT = async () => {
    if (!user || !selectedUserNFT) return;

    try {
      await LoyaltyNFTService.upgradeNFT(user.id, selectedUserNFT.nft_type_id!);
      
      toast({
        title: "Success",
        description: `${selectedUserNFT.nft_types?.display_name} NFT upgraded successfully!`,
      });

      setIsUpgradeDialogOpen(false);
      setSelectedUserNFT(null);
      loadData();
    } catch (error) {
      console.error('Error upgrading NFT:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upgrade NFT",
        variant: "destructive",
      });
    }
  };

  const handleEvolveNFT = async () => {
    if (!user || !selectedUserNFT) return;

    try {
      await LoyaltyNFTService.evolveNFT(
        user.id, 
        selectedUserNFT.nft_type_id!, 
        investmentAmount
      );
      
      toast({
        title: "Success",
        description: `${selectedUserNFT.nft_types?.display_name} NFT evolved successfully!`,
      });

      setIsEvolveDialogOpen(false);
      setSelectedUserNFT(null);
      setInvestmentAmount(0);
      loadData();
    } catch (error) {
      console.error('Error evolving NFT:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to evolve NFT",
        variant: "destructive",
      });
    }
  };

  const handleEnableAutoStaking = async () => {
    if (!user || !selectedUserNFT) return;

    try {
      await LoyaltyNFTService.enableAutoStaking(
        user.id, 
        selectedUserNFT.nft_type_id!, 
        selectedAsset
      );
      
      toast({
        title: "Success",
        description: `Auto-staking enabled for ${selectedUserNFT.nft_types?.display_name} NFT!`,
      });

      setIsAutoStakingDialogOpen(false);
      setSelectedUserNFT(null);
      setSelectedAsset('');
      loadData();
    } catch (error) {
      console.error('Error enabling auto-staking:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enable auto-staking",
        variant: "destructive",
      });
    }
  };

  const openUpgradeDialog = (userNFT: UserLoyaltyCard) => {
    setSelectedUserNFT(userNFT);
    setIsUpgradeDialogOpen(true);
  };

  const openEvolveDialog = (userNFT: UserLoyaltyCard) => {
    setSelectedUserNFT(userNFT);
    setIsEvolveDialogOpen(true);
  };

  const openAutoStakingDialog = (userNFT: UserLoyaltyCard) => {
    setSelectedUserNFT(userNFT);
    setIsAutoStakingDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading NFT data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Loyalty NFTs</h2>
          <p className="text-muted-foreground">Manage your loyalty NFT collection</p>
        </div>
        <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Purchase NFT
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Loyalty NFT</DialogTitle>
              <DialogDescription>
                Choose an NFT type to purchase and add to your collection.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4">
              {nftTypes.map((nft) => {
                const rarityInfo = LoyaltyNFTService.getRarityDisplayInfo(nft.rarity);
                const priceInfo = LoyaltyNFTService.getNFTPriceInfo(nft);
                return (
                  <Card 
                    key={nft.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedNFT?.id === nft.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedNFT(nft)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{nft.display_name}</h3>
                            <Badge variant={nft.is_custodial ? "default" : "secondary"}>
                              {nft.is_custodial ? (
                                <>
                                  <Shield className="h-3 w-3 mr-1" />
                                  Custodial
                                </>
                              ) : (
                                <>
                                  <Wallet className="h-3 w-3 mr-1" />
                                  Non-Custodial
                                </>
                              )}
                            </Badge>
                            <Badge className={`${rarityInfo.color} ${rarityInfo.bgColor}`}>
                              {rarityInfo.name}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {priceInfo.displayPrice}
                            </span>
                            <span className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {(nft.earn_on_spend_ratio * 100).toFixed(2)}% earn rate
                            </span>
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {nft.mint_quantity.toLocaleString()} max
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            {nft.is_upgradeable && (
                              <Badge variant="outline" className="text-xs">Upgradeable</Badge>
                            )}
                            {nft.is_evolvable && (
                              <Badge variant="outline" className="text-xs">Evolvable</Badge>
                            )}
                            {nft.is_fractional_eligible && (
                              <Badge variant="outline" className="text-xs">Fractional</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{priceInfo.displayPrice}</div>
                          {nft.upgrade_bonus_ratio > 0 && (
                            <div className="text-sm text-green-600">
                              +{(nft.upgrade_bonus_ratio * 100).toFixed(2)}% upgrade bonus
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsPurchaseDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePurchaseNFT}
                disabled={!selectedNFT}
              >
                Purchase {selectedNFT?.display_name}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my-nfts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-nfts">My NFTs</TabsTrigger>
          <TabsTrigger value="available">Available NFTs</TabsTrigger>
        </TabsList>

        <TabsContent value="my-nfts" className="space-y-4">
          {userNFTs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No NFTs Yet</h3>
                  <p>You haven't purchased any loyalty NFTs yet.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsPurchaseDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Purchase Your First NFT
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userNFTs.map((userNFT) => {
                const rarityInfo = LoyaltyNFTService.getRarityDisplayInfo(userNFT.nft_types?.rarity || NFTRarity.Common);
                const effectiveRatio = LoyaltyNFTService.calculateEffectiveEarningRatio(userNFT);
                const canUpgrade = LoyaltyNFTService.canUpgrade(userNFT);
                const canEvolve = LoyaltyNFTService.canEvolve(userNFT);
                const canAutoStake = LoyaltyNFTService.canEnableAutoStaking(userNFT);
                const evolutionReq = LoyaltyNFTService.getEvolutionRequirements(userNFT);

                return (
                  <Card key={userNFT.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{userNFT.nft_types?.display_name}</CardTitle>
                        <Badge variant={userNFT.is_custodial ? "default" : "secondary"}>
                          {userNFT.is_custodial ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Custodial
                            </>
                          ) : (
                            <>
                              <Wallet className="h-3 w-3 mr-1" />
                              Non-Custodial
                            </>
                          )}
                        </Badge>
                      </div>
                      <CardDescription>
                        <Badge className={`${rarityInfo.color} ${rarityInfo.bgColor}`}>
                          {rarityInfo.name}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Earning Rate:</span>
                          <span className="font-semibold text-green-600">
                            {(effectiveRatio * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Investment:</span>
                          <span className="font-semibold">
                            ${userNFT.current_investment.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <div className="flex space-x-1">
                            {userNFT.is_upgraded && (
                              <Badge variant="outline" className="text-xs">Upgraded</Badge>
                            )}
                            {userNFT.is_evolved && (
                              <Badge variant="outline" className="text-xs">Evolved</Badge>
                            )}
                            {userNFT.auto_staking_enabled && (
                              <Badge variant="outline" className="text-xs">Auto-Staking</Badge>
                            )}
                            {!userNFT.is_custodial && !userNFT.is_verified && (
                              <Badge variant="destructive" className="text-xs">Unverified</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {canUpgrade && (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => openUpgradeDialog(userNFT)}
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Upgrade NFT
                          </Button>
                        )}
                        {canEvolve && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="w-full"
                            onClick={() => openEvolveDialog(userNFT)}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Evolve NFT
                          </Button>
                        )}
                        {canAutoStake && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="w-full"
                            onClick={() => openAutoStakingDialog(userNFT)}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Enable Auto-Staking
                          </Button>
                        )}
                      </div>

                      {!canEvolve && evolutionReq.requirements.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <div className="font-semibold mb-1">Evolution Requirements:</div>
                          {evolutionReq.requirements.map((req, index) => (
                            <div key={index}>{req}</div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nftTypes.map((nft) => {
              const rarityInfo = LoyaltyNFTService.getRarityDisplayInfo(nft.rarity);
              const priceInfo = LoyaltyNFTService.getNFTPriceInfo(nft);
              const userOwns = userNFTs.some(userNFT => userNFT.nft_type_id === nft.id);

              return (
                <Card key={nft.id} className={userOwns ? 'opacity-50' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{nft.display_name}</CardTitle>
                      <Badge variant={nft.is_custodial ? "default" : "secondary"}>
                        {nft.is_custodial ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Custodial
                          </>
                        ) : (
                          <>
                            <Wallet className="h-3 w-3 mr-1" />
                            Non-Custodial
                          </>
                        )}
                      </Badge>
                    </div>
                    <CardDescription>
                      <Badge className={`${rarityInfo.color} ${rarityInfo.bgColor}`}>
                        {rarityInfo.name}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-semibold text-lg">{priceInfo.displayPrice}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Earning Rate:</span>
                        <span className="font-semibold text-green-600">
                          {(nft.earn_on_spend_ratio * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Max Supply:</span>
                        <span className="font-semibold">{nft.mint_quantity.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      {nft.is_upgradeable && (
                        <Badge variant="outline" className="text-xs">Upgradeable</Badge>
                      )}
                      {nft.is_evolvable && (
                        <Badge variant="outline" className="text-xs">Evolvable</Badge>
                      )}
                      {nft.is_fractional_eligible && (
                        <Badge variant="outline" className="text-xs">Fractional</Badge>
                      )}
                    </div>

                    {userOwns ? (
                      <Button disabled className="w-full">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Already Owned
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => {
                          setSelectedNFT(nft);
                          setIsPurchaseDialogOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Purchase
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade NFT</DialogTitle>
            <DialogDescription>
              Upgrade your {selectedUserNFT?.nft_types?.display_name} NFT to earn higher rewards.
            </DialogDescription>
          </DialogHeader>
          {selectedUserNFT && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Current Earning Rate:</span>
                    <span className="font-semibold">
                      {((selectedUserNFT.nft_types?.earn_on_spend_ratio || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upgrade Bonus:</span>
                    <span className="font-semibold text-green-600">
                      +{((selectedUserNFT.nft_types?.upgrade_bonus_ratio || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>New Earning Rate:</span>
                    <span className="text-green-600">
                      {(((selectedUserNFT.nft_types?.earn_on_spend_ratio || 0) + (selectedUserNFT.nft_types?.upgrade_bonus_ratio || 0)) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>⚠️ This action is irreversible. Once upgraded, you cannot revert the changes.</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgradeNFT}>
              Upgrade NFT
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Evolve Dialog */}
      <Dialog open={isEvolveDialogOpen} onOpenChange={setIsEvolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evolve NFT</DialogTitle>
            <DialogDescription>
              Evolve your {selectedUserNFT?.nft_types?.display_name} NFT by investing additional funds.
            </DialogDescription>
          </DialogHeader>
          {selectedUserNFT && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Current Investment:</span>
                    <span className="font-semibold">
                      ${selectedUserNFT.current_investment.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minimum Required:</span>
                    <span className="font-semibold">
                      ${(selectedUserNFT.nft_types?.evolution_min_investment || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evolution Bonus:</span>
                    <span className="font-semibold text-green-600">
                      +{((selectedUserNFT.nft_types?.evolution_earnings_ratio || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="investment_amount">Additional Investment Amount (USDT)</Label>
                <Input
                  id="investment_amount"
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount"
                  min={0}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>⚠️ This action is irreversible. Once evolved, you cannot revert the changes.</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEvolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEvolveNFT}
              disabled={investmentAmount <= 0}
            >
              Evolve NFT
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto-Staking Dialog */}
      <Dialog open={isAutoStakingDialogOpen} onOpenChange={setIsAutoStakingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Auto-Staking</DialogTitle>
            <DialogDescription>
              Enable auto-staking for your {selectedUserNFT?.nft_types?.display_name} NFT.
            </DialogDescription>
          </DialogHeader>
          {selectedUserNFT && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Auto-Staking Duration:</span>
                    <span className="font-semibold">
                      {selectedUserNFT.nft_types?.auto_staking_duration}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Investment:</span>
                    <span className="font-semibold">
                      ${selectedUserNFT.current_investment.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="selected_asset">Select Asset/Initiative</Label>
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an asset or initiative" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rac-token">RAC Token</SelectItem>
                    <SelectItem value="real-estate-fund">Real Estate Fund</SelectItem>
                    <SelectItem value="crypto-index">Crypto Index Fund</SelectItem>
                    <SelectItem value="defi-yield">DeFi Yield Farming</SelectItem>
                    <SelectItem value="nft-collection">NFT Collection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>⚠️ Auto-staking is irreversible. Once enabled, you cannot disable it.</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAutoStakingDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEnableAutoStaking}
              disabled={!selectedAsset}
            >
              Enable Auto-Staking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


