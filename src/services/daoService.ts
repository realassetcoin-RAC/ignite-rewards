// DAO Service for local PostgreSQL database
// This service handles DAO-related database operations

export interface DAOOrganization {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  discord_url?: string;
  twitter_url?: string;
  github_url?: string;
  governance_token_symbol: string;
  governance_token_decimals: number;
  min_proposal_threshold: number;
  voting_period_days: number;
  execution_delay_hours: number;
  quorum_percentage: number;
  super_majority_threshold: number;
  treasury_address?: string;
  is_active: boolean;
  created_at: string;
}

export interface Proposal {
  id: string;
  dao_id: string;
  proposer_id: string;
  title: string;
  description: string;
  category: 'rewards' | 'treasury' | 'governance' | 'technical' | 'other';
  voting_type: 'simple_majority' | 'super_majority' | 'unanimous';
  status: 'draft' | 'active' | 'passed' | 'failed' | 'executed';
  start_time?: string;
  end_time?: string;
  total_votes: number;
  yes_votes: number;
  no_votes: number;
  abstain_votes: number;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  proposal_id: string;
  voter_id: string;
  vote_type: 'yes' | 'no' | 'abstain';
  voting_power: number;
  created_at: string;
}

class DAOService {
  private baseUrl: string;

  constructor() {
    // For local development, you might want to use a different approach
    // This assumes you have a local API server running
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }

  // Get all active DAO organizations
  async getDAOOrganizations(): Promise<DAOOrganization[]> {
    try {
      const response = await fetch(`${this.baseUrl}/dao/organizations`);
      if (!response.ok) {
        throw new Error('Failed to fetch DAO organizations');
      }
      return await response.json();
    } catch {
      // Error fetching DAO organizations:
      // Return mock data for development
      return this.getMockDAOOrganizations();
    }
  }

  // Get all proposals with optional filtering
  async getProposals(filters?: {
    daoId?: string;
    status?: string;
    category?: string;
  }): Promise<Proposal[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.daoId) params.append('daoId', filters.daoId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);

      const response = await fetch(`${this.baseUrl}/dao/proposals?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }
      return await response.json();
    } catch {
      // Error fetching proposals:
      // Return mock data for development
      return this.getMockProposals();
    }
  }

  // Submit a vote on a proposal
  async submitVote(proposalId: string, voteType: 'yes' | 'no' | 'abstain', voterId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/dao/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: proposalId,
          voter_id: voterId,
          vote_type: voteType,
          voting_power: 1, // Default voting power
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      return true;
    } catch {
      // Error submitting vote:
      return false;
    }
  }

  // Get voting statistics
  async getVotingStats(): Promise<{
    total_proposals: number;
    active_proposals: number;
    passed_proposals: number;
    failed_proposals: number;
    total_voters: number;
    total_daos: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/dao/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch voting stats');
      }
      return await response.json();
    } catch {
      // Error fetching voting stats:
      // Return mock data for development
      return {
        total_proposals: 2,
        active_proposals: 1,
        passed_proposals: 0,
        failed_proposals: 0,
        total_voters: 1250,
        total_daos: 2,
      };
    }
  }

  // Mock data for development
  private getMockDAOOrganizations(): DAOOrganization[] {
    return [
      {
        id: '1',
        name: 'RAC Rewards DAO',
        description: 'The official DAO for RAC Rewards platform governance',
        logo_url: 'https://example.com/rac-dao-logo.png',
        website_url: 'https://rac-rewards.com/dao',
        discord_url: 'https://discord.gg/rac-rewards',
        twitter_url: 'https://twitter.com/rac_rewards',
        github_url: 'https://github.com/rac-rewards',
        governance_token_symbol: 'RAC',
        governance_token_decimals: 9,
        min_proposal_threshold: 1000,
        voting_period_days: 7,
        execution_delay_hours: 24,
        quorum_percentage: 10.0,
        super_majority_threshold: 66.67,
        treasury_address: 'TreasuryWallet123456789',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Community DAO',
        description: 'Community-driven governance for platform decisions',
        logo_url: 'https://example.com/community-dao-logo.png',
        website_url: 'https://community.rac-rewards.com',
        discord_url: 'https://discord.gg/rac-community',
        twitter_url: 'https://twitter.com/rac_community',
        github_url: 'https://github.com/rac-community',
        governance_token_symbol: 'COMM',
        governance_token_decimals: 9,
        min_proposal_threshold: 500,
        voting_period_days: 5,
        execution_delay_hours: 12,
        quorum_percentage: 15.0,
        super_majority_threshold: 60.0,
        treasury_address: 'CommunityTreasury123456789',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
  }

  private getMockProposals(): Proposal[] {
    return [
      {
        id: '1',
        dao_id: '1',
        proposer_id: '00000000-0000-0000-0000-000000000001',
        title: 'Increase NFT Rewards Rate',
        description: 'Proposal to increase the rewards rate for NFT holders from 1% to 1.5%',
        category: 'rewards',
        voting_type: 'simple_majority',
        status: 'active',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        total_votes: 0,
        yes_votes: 0,
        no_votes: 0,
        abstain_votes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        dao_id: '2',
        proposer_id: '00000000-0000-0000-0000-000000000001',
        title: 'Community Treasury Allocation',
        description: 'Allocate 10,000 SOL from community treasury for marketing initiatives',
        category: 'treasury',
        voting_type: 'super_majority',
        status: 'draft',
        start_time: undefined,
        end_time: undefined,
        total_votes: 0,
        yes_votes: 0,
        no_votes: 0,
        abstain_votes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }
}

export const daoService = new DAOService();
