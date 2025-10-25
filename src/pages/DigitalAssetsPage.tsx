import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Wallet, 
  TrendingUp, 
  Search,
  Eye,
  EyeOff,
  Shield,
  Zap
} from 'lucide-react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { createModuleLogger } from '@/utils/consoleReplacer';
import { supabase } from '@/lib/databaseAdapter';

// Types for digital assets
interface AssetWallet {
  id: string;
  wallet_address: string;
  currency_type: string;
  balance: number;
  locked_balance: number;
  total_invested: number;
  total_returns: number;
  asset_initiative_id: string;
  asset_initiative_name?: string;
  created_at: string;
}

interface UserLoyaltyCard {
  id: string;
  loyalty_number: string;
  card_number: string;
  full_name: string;
  points_balance: number;
  tier_level: string;
  nft_type_id?: string;
  nft_type_name?: string;
  nft_rarity?: string;
  is_active: boolean;
  created_at: string;
}

interface FractionalInvestment {
  id: string;
  investment_amount: number;
  fractional_shares: number;
  asset_type: string;
  asset_name: string;
  asset_description: string;
  total_shares: number;
  share_price: number;
  investment_date: string;
  status: string;
  expected_return_rate: number;
  maturity_date?: string;
}

interface MarketplaceInvestment {
  id: string;
  listing_id: string;
  investment_amount: number;
  tokens_received: number;
  status: string;
  invested_at: string;
  listing_title?: string;
  listing_category?: string;
  current_value?: number;
  return_percentage?: number;
}

interface DigitalAssetSummary {
  totalWallets: number;
  totalWalletValue: number;
  totalNFTs: number;
  totalInvestments: number;
  totalInvestmentValue: number;
  totalPortfolioValue: number;
}

const DigitalAssetsPage: React.FC = () => {
  const logger = createModuleLogger('DigitalAssetsPage');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSecureAuth();
  
  // State management
  const [assetWallets, setAssetWallets] = useState<AssetWallet[]>([]);
  const [loyaltyCards, setLoyaltyCards] = useState<UserLoyaltyCard[]>([]);
  const [fractionalInvestments, setFractionalInvestments] = useState<FractionalInvestment[]>([]);
  const [marketplaceInvestments, setMarketplaceInvestments] = useState<MarketplaceInvestment[]>([]);
  const [summary, setSummary] = useState<DigitalAssetSummary>({
    totalWallets: 0,
    totalWalletValue: 0,
    totalNFTs: 0,
    totalInvestments: 0,
    totalInvestmentValue: 0,
    totalPortfolioValue: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showValues, setShowValues] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all user digital assets
  const fetchUserDigitalAssets = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.info('Fetching user digital assets for user:', user.id);

      // Fetch asset wallets
      const { data: wallets, error: walletsError } = await supabase
        .from('asset_wallets')
        .select(`
          *,
          asset_initiatives (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (walletsError) {
        logger.error('Error fetching asset wallets:', walletsError);
      } else {
        const formattedWallets = wallets?.map((wallet: any) => ({
          ...wallet,
          asset_initiative_name: wallet.asset_initiatives?.name
        })) || [];
        setAssetWallets(formattedWallets);
      }

      // Fetch loyalty cards (NFTs)
      const { data: cards, error: cardsError } = await supabase
        .from('user_loyalty_cards')
        .select(`
          *,
          nft_types (
            nft_name,
            rarity
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (cardsError) {
        logger.error('Error fetching loyalty cards:', cardsError);
      } else {
        const formattedCards = cards?.map((card: any) => ({
          ...card,
          nft_type_name: card.nft_types?.nft_name,
          nft_rarity: card.nft_types?.rarity
        })) || [];
        setLoyaltyCards(formattedCards);
      }

      // Fetch fractional investments
      const { data: fractional, error: fractionalError } = await supabase
        .from('fractional_investments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (fractionalError) {
        logger.error('Error fetching fractional investments:', fractionalError);
      } else {
        setFractionalInvestments(fractional || []);
      }

      // Fetch marketplace investments
      const { data: marketplace, error: marketplaceError } = await supabase
        .from('marketplace_investments')
        .select(`
          *,
          marketplace_listings (
            title,
            category
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (marketplaceError) {
        logger.error('Error fetching marketplace investments:', marketplaceError);
      } else {
        const formattedMarketplace = marketplace?.map((investment: any) => ({
          ...investment,
          listing_title: investment.marketplace_listings?.title,
          listing_category: investment.marketplace_listings?.category
        })) || [];
        setMarketplaceInvestments(formattedMarketplace);
      }

      // Calculate summary
      const totalWalletValue = assetWallets.reduce((sum: number, wallet: AssetWallet) => 
        sum + wallet.balance + wallet.total_returns, 0);
      const totalInvestmentValue = fractionalInvestments.reduce((sum: number, inv: FractionalInvestment) => 
        sum + inv.investment_amount, 0) + marketplaceInvestments.reduce((sum: number, inv: MarketplaceInvestment) => 
        sum + inv.investment_amount, 0);

      setSummary({
        totalWallets: assetWallets.length,
        totalWalletValue,
        totalNFTs: loyaltyCards.length,
        totalInvestments: fractionalInvestments.length + marketplaceInvestments.length,
        totalInvestmentValue,
        totalPortfolioValue: totalWalletValue + totalInvestmentValue
      });

    } catch (error) {
      logger.error('Error fetching digital assets:', error as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchUserDigitalAssets();
    }
  }, [user?.id, authLoading]);

  const handleBackNavigation = () => {
    navigate('/dashboard');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCurrencyIcon = (currency: string) => {
    const icons: { [key: string]: string } = {
      'USDT': '💵',
      'ETH': '🔷',
      'BTC': '₿',
      'SOL': '◎',
      'BNB': '🟡',
      'RAC': '🎯'
    };
    return icons[currency] || '💰';
  };

  const getAssetTypeIcon = (type: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'real_estate': '🏠',
      'art': '🎨',
      'collectibles': '📦',
      'commodities': '📈',
      'crypto': '₿',
      'stocks': '📊'
    };
    return icons[type] || '💼';
  };

  const getRarityColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      'Common': 'bg-gray-100 text-gray-800',
      'Less Common': 'bg-blue-100 text-blue-800',
      'Rare': 'bg-purple-100 text-purple-800',
      'Very Rare': 'bg-yellow-100 text-yellow-800'
    };
    return colors[rarity] || 'bg-gray-100 text-gray-800';
  };

  const filteredWallets = assetWallets.filter(wallet =>
    wallet.currency_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.asset_initiative_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNFTs = loyaltyCards.filter(card =>
    card.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.nft_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.tier_level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFractional = fractionalInvestments.filter(investment =>
    investment.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investment.asset_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMarketplace = marketplaceInvestments.filter(investment =>
    investment.listing_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investment.listing_category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading while authentication is in progress
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Show message if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to view your digital assets and portfolio.
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while fetching assets
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your digital assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackNavigation}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Digital Assets</h1>
                <p className="text-muted-foreground">
                  Manage and view all your digital holdings
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowValues(!showValues)}
                className="flex items-center space-x-2"
              >
                {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{showValues ? 'Hide' : 'Show'} Values</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Portfolio Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {summary.totalWallets}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Wallets</div>
                  {showValues && (
                    <div className="text-xs text-green-600 mt-1">
                      {formatCurrency(summary.totalWalletValue)}
                    </div>
                  )}
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {summary.totalNFTs}
                  </div>
                  <div className="text-sm text-muted-foreground">Loyalty NFTs</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {summary.totalInvestments}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Investments</div>
                  {showValues && (
                    <div className="text-xs text-blue-600 mt-1">
                      {formatCurrency(summary.totalInvestmentValue)}
                    </div>
                  )}
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {showValues ? formatCurrency(summary.totalPortfolioValue) : '***'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Asset Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Wallets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5" />
                    <span>Recent Wallets</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assetWallets.slice(0, 3).map((wallet) => (
                      <div key={wallet.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getCurrencyIcon(wallet.currency_type)}</span>
                          <div>
                            <div className="font-medium">{wallet.currency_type}</div>
                            <div className="text-sm text-muted-foreground">
                              {wallet.asset_initiative_name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {showValues && (
                            <div className="font-medium">
                              {formatCurrency(wallet.balance + wallet.total_returns)}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            {wallet.currency_type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent NFTs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Loyalty NFTs</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loyaltyCards.slice(0, 3).map((card) => (
                      <div key={card.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {card.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{card.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {card.nft_type_name} • {card.tier_level}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getRarityColor(card.nft_rarity || 'Common')}>
                            {card.nft_rarity || 'Common'}
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {card.points_balance} points
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wallets Tab */}
          <TabsContent value="wallets" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWallets.map((wallet) => (
                <Card key={wallet.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span className="text-2xl">{getCurrencyIcon(wallet.currency_type)}</span>
                      <span>{wallet.currency_type}</span>
                    </CardTitle>
                    <CardDescription>
                      {wallet.asset_initiative_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Available Balance</span>
                        {showValues ? (
                          <span className="font-medium">{formatCurrency(wallet.balance)}</span>
                        ) : (
                          <span className="font-medium">***</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Invested</span>
                        {showValues ? (
                          <span className="font-medium">{formatCurrency(wallet.total_invested)}</span>
                        ) : (
                          <span className="font-medium">***</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Returns</span>
                        {showValues ? (
                          <span className="font-medium text-green-600">
                            {formatCurrency(wallet.total_returns)}
                          </span>
                        ) : (
                          <span className="font-medium">***</span>
                        )}
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          Wallet: {wallet.wallet_address.slice(0, 8)}...{wallet.wallet_address.slice(-6)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {formatDate(wallet.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredWallets.length === 0 && (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No wallets found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms' : 'Create your first wallet to get started'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* NFTs Tab */}
          <TabsContent value="nfts" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNFTs.map((card) => (
                <Card key={card.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {card.full_name.charAt(0)}
                      </div>
                      <span>{card.full_name}</span>
                    </CardTitle>
                    <CardDescription>
                      {card.nft_type_name} • {card.tier_level}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Loyalty Number</span>
                        <span className="font-medium">{card.loyalty_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Points Balance</span>
                        <span className="font-medium">{card.points_balance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tier Level</span>
                        <Badge className={getRarityColor(card.tier_level)}>
                          {card.tier_level}
                        </Badge>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          Card: {card.card_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {formatDate(card.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredNFTs.length === 0 && (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No NFTs found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms' : 'Purchase your first loyalty NFT to get started'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments" className="space-y-6">
            {/* Fractional Investments */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Fractional Investments</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFractional.map((investment) => (
                  <Card key={investment.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span className="text-2xl">{getAssetTypeIcon(investment.asset_type)}</span>
                        <span>{investment.asset_name}</span>
                      </CardTitle>
                      <CardDescription>
                        {investment.asset_description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Investment Amount</span>
                          {showValues ? (
                            <span className="font-medium">{formatCurrency(investment.investment_amount)}</span>
                          ) : (
                            <span className="font-medium">***</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Shares Owned</span>
                          <span className="font-medium">{investment.fractional_shares}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Expected Return</span>
                          <span className="font-medium text-green-600">
                            {investment.expected_return_rate}%
                          </span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            Type: {investment.asset_type}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Invested: {formatDate(investment.investment_date)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Marketplace Investments */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Marketplace Investments</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMarketplace.map((investment) => (
                  <Card key={investment.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span className="text-2xl">📈</span>
                        <span>{investment.listing_title}</span>
                      </CardTitle>
                      <CardDescription>
                        {investment.listing_category}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Investment Amount</span>
                          {showValues ? (
                            <span className="font-medium">{formatCurrency(investment.investment_amount)}</span>
                          ) : (
                            <span className="font-medium">***</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Tokens Received</span>
                          <span className="font-medium">{investment.tokens_received.toLocaleString()}</span>
                        </div>
                        {investment.current_value && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Current Value</span>
                            {showValues ? (
                              <span className="font-medium">{formatCurrency(investment.current_value)}</span>
                            ) : (
                              <span className="font-medium">***</span>
                            )}
                          </div>
                        )}
                        {investment.return_percentage && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Return</span>
                            <span className={`font-medium ${
                              investment.return_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {investment.return_percentage > 0 ? '+' : ''}{investment.return_percentage}%
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            Status: {investment.status}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Invested: {formatDate(investment.invested_at)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {filteredFractional.length === 0 && filteredMarketplace.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No investments found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms' : 'Start investing to build your portfolio'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DigitalAssetsPage;
