import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Search, MapPin, Star, Users, Filter, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Merchant {
  id: string;
  business_name: string;
  business_type: string;
  city: string;
  country: string;
  industry: string;
  logo_url?: string;
  status: string;
}

const Partners = () => {
  const { toast } = useToast();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [isLoaded, setIsLoaded] = useState(false);

  // Get unique industries and countries for filters
  const industries = Array.from(new Set(merchants.map(m => m.industry).filter(Boolean)));
  const countries = Array.from(new Set(merchants.map(m => m.country).filter(Boolean)));

  useEffect(() => {
    loadMerchants();
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    filterMerchants();
  }, [merchants, searchTerm, selectedIndustry, selectedCountry]);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('merchants')
        .select('id, business_name, business_type, city, country, industry, logo_url, status')
        .eq('status', 'active')
        .order('business_name');
      if (error) throw error;
      if (data) setMerchants(data);
    } catch (error) {
      console.error('Error loading merchants:', error);
      setSampleMerchants();
    } finally {
      setLoading(false);
    }
  };

  const setSampleMerchants = () => {
    const sampleData: Merchant[] = [
      {
        id: '1',
        business_name: 'TechHub Electronics',
        business_type: 'retail',
        city: 'San Francisco',
        country: 'USA',
        industry: 'Electronics',
        status: 'active',
      },
      {
        id: '2',
        business_name: 'Green Leaf Cafe',
        business_type: 'restaurant',
        city: 'New York',
        country: 'USA',
        industry: 'Food & Beverage',
        status: 'active',
      },
      {
        id: '3',
        business_name: 'Urban Fashion',
        business_type: 'retail',
        city: 'Los Angeles',
        country: 'USA',
        industry: 'Fashion',
        status: 'active',
      },
      {
        id: '4',
        business_name: 'Wellness Spa',
        business_type: 'service',
        city: 'Miami',
        country: 'USA',
        industry: 'Health & Wellness',
        status: 'active',
      },
      {
        id: '5',
        business_name: 'BookCorner',
        business_type: 'retail',
        city: 'Boston',
        country: 'USA',
        industry: 'Books & Education',
        status: 'active',
      },
      {
        id: '6',
        business_name: 'Fitness Pro',
        business_type: 'service',
        city: 'Chicago',
        country: 'USA',
        industry: 'Fitness',
        status: 'active',
      },
    ];
    setMerchants(sampleData);
  };

  const filterMerchants = () => {
    let filtered = [...merchants];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(merchant =>
        merchant.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Industry filter
    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(merchant => merchant.industry === selectedIndustry);
    }

    // Country filter
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(merchant => merchant.country === selectedCountry);
    }

    setFilteredMerchants(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedIndustry("all");
    setSelectedCountry("all");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-20 left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 pointer-events-none"></div>
      
      {/* Floating Particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/60 rounded-full animate-bounce animation-delay-3000"></div>
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce animation-delay-5000"></div>

      {/* Header */}
      <header className="relative z-10 border-b bg-background/80 backdrop-blur-md border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold text-foreground ${
                  isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                }`}>
                  Partner Merchants
                </h1>
                <p className={`text-sm text-muted-foreground mt-1 ${
                  isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
                }`}>
                  Discover our network of {merchants.length} trusted merchant partners
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className={`group bg-background/60 backdrop-blur-md hover:bg-background/80 border-primary/30 hover:border-primary/50 transform hover:scale-105 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
              }`}
            >
              <Link to="/" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Stats Banner */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${
            isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
          }`}>
            <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{merchants.length}</div>
              </CardContent>
            </Card>
            <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Industries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">{industries.length}</div>
              </CardContent>
            </Card>
            <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-primary bg-clip-text text-transparent">{countries.length}</div>
              </CardContent>
            </Card>
            <Card className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{merchants.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className={`card-gradient border-primary/20 backdrop-blur-md ${
            isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Find Partners
              </CardTitle>
              <CardDescription>
                Search and filter our merchant directory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by business name, industry, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Merchants Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${
            isLoaded ? 'animate-fade-in-up animation-delay-1000' : 'opacity-0'
          }`}>
            {filteredMerchants.map((merchant) => (
              <Card key={merchant.id} className="card-gradient border-primary/20 backdrop-blur-md hover:scale-105 hover:shadow-xl transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center group-hover:from-primary/30 group-hover:to-purple-500/30 transition-all duration-300">
                        {merchant.logo_url ? (
                          <img 
                            src={merchant.logo_url} 
                            alt={merchant.business_name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-primary group-hover:animate-bounce" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{merchant.business_name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {merchant.city}, {merchant.country}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-500 border-green-500/30">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Industry</span>
                      <Badge variant="outline">{merchant.industry}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className="text-sm font-medium capitalize">{merchant.business_type}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-primary/20">
                      <Star className="h-4 w-4 text-yellow-500 group-hover:animate-pulse" />
                      <span className="text-sm">Earn rewards on every purchase</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredMerchants.length === 0 && (
            <Card className={`card-gradient border-primary/20 backdrop-blur-md ${
              isLoaded ? 'animate-fade-in-up animation-delay-1200' : 'opacity-0'
            }`}>
              <CardContent className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No merchants found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or clear the filters to see all partners.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Call to Action */}
          <Card className={`card-gradient border-primary/20 backdrop-blur-md ${
            isLoaded ? 'animate-fade-in-up animation-delay-1400' : 'opacity-0'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Join Our Partner Network
              </CardTitle>
              <CardDescription>
                Are you a business owner? Join our growing network of merchant partners and start rewarding your customers today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="group bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
                <a href="/#signup" className="flex items-center">
                  Become a Partner
                  <Users className="ml-2 h-4 w-4 group-hover:animate-bounce" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Partners;