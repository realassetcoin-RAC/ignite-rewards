// =====================================================
// DAO TYPES AND INTERFACES
// Comprehensive TypeScript definitions for voting DAO
// =====================================================

export type ProposalStatus = 
  | 'draft'
  | 'active'
  | 'passed'
  | 'rejected'
  | 'executed'
  | 'approved'
  | 'implemented'
  | 'cancelled';

export type VotingType = 
  | 'simple_majority'
  | 'super_majority'
  | 'unanimous'
  | 'weighted'
  | 'quadratic';

export type MemberRole = 
  | 'member'
  | 'moderator'
  | 'admin'
  | 'founder';

export type TreasuryTransactionType = 
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'proposal_funding'
  | 'reward_distribution';

export type VoteChoice = 'yes' | 'no' | 'abstain';

// =====================================================
// CORE DAO INTERFACES
// =====================================================

export interface DAOOrganization {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  discord_url?: string;
  twitter_url?: string;
  github_url?: string;
  governance_token_address?: string;
  governance_token_symbol?: string;
  governance_token_decimals: number;
  min_proposal_threshold: number;
  voting_period_days: number;
  execution_delay_hours: number;
  quorum_percentage: number;
  super_majority_threshold: number;
  treasury_address?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface DAOMember {
  id: string;
  dao_id: string;
  user_id: string;
  wallet_address?: string;
  role: MemberRole;
  governance_tokens: number;
  voting_power: number;
  joined_at: string;
  last_active_at: string;
  is_active: boolean;
  // Extended fields
  user_email?: string;
  user_avatar_url?: string;
  user_full_name?: string;
}

export interface DAOProposal {
  id: string;
  dao_id: string;
  proposer_id: string;
  title: string;
  description: string;
  full_description?: string;
  category: string;
  voting_type: VotingType;
  status: ProposalStatus;
  
  // Voting parameters
  start_time?: string;
  end_time?: string;
  execution_time?: string;
  
  // Voting results
  total_votes: number;
  yes_votes: number;
  no_votes: number;
  abstain_votes: number;
  participation_rate: number;
  
  // Treasury impact
  treasury_impact_amount: number;
  treasury_impact_currency: string;
  
  // Metadata
  tags: string[];
  external_links?: Record<string, string>;
  attachments?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  executed_at?: string;
  
  // Extended fields
  dao_name?: string;
  proposer_email?: string;
  proposer_tokens?: number;
  voting_status?: 'upcoming' | 'active' | 'ended';
  user_vote?: VoteChoice;
  user_voting_power?: number;
  can_vote?: boolean;
  can_execute?: boolean;
}

export interface DAOVote {
  id: string;
  proposal_id: string;
  voter_id: string;
  vote_choice: VoteChoice;
  voting_power: number;
  voting_weight: number;
  reason?: string;
  transaction_hash?: string;
  created_at: string;
  // Extended fields
  voter_email?: string;
  voter_avatar_url?: string;
}

export interface DAOTreasuryTransaction {
  id: string;
  dao_id: string;
  proposal_id?: string;
  transaction_type: TreasuryTransactionType;
  amount: number;
  currency: string;
  from_address?: string;
  to_address?: string;
  description?: string;
  transaction_hash?: string;
  block_number?: number;
  created_by?: string;
  created_at: string;
  executed_at?: string;
  // Extended fields
  creator_email?: string;
  proposal_title?: string;
}

export interface DAOProposalComment {
  id: string;
  proposal_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Extended fields
  user_email?: string;
  user_avatar_url?: string;
  user_full_name?: string;
  replies?: DAOProposalComment[];
  reply_count?: number;
}

export interface DAOTokenSnapshot {
  id: string;
  dao_id: string;
  proposal_id: string;
  user_id: string;
  token_balance: number;
  voting_power: number;
  snapshot_block?: number;
  created_at: string;
}

export interface DAONotification {
  id: string;
  dao_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  proposal_id?: string;
  is_read: boolean;
  created_at: string;
  // Extended fields
  dao_name?: string;
  proposal_title?: string;
}

// =====================================================
// FORM INTERFACES
// =====================================================

export interface CreateProposalForm {
  title: string;
  description: string;
  full_description?: string;
  category: string;
  voting_type: VotingType;
  treasury_impact_amount?: number;
  treasury_impact_currency: string;
  tags: string[];
  external_links?: Record<string, string>;
  attachments?: File[];
}

export interface CreateDAOForm {
  name: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  discord_url?: string;
  twitter_url?: string;
  github_url?: string;
  governance_token_address?: string;
  governance_token_symbol?: string;
  min_proposal_threshold: number;
  voting_period_days: number;
  execution_delay_hours: number;
  quorum_percentage: number;
  super_majority_threshold: number;
  treasury_address?: string;
}

export interface VoteForm {
  proposal_id: string;
  vote_choice: VoteChoice;
  reason?: string;
}

export interface CommentForm {
  proposal_id: string;
  parent_comment_id?: string;
  content: string;
}

// =====================================================
// API RESPONSE INTERFACES
// =====================================================

export interface DAOListResponse {
  daos: DAOOrganization[];
  total: number;
  page: number;
  limit: number;
}

export interface ProposalListResponse {
  proposals: DAOProposal[];
  total: number;
  page: number;
  limit: number;
}

export interface VoteListResponse {
  votes: DAOVote[];
  total: number;
  page: number;
  limit: number;
}

export interface MemberListResponse {
  members: DAOMember[];
  total: number;
  page: number;
  limit: number;
}

export interface TreasuryTransactionListResponse {
  transactions: DAOTreasuryTransaction[];
  total: number;
  page: number;
  limit: number;
}

// =====================================================
// STATISTICS INTERFACES
// =====================================================

export interface DAOStats {
  total_members: number;
  active_members: number;
  total_proposals: number;
  active_proposals: number;
  total_treasury_value: number;
  treasury_currency: string;
  participation_rate: number;
  average_voting_power: number;
}

export interface ProposalStats {
  total_votes: number;
  participation_rate: number;
  yes_percentage: number;
  no_percentage: number;
  abstain_percentage: number;
  time_remaining?: number;
  quorum_met: boolean;
  threshold_met: boolean;
}

export interface VotingAnalytics {
  total_voters: number;
  participation_rate: number;
  vote_distribution: {
    yes: number;
    no: number;
    abstain: number;
  };
  voting_power_distribution: {
    high_power: number; // > 10%
    medium_power: number; // 1-10%
    low_power: number; // < 1%
  };
  voting_timeline: Array<{
    date: string;
    votes_cast: number;
    cumulative_participation: number;
  }>;
}

// =====================================================
// WALLET INTEGRATION INTERFACES
// =====================================================

export interface SolanaWalletInfo {
  publicKey: string;
  balance: number;
  governance_tokens: number;
  voting_power: number;
  is_connected: boolean;
}

export interface GovernanceTokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  total_supply: number;
  user_balance: number;
  user_voting_power: number;
}

// =====================================================
// FILTER AND SORT INTERFACES
// =====================================================

export interface ProposalFilters {
  status?: ProposalStatus[];
  category?: string[];
  voting_type?: VotingType[];
  proposer_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  tags?: string[];
  search?: string;
}

export interface ProposalSortOptions {
  field: 'created_at' | 'end_time' | 'total_votes' | 'participation_rate';
  direction: 'asc' | 'desc';
}

export interface MemberFilters {
  role?: MemberRole[];
  is_active?: boolean;
  min_tokens?: number;
  max_tokens?: number;
  search?: string;
}

export interface MemberSortOptions {
  field: 'joined_at' | 'governance_tokens' | 'voting_power' | 'last_active_at';
  direction: 'asc' | 'desc';
}

// =====================================================
// ERROR INTERFACES
// =====================================================

export interface DAOError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type DAOAction = 
  | 'create_proposal'
  | 'vote'
  | 'execute_proposal'
  | 'manage_members'
  | 'manage_treasury'
  | 'update_dao_settings';

export type NotificationType = 
  | 'proposal_created'
  | 'proposal_ended'
  | 'vote_cast'
  | 'proposal_executed'
  | 'member_joined'
  | 'treasury_transaction'
  | 'comment_added';

export interface DAOPermission {
  action: DAOAction;
  allowed: boolean;
  reason?: string;
}

// =====================================================
// CONSTANTS
// =====================================================

export const PROPOSAL_CATEGORIES = [
  'governance',
  'treasury',
  'technical',
  'community',
  'partnership',
  'marketing',
  'general'
] as const;

export const VOTING_TYPES: Record<VotingType, { label: string; description: string }> = {
  simple_majority: {
    label: 'Simple Majority',
    description: 'Proposal passes with >50% yes votes'
  },
  super_majority: {
    label: 'Super Majority',
    description: 'Proposal passes with >66.67% yes votes'
  },
  unanimous: {
    label: 'Unanimous',
    description: 'Proposal requires 100% yes votes'
  },
  weighted: {
    label: 'Weighted Voting',
    description: 'Voting power based on token holdings'
  },
  quadratic: {
    label: 'Quadratic Voting',
    description: 'Voting power is square root of token holdings'
  }
};

export const MEMBER_ROLES: Record<MemberRole, { label: string; description: string; permissions: DAOAction[] }> = {
  member: {
    label: 'Member',
    description: 'Basic member with voting rights',
    permissions: ['vote']
  },
  moderator: {
    label: 'Moderator',
    description: 'Can moderate discussions and proposals',
    permissions: ['vote', 'create_proposal']
  },
  admin: {
    label: 'Admin',
    description: 'Can manage DAO settings and members',
    permissions: ['vote', 'create_proposal', 'execute_proposal', 'manage_members', 'manage_treasury']
  },
  founder: {
    label: 'Founder',
    description: 'Full administrative access',
    permissions: ['vote', 'create_proposal', 'execute_proposal', 'manage_members', 'manage_treasury', 'update_dao_settings']
  }
};

export const TREASURY_CURRENCIES = [
  'SOL',
  'USDC',
  'USDT',
  'RAY',
  'SRM'
] as const;

export const DEFAULT_DAO_SETTINGS = {
  min_proposal_threshold: 1000,
  voting_period_days: 7,
  execution_delay_hours: 24,
  quorum_percentage: 10.0,
  super_majority_threshold: 66.67,
  governance_token_decimals: 9
} as const;
