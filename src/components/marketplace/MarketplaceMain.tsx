import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import UserNavigation from '@/components/UserNavigation';
import HomeNavigation from '@/components/HomeNavigation';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  Grid3X3,
  List,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import racLogo from '@/assets/rac-logo-exact.svg';
import MarketplaceListingCard from './MarketplaceListingCard';
import MarketplaceFilters from './MarketplaceFilters';
import InvestmentModal from './InvestmentModal';
import { 
  MarketplaceListing, 
  MarketplaceFilters as MarketplaceFiltersType,
  MarketplaceSortOptions,
  MarketplaceInvestment,
  MarketplaceStats
  // NFTCardTier
} from '@/types/marketplace';
import { 
  filterListings, 
  sortListings, 
  paginateListings,
  formatCurrency,
  formatNumber
} from '@/lib/marketplaceUtils';
import { MarketplaceService } from '@/lib/marketplaceService';
import { LoyaltyNFTService } from '@/lib/loyaltyNFTService';

interface MarketplaceMainProps {
  className?: string;
}

// Real data will be loaded from the database

const mockStats: MarketplaceStats = {
  total_listings: 3,
  active_listings: 3,
  total_funding_raised: 7400000,
  total_investments: 105,
  total_users_invested: 105,
  average_investment_amount: 70476,
  top_performing_assets: [],
  recent_investments: []
};

const MarketplaceMain: React.FC<MarketplaceMainProps> = ({ className = '' }) => {
  // All hooks must be called at the top level, before any conditional returns
  const { user, loading: authLoading } = useSecureAuth();
  const { toast } = useToast();
  
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<MarketplaceListing[]>([]);
  const [displayedListings, setDisplayedListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<MarketplaceFiltersType>({});
  const [sort, setSort] = useState<MarketplaceSortOptions>({
    field: 'created_at',
    direction: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    total_pages: 0
  });
  const [userBalance] = useState(10000);
  // const [_nftTier] = useState<NFTCardTier | null>(null);
  const [nftMultiplier, setNftMultiplier] = useState(1.0);
  const [loyaltyCard, setLoyaltyCard] = useState<any>(null);

  // All useCallback hooks
  const loadNFTData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Load user's loyalty card
      const card = await LoyaltyNFTService.getUserLoyaltyCard(user.id);
      setLoyaltyCard(card);
      
      // Get NFT multiplier
      const multiplier = await MarketplaceService.getUserNFTMultiplier(user.id);
      setNftMultiplier(multiplier);
    } catch (error) {
      console.error('Failed to load NFT data:', error);
    }
  }, [user?.id]);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await MarketplaceService.getListings();
      setListings(data);
    } catch (error) {
      console.error('Failed to load listings:', error);
      setListings([]);
      toast({
        title: "Error",
        description: "Failed to load marketplace listings. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadStats = useCallback(async () => {
    try {
      const data = await MarketplaceService.getMarketplaceStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats(mockStats);
    }
  }, []);

  const handleInvest = useCallback((listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setShowInvestmentModal(true);
  }, []);

  const handleInvestmentSuccess = useCallback((investment: MarketplaceInvestment) => {
    toast({
      title: "Investment Successful!",
      description: `You've invested ${formatCurrency(investment.investment_amount)} in ${selectedListing?.title}`,
    });
    loadListings();
  }, [toast, selectedListing?.title, loadListings]);

  const handleFiltersChange = useCallback((newFilters: MarketplaceFiltersType) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field: field as any, direction });
  }, []);

  const handleLoadMore = useCallback(() => {
    if (pagination.page < pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [pagination.page, pagination.total_pages]);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // All useEffect hooks
  useEffect(() => {
    if (user) {
      loadListings();
      loadStats();
      loadNFTData();
    }
  }, [user, loadListings, loadStats, loadNFTData]);

  useEffect(() => {
    let filtered = filterListings(listings, filters);
    filtered = sortListings(filtered, sort);
    setFilteredListings(filtered);
  }, [listings, filters, sort]);

  useEffect(() => {
    const paginated = paginateListings(filteredListings, pagination.page, pagination.limit);
    setDisplayedListings(paginated.listings);
  }, [filteredListings, pagination.page, pagination.limit]);

  useEffect(() => {
    const totalPages = Math.ceil(filteredListings.length / pagination.limit);
    setPagination(prev => ({
      ...prev,
      total: filteredListings.length,
      total_pages: totalPages
    }));
  }, [filteredListings.length, pagination.limit]);

  // Authentication checks - AFTER all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  // Allow access to marketplace for all users (both authenticated and non-authenticated)
  // if (!user) {
  //   return <Navigate to="/" replace />;
  // }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden ${className}`}>
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,31,63,0.4),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(255,133,27,0.2),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(0,31,63,0.3),transparent_50%)]"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl rotate-45 animate-float pointer-events-none"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-blue-900/20 to-blue-950/20 rounded-full animate-float-delayed pointer-events-none"></div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-orange-500/20 rounded-lg rotate-12 animate-float-slow pointer-events-none"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {/* Navigation Header */}
      <header className="relative z-50 border-b bg-slate-950/80 backdrop-blur-xl border-orange-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                 <div className="relative">
                   <img 
                     src={racLogo} 
                     alt="RAC Logo" 
                     className="w-10 h-10"
                   />
                 </div>
                 <div>
                   <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                     RAC
                   </h1>
                   <p className="text-sm text-gray-400">Marketplace</p>
                 </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <HomeNavigation variant="home" showText={true} />
              <UserNavigation />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation className="mb-4" />
        
        {/* Header */}
        <div className="text-center space-y-6">
           {/* Logo and Title */}
           <div className="flex items-center justify-center space-x-4">
             <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4">
               <img 
                 src={racLogo} 
                 alt="RAC Logo" 
                 className="h-12 lg:h-16"
               />
             </div>
             <div>
               <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-orange-400 to-blue-500 bg-clip-text text-transparent animate-gradient-x">
                 RAC
               </h1>
               <p className="text-lg text-orange-500 font-semibold">Marketplace</p>
             </div>
           </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Invest your $RAC tokens in tokenized assets and initiatives. Earn passive income through fractional ownership in the RAC ecosystem.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-400">Total Funding Raised</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(stats.total_funding_raised)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Target className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-400">Active Listings</p>
                    <p className="text-2xl font-bold text-white">
                      {stats.active_listings}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-400">Total Investors</p>
                    <p className="text-2xl font-bold text-white">
                      {formatNumber(stats.total_investments)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-400">Avg. Investment</p>
                     <p className="text-2xl font-bold text-white">
                       {formatCurrency(stats.average_investment_amount)}
                     </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NFT Multiplier Card */}
            <Card className="bg-gradient-to-br from-purple-900/60 to-blue-800/30 backdrop-blur-md border border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Your NFT Multiplier</p>
                    <p className="text-2xl font-bold text-white">
                      {nftMultiplier.toFixed(1)}x
                    </p>
                    {loyaltyCard && (
                      <p className="text-xs text-purple-300">
                        {loyaltyCard.nft_types?.nft_name} ({loyaltyCard.tier_level})
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="space-y-6">
          <MarketplaceFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <Select value={`${sort.field}-${sort.direction}`} onValueChange={(value) => {
                const [field, direction] = value.split('-');
                handleSortChange(field, direction as 'asc' | 'desc');
              }}>
                 <SelectTrigger className="w-48 bg-slate-900/60 backdrop-blur-md border border-orange-500/20">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                  <SelectItem value="created_at-asc">Oldest First</SelectItem>
                  <SelectItem value="total_funding_goal-desc">Highest Goal</SelectItem>
                  <SelectItem value="total_funding_goal-asc">Lowest Goal</SelectItem>
                  <SelectItem value="expected_return_rate-desc">Highest Return</SelectItem>
                  <SelectItem value="expected_return_rate-asc">Lowest Return</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Mode */}
              <div className="flex border border-white/20 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={loadListings}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
             <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : displayedListings.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {displayedListings.map((listing) => (
              <MarketplaceListingCard
                key={listing.id}
                listing={listing}
                onInvest={handleInvest}
                showInvestButton={true}
                className={viewMode === 'list' ? 'flex flex-row' : ''}
              />
            ))}
          </div>
        ) : (
           <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-md border border-orange-500/20">
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Listings Found</h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your filters or check back later for new opportunities.
              </p>
               <Button
                 onClick={handleResetFilters}
                 className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
               >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {pagination.page < pagination.total_pages && (
          <div className="text-center">
             <Button
               onClick={handleLoadMore}
               className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
             >
              Load More Listings
            </Button>
          </div>
        )}
      </div>

       {/* Investment Modal */}
       {selectedListing && (
         <InvestmentModal
           listing={selectedListing}
           userBalance={userBalance}
           isOpen={showInvestmentModal}
           onClose={() => setShowInvestmentModal(false)}
           onSuccess={handleInvestmentSuccess}
         />
       )}
    </div>
  );
};

export default MarketplaceMain;
