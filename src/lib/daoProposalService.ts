// import { DAOService } from './daoService';

export interface ProposalRequest {
  title: string;
  description: string;
  proposal_type: 'marketplace_config' | 'nft_config' | 'rewards_config' | 'governance';
  target_contract?: string;
  target_function?: string;
  parameters?: Record<string, any>;
  created_by: string;
}

export interface ProposalResponse {
  success: boolean;
  proposal_id?: string;
  message: string;
}

export class DAOProposalService {
  /**
   * Create a DAO proposal for marketplace configuration changes
   */
  static async createMarketplaceProposal(
    title: string,
    description: string,
    changes: Record<string, any>,
    createdBy: string
  ): Promise<ProposalResponse> {
    try {
      const proposalData = {
        title,
        description,
        proposal_type: 'marketplace_config',
        target_contract: 'marketplace_smart_contract',
        target_function: 'update_marketplace_config',
        parameters: changes,
        created_by: createdBy,
        status: 'pending',
        voting_start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        voting_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('dao_proposals')
        .insert([proposalData])
        .select()
        .single();

      if (error) {
        console.error('Error creating marketplace proposal:', error);
        return { success: false, message: 'Failed to create proposal' };
      }

      return { 
        success: true, 
        proposal_id: data.id, 
        message: 'Marketplace configuration proposal created successfully' 
      };
    } catch (error) {
      console.error('Error creating marketplace proposal:', error);
      return { success: false, message: 'Failed to create proposal' };
    }
  }

  /**
   * Create a DAO proposal for NFT configuration changes
   */
  static async createNFTProposal(
    title: string,
    description: string,
    nftChanges: Record<string, any>,
    createdBy: string
  ): Promise<ProposalResponse> {
    try {
      const proposalData = {
        title,
        description,
        proposal_type: 'nft_config',
        target_contract: 'solana_dao_nft_contract',
        target_function: 'update_nft_config',
        parameters: nftChanges,
        created_by: createdBy,
        status: 'pending',
        voting_start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        voting_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('dao_proposals')
        .insert([proposalData])
        .select()
        .single();

      if (error) {
        console.error('Error creating NFT proposal:', error);
        return { success: false, message: 'Failed to create proposal' };
      }

      return { 
        success: true, 
        proposal_id: data.id, 
        message: 'NFT configuration proposal created successfully' 
      };
    } catch (error) {
      console.error('Error creating NFT proposal:', error);
      return { success: false, message: 'Failed to create proposal' };
    }
  }

  /**
   * Create a DAO proposal for rewards configuration changes
   */
  static async createRewardsProposal(
    title: string,
    description: string,
    rewardsChanges: Record<string, any>,
    createdBy: string
  ): Promise<ProposalResponse> {
    try {
      const proposalData = {
        title,
        description,
        proposal_type: 'rewards_config',
        target_contract: 'solana_dao_nft_contract',
        target_function: 'update_rewards_config',
        parameters: rewardsChanges,
        created_by: createdBy,
        status: 'pending',
        voting_start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        voting_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('dao_proposals')
        .insert([proposalData])
        .select()
        .single();

      if (error) {
        console.error('Error creating rewards proposal:', error);
        return { success: false, message: 'Failed to create proposal' };
      }

      return { 
        success: true, 
        proposal_id: data.id, 
        message: 'Rewards configuration proposal created successfully' 
      };
    } catch (error) {
      console.error('Error creating rewards proposal:', error);
      return { success: false, message: 'Failed to create proposal' };
    }
  }

  /**
   * Vote on a DAO proposal
   */
  static async voteOnProposal(
    proposalId: string,
    userId: string,
    vote: 'yes' | 'no' | 'abstain',
    votingPower: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('dao_votes')
        .select('*')
        .eq('proposal_id', proposalId)
        .eq('voter_id', userId)
        .single();

      if (existingVote) {
        return { success: false, message: 'You have already voted on this proposal' };
      }

      // Create vote record
      const { error } = await supabase
        .from('dao_votes')
        .insert([{
          proposal_id: proposalId,
          voter_id: userId,
          vote_type: vote,
          voting_power: votingPower,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error voting on proposal:', error);
        return { success: false, message: 'Failed to cast vote' };
      }

      return { success: true, message: 'Vote cast successfully' };
    } catch (error) {
      console.error('Error voting on proposal:', error);
      return { success: false, message: 'Failed to cast vote' };
    }
  }

  /**
   * Execute approved proposals
   */
  static async executeProposal(proposalId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get proposal details
      const { data: proposal, error: proposalError } = await supabase
        .from('dao_proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (proposalError || !proposal) {
        return { success: false, message: 'Proposal not found' };
      }

      if (proposal.status !== 'approved') {
        return { success: false, message: 'Proposal is not approved' };
      }

      // Execute based on proposal type
      switch (proposal.proposal_type) {
        case 'marketplace_config':
          await this.executeMarketplaceConfig(proposal.parameters);
          break;
        case 'nft_config':
          await this.executeNFTConfig(proposal.parameters);
          break;
        case 'rewards_config':
          await this.executeRewardsConfig(proposal.parameters);
          break;
        default:
          return { success: false, message: 'Unknown proposal type' };
      }

      // Update proposal status
      await supabase
        .from('dao_proposals')
        .update({ 
          status: 'implemented',
          executed_at: new Date().toISOString()
        })
        .eq('id', proposalId);

      return { success: true, message: 'Proposal executed successfully' };
    } catch (error) {
      console.error('Error executing proposal:', error);
      return { success: false, message: 'Failed to execute proposal' };
    }
  }

  /**
   * Execute marketplace configuration changes
   */
  private static async executeMarketplaceConfig(parameters: Record<string, any>): Promise<void> {
    // Update marketplace configuration in database
    if (parameters.nft_multiplier_cap) {
      await supabase
        .from('marketplace_config')
        .upsert([{
          key: 'nft_multiplier_cap',
          value: parameters.nft_multiplier_cap,
          updated_at: new Date().toISOString()
        }]);
    }

    if (parameters.minimum_investment) {
      await supabase
        .from('marketplace_config')
        .upsert([{
          key: 'minimum_investment',
          value: parameters.minimum_investment,
          updated_at: new Date().toISOString()
        }]);
    }
  }

  /**
   * Execute NFT configuration changes
   */
  private static async executeNFTConfig(parameters: Record<string, any>): Promise<void> {
    // Update NFT types in database
    if (parameters.nft_types) {
      for (const nftType of parameters.nft_types) {
        await supabase
          .from('nft_types')
          .update({
            buy_price_usdt: nftType.buy_price_usdt,
            earn_on_spend_ratio: nftType.earn_on_spend_ratio,
            upgrade_bonus_ratio: nftType.upgrade_bonus_ratio,
            evolution_min_investment: nftType.evolution_min_investment,
            evolution_earnings_ratio: nftType.evolution_earnings_ratio,
            updated_at: new Date().toISOString()
          })
          .eq('nft_name', nftType.nft_name)
          .eq('is_custodial', nftType.is_custodial);
      }
    }
  }

  /**
   * Execute rewards configuration changes
   */
  private static async executeRewardsConfig(parameters: Record<string, any>): Promise<void> {
    // Update rewards configuration in database
    if (parameters.distribution_interval) {
      await supabase
        .from('rewards_config')
        .upsert([{
          key: 'distribution_interval',
          value: parameters.distribution_interval,
          updated_at: new Date().toISOString()
        }]);
    }

    if (parameters.max_rewards_per_user) {
      await supabase
        .from('rewards_config')
        .upsert([{
          key: 'max_rewards_per_user',
          value: parameters.max_rewards_per_user,
          updated_at: new Date().toISOString()
        }]);
    }
  }

  /**
   * Get all pending proposals
   */
  static async getPendingProposals(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('dao_proposals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending proposals:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching pending proposals:', error);
      return [];
    }
  }

  /**
   * Get proposal voting results
   */
  static async getProposalResults(proposalId: string): Promise<any> {
    try {
      const { data: votes, error } = await supabase
        .from('dao_votes')
        .select('*')
        .eq('proposal_id', proposalId);

      if (error) {
        console.error('Error fetching proposal results:', error);
        return null;
      }

      const results = {
        total_votes: votes?.length || 0,
        yes_votes: votes?.filter(v => v.vote_type === 'yes').length || 0,
        no_votes: votes?.filter(v => v.vote_type === 'no').length || 0,
        abstain_votes: votes?.filter(v => v.vote_type === 'abstain').length || 0,
        total_voting_power: votes?.reduce((sum, v) => sum + (v.voting_power || 0), 0) || 0,
        yes_power: votes?.filter(v => v.vote_type === 'yes').reduce((sum, v) => sum + (v.voting_power || 0), 0) || 0,
        no_power: votes?.filter(v => v.vote_type === 'no').reduce((sum, v) => sum + (v.voting_power || 0), 0) || 0
      };

      return results;
    } catch (error) {
      console.error('Error fetching proposal results:', error);
      return null;
    }
  }
}
