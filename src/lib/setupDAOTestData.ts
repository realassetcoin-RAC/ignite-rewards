import { databaseAdapter } from '@/lib/databaseAdapter';

export class SetupDAOTestData {
  /**
   * Set up comprehensive DAO test data
   */
  static async setupTestData(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚀 Setting up DAO test data...');

      // First, ensure all DAO tables exist
      await this.createTables();
      
      // Clear existing test data
      await this.clearExistingData();
      
      // Create test data
      await this.createTestData();
      
      // Update with real user IDs
      await this.updateWithRealUserIds();

      console.log('✅ DAO test data setup complete!');
      return { success: true, message: 'DAO test data created successfully!' };
    } catch (error) {
      console.error('❌ Error setting up DAO test data:', error);
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Create DAO tables if they don't exist
   */
  private static async createTables(): Promise<void> {
    try {
      // Try to create tables by attempting to insert and catch errors
      console.log('Creating DAO tables...');
      
      // Test if dao_organizations table exists by trying to select from it
      const { error: orgError } = await databaseAdapter
        .from('dao_organizations')
        .select('id')
        .limit(1);
      
      if (orgError && orgError.message.includes('relation') && orgError.message.includes('does not exist')) {
        console.log('DAO tables do not exist, they need to be created via migration or SQL editor');
        throw new Error('DAO tables do not exist. Please run the migration file or create tables manually.');
      }
      
      console.log('DAO tables exist, continuing...');
    } catch (error) {
      console.error('Error checking/creating tables:', error);
      throw error;
    }
  }

  /**
   * Clear existing test data
   */
  private static async clearExistingData(): Promise<void> {
    try {
      console.log('Clearing existing test data...');
      
      // Clear votes first (due to foreign key constraints)
      const { error: votesError } = await databaseAdapter
        .from('dao_votes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (votesError) {
        console.log('Could not clear votes:', votesError.message);
      }
      
      // Clear proposals
      const { error: proposalsError } = await databaseAdapter
        .from('dao_proposals')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (proposalsError) {
        console.log('Could not clear proposals:', proposalsError.message);
      }
      
      // Clear members
      const { error: membersError } = await databaseAdapter
        .from('dao_members')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (membersError) {
        console.log('Could not clear members:', membersError.message);
      }
      
      // Clear organizations (only test ones)
      const { error: orgsError } = await databaseAdapter
        .from('dao_organizations')
        .delete()
        .eq('name', 'RAC Rewards DAO'); // Only delete test org
      
      if (orgsError) {
        console.log('Could not clear test organization:', orgsError.message);
      }
      
      console.log('Existing test data cleared');
    } catch (error) {
      console.log('Error clearing existing data:', error);
    }
  }

  /**
   * Create test data
   */
  private static async createTestData(): Promise<void> {
    // Create DAO organization
    const { error: orgError } = await databaseAdapter
      .from('dao_organizations')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'RAC Rewards DAO',
        description: 'Decentralized governance for the RAC Rewards loyalty platform',
        governance_token_symbol: 'RAC',
        governance_token_decimals: 9,
        min_proposal_threshold: 100,
        voting_period_days: 7,
        execution_delay_hours: 24,
        quorum_percentage: 10.0,
        super_majority_threshold: 66.67,
        is_active: true
      })
      .select()
      .single();

    if (orgError) {
      console.log('DAO organization might already exist, continuing...');
    }

    // Create DAO members
    const members = [
      {
        id: '650e8400-e29b-41d4-a716-446655440001',
        dao_id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: '750e8400-e29b-41d4-a716-446655440001',
        wallet_address: 'AdminWallet123456789',
        role: 'admin',
        governance_tokens: 10000,
        voting_power: 10000,
        is_active: true,
        user_email: 'admin@rac.com',
        user_full_name: 'DAO Admin'
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440002',
        dao_id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: '750e8400-e29b-41d4-a716-446655440002',
        wallet_address: 'MemberWallet123456789',
        role: 'member',
        governance_tokens: 5000,
        voting_power: 5000,
        is_active: true,
        user_email: 'member1@rac.com',
        user_full_name: 'DAO Member 1'
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440003',
        dao_id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: '750e8400-e29b-41d4-a716-446655440003',
        wallet_address: 'MemberWallet987654321',
        role: 'member',
        governance_tokens: 3000,
        voting_power: 3000,
        is_active: true,
        user_email: 'member2@rac.com',
        user_full_name: 'DAO Member 2'
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440004',
        dao_id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: '750e8400-e29b-41d4-a716-446655440004',
        wallet_address: 'MemberWallet456789123',
        role: 'member',
        governance_tokens: 2000,
        voting_power: 2000,
        is_active: true,
        user_email: 'member3@rac.com',
        user_full_name: 'DAO Member 3'
      }
    ];

    const { error: membersError } = await databaseAdapter
      .from('dao_members')
      .insert(members);

    if (membersError) {
      console.log('DAO members might already exist, continuing...');
    }

    // Create DAO proposals
    const proposals = [
      {
        id: '850e8400-e29b-41d4-a716-446655440001',
        dao_id: '550e8400-e29b-41d4-a716-446655440000',
        proposer_id: '750e8400-e29b-41d4-a716-446655440001',
        title: 'Increase Loyalty Point Rewards by 20%',
        description: 'Proposal to increase the loyalty point multiplier from 1x to 1.2x for all merchants',
        full_description: 'This proposal aims to increase customer engagement by boosting the loyalty point rewards. The change would affect all merchants on the platform and require updates to the reward calculation system.',
        category: 'governance',
        voting_type: 'simple_majority',
        status: 'active',
        start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        total_votes: 0,
        yes_votes: 0,
        no_votes: 0,
        abstain_votes: 0,
        participation_rate: 0,
        treasury_impact_amount: 0,
        treasury_impact_currency: 'SOL',
        tags: ['governance', 'rewards', 'loyalty']
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440002',
        dao_id: '550e8400-e29b-41d4-a716-446655440000',
        proposer_id: '750e8400-e29b-41d4-a716-446655440002',
        title: 'Add Solana USDC as Payment Option',
        description: 'Enable USDC payments on Solana blockchain for loyalty transactions',
        full_description: 'This proposal would integrate Solana USDC as a payment method, allowing users to pay for loyalty transactions using USDC.',
        category: 'technical',
        voting_type: 'simple_majority',
        status: 'active',
        start_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        total_votes: 0,
        yes_votes: 0,
        no_votes: 0,
        abstain_votes: 0,
        participation_rate: 0,
        treasury_impact_amount: 0,
        treasury_impact_currency: 'USDC',
        tags: ['technical', 'payments', 'solana']
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440003',
        dao_id: '550e8400-e29b-41d4-a716-446655440000',
        proposer_id: '750e8400-e29b-41d4-a716-446655440001',
        title: 'Implement Quadratic Voting for Governance',
        description: 'Change voting mechanism from simple majority to quadratic voting',
        full_description: 'This proposal would implement quadratic voting to reduce the influence of large token holders.',
        category: 'governance',
        voting_type: 'super_majority',
        status: 'passed',
        start_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        total_votes: 3,
        yes_votes: 2,
        no_votes: 1,
        abstain_votes: 0,
        participation_rate: 75.0,
        treasury_impact_amount: 0,
        treasury_impact_currency: 'SOL',
        tags: ['governance', 'voting', 'democracy']
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440004',
        dao_id: '550e8400-e29b-41d4-a716-446655440000',
        proposer_id: '750e8400-e29b-41d4-a716-446655440003',
        title: 'Increase Platform Fees by 50%',
        description: 'Proposal to increase transaction fees to fund development',
        full_description: 'This proposal would increase platform fees from 2% to 3% to provide additional funding.',
        category: 'treasury',
        voting_type: 'simple_majority',
        status: 'rejected',
        start_time: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        total_votes: 3,
        yes_votes: 1,
        no_votes: 2,
        abstain_votes: 0,
        participation_rate: 75.0,
        treasury_impact_amount: 0,
        treasury_impact_currency: 'SOL',
        tags: ['treasury', 'fees', 'development']
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440005',
        dao_id: '550e8400-e29b-41d4-a716-446655440000',
        proposer_id: '750e8400-e29b-41d4-a716-446655440002',
        title: 'Add NFT Rewards for High-Value Customers',
        description: 'Proposal to create NFT rewards for customers with high loyalty points',
        full_description: 'This proposal would create a new NFT reward system for customers who accumulate high loyalty points.',
        category: 'rewards',
        voting_type: 'simple_majority',
        status: 'draft',
        total_votes: 0,
        yes_votes: 0,
        no_votes: 0,
        abstain_votes: 0,
        participation_rate: 0,
        treasury_impact_amount: 0,
        treasury_impact_currency: 'SOL',
        tags: ['rewards', 'nft', 'loyalty']
      }
    ];

    const { error: proposalsError } = await databaseAdapter
      .from('dao_proposals')
      .insert(proposals);

    if (proposalsError) {
      console.log('DAO proposals might already exist, continuing...');
    }

    // Create DAO votes
    const votes = [
      {
        id: '950e8400-e29b-41d4-a716-446655440001',
        proposal_id: '850e8400-e29b-41d4-a716-446655440003',
        voter_id: '750e8400-e29b-41d4-a716-446655440001',
        choice: 'yes',
        voting_power: 10000,
        reason: 'This will make our governance more democratic and fair for all members.'
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440002',
        proposal_id: '850e8400-e29b-41d4-a716-446655440003',
        voter_id: '750e8400-e29b-41d4-a716-446655440002',
        choice: 'yes',
        voting_power: 5000,
        reason: 'I support this change to reduce the influence of large holders.'
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440003',
        proposal_id: '850e8400-e29b-41d4-a716-446655440003',
        voter_id: '750e8400-e29b-41d4-a716-446655440003',
        choice: 'no',
        voting_power: 3000,
        reason: 'The current system works fine and this change might be too complex.'
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440004',
        proposal_id: '850e8400-e29b-41d4-a716-446655440004',
        voter_id: '750e8400-e29b-41d4-a716-446655440001',
        choice: 'yes',
        voting_power: 10000,
        reason: 'We need more funding for development and platform improvements.'
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440005',
        proposal_id: '850e8400-e29b-41d4-a716-446655440004',
        voter_id: '750e8400-e29b-41d4-a716-446655440002',
        choice: 'no',
        voting_power: 5000,
        reason: 'Higher fees will discourage users from using the platform.'
      },
      {
        id: '950e8400-e29b-41d4-a716-446655440006',
        proposal_id: '850e8400-e29b-41d4-a716-446655440004',
        voter_id: '750e8400-e29b-41d4-a716-446655440003',
        choice: 'no',
        voting_power: 3000,
        reason: 'This will hurt small merchants and users.'
      }
    ];

    const { error: votesError } = await databaseAdapter
      .from('dao_votes')
      .insert(votes);

    if (votesError) {
      console.log('DAO votes might already exist, continuing...');
    }
  }

  /**
   * Update test data with real user IDs
   */
  private static async updateWithRealUserIds(): Promise<void> {
    try {
      // Get current user
      const { data: { user } } = await databaseAdapter.supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found, skipping user ID update');
        return;
      }

      // Update the first member to use the current user's ID
      const { error } = await databaseAdapter
        .from('dao_members')
        .update({ user_id: user.id })
        .eq('id', '650e8400-e29b-41d4-a716-446655440001');

      if (error) {
        console.log('Could not update user ID, continuing...');
      } else {
        console.log('Updated test data with current user ID');
      }
    } catch (error) {
      console.log('Error updating user IDs:', error);
    }
  }

  /**
   * Check if test data exists
   */
  static async checkTestDataExists(): Promise<boolean> {
    try {
      const { error } = await databaseAdapter
        .from('dao_organizations')
        .select('id')
        .eq('id', '550e8400-e29b-41d4-a716-446655440000')
        .single();
      return !error;
    } catch {
      return false;
    }
  }
}
