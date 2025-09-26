import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  Grid3X3,
  List,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import MarketplaceListingCard from './MarketplaceListingCard';
import MarketplaceFilters from './MarketplaceFilters';
import InvestmentModal from './InvestmentModal';
import { 
  MarketplaceListing, 
  MarketplaceFilters as MarketplaceFiltersType,
  MarketplaceSortOptions,
  MarketplaceStats
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

// Mock data for demonstration
const mockListings: MarketplaceListing[] = [
  {
    id: '1',
    title: 'Green Energy Solar Farm',
    description: 'Invest in sustainable solar energy infrastructure with guaranteed returns.',
    image_url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400',
    target_amount: 1000000,
    current_amount: 750000,
    minimum_investment: 100,
    expected_return: 12.5,
    risk_level: 'medium',
    duration_months: 24,
    category: 'renewable_energy',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_id: 'creator1',
    tags: ['solar', 'green', 'sustainable'],
    documents: []
  },
  {
    id: '2',
    title: 'Tech Startup Expansion',
    description: 'Fund the next phase of growth for a promising fintech startup.',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    target_amount: 500000,
    current_amount: 320000,
    minimum_investment: 250,
    expected_return: 18.0,
    risk_level: 'high',
    duration_months: 18,
    category: 'technology',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_id: 'creator2',
    tags: ['fintech', 'startup', 'growth'],
    documents: []
  },
  {
    id: '3',
    title: 'Real Estate Development',
    description: 'Participate in premium residential property development project.',
    image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
    target_amount: 2000000,
    current_amount: 1200000,
    minimum_investment: 500,
    expected_return: 15.0,
    risk_level: 'low',
    duration_months: 36,
    category: 'real_estate',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_id: 'creator3',
    tags: ['property', 'residential', 'development'],
    documents: []
  }
];

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

const MarketplaceMainFixed: React.FC<MarketplaceMainProps> = ({ className = '' }) => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  
  const [listings, setListings] = useState<MarketplaceListing[]>(mockListings);
  const [filteredListings, setFilteredListings] = useState<MarketplaceListing[]>(mockListings);
  const [displayedListings, setDisplayedListings] = useState<MarketplaceListing[]>(mockListings);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MarketplaceStats | null>(mockStats);
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
    total: mockListings.length,
    total_pages: 1
  });
  const [userBalance] = useState(10000);
  const [nftMultiplier] = useState(1.0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from the API
      setListings(mockListings);
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
      toast({
        title: "Error",
        description: "Failed to load marketplace data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const filtered = filterListings(listings, filters);
    setFilteredListings(filtered);
    
    const sorted = sortListings(filtered, sort);
    const paginated = paginateListings(sorted, pagination.page, pagination.limit);
    setDisplayedListings(paginated.data);
    
    setPagination(prev => ({
      ...prev,
      total: filtered.length,
      total_pages: paginated.pagination.total_pages
    }));
  }, [listings, filters, sort, pagination.page, pagination.limit]);

  const handleInvestment = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setShowInvestmentModal(true);
  };

  const handleFiltersChange = (newFilters: MarketplaceFiltersType) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (newSort: MarketplaceSortOptions) => {
    setSort(newSort);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-orange-400 to-blue-500 bg-clip-text text-transparent">
            RAC Marketplace
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mt-4">
            Invest your RAC tokens in tokenized assets and initiatives. Earn passive income through fractional ownership.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Listings</p>
                  <p className="text-2xl font-bold text-white">{stats.total_listings}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Funding</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.total_funding_raised)}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Active Investors</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(stats.total_users_invested)}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Avg Investment</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.average_investment_amount)}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Balance */}
      <Card className="bg-gradient-to-r from-primary/20 to-blue-500/20 backdrop-blur-xl border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Your Investment Balance</h3>
              <p className="text-3xl font-bold text-primary">{formatCurrency(userBalance)} RAC</p>
              {nftMultiplier > 1 && (
                <p className="text-sm text-green-400 mt-1">
                  NFT Bonus: {((nftMultiplier - 1) * 100).toFixed(1)}% extra returns
                </p>
              )}
            </div>
            <div className="p-4 bg-primary/20 rounded-full">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <MarketplaceFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            className="bg-white/5 backdrop-blur-xl border-white/10"
          />
        </div>
        
        <div className="lg:w-80 space-y-4">
          <div className="flex items-center gap-2">
            <Select value={`${sort.field}-${sort.direction}`} onValueChange={(value) => {
              const [field, direction] = value.split('-') as [keyof MarketplaceListing, 'asc' | 'desc'];
              handleSortChange({ field, direction });
            }}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/10">
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="expected_return-desc">Highest Return</SelectItem>
                <SelectItem value="expected_return-asc">Lowest Return</SelectItem>
                <SelectItem value="target_amount-desc">Largest Amount</SelectItem>
                <SelectItem value="target_amount-asc">Smallest Amount</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex border border-white/10 rounded-lg bg-white/5">
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
          </div>
          
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="w-full bg-white/5 border-white/10 hover:bg-white/10"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Listings */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Investment Opportunities
          </h2>
          <p className="text-gray-400">
            Showing {displayedListings.length} of {filteredListings.length} listings
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-white">Loading opportunities...</span>
          </div>
        ) : displayedListings.length === 0 ? (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No opportunities found</h3>
              <p className="text-gray-400">Try adjusting your filters to see more listings.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {displayedListings.map((listing) => (
                <MarketplaceListingCard
                  key={listing.id}
                  listing={listing}
                  onInvest={() => handleInvestment(listing)}
                  viewMode={viewMode}
                  nftMultiplier={nftMultiplier}
                  className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10"
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  Previous
                </Button>
                
                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={pagination.page === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page }))}
                    className={pagination.page === page ? '' : 'bg-white/5 border-white/10 hover:bg-white/10'}
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.total_pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.total_pages}
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Investment Modal */}
      {selectedListing && (
        <InvestmentModal
          listing={selectedListing}
          userBalance={userBalance}
          isOpen={showInvestmentModal}
          onClose={() => setShowInvestmentModal(false)}
          onInvest={(amount) => {
            toast({
              title: "Investment Successful!",
              description: `You have invested ${formatCurrency(amount)} RAC in ${selectedListing.title}`,
            });
            setShowInvestmentModal(false);
          }}
        />
      )}
    </div>
  );
};

export default MarketplaceMainFixed;
