import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { 
  Crown, 
  TrendingUp, 
  Zap, 
  Shield, 
  Star,
  ArrowUpRight,
  Coins,
  Gift
} from 'lucide-react';
import { LoyaltyNFTService } from '@/lib/loyaltyNFTService';
import { AutoStakingService } from '@/lib/autoStakingService';
import { NFTEvolutionService } from '@/lib/nftEvolutionService';
import { FractionalInvestmentService } from '@/lib/fractionalInvestmentService';
import { tokenBuyBackService } from '@/lib/tokenBuyBackService';

interface NFTManagementPanelProps {
  className?: string;
}

const NFTManagementPanel: React.FC<NFTManagementPanelProps> = ({ className = '' }) => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  
  const [loyaltyCard, setLoyaltyCard] = useState<Record<string, unknown> | null>(null);
  const [autoStakingConfig, setAutoStakingConfig] = useState<Record<string, unknown> | null>(null);
  const [evolutionStats, setEvolutionStats] = useState<Record<string, unknown> | null>(null);
  const [fractionalStats, setFractionalStats] = useState<Record<string, unknown> | null>(null);
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const loadNFTData = useCallback(async () => {
    try {
      setLoading(true);
      
      // ✅ IMPLEMENT REQUIREMENT: Load user profile to check user type
      try {
        const { data: profile } = await databaseAdapter
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .single();
        setUserProfile(profile);
      } catch {
        setUserProfile(null);
      }
      
      // Load loyalty card
      try {
        const cards = await LoyaltyNFTService.getUserNFTs(user?.id);
        setLoyaltyCard(cards && cards.length > 0 ? cards[0] : null);
      } catch {
        // Console statement removed
        setLoyaltyCard(null);
      }
      
      // Load auto-staking config
      try {
        const stakingConfig = await AutoStakingService.getAutoStakingConfig(user?.id);
        setAutoStakingConfig(stakingConfig);
      } catch {
        // Console statement removed
        setAutoStakingConfig(null);
      }
      
      // Load evolution stats
      try {
        const evolution = await NFTEvolutionService.getEvolutionStats(user?.id);
        setEvolutionStats(evolution);
      } catch {
        // Console statement removed
        setEvolutionStats(null);
      }
      
      // Load fractional investment stats
      try {
        const fractional = await FractionalInvestmentService.getFractionalInvestmentStats(user?.id);
        setFractionalStats(fractional);
      } catch {
        // Console statement removed
        setFractionalStats(null);
      }
      
    } catch {
      // Console statement removed
      toast({
        title: "Error",
        description: "Failed to load NFT data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // ✅ IMPLEMENT REQUIREMENT: Handle NFT upgrade with payment gateway
  const handleNFTUpgrade = useCallback(async () => {
    if (!user?.id || !loyaltyCard) return;

    try {
      setUpgrading(true);
      
      // Define upgrade prices based on current NFT type
      const upgradePrices: Record<string, number> = {
        'pearl_white': 50,    // Pearl White → Silver
        'silver': 100,        // Silver → Gold
        'gold': 200,          // Gold → Platinum
        'platinum': 500       // Platinum → Diamond
      };

      const currentType = loyaltyCard.card_type as string;
      const upgradePrice = upgradePrices[currentType] || 50;

      // Store upgrade data for payment gateway
      const upgradeData = {
        userId: user.id,
        currentNftType: currentType,
        upgradePrice: upgradePrice,
        nextTier: {
          'pearl_white': 'silver',
          'silver': 'gold',
          'gold': 'platinum',
          'platinum': 'diamond'
        }[currentType]
      };

      sessionStorage.setItem('nftUpgradeData', JSON.stringify(upgradeData));

      toast({
        title: "Redirecting to Payment Gateway",
        description: `Please complete your payment of $${upgradePrice} to upgrade your NFT.`,
      });

      // Redirect to payment gateway for NFT upgrade
      setTimeout(() => {
        window.location.href = `/payment?type=nft_upgrade&price=${upgradePrice}&nft_type=${currentType}`;
      }, 1500);

    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "Failed to initiate NFT upgrade. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpgrading(false);
    }
  }, [user?.id, loyaltyCard, toast]);

  useEffect(() => {
    if (user?.id) {
      loadNFTData();
    }
  }, [user?.id, loadNFTData]);

  const handleEnableAutoStaking = async () => {
    try {
      const result = await AutoStakingService.enableAutoStaking(user?.id, {
        nft_id: loyaltyCard?.id,
        staking_duration: 'forever',
        auto_reinvest: true,
        staking_percentage: 100
      });
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message
        });
        loadNFTData();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch {
      // Console statement removed
    }
  };

  const handleAddEvolutionInvestment = async () => {
    try {
      const investmentAmount = 1000; // Example amount
      const result = await NFTEvolutionService.addEvolutionInvestment(user?.id, investmentAmount);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message
        });
        loadNFTData();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch {
      // Console statement removed
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'diamond': return 'from-cyan-400 to-blue-400';
      case 'platinum': return 'from-gray-300 to-gray-400';
      case 'gold': return 'from-yellow-400 to-yellow-500';
      case 'silver': return 'from-gray-200 to-gray-300';
      default: return 'from-orange-400 to-red-400';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'very rare': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-purple-500';
      case 'less common': return 'from-green-500 to-blue-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className={`bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <span className="text-white/70">Loading NFT data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!loyaltyCard) {
    return (
      <Card className={`bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Crown className="w-12 h-12 text-orange-500 mx-auto" />
            <h3 className="text-lg font-semibold text-white">No Loyalty NFT Found</h3>
            <p className="text-white/70">You need a loyalty NFT to access these features.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* NFT Overview Card */}
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Crown className="w-6 h-6 text-orange-500" />
            <span>Your Loyalty NFT</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-xl bg-gradient-to-r ${getRarityColor(loyaltyCard.nft_types?.rarity)} shadow-lg`}>
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{loyaltyCard.nft_types?.nft_name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`${getTierColor(loyaltyCard.tier_level)} text-white border-0 capitalize`}>
                    {loyaltyCard.tier_level}
                  </Badge>
                  <Badge className={`bg-gradient-to-r ${getRarityColor(loyaltyCard.nft_types?.rarity)} text-white border-0`}>
                    {loyaltyCard.nft_types?.rarity}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Points Balance</p>
              <p className="text-2xl font-bold text-white">{loyaltyCard.points_balance?.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-sm text-gray-400">Earn Rate</p>
              <p className="text-lg font-semibold text-white">
                {((loyaltyCard.nft_types?.earn_on_spend_ratio || 0) * 100).toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Loyalty Number</p>
              <p className="text-lg font-semibold text-white font-mono">{loyaltyCard.loyalty_number}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Status</p>
              <Badge className={loyaltyCard.is_active ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}>
                {loyaltyCard.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Type</p>
              <Badge className={loyaltyCard.is_custodial ? 'bg-blue-500 text-black' : 'bg-purple-500 text-black'}>
                {loyaltyCard.is_custodial ? 'Custodial' : 'Non-Custodial'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NFT Features Tabs */}
      <Tabs defaultValue="evolution" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 overflow-x-hidden">
          <TabsTrigger value="evolution" className="data-[state=active]:bg-orange-500">
            <Zap className="w-4 h-4 mr-2" />
            Evolution
          </TabsTrigger>
          <TabsTrigger value="staking" className="data-[state=active]:bg-orange-500">
            <Shield className="w-4 h-4 mr-2" />
            Auto-Staking
          </TabsTrigger>
          <TabsTrigger value="fractional" className="data-[state=active]:bg-orange-500">
            <TrendingUp className="w-4 h-4 mr-2" />
            Fractional
          </TabsTrigger>
          <TabsTrigger value="upgrade" className="data-[state=active]:bg-orange-500">
            <Star className="w-4 h-4 mr-2" />
            Upgrade
          </TabsTrigger>
        </TabsList>

        {/* Evolution Tab */}
        <TabsContent value="evolution" className="space-y-4">
          <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Zap className="w-5 h-5 text-orange-500" />
                <span>NFT Evolution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {evolutionStats && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Current Level</p>
                      <p className="text-lg font-semibold text-white capitalize">{evolutionStats.currentEvolutionLevel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Investment</p>
                      <p className="text-lg font-semibold text-white">${evolutionStats.totalInvestment.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {evolutionStats.nextEvolutionRequirement > 0 && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Evolution Progress</span>
                        <span>Need ${evolutionStats.nextEvolutionRequirement.toLocaleString()}</span>
                      </div>
                      <Progress 
                        value={(evolutionStats.totalInvestment / (evolutionStats.totalInvestment + evolutionStats.nextEvolutionRequirement)) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleAddEvolutionInvestment}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      <Coins className="w-4 h-4 mr-2" />
                      Add Investment
                    </Button>
                    {evolutionStats.nextEvolutionRequirement === 0 && (
                      <Button 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Evolve NFT
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Staking Tab */}
        <TabsContent value="staking" className="space-y-4">
          <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Shield className="w-5 h-5 text-orange-500" />
                <span>Auto-Staking</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {autoStakingConfig ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Duration</p>
                      <p className="text-lg font-semibold text-white capitalize">
                        {autoStakingConfig.staking_duration.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Percentage</p>
                      <p className="text-lg font-semibold text-white">{autoStakingConfig.staking_percentage}%</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <Shield className="w-12 h-12 text-orange-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Auto-Staking Not Enabled</h3>
                    <p className="text-white/70">Enable auto-staking to earn passive rewards</p>
                  </div>
                  <Button 
                    onClick={handleEnableAutoStaking}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Enable Auto-Staking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fractional Investment Tab */}
        <TabsContent value="fractional" className="space-y-4">
          <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span>Fractional Investments</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fractionalStats && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Investments</p>
                    <p className="text-lg font-semibold text-white">{fractionalStats.totalInvestments}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Amount</p>
                    <p className="text-lg font-semibold text-white">${fractionalStats.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Shares</p>
                    <p className="text-lg font-semibold text-white">{fractionalStats.totalShares}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Expected Returns</p>
                    <p className="text-lg font-semibold text-white">${fractionalStats.expectedAnnualReturns.toLocaleString()}/year</p>
                  </div>
                </div>
              )}
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Browse Investment Opportunities
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upgrade Tab */}
        <TabsContent value="upgrade" className="space-y-4">
          <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Star className="w-5 h-5 text-orange-500" />
                <span>NFT Upgrade</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ✅ IMPLEMENT REQUIREMENT: Only custodial users can upgrade NFTs */}
              {userProfile?.user_type === 'custodial' && loyaltyCard?.is_custodial ? (
                <div className="text-center space-y-4">
                  <Star className="w-12 h-12 text-orange-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Upgrade Available</h3>
                    <p className="text-white/70">Upgrade your custodial NFT to earn higher rewards</p>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    onClick={handleNFTUpgrade}
                    disabled={upgrading}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    {upgrading ? 'Upgrading...' : 'Upgrade NFT'}
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <Shield className="w-12 h-12 text-gray-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Upgrade Not Available</h3>
                    <p className="text-white/70">
                      {userProfile?.user_type === 'non_custodial' 
                        ? 'Only custodial users can upgrade NFTs' 
                        : 'Only custodial NFTs can be upgraded'
                      }
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NFTManagementPanel;
