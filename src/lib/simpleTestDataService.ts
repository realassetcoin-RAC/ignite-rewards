
export interface TestDataResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class SimpleTestDataService {
  /**
   * Create comprehensive test data using simple insert operations
   */
  static async createComprehensiveTestData(): Promise<TestDataResult> {
    try {
      console.log('🚀 Creating comprehensive test data using simple inserts...');

      // Step 1: Clear existing test data
      await this.clearExistingTestData();
      
      // Step 2: Create DAO test data
      const daoResult = await this.createDAOTestData();
      
      // Step 3: Create merchant test data
      const merchantResult = await this.createMerchantTestData();
      
      // Step 4: Create transaction test data
      const transactionResult = await this.createTransactionTestData();
      
      // Step 5: Create marketplace test data
      const marketplaceResult = await this.createMarketplaceTestData();
      
      // Step 6: Update with real user IDs
      await this.updateWithRealUserIds();

      console.log('✅ Comprehensive test data created successfully!');
      return {
        success: true,
        message: 'Comprehensive test data created successfully',
        data: {
          dao: daoResult,
          merchants: merchantResult.count || 0,
          transactions: transactionResult.count || 0,
          listings: marketplaceResult.count || 0
        }
      };
    } catch (error) {
      console.error('❌ Error creating comprehensive test data:', error);
      return {
        success: false,
        message: 'Failed to create comprehensive test data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear existing test data
   */
  private static async clearExistingTestData(): Promise<void> {
    console.log('🧹 Clearing existing test data...');

    try {
      // Clear in order due to foreign key constraints
      // Use more robust deletion approach
      
      // First, try to clear DAO-related data
      try {
        const { error: votesError } = await supabase
          .from('dao_votes')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (votesError) {
          console.log('⚠️ Could not clear dao_votes:', votesError.message);
        } else {
          console.log('✅ Cleared dao_votes');
        }
      } catch (error) {
        console.log('⚠️ Error clearing dao_votes:', error);
      }

      try {
        const { error: proposalsError } = await supabase
          .from('dao_proposals')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (proposalsError) {
          console.log('⚠️ Could not clear dao_proposals:', proposalsError.message);
        } else {
          console.log('✅ Cleared dao_proposals');
        }
      } catch (error) {
        console.log('⚠️ Error clearing dao_proposals:', error);
      }

      try {
        const { error: membersError } = await supabase
          .from('dao_members')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (membersError) {
          console.log('⚠️ Could not clear dao_members:', membersError.message);
        } else {
          console.log('✅ Cleared dao_members');
        }
      } catch {
        console.log('⚠️ Error clearing dao_members');
      }

      try {
        const { error: orgsError } = await supabase
          .from('dao_organizations')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (orgsError) {
          console.log('⚠️ Could not clear dao_organizations:', orgsError.message);
        } else {
          console.log('✅ Cleared dao_organizations');
        }
      } catch (error) {
        console.log('⚠️ Error clearing dao_organizations:', error);
      }
      
      // Clear other test data with better error handling
      try {
        const { error: transactionsError } = await supabase
          .from('loyalty_transactions')
          .delete()
          .in('id', [
            'test_transaction_1',
            'test_transaction_2', 
            'test_transaction_3',
            'test_transaction_4'
          ]);
        if (transactionsError) {
          console.log('⚠️ Could not clear loyalty_transactions:', transactionsError.message);
        } else {
          console.log('✅ Cleared loyalty_transactions');
        }
      } catch (error) {
        console.log('⚠️ Error clearing loyalty_transactions:', error);
      }

      try {
        const { error: merchantsError } = await supabase
          .from('merchants')
          .delete()
          .in('id', [
            'test_merchant_1',
            'test_merchant_2',
            'test_merchant_3'
          ]);
        if (merchantsError) {
          console.log('⚠️ Could not clear merchants:', merchantsError.message);
        } else {
          console.log('✅ Cleared merchants');
        }
      } catch (error) {
        console.log('⚠️ Error clearing merchants:', error);
      }

      try {
        const { error: listingsError } = await supabase
          .from('marketplace_listings')
          .delete()
          .in('id', [
            'test_listing_1',
            'test_listing_2',
            'test_listing_3'
          ]);
        if (listingsError) {
          console.log('⚠️ Could not clear marketplace_listings:', listingsError.message);
        } else {
          console.log('✅ Cleared marketplace_listings');
        }
      } catch (error) {
        console.log('⚠️ Error clearing marketplace_listings:', error);
      }

      console.log('✅ Existing test data clearing completed');
    } catch (error) {
      console.log('⚠️ Some test data could not be cleared:', error);
    }
  }

  /**
   * Create DAO test data
   */
  private static async createDAOTestData(): Promise<any> {
    console.log('🗳️ Creating DAO test data...');

    const daoId = '550e8400-e29b-41d4-a716-446655440000';
    const adminUserId = '750e8400-e29b-41d4-a716-446655440001';
    const member1Id = '750e8400-e29b-41d4-a716-446655440002';
    const member2Id = '750e8400-e29b-41d4-a716-446655440003';
    const member3Id = '750e8400-e29b-41d4-a716-446655440004';

    try {
      // Create DAO organization
      const { error: orgError } = await supabase
        .from('dao_organizations')
        .insert({
          id: daoId,
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
        });

      if (orgError) {
        console.log('⚠️ Organization insert error:', orgError.message);
        // Continue anyway, might already exist
      }

      // Create DAO members
      const { error: membersError } = await supabase
        .from('dao_members')
        .insert([
          {
            id: '650e8400-e29b-41d4-a716-446655440001',
            dao_id: daoId,
            user_id: adminUserId,
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
            dao_id: daoId,
            user_id: member1Id,
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
            dao_id: daoId,
            user_id: member2Id,
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
            dao_id: daoId,
            user_id: member3Id,
            wallet_address: 'MemberWallet456789123',
            role: 'member',
            governance_tokens: 2000,
            voting_power: 2000,
            is_active: true,
            user_email: 'member3@rac.com',
            user_full_name: 'DAO Member 3'
          }
        ]);

      if (membersError) {
        console.log('⚠️ Members insert error:', membersError.message);
      }

      // Create DAO proposals (without tags column)
      const proposals = [
        {
          id: '850e8400-e29b-41d4-a716-446655440001',
          dao_id: daoId,
          proposer_id: adminUserId,
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
          treasury_impact_currency: 'SOL'
        },
        {
          id: '850e8400-e29b-41d4-a716-446655440002',
          dao_id: daoId,
          proposer_id: member1Id,
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
          treasury_impact_currency: 'USDC'
        },
        {
          id: '850e8400-e29b-41d4-a716-446655440003',
          dao_id: daoId,
          proposer_id: adminUserId,
          title: 'Implement Quadratic Voting for Governance',
          description: 'Change voting mechanism from simple majority to quadratic voting',
          full_description: 'This proposal would implement quadratic voting to reduce the influence of large token holders.',
          category: 'governance',
          voting_type: 'super_majority',
          status: 'passed',
          start_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          execution_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          total_votes: 3,
          yes_votes: 2,
          no_votes: 1,
          abstain_votes: 0,
          participation_rate: 75.0,
          treasury_impact_amount: 0,
          treasury_impact_currency: 'SOL'
        },
        {
          id: '850e8400-e29b-41d4-a716-446655440004',
          dao_id: daoId,
          proposer_id: member2Id,
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
          treasury_impact_currency: 'SOL'
        },
        {
          id: '850e8400-e29b-41d4-a716-446655440005',
          dao_id: daoId,
          proposer_id: member1Id,
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
          treasury_impact_currency: 'SOL'
        }
      ];

      const { error: proposalsError } = await supabase
        .from('dao_proposals')
        .insert(proposals);

      if (proposalsError) {
        console.log('⚠️ Proposals insert error:', proposalsError.message);
      }

      // Create DAO votes
      const votes = [
        {
          id: '950e8400-e29b-41d4-a716-446655440001',
          proposal_id: '850e8400-e29b-41d4-a716-446655440003',
          voter_id: adminUserId,
          choice: 'yes',
          voting_power: 10000,
          reason: 'This will make our governance more democratic and fair for all members.'
        },
        {
          id: '950e8400-e29b-41d4-a716-446655440002',
          proposal_id: '850e8400-e29b-41d4-a716-446655440003',
          voter_id: member1Id,
          choice: 'yes',
          voting_power: 5000,
          reason: 'I support this change to reduce the influence of large holders.'
        },
        {
          id: '950e8400-e29b-41d4-a716-446655440003',
          proposal_id: '850e8400-e29b-41d4-a716-446655440003',
          voter_id: member2Id,
          choice: 'no',
          voting_power: 3000,
          reason: 'The current system works fine and this change might be too complex.'
        },
        {
          id: '950e8400-e29b-41d4-a716-446655440004',
          proposal_id: '850e8400-e29b-41d4-a716-446655440004',
          voter_id: adminUserId,
          choice: 'yes',
          voting_power: 10000,
          reason: 'We need more funding for development and platform improvements.'
        },
        {
          id: '950e8400-e29b-41d4-a716-446655440005',
          proposal_id: '850e8400-e29b-41d4-a716-446655440004',
          voter_id: member1Id,
          choice: 'no',
          voting_power: 5000,
          reason: 'Higher fees will discourage users from using the platform.'
        },
        {
          id: '950e8400-e29b-41d4-a716-446655440006',
          proposal_id: '850e8400-e29b-41d4-a716-446655440004',
          voter_id: member2Id,
          choice: 'no',
          voting_power: 3000,
          reason: 'This will hurt small merchants and users.'
        }
      ];

      const { error: votesError } = await supabase
        .from('dao_votes')
        .insert(votes);

      if (votesError) {
        console.log('⚠️ Votes insert error:', votesError.message);
      }

      console.log('✅ DAO test data created successfully');
      return { organizations: 1, members: 4, proposals: 5, votes: 6 };
    } catch (error) {
      console.error('❌ Error creating DAO test data:', error);
      throw error;
    }
  }

  /**
   * Create merchant test data
   */
  private static async createMerchantTestData(): Promise<any> {
    console.log('🏪 Creating merchant test data...');

    const merchants = [
      {
        id: 'test_merchant_1',
        name: 'TechStore Pro',
        email: 'contact@techstorepro.com',
        phone: '+1-555-0101',
        business_type: 'electronics',
        address: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postal_code: '94105',
        website: 'https://techstorepro.com',
        description: 'Premium electronics and gadgets store',
        logo_url: 'https://example.com/logo1.png',
        is_active: true
      },
      {
        id: 'test_merchant_2',
        name: 'Fashion Forward',
        email: 'hello@fashionforward.com',
        phone: '+1-555-0102',
        business_type: 'fashion',
        address: '456 Fashion Ave',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postal_code: '10001',
        website: 'https://fashionforward.com',
        description: 'Trendy fashion and accessories',
        logo_url: 'https://example.com/logo2.png',
        is_active: true
      },
      {
        id: 'test_merchant_3',
        name: 'Green Grocer',
        email: 'info@greengrocer.com',
        phone: '+1-555-0103',
        business_type: 'food',
        address: '789 Organic Lane',
        city: 'Portland',
        state: 'OR',
        country: 'USA',
        postal_code: '97201',
        website: 'https://greengrocer.com',
        description: 'Organic and sustainable food products',
        logo_url: 'https://example.com/logo3.png',
        is_active: true
      }
    ];

    try {
      const { error } = await supabase
        .from('merchants')
        .upsert(merchants, { onConflict: 'id' });

      if (error) {
        console.log('⚠️ Merchants insert error:', error.message);
      }

      console.log('✅ Merchant test data created successfully');
      return { count: merchants.length };
    } catch (error) {
      console.log('⚠️ Error creating merchant test data:', error);
      return { count: 0 };
    }
  }

  /**
   * Create transaction test data
   */
  private static async createTransactionTestData(): Promise<any> {
    console.log('💳 Creating transaction test data...');

    const transactions = [
      {
        id: 'test_transaction_1',
        user_id: '750e8400-e29b-41d4-a716-446655440001',
        merchant_id: 'test_merchant_1',
        transaction_type: 'purchase',
        points_earned: 100,
        points_redeemed: 0,
        transaction_amount: 50.00,
        currency: 'USD',
        description: 'Electronics purchase',
        status: 'completed',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'test_transaction_2',
        user_id: '750e8400-e29b-41d4-a716-446655440002',
        merchant_id: 'test_merchant_2',
        transaction_type: 'purchase',
        points_earned: 75,
        points_redeemed: 0,
        transaction_amount: 37.50,
        currency: 'USD',
        description: 'Fashion purchase',
        status: 'completed',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'test_transaction_3',
        user_id: '750e8400-e29b-41d4-a716-446655440001',
        merchant_id: 'test_merchant_3',
        transaction_type: 'purchase',
        points_earned: 50,
        points_redeemed: 0,
        transaction_amount: 25.00,
        currency: 'USD',
        description: 'Grocery purchase',
        status: 'completed',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'test_transaction_4',
        user_id: '750e8400-e29b-41d4-a716-446655440003',
        merchant_id: 'test_merchant_1',
        transaction_type: 'redemption',
        points_earned: 0,
        points_redeemed: 50,
        transaction_amount: 0,
        currency: 'USD',
        description: 'Points redemption for discount',
        status: 'completed',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    try {
      const { error } = await supabase
        .from('loyalty_transactions')
        .upsert(transactions, { onConflict: 'id' });

      if (error) {
        console.log('⚠️ Transactions insert error:', error.message);
      }

      console.log('✅ Transaction test data created successfully');
      return { count: transactions.length };
    } catch (error) {
      console.log('⚠️ Error creating transaction test data:', error);
      return { count: 0 };
    }
  }

  /**
   * Create marketplace test data
   */
  private static async createMarketplaceTestData(): Promise<any> {
    console.log('🛒 Creating marketplace test data...');

    const listings = [
      {
        id: 'test_listing_1',
        title: 'Vintage Gaming Console',
        description: 'Classic gaming console in excellent condition',
        price: 299.99,
        currency: 'USD',
        category: 'electronics',
        condition: 'excellent',
        seller_id: '750e8400-e29b-41d4-a716-446655440001',
        images: ['https://example.com/image1.jpg'],
        is_active: true,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'test_listing_2',
        title: 'Designer Handbag',
        description: 'Luxury designer handbag, barely used',
        price: 450.00,
        currency: 'USD',
        category: 'fashion',
        condition: 'like_new',
        seller_id: '750e8400-e29b-41d4-a716-446655440002',
        images: ['https://example.com/image2.jpg'],
        is_active: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'test_listing_3',
        title: 'Organic Coffee Beans',
        description: 'Premium organic coffee beans, 2lb bag',
        price: 24.99,
        currency: 'USD',
        category: 'food',
        condition: 'new',
        seller_id: '750e8400-e29b-41d4-a716-446655440003',
        images: ['https://example.com/image3.jpg'],
        is_active: true,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .upsert(listings, { onConflict: 'id' });

      if (error) {
        console.log('⚠️ Marketplace listings insert error:', error.message);
      }

      console.log('✅ Marketplace test data created successfully');
      return { count: listings.length };
    } catch (error) {
      console.log('⚠️ Error creating marketplace test data:', error);
      return { count: 0 };
    }
  }

  /**
   * Update test data with real user IDs
   */
  private static async updateWithRealUserIds(): Promise<void> {
    console.log('👤 Updating test data with real user IDs...');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update DAO members with current user ID
        await supabase
          .from('dao_members')
          .update({ user_id: user.id })
          .eq('id', '650e8400-e29b-41d4-a716-446655440001');

        // Update loyalty transactions with current user ID
        await supabase
          .from('loyalty_transactions')
          .update({ user_id: user.id })
          .eq('id', 'test_transaction_1');

        // Update marketplace listings with current user ID
        await supabase
          .from('marketplace_listings')
          .update({ seller_id: user.id })
          .eq('id', 'test_listing_1');

        console.log('✅ Test data updated with real user IDs');
      } else {
        console.log('⚠️ No authenticated user found, skipping user ID update');
      }
    } catch (error) {
      console.log('⚠️ Error updating user IDs:', error);
    }
  }

  /**
   * Get test data summary
   */
  static async getTestDataSummary(): Promise<TestDataResult> {
    try {
      console.log('📊 Getting test data summary...');

      const [orgsResult, membersResult, proposalsResult, votesResult, merchantsResult, transactionsResult, listingsResult] = await Promise.all([
        supabase.from('dao_organizations').select('id', { count: 'exact', head: true }),
        supabase.from('dao_members').select('id', { count: 'exact', head: true }),
        supabase.from('dao_proposals').select('id', { count: 'exact', head: true }),
        supabase.from('dao_votes').select('id', { count: 'exact', head: true }),
        supabase.from('merchants').select('id', { count: 'exact', head: true }),
        supabase.from('loyalty_transactions').select('id', { count: 'exact', head: true }),
        supabase.from('marketplace_listings').select('id', { count: 'exact', head: true })
      ]);

      const summary = {
        dao: {
          organizations: orgsResult.count || 0,
          members: membersResult.count || 0,
          proposals: proposalsResult.count || 0,
          votes: votesResult.count || 0
        },
        merchants: merchantsResult.count || 0,
        transactions: transactionsResult.count || 0,
        listings: listingsResult.count || 0
      };

      console.log('📊 Test data summary:', summary);
      return {
        success: true,
        message: 'Test data summary retrieved successfully',
        data: summary
      };
    } catch (error) {
      console.error('❌ Error getting test data summary:', error);
      return {
        success: false,
        message: 'Failed to get test data summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear all test data
   */
  static async clearAllTestData(): Promise<TestDataResult> {
    try {
      console.log('🧹 Clearing all test data...');

      await this.clearExistingTestData();

      console.log('✅ All test data cleared successfully');
      return {
        success: true,
        message: 'All test data cleared successfully'
      };
    } catch (error) {
      console.error('❌ Error clearing test data:', error);
      return {
        success: false,
        message: 'Failed to clear test data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
