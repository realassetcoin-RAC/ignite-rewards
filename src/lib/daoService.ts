import { supabase } from '@/integrations/supabase/client';
import { DAOProposal, DAOMember, DAOOrganization, DAOStats } from '@/types/dao';

export class DAOService {
  /**
   * Load DAO organizations
   */
  static async getOrganizations(): Promise<DAOOrganization[]> {
    try {
      const { data, error } = await supabase
        .from('dao_organizations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('DAO organizations table does not exist yet, returning empty array');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error loading DAO organizations:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  /**
   * Load DAO proposals for a specific organization
   */
  static async getProposals(daoId: string): Promise<DAOProposal[]> {
    try {
      const { data, error } = await supabase
        .from('dao_proposals')
        .select(`
          *,
          dao_organizations(name)
        `)
        .eq('dao_id', daoId)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('DAO proposals table does not exist yet, returning empty array');
          return [];
        }
        throw error;
      }

      // Map database data to DAOProposal interface
      const proposals: DAOProposal[] = (data || []).map((proposal: any) => ({
        id: proposal.id,
        dao_id: proposal.dao_id,
        proposer_id: proposal.proposer_id,
        title: proposal.title,
        description: proposal.description,
        full_description: proposal.full_description,
        category: proposal.category,
        voting_type: proposal.voting_type,
        status: proposal.status,
        start_time: proposal.start_time,
        end_time: proposal.end_time,
        execution_time: proposal.execution_time,
        total_votes: proposal.total_votes || 0,
        yes_votes: proposal.yes_votes || 0,
        no_votes: proposal.no_votes || 0,
        abstain_votes: proposal.abstain_votes || 0,
        participation_rate: proposal.participation_rate || 0,
        treasury_impact_amount: proposal.treasury_impact_amount || 0,
        treasury_impact_currency: proposal.treasury_impact_currency || 'SOL',
        tags: proposal.tags || [],
        created_at: proposal.created_at,
        updated_at: proposal.updated_at,
        dao_name: proposal.dao_organizations?.name || 'Unknown DAO',
        proposer_email: proposal.proposer_email || 'unknown@example.com',
        proposer_tokens: proposal.proposer_tokens || 0,
        voting_status: proposal.status === 'active' ? 'active' : 'inactive',
        can_vote: proposal.status === 'active' && !proposal.user_vote,
        can_execute: proposal.status === 'passed' && proposal.proposer_id === proposal.current_user_id
      }));

      return proposals;
    } catch (error) {
      console.error('Error loading DAO proposals:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  /**
   * Load DAO members for a specific organization
   */
  static async getMembers(daoId: string): Promise<DAOMember[]> {
    try {
      const { data, error } = await supabase
        .from('dao_members')
        .select(`
          *,
          dao_organizations(name)
        `)
        .eq('dao_id', daoId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('DAO members table does not exist yet, returning empty array');
          return [];
        }
        throw error;
      }

      // Map database data to DAOMember interface
      const members: DAOMember[] = (data || []).map((member: any) => ({
        id: member.id,
        dao_id: member.dao_id,
        user_id: member.user_id,
        wallet_address: member.wallet_address,
        role: member.role,
        governance_tokens: Number(member.governance_tokens) || 0,
        voting_power: Number(member.voting_power) || 0,
        joined_at: member.joined_at,
        last_active_at: member.last_active_at,
        is_active: member.is_active,
        user_email: member.user_email,
        user_full_name: member.user_full_name
      }));

      return members;
    } catch (error) {
      console.error('Error loading DAO members:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  /**
   * Get user's membership in a DAO
   */
  static async getUserMembership(daoId: string, userId: string): Promise<DAOMember | null> {
    try {
      const { data, error } = await supabase
        .from('dao_members')
        .select('*')
        .eq('dao_id', daoId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      if (!data) return null;

      return {
        id: data.id,
        dao_id: data.dao_id,
        user_id: data.user_id,
        wallet_address: data.wallet_address,
        role: data.role,
        governance_tokens: Number(data.governance_tokens) || 0,
        voting_power: Number(data.voting_power) || 0,
        joined_at: data.joined_at,
        last_active_at: data.last_active_at,
        is_active: data.is_active,
        user_email: data.user_email,
        user_full_name: data.user_full_name
      };
    } catch (error) {
      console.error('Error loading user membership:', error);
      return null;
    }
  }

  /**
   * Cast a vote on a proposal
   */
  static async castVote(proposalId: string, userId: string, choice: 'yes' | 'no' | 'abstain', votingPower: number, reason?: string): Promise<void> {
    try {
      console.log('🗳️ Casting vote:', { proposalId, userId, choice, votingPower, reason });

      // Validate UUID format for proposalId
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(proposalId)) {
        throw new Error(`Invalid proposal ID format: ${proposalId}. Expected a valid UUID.`);
      }

      // Validate UUID format for userId
      if (!uuidRegex.test(userId)) {
        throw new Error(`Invalid user ID format: ${userId}. Expected a valid UUID.`);
      }

      // First, verify the proposal exists in the database
      const { data: proposal, error: proposalError } = await supabase
        .from('dao_proposals' as any)
        .select('id, status')
        .eq('id', proposalId)
        .single();

      if (proposalError || !proposal) {
        throw new Error(`Proposal not found: ${proposalId}. This may be a sample proposal that doesn't exist in the database.`);
      }

      if (proposal.status !== 'active') {
        throw new Error(`Proposal is not active for voting. Current status: ${proposal.status}`);
      }

      // Then, check if user already voted
      const { data: existingVote, error: checkError } = await supabase
        .from('dao_votes')
        .select('id')
        .eq('proposal_id', proposalId)
        .eq('voter_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing vote:', checkError);
        throw new Error(`Failed to check existing vote: ${checkError.message}`);
      }

      if (existingVote) {
        throw new Error('You have already voted on this proposal');
      }

      // Cast the vote
      const { error: voteError } = await supabase
        .from('dao_votes')
        .insert({
          proposal_id: proposalId,
          voter_id: userId,
          vote_choice: choice,
          voting_power: votingPower,
          voting_weight: votingPower, // Set voting_weight same as voting_power for now
          reason
        });

      if (voteError) {
        console.error('Error inserting vote:', voteError);
        // If table doesn't exist, provide a helpful error message
        if (voteError.message.includes('relation') || voteError.message.includes('does not exist')) {
          throw new Error('DAO voting system is not set up yet. Please contact an administrator.');
        }
        throw new Error(`Failed to cast vote: ${voteError.message}`);
      }

      // Update proposal vote counts - first get current counts, then update
      const { data: currentProposal, error: fetchError } = await supabase
        .from('dao_proposals' as any)
        .select('total_votes, yes_votes, no_votes, abstain_votes')
        .eq('id', proposalId)
        .single();

      if (fetchError) {
        console.error('Error fetching current proposal counts:', fetchError);
        throw new Error(`Failed to fetch proposal counts: ${fetchError.message}`);
      }

      // Calculate new vote counts
      const newTotalVotes = (currentProposal.total_votes || 0) + 1;
      const newYesVotes = choice === 'yes' ? (currentProposal.yes_votes || 0) + 1 : (currentProposal.yes_votes || 0);
      const newNoVotes = choice === 'no' ? (currentProposal.no_votes || 0) + 1 : (currentProposal.no_votes || 0);
      const newAbstainVotes = choice === 'abstain' ? (currentProposal.abstain_votes || 0) + 1 : (currentProposal.abstain_votes || 0);

      const { error: updateError } = await supabase
        .from('dao_proposals' as any)
        .update({
          total_votes: newTotalVotes,
          yes_votes: newYesVotes,
          no_votes: newNoVotes,
          abstain_votes: newAbstainVotes
        })
        .eq('id', proposalId);

      if (updateError) {
        console.error('Error updating proposal vote counts:', updateError);
        // If table doesn't exist, provide a helpful error message
        if (updateError.message.includes('relation') || updateError.message.includes('does not exist')) {
          throw new Error('DAO voting system is not set up yet. Please contact an administrator.');
        }
        throw new Error(`Failed to update vote counts: ${updateError.message}`);
      }

      console.log('✅ Vote cast successfully');

    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  }

  /**
   * Get user's vote on a proposal
   */
  static async getUserVote(proposalId: string, userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('dao_votes')
        .select('choice')
        .eq('proposal_id', proposalId)
        .eq('voter_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      return data?.choice || null;
    } catch (error) {
      console.error('Error getting user vote:', error);
      return null;
    }
  }

  /**
   * Start a proposal (change status from draft to active)
   */
  static async startProposal(proposalId: string): Promise<void> {
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const { error } = await supabase
        .from('dao_proposals')
        .update({
          status: 'active',
          start_time: now.toISOString(),
          end_time: endTime.toISOString()
        })
        .eq('id', proposalId);

      if (error) throw error;
    } catch (error) {
      console.error('Error starting proposal:', error);
      throw error;
    }
  }

  /**
   * Execute a passed proposal
   */
  static async executeProposal(proposalId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('dao_proposals')
        .update({
          status: 'executed',
          execution_time: new Date().toISOString()
        })
        .eq('id', proposalId);

      if (error) throw error;
    } catch (error) {
      console.error('Error executing proposal:', error);
      throw error;
    }
  }

  /**
   * Create a new proposal
   */
  static async createProposal(proposalData: {
    dao_id: string;
    proposer_id: string;
    title: string;
    description: string;
    full_description?: string;
    category: string;
    voting_type: 'simple_majority' | 'super_majority';
  }): Promise<DAOProposal> {
    try {
      const { data, error } = await supabase
        .from('dao_proposals')
        .insert({
          ...proposalData,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        dao_id: data.dao_id,
        proposer_id: data.proposer_id,
        title: data.title,
        description: data.description,
        full_description: data.full_description,
        category: data.category,
        voting_type: data.voting_type,
        status: data.status,
        start_time: data.start_time,
        end_time: data.end_time,
        execution_time: data.execution_time,
        total_votes: data.total_votes || 0,
        yes_votes: data.yes_votes || 0,
        no_votes: data.no_votes || 0,
        abstain_votes: data.abstain_votes || 0,
        participation_rate: data.participation_rate || 0,
        treasury_impact_amount: data.treasury_impact_amount || 0,
        treasury_impact_currency: data.treasury_impact_currency || 'SOL',
        tags: data.tags || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
        dao_name: 'RAC Rewards DAO',
        proposer_email: 'unknown@example.com',
        proposer_tokens: 0,
        voting_status: 'inactive',
        can_vote: false,
        can_execute: false
      };
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  }

  /**
   * Get DAO statistics
   */
  static async getDAOStats(daoId: string): Promise<DAOStats> {
    try {
      // Get member count
      const { count: totalMembers } = await supabase
        .from('dao_members')
        .select('*', { count: 'exact', head: true })
        .eq('dao_id', daoId)
        .eq('is_active', true);

      // Get active member count (members active in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: activeMembers } = await supabase
        .from('dao_members')
        .select('*', { count: 'exact', head: true })
        .eq('dao_id', daoId)
        .eq('is_active', true)
        .gte('last_active_at', thirtyDaysAgo);

      // Get proposal counts
      const { count: totalProposals } = await supabase
        .from('dao_proposals')
        .select('*', { count: 'exact', head: true })
        .eq('dao_id', daoId);

      const { count: activeProposals } = await supabase
        .from('dao_proposals')
        .select('*', { count: 'exact', head: true })
        .eq('dao_id', daoId)
        .eq('status', 'active');

      // Calculate participation rate
      const { data: recentProposals } = await supabase
        .from('dao_proposals')
        .select('participation_rate')
        .eq('dao_id', daoId)
        .eq('status', 'passed')
        .order('created_at', { ascending: false })
        .limit(10);

      const avgParticipation = recentProposals?.length > 0 
        ? recentProposals.reduce((sum, p) => sum + (p.participation_rate || 0), 0) / recentProposals.length
        : 0;

      // Calculate average voting power
      const { data: members } = await supabase
        .from('dao_members')
        .select('voting_power')
        .eq('dao_id', daoId)
        .eq('is_active', true);

      const avgVotingPower = members?.length > 0
        ? members.reduce((sum, m) => sum + (Number(m.voting_power) || 0), 0) / members.length
        : 0;

      return {
        total_members: totalMembers || 0,
        active_members: activeMembers || 0,
        total_proposals: totalProposals || 0,
        active_proposals: activeProposals || 0,
        total_treasury_value: 0, // TODO: Implement treasury tracking
        treasury_currency: 'SOL',
        participation_rate: avgParticipation,
        average_voting_power: avgVotingPower
      };
    } catch (error) {
      console.error('Error loading DAO stats:', error);
      throw error;
    }
  }

  /**
   * Join a DAO (create membership)
   */
  static async joinDAO(daoId: string, userId: string, userEmail: string, userFullName: string): Promise<DAOMember> {
    try {
      // Check if user is already a member
      const existingMember = await this.getUserMembership(daoId, userId);
      if (existingMember) {
        throw new Error('User is already a member of this DAO');
      }

      const { data, error } = await supabase
        .from('dao_members')
        .insert({
          dao_id: daoId,
          user_id: userId,
          role: 'member',
          governance_tokens: 1000, // Default tokens for new members
          voting_power: 3.0, // Default voting power
          user_email: userEmail,
          user_full_name: userFullName,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        dao_id: data.dao_id,
        user_id: data.user_id,
        wallet_address: data.wallet_address,
        role: data.role,
        governance_tokens: Number(data.governance_tokens) || 0,
        voting_power: Number(data.voting_power) || 0,
        joined_at: data.joined_at,
        last_active_at: data.last_active_at,
        is_active: data.is_active,
        user_email: data.user_email,
        user_full_name: data.user_full_name
      };
    } catch (error) {
      console.error('Error joining DAO:', error);
      throw error;
    }
  }
}
