import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign, 
  Shield, 
  Star,
  ArrowRight,
  Calendar,
  Target
} from 'lucide-react';
import { MarketplaceListing } from '@/types/marketplace';
import { formatCurrency, formatNumber, calculateDaysRemaining } from '@/lib/marketplaceUtils';

interface MarketplaceListingCardProps {
  listing: MarketplaceListing;
  onInvest?: (listing: MarketplaceListing) => void;
  onViewDetails?: (listing: MarketplaceListing) => void;
  showInvestButton?: boolean;
  className?: string;
}

const MarketplaceListingCard: React.FC<MarketplaceListingCardProps> = ({
  listing,
  onInvest,
  onViewDetails,
  showInvestButton = true,
  className = ''
}) => {
  const {
    title,
    short_description,
    image_url,
    listing_type,
    status,
    total_funding_goal,
    current_funding_amount,
    current_investor_count,
    expected_return_rate,
    risk_level,
    minimum_investment,
    campaign_type,
    end_date,
    is_featured,
    is_verified,
    funding_progress_percentage = 0,
    days_remaining = 0,
    is_expired = false
  } = listing;

  const canInvest = status === 'active' && !is_expired;
  const isFullyFunded = funding_progress_percentage >= 100;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'funded': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className={`group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl ${className}`}>
      {/* Header with Image */}
      <div className="relative">
        {image_url && (
          <div className="h-48 w-full overflow-hidden rounded-t-lg">
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        {/* Status Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <Badge className={`${getStatusColor(status)} border backdrop-blur-sm`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          {is_featured && (
            <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30 backdrop-blur-sm">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
          {is_verified && (
            <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30 backdrop-blur-sm">
              <Shield className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {/* Type Badge */}
        <div className="absolute top-4 right-4">
          <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30 backdrop-blur-sm">
            {listing_type.charAt(0).toUpperCase() + listing_type.slice(1)}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
          {title}
        </CardTitle>
        {short_description && (
          <p className="text-gray-300 text-sm leading-relaxed">
            {short_description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-xs text-gray-400">Expected Return</p>
              <p className="text-sm font-semibold text-white">
                {expected_return_rate ? `${expected_return_rate}%` : 'TBD'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">Risk Level</p>
              <Badge className={`${getRiskColor(risk_level)} text-xs border`}>
                {risk_level.charAt(0).toUpperCase() + risk_level.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Funding Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Funding Progress</span>
            <span className="text-sm font-semibold text-white">
              {formatCurrency(current_funding_amount)} / {formatCurrency(total_funding_goal)}
            </span>
          </div>
          
          <Progress 
            value={funding_progress_percentage} 
            className="h-2 bg-gray-700/50"
          />
          
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>{formatNumber(funding_progress_percentage)}% funded</span>
            <span>{current_investor_count} investors</span>
          </div>
        </div>

        {/* Time Information */}
        {campaign_type === 'time_bound' && end_date && (
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-300">
                {is_expired ? 'Campaign Ended' : `${days_remaining} days left`}
              </span>
            </div>
            {!is_expired && (
              <div className="text-xs text-gray-400">
                Ends {new Date(end_date).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* Investment Info */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">Min. Investment</span>
          </div>
          <span className="text-sm font-semibold text-white">
            {formatCurrency(minimum_investment)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          {showInvestButton && canInvest && !isFullyFunded && (
            <Button
              onClick={() => onInvest?.(listing)}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Invest Now
            </Button>
          )}
          
          {isFullyFunded && (
            <Button
              disabled
              className="flex-1 bg-gray-600 text-gray-300 border-0"
            >
              <Target className="w-4 h-4 mr-2" />
              Fully Funded
            </Button>
          )}
          
          {is_expired && (
            <Button
              disabled
              className="flex-1 bg-gray-600 text-gray-300 border-0"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Campaign Ended
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => onViewDetails?.(listing)}
            className="flex items-center space-x-2 bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <span>Details</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketplaceListingCard;
