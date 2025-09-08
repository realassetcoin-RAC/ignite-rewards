// Utility functions for the marketplace system

import { MarketplaceListing, MarketplaceFilters, MarketplaceSortOptions } from '@/types/marketplace';

/**
 * Format currency values for display
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format large numbers with appropriate suffixes
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Calculate days remaining until a date
 */
export const calculateDaysRemaining = (endDate: string): number => {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Check if a campaign has expired
 */
export const isCampaignExpired = (endDate: string): boolean => {
  return new Date(endDate) < new Date();
};

/**
 * Calculate funding progress percentage
 */
export const calculateFundingProgress = (current: number, goal: number): number => {
  if (goal === 0) return 0;
  return Math.min(100, (current / goal) * 100);
};

/**
 * Calculate user's effective investment amount with NFT multiplier
 */
export const calculateEffectiveInvestment = (amount: number, multiplier: number): number => {
  return amount * multiplier;
};

/**
 * Calculate tokens received for investment
 */
export const calculateTokensReceived = (investmentAmount: number, tokenPrice: number): number => {
  if (tokenPrice === 0) return 0;
  return Math.floor(investmentAmount / tokenPrice);
};

/**
 * Calculate passive income earnings
 */
export const calculatePassiveEarnings = (
  tokenAmount: number,
  distributionPerToken: number
): number => {
  return tokenAmount * distributionPerToken;
};

/**
 * Filter listings based on criteria
 */
export const filterListings = (
  listings: MarketplaceListing[],
  filters: MarketplaceFilters
): MarketplaceListing[] => {
  return listings.filter(listing => {
    // Listing type filter
    if (filters.listing_type && listing.listing_type !== filters.listing_type) {
      return false;
    }

    // Status filter
    if (filters.status && listing.status !== filters.status) {
      return false;
    }

    // Asset type filter
    if (filters.asset_type && listing.asset_type !== filters.asset_type) {
      return false;
    }

    // Risk level filter
    if (filters.risk_level && listing.risk_level !== filters.risk_level) {
      return false;
    }

    // Campaign type filter
    if (filters.campaign_type && listing.campaign_type !== filters.campaign_type) {
      return false;
    }

    // Investment amount filters
    if (filters.min_investment && listing.minimum_investment < filters.min_investment) {
      return false;
    }

    if (filters.max_investment && listing.minimum_investment > filters.max_investment) {
      return false;
    }

    // Return rate filters
    if (filters.min_return_rate && (!listing.expected_return_rate || listing.expected_return_rate < filters.min_return_rate)) {
      return false;
    }

    if (filters.max_return_rate && (!listing.expected_return_rate || listing.expected_return_rate > filters.max_return_rate)) {
      return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        listing.tags?.some(listingTag => 
          listingTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) return false;
    }

    // Featured filter
    if (filters.is_featured !== undefined && listing.is_featured !== filters.is_featured) {
      return false;
    }

    // Verified filter
    if (filters.is_verified !== undefined && listing.is_verified !== filters.is_verified) {
      return false;
    }

    // Search query filter
    if (filters.search_query) {
      const query = filters.search_query.toLowerCase();
      const matchesTitle = listing.title.toLowerCase().includes(query);
      const matchesDescription = listing.description.toLowerCase().includes(query);
      const matchesShortDescription = listing.short_description?.toLowerCase().includes(query) || false;
      const matchesTags = listing.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
      
      if (!matchesTitle && !matchesDescription && !matchesShortDescription && !matchesTags) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort listings based on criteria
 */
export const sortListings = (
  listings: MarketplaceListing[],
  sort: MarketplaceSortOptions
): MarketplaceListing[] => {
  return [...listings].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sort.field) {
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'total_funding_goal':
        aValue = a.total_funding_goal;
        bValue = b.total_funding_goal;
        break;
      case 'current_funding_amount':
        aValue = a.current_funding_amount;
        bValue = b.current_funding_amount;
        break;
      case 'expected_return_rate':
        aValue = a.expected_return_rate || 0;
        bValue = b.expected_return_rate || 0;
        break;
      case 'risk_level':
        const riskOrder = { low: 1, medium: 2, high: 3 };
        aValue = riskOrder[a.risk_level as keyof typeof riskOrder] || 0;
        bValue = riskOrder[b.risk_level as keyof typeof riskOrder] || 0;
        break;
      case 'end_date':
        aValue = a.end_date ? new Date(a.end_date).getTime() : 0;
        bValue = b.end_date ? new Date(b.end_date).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (sort.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

/**
 * Paginate listings
 */
export const paginateListings = (
  listings: MarketplaceListing[],
  page: number,
  limit: number
): { listings: MarketplaceListing[]; pagination: any } => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedListings = listings.slice(startIndex, endIndex);
  
  const totalPages = Math.ceil(listings.length / limit);
  
  return {
    listings: paginatedListings,
    pagination: {
      page,
      limit,
      total: listings.length,
      total_pages: totalPages,
    }
  };
};

/**
 * Validate investment amount
 */
export const validateInvestmentAmount = (
  amount: number,
  listing: MarketplaceListing,
  userBalance: number
): { isValid: boolean; error?: string } => {
  if (amount <= 0) {
    return { isValid: false, error: 'Investment amount must be greater than 0' };
  }

  if (amount < listing.minimum_investment) {
    return { 
      isValid: false, 
      error: `Minimum investment is ${formatCurrency(listing.minimum_investment)}` 
    };
  }

  if (listing.maximum_investment && amount > listing.maximum_investment) {
    return { 
      isValid: false, 
      error: `Maximum investment is ${formatCurrency(listing.maximum_investment)}` 
    };
  }

  if (amount > userBalance) {
    return { 
      isValid: false, 
      error: 'Insufficient balance for this investment' 
    };
  }

  const remainingFunding = listing.total_funding_goal - listing.current_funding_amount;
  if (amount > remainingFunding) {
    return { 
      isValid: false, 
      error: `Investment exceeds remaining funding goal of ${formatCurrency(remainingFunding)}` 
    };
  }

  return { isValid: true };
};

/**
 * Get risk level color classes
 */
export const getRiskLevelColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'low':
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'medium':
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'high':
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    default:
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

/**
 * Get status color classes
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'funded':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'cancelled':
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'completed':
      return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
    case 'draft':
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    default:
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

/**
 * Calculate time remaining in a readable format
 */
export const formatTimeRemaining = (endDate: string): string => {
  const days = calculateDaysRemaining(endDate);
  
  if (days === 0) {
    return 'Ends today';
  } else if (days === 1) {
    return '1 day left';
  } else if (days < 7) {
    return `${days} days left`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} left`;
  } else {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} left`;
  }
};

/**
 * Generate a unique investment ID
 */
export const generateInvestmentId = (): string => {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate compound interest for passive income projections
 */
export const calculateCompoundInterest = (
  principal: number,
  annualRate: number,
  years: number,
  compoundingFrequency: number = 12
): number => {
  const rate = annualRate / 100;
  const amount = principal * Math.pow(1 + (rate / compoundingFrequency), compoundingFrequency * years);
  return amount - principal;
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get asset type display name
 */
export const getAssetTypeDisplayName = (assetType: string): string => {
  const displayNames: Record<string, string> = {
    'real_estate': 'Real Estate',
    'startup_equity': 'Startup Equity',
    'commodity': 'Commodity',
    'crypto': 'Cryptocurrency',
    'bonds': 'Bonds',
    'reit': 'REIT',
    'other': 'Other'
  };
  
  return displayNames[assetType] || assetType;
};

/**
 * Check if user can invest in a listing
 */
export const canUserInvest = (
  listing: MarketplaceListing,
  userBalance: number,
  hasExistingInvestment: boolean = false
): { canInvest: boolean; reason?: string } => {
  if (listing.status !== 'active') {
    return { canInvest: false, reason: 'This listing is not currently accepting investments' };
  }

  if (listing.is_expired) {
    return { canInvest: false, reason: 'This campaign has expired' };
  }

  if (hasExistingInvestment) {
    return { canInvest: false, reason: 'You have already invested in this listing' };
  }

  if (userBalance < listing.minimum_investment) {
    return { canInvest: false, reason: 'Insufficient balance for minimum investment' };
  }

  const remainingFunding = listing.total_funding_goal - listing.current_funding_amount;
  if (remainingFunding <= 0) {
    return { canInvest: false, reason: 'This listing is fully funded' };
  }

  return { canInvest: true };
};
