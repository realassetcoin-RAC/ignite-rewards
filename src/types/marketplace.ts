// TypeScript interfaces for the Tokenized Asset and Initiative Marketplace

export type MarketplaceListingType = 'asset' | 'initiative';
export type MarketplaceListingStatus = 'draft' | 'active' | 'funded' | 'cancelled' | 'completed';
export type InvestmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';
export type CampaignType = 'time_bound' | 'open_ended';
export type RiskLevel = 'low' | 'medium' | 'high';
export type AssetType = 'real_estate' | 'startup_equity' | 'commodity' | 'crypto' | 'bonds' | 'reit' | 'other';

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  image_url?: string;
  listing_type: MarketplaceListingType;
  status: MarketplaceListingStatus;
  
  // Funding configuration
  total_funding_goal: number;
  current_funding_amount: number;
  investment_cap?: number;
  current_investor_count: number;
  
  // Campaign settings
  campaign_type: CampaignType;
  start_date?: string;
  end_date?: string;
  
  // Tokenization details
  token_symbol?: string;
  total_token_supply?: number;
  token_price?: number;
  
  // Asset/Initiative specific details
  asset_type?: AssetType;
  expected_return_rate?: number;
  risk_level: RiskLevel;
  minimum_investment: number;
  maximum_investment?: number;
  
  // Metadata
  tags?: string[];
  is_featured: boolean;
  is_verified: boolean;
  
  // Audit fields
  created_by: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  
  // Computed fields
  funding_progress_percentage?: number;
  days_remaining?: number;
  is_expired?: boolean;
}

export interface MarketplaceInvestment {
  id: string;
  user_id: string;
  listing_id: string;
  
  // Investment details
  investment_amount: number;
  token_amount: number;
  effective_investment_amount: number;
  nft_multiplier: number;
  
  // Status tracking
  status: InvestmentStatus;
  transaction_hash?: string;
  
  // Timestamps
  invested_at: string;
  confirmed_at?: string;
  cancelled_at?: string;
  
  // Audit fields
  created_at: string;
  updated_at: string;
  
  // Related data
  listing?: MarketplaceListing;
}

export interface PassiveIncomeDistribution {
  id: string;
  listing_id: string;
  distribution_period_start: string;
  distribution_period_end: string;
  
  // Distribution details
  total_distribution_amount: number;
  distribution_per_token: number;
  
  // Status
  is_processed: boolean;
  processed_at?: string;
  
  // Audit fields
  created_by: string;
  created_at: string;
}

export interface UserPassiveEarning {
  id: string;
  user_id: string;
  investment_id: string;
  distribution_id: string;
  
  // Earnings details
  token_amount: number;
  earnings_amount: number;
  is_claimed: boolean;
  claimed_at?: string;
  
  // Audit fields
  created_at: string;
  
  // Related data
  distribution?: PassiveIncomeDistribution;
  investment?: MarketplaceInvestment;
}

export interface NFTCardTier {
  id: string;
  tier_name: string;
  display_name: string;
  description?: string;
  
  // Investment benefits
  investment_multiplier: number;
  minimum_balance_required: number;
  
  // Access permissions
  can_access_premium_listings: boolean;
  can_access_early_listings: boolean;
  
  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceAnalytics {
  id: string;
  listing_id?: string;
  
  // View and interaction tracking
  total_views: number;
  unique_viewers: number;
  total_investments: number;
  total_investment_amount: number;
  
  // Time-based metrics
  date_recorded: string;
  
  // Audit fields
  created_at: string;
  updated_at: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  short_description?: string;
  image_url?: string;
  listing_type: MarketplaceListingType;
  
  // Funding configuration
  total_funding_goal: number;
  investment_cap?: number;
  
  // Campaign settings
  campaign_type: CampaignType;
  start_date?: string;
  end_date?: string;
  
  // Tokenization details
  token_symbol?: string;
  total_token_supply?: number;
  token_price?: number;
  
  // Asset/Initiative specific details
  asset_type?: AssetType;
  expected_return_rate?: number;
  expected_return_period?: number;
  risk_level: RiskLevel;
  minimum_investment: number;
  maximum_investment?: number;
  
  // Database required fields
  category?: string;
  status?: string;
  is_featured?: boolean;
  is_verified?: boolean;
  
  // Metadata
  tags?: string[];
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {
  id: string;
}

export interface InvestmentRequest {
  listing_id: string;
  investment_amount: number;
}

export interface InvestmentResponse {
  success: boolean;
  investment?: MarketplaceInvestment;
  error?: string;
  message?: string;
}

export interface MarketplaceStats {
  total_listings: number;
  active_listings: number;
  total_investments: number;
  total_funding_raised: number;
  total_users_invested: number;
  average_investment_amount: number;
  top_performing_assets: MarketplaceListing[];
  recent_investments: MarketplaceInvestment[];
}

export interface UserMarketplaceStats {
  total_investments: number;
  total_invested_amount: number;
  total_earnings: number;
  total_unclaimed_earnings: number;
  active_investments: number;
  completed_investments: number;
  nft_multiplier: number;
  nft_tier?: NFTCardTier;
}

export interface MarketplaceFilters {
  listing_type?: MarketplaceListingType;
  status?: MarketplaceListingStatus;
  asset_type?: AssetType;
  risk_level?: RiskLevel;
  campaign_type?: CampaignType;
  min_investment?: number;
  max_investment?: number;
  min_return_rate?: number;
  max_return_rate?: number;
  tags?: string[];
  is_featured?: boolean;
  is_verified?: boolean;
  search_query?: string;
}

export interface MarketplaceSortOptions {
  field: 'created_at' | 'total_funding_goal' | 'current_funding_amount' | 'expected_return_rate' | 'risk_level' | 'end_date';
  direction: 'asc' | 'desc';
}

export interface MarketplacePagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface MarketplaceListingsResponse {
  listings: MarketplaceListing[];
  pagination: MarketplacePagination;
  filters: MarketplaceFilters;
  sort: MarketplaceSortOptions;
}

export interface DAOMarketplaceProposal {
  id: string;
  proposal_type: 'listing_approval' | 'marketplace_config_change' | 'nft_tier_update';
  listing_id?: string;
  title: string;
  description: string;
  proposed_changes: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  created_by: string;
  created_at: string;
  approved_at?: string;
  implemented_at?: string;
}

// Error types
export interface MarketplaceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: MarketplaceError;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: MarketplacePagination;
  error?: MarketplaceError;
}

// Component Props types
export interface MarketplaceListingCardProps {
  listing: MarketplaceListing;
  onInvest?: (listing: MarketplaceListing) => void;
  onViewDetails?: (listing: MarketplaceListing) => void;
  showInvestButton?: boolean;
  className?: string;
}

export interface InvestmentModalProps {
  listing: MarketplaceListing;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (investment: MarketplaceInvestment) => void;
}

export interface MarketplaceFiltersProps {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: MarketplaceFilters) => void;
  onReset: () => void;
}

export interface ProgressBarProps {
  current: number;
  total: number;
  showPercentage?: boolean;
  showAmount?: boolean;
  className?: string;
}

export interface CountdownTimerProps {
  endDate: string;
  onExpire?: () => void;
  className?: string;
}

// Hook return types
export interface UseMarketplaceListingsReturn {
  listings: MarketplaceListing[];
  loading: boolean;
  error: string | null;
  pagination: MarketplacePagination;
  filters: MarketplaceFilters;
  sort: MarketplaceSortOptions;
  refetch: () => Promise<void>;
  updateFilters: (filters: MarketplaceFilters) => void;
  updateSort: (sort: MarketplaceSortOptions) => void;
  loadMore: () => Promise<void>;
}

export interface UseUserInvestmentsReturn {
  investments: MarketplaceInvestment[];
  loading: boolean;
  error: string | null;
  stats: UserMarketplaceStats;
  refetch: () => Promise<void>;
  invest: (request: InvestmentRequest) => Promise<InvestmentResponse>;
  claimEarnings: (earningId: string) => Promise<boolean>;
}

export interface UseMarketplaceStatsReturn {
  stats: MarketplaceStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
