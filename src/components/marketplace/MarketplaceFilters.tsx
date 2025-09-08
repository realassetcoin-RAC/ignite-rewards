import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Filter, 
  Search, 
  X, 
  TrendingUp, 
  Shield, 
  Calendar,
  DollarSign,
  Tag
} from 'lucide-react';
import { MarketplaceFilters as MarketplaceFiltersType } from '@/types/marketplace';
import { formatCurrency } from '@/lib/marketplaceUtils';

interface MarketplaceFiltersProps {
  filters: MarketplaceFiltersType;
  onFiltersChange: (filters: MarketplaceFiltersType) => void;
  onReset: () => void;
  className?: string;
}

const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof MarketplaceFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const removeFilter = (key: keyof MarketplaceFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter(key => {
      const value = filters[key as keyof MarketplaceFiltersType];
      return value !== undefined && value !== null && value !== '' && 
             (Array.isArray(value) ? value.length > 0 : true);
    }).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className={`bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-0 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/30">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-white font-medium">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="search"
              value={filters.search_query || ''}
              onChange={(e) => updateFilter('search_query', e.target.value)}
              placeholder="Search listings..."
              className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          <Label className="text-white font-medium">Quick Filters</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.is_featured ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('is_featured', filters.is_featured ? undefined : true)}
              className={filters.is_featured ? "bg-purple-500 text-white" : "bg-white/5 border-white/20 text-white hover:bg-white/10"}
            >
              <Tag className="w-3 h-3 mr-1" />
              Featured
            </Button>
            <Button
              variant={filters.is_verified ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('is_verified', filters.is_verified ? undefined : true)}
              className={filters.is_verified ? "bg-blue-500 text-white" : "bg-white/5 border-white/20 text-white hover:bg-white/10"}
            >
              <Shield className="w-3 h-3 mr-1" />
              Verified
            </Button>
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t border-white/10">
            {/* Listing Type */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Listing Type</Label>
              <Select
                value={filters.listing_type || ''}
                onValueChange={(value) => updateFilter('listing_type', value || undefined)}
              >
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="asset">Assets</SelectItem>
                  <SelectItem value="initiative">Initiatives</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Status</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => updateFilter('status', value || undefined)}
              >
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="funded">Funded</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Asset Type */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Asset Type</Label>
              <Select
                value={filters.asset_type || ''}
                onValueChange={(value) => updateFilter('asset_type', value || undefined)}
              >
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="All asset types" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="">All asset types</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="startup_equity">Startup Equity</SelectItem>
                  <SelectItem value="commodity">Commodity</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="bonds">Bonds</SelectItem>
                  <SelectItem value="reit">REIT</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Risk Level */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Risk Level</Label>
              <Select
                value={filters.risk_level || ''}
                onValueChange={(value) => updateFilter('risk_level', value || undefined)}
              >
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="All risk levels" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="">All risk levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Type */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Campaign Type</Label>
              <Select
                value={filters.campaign_type || ''}
                onValueChange={(value) => updateFilter('campaign_type', value || undefined)}
              >
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="All campaign types" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="">All campaign types</SelectItem>
                  <SelectItem value="time_bound">Time Bound</SelectItem>
                  <SelectItem value="open_ended">Open Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Investment Amount Range */}
            <div className="space-y-3">
              <Label className="text-white font-medium">Investment Amount</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="min-investment" className="text-sm text-gray-400">Min</Label>
                  <Input
                    id="min-investment"
                    type="number"
                    value={filters.min_investment || ''}
                    onChange={(e) => updateFilter('min_investment', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0"
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="max-investment" className="text-sm text-gray-400">Max</Label>
                  <Input
                    id="max-investment"
                    type="number"
                    value={filters.max_investment || ''}
                    onChange={(e) => updateFilter('max_investment', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="No limit"
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Expected Return Rate Range */}
            <div className="space-y-3">
              <Label className="text-white font-medium">Expected Return Rate</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="min-return" className="text-sm text-gray-400">Min %</Label>
                  <Input
                    id="min-return"
                    type="number"
                    value={filters.min_return_rate || ''}
                    onChange={(e) => updateFilter('min_return_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0"
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="max-return" className="text-sm text-gray-400">Max %</Label>
                  <Input
                    id="max-return"
                    type="number"
                    value={filters.max_return_rate || ''}
                    onChange={(e) => updateFilter('max_return_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="No limit"
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="space-y-2">
            <Label className="text-white font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (value === undefined || value === null || value === '' || 
                    (Array.isArray(value) && value.length === 0)) {
                  return null;
                }

                let displayValue = '';
                if (typeof value === 'boolean') {
                  displayValue = value ? 'Yes' : 'No';
                } else if (typeof value === 'number') {
                  if (key.includes('investment')) {
                    displayValue = formatCurrency(value);
                  } else if (key.includes('return_rate')) {
                    displayValue = `${value}%`;
                  } else {
                    displayValue = value.toString();
                  }
                } else {
                  displayValue = value.toString();
                }

                return (
                  <Badge
                    key={key}
                    variant="outline"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10 cursor-pointer"
                    onClick={() => removeFilter(key as keyof MarketplaceFiltersType)}
                  >
                    {key.replace(/_/g, ' ')}: {displayValue}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketplaceFilters;
