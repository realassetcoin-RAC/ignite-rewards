import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Search, MapPin, Star, Users, Filter } from "lucide-react";

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

  // Get unique industries and countries for filters
  const industries = Array.from(new Set(merchants.map(m => m.industry).filter(Boolean)));
  const countries = Array.from(new Set(merchants.map(m => m.country).filter(Boolean)));

  useEffect(() => {
    loadMerchants();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Partner Merchants</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Discover our network of {merchants.length} trusted merchant partners
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/">Back to Home</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{merchants.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Industries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{industries.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{countries.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{merchants.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMerchants.map((merchant) => (
              <Card key={merchant.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        {merchant.logo_url ? (
                          <img 
                            src={merchant.logo_url} 
                            alt={merchant.business_name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-primary" />
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
                    <Badge variant="default" className="bg-green-100 text-green-800">
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
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Earn rewards on every purchase</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredMerchants.length === 0 && (
            <Card>
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
          <Card className="bg-primary/5 border-primary/20">
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
              <Button asChild>
                <a href="/#signup">Become a Partner</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Partners;