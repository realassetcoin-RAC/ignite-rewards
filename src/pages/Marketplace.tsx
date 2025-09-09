import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Grid3X3,
  List,
  Search,
  Filter,
  Star,
  Shield,
  ArrowLeft,
  Sparkles,
  Building2,
  Zap,
  Clock,
  Award,
  Eye,
  ArrowRight,
  Heart,
  Bookmark
} from "lucide-react";

// Mock listing data
interface Listing {
  id: string;
  title: string;
  description: string;
  short_description: string;
  image_url: string;
  asset_type: string;
  expected_return_rate: number;
  risk_level: 'low' | 'medium' | 'high';
  minimum_investment: number;
  total_funding_goal: number;
  current_funding_amount: number;
  funding_progress: number;
  investor_count: number;
  days_remaining: number | null;
  is_featured: boolean;
  is_verified: boolean;
  tags: string[];
}

const mockListings: Listing[] = [
  {
    id: "1",
    title: "Gold Commodity Fund",
    description: "Diversified gold investment fund with professional management and secure storage. This fund provides exposure to physical gold markets with the convenience of digital ownership.",
    short_description: "Professional gold investment fund with secure storage",
    image_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop",
    asset_type: "Commodity",
    expected_return_rate: 8.5,
    risk_level: "low",
    minimum_investment: 2500,
    total_funding_goal: 10000000,
    current_funding_amount: 7500000,
    funding_progress: 75,
    investor_count: 156,
    days_remaining: null,
    is_featured: true,
    is_verified: true,
    tags: ["gold", "commodity", "low-risk"]
  },
  {
    id: "2", 
    title: "Green Energy Startup",
    description: "Revolutionary solar panel technology startup seeking funding for expansion and R&D. Our innovative panel design increases efficiency by 40% while reducing manufacturing costs.",
    short_description: "Solar technology startup with innovative panel design",
    image_url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&h=400&fit=crop",
    asset_type: "Startup Equity",
    expected_return_rate: 25.0,
    risk_level: "high",
    minimum_investment: 500,
    total_funding_goal: 2000000,
    current_funding_amount: 850000,
    funding_progress: 42.5,
    investor_count: 23,
    days_remaining: 45,
    is_featured: false,
    is_verified: true,
    tags: ["startup", "green-energy", "solar", "technology"]
  },
  {
    id: "3",
    title: "Downtown Office Building",
    description: "Premium office space in the heart of downtown with high rental yields and appreciation potential. Located in a prime business district with excellent accessibility.",
    short_description: "Premium downtown office building with excellent rental yields",
    image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop",
    asset_type: "Real Estate",
    expected_return_rate: 12.5,
    risk_level: "medium",
    minimum_investment: 1000,
    total_funding_goal: 5000000,
    current_funding_amount: 3200000,
    funding_progress: 64,
    investor_count: 45,
    days_remaining: 30,
    is_featured: true,
    is_verified: true,
    tags: ["real-estate", "commercial", "downtown"]
  }
];

const Marketplace = () => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadListings();
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, searchQuery, selectedAssetType, selectedRiskLevel, sortBy]);

  const loadListings = async () => {
    setLoading(true);
    try {
      // Simulate API call
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

  const filterListings = () => {
    let filtered = [...listings];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Asset type filter
    if (selectedAssetType !== 'all') {
      filtered = filtered.filter(listing => 
        listing.asset_type.toLowerCase() === selectedAssetType.toLowerCase()
      );
    }

    // Risk level filter
    if (selectedRiskLevel !== 'all') {
      filtered = filtered.filter(listing => 
        listing.risk_level === selectedRiskLevel
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          if (a.is_featured !== b.is_featured) {
            return a.is_featured ? -1 : 1;
          }
          return b.funding_progress - a.funding_progress;
        case 'return-high':
          return b.expected_return_rate - a.expected_return_rate;
        case 'return-low':
          return a.expected_return_rate - b.expected_return_rate;
        case 'funding-high':
          return b.funding_progress - a.funding_progress;
        case 'funding-low':
          return a.funding_progress - b.funding_progress;
        case 'investment-low':
          return a.minimum_investment - b.minimum_investment;
        case 'investment-high':
          return b.minimum_investment - a.minimum_investment;
        default:
          return 0;
      }
    });

    setFilteredListings(filtered);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleInvest = (listing: Listing) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to invest in listings",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    // TODO: Open investment modal
    toast({
      title: "Investment Feature",
      description: `Investment functionality for ${listing.title} will be available soon`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
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

      {/* Header */}
      <header className="relative z-10 border-b bg-black/20 backdrop-blur-xl border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className={`text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent ${
                    isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                  }`}>
                    Marketplace
                  </h1>
                  <p className="text-sm text-gray-400">Tokenized Investment Opportunities</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm">Welcome,</span>
                  <span className="font-medium text-white text-sm">{user.email}</span>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className={`group bg-white/5 backdrop-blur-sm hover:bg-white/10 border-white/20 hover:border-white/30 text-white hover:text-white transform hover:scale-105 transition-all duration-300 ${
                  isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
                }`}
              >
                <Link to="/" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* Hero Section */}
        <div className={`text-center space-y-4 ${
          isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
        }`}>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Investment Opportunities
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover tokenized assets, real estate, startups, and commodities. 
            Invest your loyalty rewards for passive income and portfolio diversification.
          </p>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${
          isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
        }`}>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Funding</p>
                  <p className="text-2xl font-bold text-white">$11.6M</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active Listings</p>
                  <p className="text-2xl font-bold text-white">{listings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Investors</p>
                  <p className="text-2xl font-bold text-white">224</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg. Return</p>
                  <p className="text-2xl font-bold text-white">15.3%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        <div className={`${
          isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
        }`}>
          {filteredListings.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                : 'grid-cols-1 max-w-4xl mx-auto'
            }`}>
              {filteredListings.map((listing) => (
                <Card 
                  key={listing.id} 
                  className={`group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                    listing.is_featured ? 'ring-2 ring-purple-500/30' : ''
                  } ${viewMode === 'list' ? 'flex flex-row' : ''}`}
                >
                  {listing.is_featured && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Featured
                      </div>
                    </div>
                  )}
                  
                  <div className={viewMode === 'list' ? 'w-1/3' : ''}>
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={listing.image_url}
                        alt={listing.title}
                        className={`w-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                          viewMode === 'list' ? 'h-full' : 'h-48'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {listing.is_verified && (
                        <div className="absolute top-2 left-2">
                          <div className="bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Verified
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white group-hover:text-purple-200 transition-colors">
                          {listing.title}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {listing.short_description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {listing.asset_type}
                        </Badge>
                        <Badge className={getRiskColor(listing.risk_level)}>
                          {listing.risk_level.toUpperCase()} Risk
                        </Badge>
                        {listing.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="bg-white/5 text-gray-300 border-white/20">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Expected Return</span>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="font-bold text-green-400">{listing.expected_return_rate}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Min. Investment</span>
                          <span className="font-semibold text-white">${listing.minimum_investment.toLocaleString()}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Progress</span>
                            <span className="text-sm font-medium text-white">{listing.funding_progress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${listing.funding_progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>${(listing.current_funding_amount / 1000000).toFixed(1)}M raised</span>
                            <span>{listing.investor_count} investors</span>
                          </div>
                        </div>

                        {listing.days_remaining && (
                          <div className="flex items-center gap-2 text-sm text-orange-400">
                            <Clock className="w-4 h-4" />
                            <span>{listing.days_remaining} days remaining</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => handleInvest(listing)}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Invest Now
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                        >
                          <Bookmark className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No investments found</h3>
                <p className="text-gray-400 mb-6">
                  Try adjusting your filters or check back later for new opportunities.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedAssetType('all');
                    setSelectedRiskLevel('all');
                  }}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters and Controls - Moved Below Listings */}
        <div className={`${
          isLoaded ? 'animate-fade-in-up animation-delay-1000' : 'opacity-0'
        }`}>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                Search & Filter Options
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by title, description, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Asset Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="real estate">Real Estate</SelectItem>
                      <SelectItem value="startup equity">Startups</SelectItem>
                      <SelectItem value="commodity">Commodities</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                    <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Risk" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="all">All Risk</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="featured">Featured First</SelectItem>
                      <SelectItem value="return-high">Highest Return</SelectItem>
                      <SelectItem value="return-low">Lowest Return</SelectItem>
                      <SelectItem value="funding-high">Most Funded</SelectItem>
                      <SelectItem value="funding-low">Least Funded</SelectItem>
                      <SelectItem value="investment-low">Lowest Min. Investment</SelectItem>
                      <SelectItem value="investment-high">Highest Min. Investment</SelectItem>
                    </SelectContent>
                  </Select>

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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        {!user && (
          <div className={`text-center ${
            isLoaded ? 'animate-fade-in-up animation-delay-1200' : 'opacity-0'
          }`}>
            <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl mx-auto flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Ready to Start Investing?</h3>
                  <p className="text-gray-300">
                    Join thousands of users who are earning passive income through tokenized investments
                  </p>
                  <Button 
                    onClick={() => navigate('/auth')}
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Get Started Today
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Marketplace;