import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  Grid3X3,
  List,
  ArrowUpDown,
  RefreshCw,
  Plus,
  Star,
  Shield
} from 'lucide-react';
import MarketplaceListingCard from './MarketplaceListingCard';
import MarketplaceFilters from './MarketplaceFilters';
import InvestmentModal from './InvestmentModal';
import { 
  MarketplaceListing, 
  MarketplaceFilters as MarketplaceFiltersType,
  MarketplaceSortOptions,
  MarketplaceInvestment,
  MarketplaceStats,
  NFTCardTier
} from '@/types/marketplace';
import { 
  filterListings, 
  sortListings, 
  paginateListings,
  formatCurrency,
  formatNumber
} from '@/lib/marketplaceUtils';

interface MarketplaceMainProps {
  className?: string;
}

const MarketplaceMain: React.FC<MarketplaceMainProps> = ({ className = '' }) => {
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
  const [userBalance] = useState(10000); // TODO: Get from user context
  const [nftTier] = useState<NFTCardTier | null>(null); // TODO: Get from NFT context
  const { toast } = useToast();

  // Mock data - replace with actual API calls
  const mockListings: MarketplaceListing[] = [
    {
      id: '1',
      title: 'Downtown Office Building',
      description: 'Premium office space in the heart of downtown with high rental yields and appreciation potential.',
      short_description: 'Premium downtown office building with excellent rental yields',
      image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500',
      listing_type: 'asset',
      status: 'active',
      total_funding_goal: 5000000,
      current_funding_amount: 3200000,
      current_investor_count: 45,
      campaign_type: 'time_bound',
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      expected_return_rate: 12.5,
      risk_level: 'medium',
      minimum_investment: 1000,
      maximum_investment: 100000,
      asset_type: 'real_estate',
      token_symbol: 'DOB',
      total_token_supply: 1000000,
      token_price: 5,
      is_featured: true,
      is_verified: true,
      tags: ['real-estate', 'commercial', 'downtown'],
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      funding_progress_percentage: 64,
      days_remaining: 30,
      is_expired: false
    },
    {
      id: '2',
      title: 'Green Energy Startup',
      description: 'Revolutionary solar panel technology startup seeking funding for expansion and R&D.',
      short_description: 'Solar technology startup with innovative panel design',
      image_url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=500',
      listing_type: 'initiative',
      status: 'active',
      total_funding_goal: 2000000,
      current_funding_amount: 850000,
      current_investor_count: 23,
      campaign_type: 'time_bound',
      end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      expected_return_rate: 25.0,
      risk_level: 'high',
      minimum_investment: 500,
      maximum_investment: 50000,
      asset_type: 'startup_equity',
      token_symbol: 'GES',
      total_token_supply: 2000000,
      token_price: 1,
      is_featured: false,
      is_verified: true,
      tags: ['startup', 'green-energy', 'solar'],
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      funding_progress_percentage: 42.5,
      days_remaining: 45,
      is_expired: false
    },
    {
      id: '3',
      title: 'Gold Commodity Fund',
      description: 'Diversified gold investment fund with professional management and storage.',
      short_description: 'Professional gold investment fund with secure storage',
      image_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500',
      listing_type: 'asset',
      status: 'active',
      total_funding_goal: 10000000,
      current_funding_amount: 7500000,
      current_investor_count: 156,
      campaign_type: 'open_ended',
      expected_return_rate: 8.5,
      risk_level: 'low',
      minimum_investment: 2500,
      maximum_investment: 250000,
      asset_type: 'commodity',
      token_symbol: 'GOLD',
      total_token_supply: 10000000,
      token_price: 1,
      is_featured: true,
      is_verified: true,
      tags: ['commodity', 'gold', 'precious-metals'],
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      funding_progress_percentage: 75,
      days_remaining: null,
      is_expired: false
    }
  ];

  const mockStats: MarketplaceStats = {
    total_listings: 3,
    active_listings: 3,
    total_investments: 224,
    total_funding_raised: 11550000,
    total_users_invested: 156,
    average_investment_amount: 51562.5,
    top_performing_assets: mockListings.slice(0, 2),
    recent_investments: []
  };

  // Load data
  useEffect(() => {
    loadListings();
    loadStats();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = filterListings(listings, filters);
    filtered = sortListings(filtered, sort);
    
    setFilteredListings(filtered);
    
    const paginated = paginateListings(filtered, pagination.page, pagination.limit);
    setDisplayedListings(paginated.listings);
    setPagination(prev => ({
      ...prev,
      total: paginated.pagination.total,
      total_pages: paginated.pagination.total_pages
    }));
  }, [listings, filters, sort, pagination.page, pagination.limit]);

  const loadListings = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setListings(mockListings);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load marketplace listings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // TODO: Replace with actual API call
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleInvest = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setShowInvestmentModal(true);
  };

  const handleInvestmentSuccess = (investment: MarketplaceInvestment) => {
    toast({
      title: "Investment Successful!",
      description: `You've invested ${formatCurrency(investment.investment_amount)} in ${selectedListing?.title}`,
    });
    
    // Refresh listings to update funding amounts
    loadListings();
  };

  const handleFiltersChange = (newFilters: MarketplaceFiltersType) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSort({ field: field as any, direction });
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const handleResetFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden ${className}`}>
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.2),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.2),transparent_50%)]"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl rotate-45 animate-float pointer-events-none"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full animate-float-delayed pointer-events-none"></div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg rotate-12 animate-float-slow pointer-events-none"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="container mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Tokenized Asset Marketplace
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Invest your loyalty rewards in tokenized assets and initiatives. Earn passive income through fractional ownership.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Funding Raised</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(stats.total_funding_raised)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Target className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Active Listings</p>
                    <p className="text-2xl font-bold text-white">
                      {stats.active_listings}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Investors</p>
                    <p className="text-2xl font-bold text-white">
                      {formatNumber(stats.total_users_invested)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-orange-400" />
                  <div>
                    <p className="text-sm text-gray-400">Avg. Investment</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(stats.average_investment_amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters */}
          <div className="lg:w-1/4">
            <MarketplaceFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Listings */}
          <div className="lg:w-3/4 space-y-6">
            {/* Listings Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Available Investments
                </h2>
                <p className="text-gray-400">
                  {pagination.total} listings found
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {/* Sort */}
                <Select
                  value={`${sort.field}-${sort.direction}`}
                  onValueChange={(value) => {
                    const [field, direction] = value.split('-');
                    handleSortChange(field, direction as 'asc' | 'desc');
                  }}
                >
                  <SelectTrigger className="w-48 bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="expected_return_rate-desc">Highest Return</SelectItem>
                    <SelectItem value="expected_return_rate-asc">Lowest Return</SelectItem>
                    <SelectItem value="current_funding_amount-desc">Most Funded</SelectItem>
                    <SelectItem value="current_funding_amount-asc">Least Funded</SelectItem>
                    <SelectItem value="risk_level-asc">Lowest Risk</SelectItem>
                    <SelectItem value="risk_level-desc">Highest Risk</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex border border-white/20 rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-purple-500 text-white' : 'bg-transparent text-white hover:bg-white/10'}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-purple-500 text-white' : 'bg-transparent text-white hover:bg-white/10'}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* Refresh */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadListings}
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Listings Grid */}
            {displayedListings.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
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
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
                  <p className="text-gray-400 mb-6">
                    Try adjusting your filters or check back later for new opportunities.
                  </p>
                  <Button
                    onClick={handleResetFilters}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Load More */}
            {pagination.page < pagination.total_pages && (
              <div className="text-center">
                <Button
                  onClick={handleLoadMore}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                >
                  Load More Listings
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      {selectedListing && (
        <InvestmentModal
          listing={selectedListing}
          isOpen={showInvestmentModal}
          onClose={() => setShowInvestmentModal(false)}
          onSuccess={handleInvestmentSuccess}
          userBalance={userBalance}
          nftTier={nftTier}
        />
      )}
    </div>
  );
};

export default MarketplaceMain;
