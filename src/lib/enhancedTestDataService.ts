import { supabase } from '@/integrations/supabase/client';
// import { DAOProposal, DAOMember, DAOOrganization } from '@/types/dao';

export interface TestDataResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface TestDataSummary {
  dao: {
    organizations: number;
    members: number;
    proposals: number;
    votes: number;
  };
  subscriptionPlans: number;
  merchants: number;
  transactions: number;
  listings: number;
}

export class EnhancedTestDataService {
  /**
   * Create comprehensive test data with 100+ records
   */
  static async createComprehensiveTestData(): Promise<TestDataResult> {
    try {
      console.log('🚀 Creating comprehensive test data with 100+ records...');

      // Step 1: Create DAO tables if they don't exist
      await this.createDAOTables();

      // Step 2: Create DAO test data
      const daoResult = await this.createDAOTestData();
      if (!daoResult.success) {
        return daoResult;
      }

      // Step 3: Create merchant subscription plans
      const subscriptionPlansResult = await this.createMerchantSubscriptionPlans();
      if (!subscriptionPlansResult.success) {
        return subscriptionPlansResult;
      }

      // Step 4: Create merchant test data
      const merchantResult = await this.createMerchantTestData();
      if (!merchantResult.success) {
        return merchantResult;
      }

      // Step 5: Create transaction test data
      const transactionResult = await this.createTransactionTestData();
      if (!transactionResult.success) {
        return transactionResult;
      }

      // Step 6: Create marketplace test data
      const marketplaceResult = await this.createMarketplaceTestData();
      if (!marketplaceResult.success) {
        return marketplaceResult;
      }

      // Get final summary
      const summary = await this.getTestDataSummary();

      console.log('🎉 Comprehensive test data created successfully!');
      return {
        success: true,
        message: 'Comprehensive test data created successfully',
        data: {
          dao: daoResult.data,
          subscriptionPlans: subscriptionPlansResult.data,
          merchants: merchantResult.data,
          transactions: transactionResult.data,
          marketplace: marketplaceResult.data,
          summary: summary.data
        }
      };
    } catch (error) {
      console.error('❌ Error creating comprehensive test data:', error);
      return {
        success: false,
        message: 'Unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create DAO tables if they don't exist
   */
  private static async createDAOTables(): Promise<void> {
    console.log('🏗️ Creating DAO tables...');

    // Create dao_organizations table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.dao_organizations (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          description text,
          logo_url text,
          website_url text,
          discord_url text,
          twitter_url text,
          github_url text,
          governance_token_address text,
          governance_token_symbol text NOT NULL,
          governance_token_decimals int NOT NULL DEFAULT 9,
          min_proposal_threshold numeric NOT NULL DEFAULT 0,
          voting_period_days int NOT NULL DEFAULT 7,
          execution_delay_hours int NOT NULL DEFAULT 24,
          quorum_percentage numeric NOT NULL DEFAULT 10.0,
          super_majority_threshold numeric NOT NULL DEFAULT 66.67,
          treasury_address text,
          created_by uuid,
          is_active boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `
    });

    // Create dao_members table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.dao_members (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          dao_id uuid REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
          user_id uuid NOT NULL,
          wallet_address text,
          role text NOT NULL DEFAULT 'member',
          governance_tokens numeric NOT NULL DEFAULT 0,
          voting_power numeric NOT NULL DEFAULT 0,
          joined_at timestamptz NOT NULL DEFAULT now(),
          last_active_at timestamptz,
          is_active boolean NOT NULL DEFAULT true,
          user_email text,
          user_full_name text,
          user_avatar_url text
        );
      `
    });

    // Create dao_proposals table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.dao_proposals (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          dao_id uuid REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
          proposer_id uuid,
          title text NOT NULL,
          description text,
          full_description text,
          category text,
          voting_type text NOT NULL DEFAULT 'simple_majority',
          status text NOT NULL DEFAULT 'draft',
          start_time timestamptz,
          end_time timestamptz,
          execution_time timestamptz,
          total_votes int NOT NULL DEFAULT 0,
          yes_votes int NOT NULL DEFAULT 0,
          no_votes int NOT NULL DEFAULT 0,
          abstain_votes int NOT NULL DEFAULT 0,
          participation_rate numeric NOT NULL DEFAULT 0,
          treasury_impact_amount numeric NOT NULL DEFAULT 0,
          treasury_impact_currency text NOT NULL DEFAULT 'SOL',
          tags text[] DEFAULT '{}',
          external_links jsonb,
          attachments jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          executed_at timestamptz
        );
      `
    });

    // Create dao_votes table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.dao_votes (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          proposal_id uuid REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
          voter_id uuid NOT NULL,
          choice text NOT NULL CHECK (choice IN ('yes', 'no', 'abstain')),
          voting_power numeric NOT NULL,
          voting_weight numeric NOT NULL,
          reason text,
          transaction_hash text,
          created_at timestamptz NOT NULL DEFAULT now(),
          voter_email text,
          voter_avatar_url text
        );
      `
    });

    // Enable RLS and create policies
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.dao_organizations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.dao_members ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;
      `
    });

    console.log('✅ DAO tables created successfully');
  }

  /**
   * Create comprehensive DAO test data with 100+ records
   */
  private static async createDAOTestData(): Promise<TestDataResult> {
    try {
      console.log('🗳️ Creating DAO test data with 100+ records...');

      // Clear existing test data
      await this.clearDAOTestData();

      // Create 5 DAO organizations
      const organizations = await this.createDAOOrganizations();
      if (!organizations.success) {
        return organizations;
      }

      // Create 50 DAO members across all organizations
      const members = await this.createDAOMembers(organizations.data);
      if (!members.success) {
        return members;
      }

      // Create 100 DAO proposals across all organizations
      const proposals = await this.createDAOProposals(organizations.data, members.data);
      if (!proposals.success) {
        return proposals;
      }

      // Create 200 DAO votes across all proposals
      const votes = await this.createDAOVotes(proposals.data, members.data);
      if (!votes.success) {
        return votes;
      }

      console.log('✅ DAO test data created successfully');
      return {
        success: true,
        message: 'DAO test data created successfully',
        data: {
          organizations: organizations.data.length,
          members: members.data.length,
          proposals: proposals.data.length,
          votes: votes.data.length
        }
      };
    } catch (error) {
      console.error('❌ Error creating DAO test data:', error);
      return {
        success: false,
        message: 'Failed to create DAO test data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create 5 DAO organizations with different configurations
   */
  private static async createDAOOrganizations(): Promise<TestDataResult> {
    const organizations = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'RAC Rewards DAO',
        description: 'Decentralized governance for the RAC Rewards loyalty platform',
        governance_token_symbol: 'RAC',
        governance_token_decimals: 9,
        min_proposal_threshold: 100,
        voting_period_days: 7,
        quorum_percentage: 10.0,
        super_majority_threshold: 66.67
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Community Governance DAO',
        description: 'Community-driven governance for platform decisions',
        governance_token_symbol: 'COMM',
        governance_token_decimals: 9,
        min_proposal_threshold: 50,
        voting_period_days: 5,
        quorum_percentage: 15.0,
        super_majority_threshold: 60.0
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Treasury Management DAO',
        description: 'Manages platform treasury and financial decisions',
        governance_token_symbol: 'TREAS',
        governance_token_decimals: 9,
        min_proposal_threshold: 200,
        voting_period_days: 10,
        quorum_percentage: 20.0,
        super_majority_threshold: 75.0
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Technical Committee DAO',
        description: 'Technical decisions and protocol upgrades',
        governance_token_symbol: 'TECH',
        governance_token_decimals: 9,
        min_proposal_threshold: 75,
        voting_period_days: 14,
        quorum_percentage: 25.0,
        super_majority_threshold: 80.0
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Partnership DAO',
        description: 'Strategic partnerships and business development',
        governance_token_symbol: 'PART',
        governance_token_decimals: 9,
        min_proposal_threshold: 150,
        voting_period_days: 7,
        quorum_percentage: 12.0,
        super_majority_threshold: 70.0
      }
    ];

    const { data, error } = await supabase
      .from('dao_organizations')
      .insert(organizations)
      .select();

    if (error) {
      return {
        success: false,
        message: 'Failed to create DAO organizations',
        error: error.message
      };
    }

    return {
      success: true,
      message: 'DAO organizations created successfully',
      data: data
    };
  }

  /**
   * Create 50 DAO members across all organizations
   */
  private static async createDAOMembers(organizations: any[]): Promise<TestDataResult> {
    const members = [];
    const roles = ['admin', 'moderator', 'member'];
    // const categories = ['governance', 'treasury', 'technical', 'community', 'partnership', 'marketing', 'general'];

    for (let i = 0; i < 50; i++) {
      const orgIndex = i % organizations.length;
      const org = organizations[orgIndex];
      
      members.push({
        dao_id: org.id,
        user_id: `user-${i.toString().padStart(3, '0')}-${Date.now()}`,
        role: roles[i % roles.length],
        governance_tokens: Math.floor(Math.random() * 10000) + 100,
        voting_power: Math.floor(Math.random() * 100) + 1,
        user_email: `member${i}@example.com`,
        user_full_name: `Member ${i + 1}`,
        is_active: Math.random() > 0.1 // 90% active
      });
    }

    const { data, error } = await supabase
      .from('dao_members')
      .insert(members)
      .select();

    if (error) {
      return {
        success: false,
        message: 'Failed to create DAO members',
        error: error.message
      };
    }

    return {
      success: true,
      message: 'DAO members created successfully',
      data: data
    };
  }

  /**
   * Create 100 DAO proposals across all organizations
   */
  private static async createDAOProposals(organizations: any[], members: any[]): Promise<TestDataResult> {
    const proposals = [];
    const categories = ['governance', 'treasury', 'technical', 'community', 'partnership', 'marketing', 'general'];
    const votingTypes = ['simple_majority', 'super_majority', 'unanimous', 'weighted', 'quadratic'];
    const statuses = ['draft', 'active', 'passed', 'rejected', 'executed'];
    const proposalTitles = [
      'Increase reward points for premium users',
      'Implement new loyalty tier system',
      'Add support for additional cryptocurrencies',
      'Create community ambassador program',
      'Upgrade platform security measures',
      'Launch mobile application',
      'Partner with major retail chains',
      'Implement NFT rewards system',
      'Create decentralized governance token',
      'Establish treasury management protocol'
    ];

    for (let i = 0; i < 100; i++) {
      const orgIndex = i % organizations.length;
      const org = organizations[orgIndex];
      const memberIndex = i % members.length;
      const member = members[memberIndex];
      
      const status = statuses[i % statuses.length];
      const now = new Date();
      const startTime = status === 'active' || status === 'passed' || status === 'rejected' 
        ? new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random time in last 30 days
        : null;
      const endTime = startTime 
        ? new Date(startTime.getTime() + org.voting_period_days * 24 * 60 * 60 * 1000)
        : null;

      proposals.push({
        dao_id: org.id,
        proposer_id: member.user_id,
        title: `${proposalTitles[i % proposalTitles.length]} - Proposal ${i + 1}`,
        description: `This proposal aims to ${proposalTitles[i % proposalTitles.length].toLowerCase()} and improve the platform.`,
        full_description: `Detailed description for proposal ${i + 1}. This is a comprehensive proposal that outlines the implementation details, benefits, and potential risks.`,
        category: categories[i % categories.length],
        voting_type: votingTypes[i % votingTypes.length],
        status: status,
        start_time: startTime?.toISOString(),
        end_time: endTime?.toISOString(),
        execution_time: status === 'executed' ? new Date().toISOString() : null,
        total_votes: status === 'active' || status === 'passed' || status === 'rejected' ? Math.floor(Math.random() * 50) + 1 : 0,
        yes_votes: status === 'active' || status === 'passed' || status === 'rejected' ? Math.floor(Math.random() * 30) + 1 : 0,
        no_votes: status === 'active' || status === 'passed' || status === 'rejected' ? Math.floor(Math.random() * 20) : 0,
        abstain_votes: status === 'active' || status === 'passed' || status === 'rejected' ? Math.floor(Math.random() * 10) : 0,
        participation_rate: status === 'active' || status === 'passed' || status === 'rejected' ? Math.random() * 100 : 0,
        treasury_impact_amount: Math.random() * 10000,
        treasury_impact_currency: 'SOL',
        tags: [`tag-${i % 10}`, `category-${categories[i % categories.length]}`],
        proposer_email: member.user_email,
        proposer_tokens: member.governance_tokens
      });
    }

    const { data, error } = await supabase
      .from('dao_proposals')
      .insert(proposals)
      .select();

    if (error) {
      return {
        success: false,
        message: 'Failed to create DAO proposals',
        error: error.message
      };
    }

    return {
      success: true,
      message: 'DAO proposals created successfully',
      data: data
    };
  }

  /**
   * Create 200 DAO votes across all proposals
   */
  private static async createDAOVotes(proposals: any[], members: any[]): Promise<TestDataResult> {
    const votes = [];
    const choices = ['yes', 'no', 'abstain'];
    const reasons = [
      'This proposal aligns with our community values',
      'I believe this will benefit the platform',
      'Need more information before deciding',
      'This proposal needs refinement',
      'Strongly support this initiative',
      'Concerned about implementation costs',
      'Great idea but timing is wrong',
      'This addresses a critical need',
      'Requires further discussion',
      'Not convinced of the benefits'
    ];

    // Create votes for active, passed, and rejected proposals
    const activeProposals = proposals.filter(p => ['active', 'passed', 'rejected'].includes(p.status));
    
    for (let i = 0; i < 200; i++) {
      const proposal = activeProposals[i % activeProposals.length];
      const member = members[i % members.length];
      
      // Skip if member is from different DAO
      if (member.dao_id !== proposal.dao_id) {
        continue;
      }

      votes.push({
        proposal_id: proposal.id,
        voter_id: member.user_id,
        choice: choices[i % choices.length],
        voting_power: member.voting_power,
        voting_weight: member.voting_power,
        reason: reasons[i % reasons.length],
        voter_email: member.user_email
      });
    }

    const { data, error } = await supabase
      .from('dao_votes')
      .insert(votes)
      .select();

    if (error) {
      return {
        success: false,
        message: 'Failed to create DAO votes',
        error: error.message
      };
    }

    return {
      success: true,
      message: 'DAO votes created successfully',
      data: data
    };
  }

  /**
   * Create merchant subscription plans test data
   */
  private static async createMerchantSubscriptionPlans(): Promise<TestDataResult> {
    try {
      console.log('💳 Creating merchant subscription plans...');

      const plans = [
        {
          name: 'Free Trial',
          description: 'Experience our platform with full access to all features for 14 days',
          price_monthly: 0.00,
          price_yearly: 0.00,
          monthly_points: 100,
          monthly_transactions: 10,
          features: [
            'Full platform access for 14 days',
            'Up to 10 transactions',
            'Basic customer management',
            'Email support',
            'Basic analytics dashboard',
            'QR code generation',
            'Mobile app access'
          ],
          trial_days: 14,
          is_active: true,
          popular: false,
          plan_number: 0
        },
        {
          name: 'Starter',
          description: 'Perfect for small businesses and startups looking to build customer loyalty',
          price_monthly: 29.99,
          price_yearly: 299.99,
          monthly_points: 1000,
          monthly_transactions: 100,
          features: [
            'Basic loyalty program setup',
            'Up to 100 transactions per month',
            'Customer database management',
            'Email support (24-48 hour response)',
            'Basic analytics and reporting',
            'QR code generation',
            'Mobile app for customers',
            'Basic email marketing tools',
            'Social media integration',
            'Up to 2 staff accounts'
          ],
          trial_days: 14,
          is_active: true,
          popular: false,
          plan_number: 1
        },
        {
          name: 'Growth',
          description: 'Ideal for growing businesses that need more advanced features and higher limits',
          price_monthly: 79.99,
          price_yearly: 799.99,
          monthly_points: 5000,
          monthly_transactions: 500,
          features: [
            'Advanced loyalty program features',
            'Up to 500 transactions per month',
            'Advanced customer segmentation',
            'Priority email support (12-24 hour response)',
            'Advanced analytics and reporting',
            'Custom branding options',
            'API access for integrations',
            'Referral system',
            'Multi-location support',
            'Advanced email marketing',
            'Social media management',
            'Up to 5 staff accounts',
            'Custom reward rules',
            'A/B testing for campaigns'
          ],
          trial_days: 14,
          is_active: true,
          popular: true,
          plan_number: 2
        },
        {
          name: 'Professional',
          description: 'For established businesses requiring enterprise-level features and support',
          price_monthly: 199.99,
          price_yearly: 1999.99,
          monthly_points: 15000,
          monthly_transactions: 1500,
          features: [
            'Enterprise loyalty program features',
            'Up to 1500 transactions per month',
            'Advanced customer analytics',
            '24/7 phone and email support',
            'Real-time analytics dashboard',
            'White-label solution options',
            'Full API access with documentation',
            'Advanced referral system',
            'Multi-location management',
            'Custom integrations',
            'Dedicated account manager',
            'Advanced email marketing automation',
            'Social media management suite',
            'Up to 15 staff accounts',
            'Custom reward algorithms',
            'Advanced A/B testing',
            'Priority feature requests',
            'Custom reporting'
          ],
          trial_days: 30,
          is_active: true,
          popular: false,
          plan_number: 3
        },
        {
          name: 'Enterprise',
          description: 'For large businesses and enterprises requiring unlimited features and dedicated support',
          price_monthly: 499.99,
          price_yearly: 4999.99,
          monthly_points: 50000,
          monthly_transactions: 5000,
          features: [
            'Unlimited loyalty program features',
            'Up to 5000 transactions per month',
            'Enterprise-grade customer analytics',
            '24/7 dedicated support team',
            'Real-time analytics with custom dashboards',
            'Full white-label solution',
            'Unlimited API access',
            'Advanced referral and affiliate system',
            'Unlimited multi-location support',
            'Custom integrations and development',
            'Dedicated success manager',
            'Advanced email marketing automation',
            'Enterprise social media management',
            'Unlimited staff accounts',
            'Custom reward algorithms and AI',
            'Advanced A/B testing and optimization',
            'Priority feature development',
            'Custom reporting and analytics',
            'SLA guarantees',
            'Onboarding and training',
            'Custom contract terms'
          ],
          trial_days: 30,
          is_active: true,
          popular: false,
          plan_number: 4
        }
      ];

      const { data, error } = await supabase
        .from('merchant_subscription_plans')
        .insert(plans)
        .select();

      if (error) {
        return {
          success: false,
          message: 'Failed to create merchant subscription plans',
          error: error.message
        };
      }

      return {
        success: true,
        message: 'Merchant subscription plans created successfully',
        data: data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create merchant subscription plans',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create merchant test data
   */
  private static async createMerchantTestData(): Promise<TestDataResult> {
    try {
      console.log('🏪 Creating merchant test data...');

      const merchants = [];
      const businessTypes = ['Retail', 'Restaurant', 'Service', 'E-commerce', 'Entertainment'];
      const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];

      for (let i = 0; i < 20; i++) {
        merchants.push({
          id: `merchant-${i.toString().padStart(3, '0')}-${Date.now()}`,
          name: `Test Merchant ${i + 1}`,
          business_type: businessTypes[i % businessTypes.length],
          address: `${Math.floor(Math.random() * 9999) + 1} Main St, ${cities[i % cities.length]}`,
          phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
          email: `merchant${i}@example.com`,
          website: `https://merchant${i}.com`,
          description: `Test merchant ${i + 1} specializing in ${businessTypes[i % businessTypes.length].toLowerCase()}`,
          is_active: Math.random() > 0.1 // 90% active
        });
      }

      const { data, error } = await supabase
        .from('merchants')
        .insert(merchants)
        .select();

      if (error) {
        return {
          success: false,
          message: 'Failed to create merchant test data',
          error: error.message
        };
      }

      return {
        success: true,
        message: 'Merchant test data created successfully',
        data: data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create merchant test data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create transaction test data
   */
  private static async createTransactionTestData(): Promise<TestDataResult> {
    try {
      console.log('💳 Creating transaction test data...');

      const transactions = [];
      const statuses = ['completed', 'pending', 'failed', 'cancelled'];
      const transactionTypes = ['purchase', 'redemption', 'refund', 'bonus'];

      for (let i = 0; i < 50; i++) {
        transactions.push({
          id: `transaction-${i.toString().padStart(3, '0')}-${Date.now()}`,
          user_id: `user-${i % 20}`,
          merchant_id: `merchant-${i % 10}`,
          amount: Math.random() * 1000 + 10,
          reward_points: Math.floor(Math.random() * 100) + 1,
          status: statuses[i % statuses.length],
          transaction_type: transactionTypes[i % transactionTypes.length],
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      const { data, error } = await supabase
        .from('loyalty_transactions')
        .insert(transactions)
        .select();

      if (error) {
        return {
          success: false,
          message: 'Failed to create transaction test data',
          error: error.message
        };
      }

      return {
        success: true,
        message: 'Transaction test data created successfully',
        data: data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create transaction test data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create marketplace test data
   */
  private static async createMarketplaceTestData(): Promise<TestDataResult> {
    try {
      console.log('🛒 Creating marketplace test data...');

      const listings = [];
      const assetTypes = ['NFT', 'Token', 'Service', 'Product'];
      const riskLevels = ['Low', 'Medium', 'High'];
      const statuses = ['active', 'funded', 'completed', 'cancelled'];

      for (let i = 0; i < 30; i++) {
        listings.push({
          id: `listing-${i.toString().padStart(3, '0')}-${Date.now()}`,
          title: `Marketplace Listing ${i + 1}`,
          description: `Description for marketplace listing ${i + 1}`,
          asset_type: assetTypes[i % assetTypes.length],
          risk_level: riskLevels[i % riskLevels.length],
          funding_goal: Math.random() * 100000 + 1000,
          current_funding: Math.random() * 50000,
          status: statuses[i % statuses.length],
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      const { data, error } = await supabase
        .from('marketplace_listings')
        .insert(listings)
        .select();

      if (error) {
        return {
          success: false,
          message: 'Failed to create marketplace test data',
          error: error.message
        };
      }

      return {
        success: true,
        message: 'Marketplace test data created successfully',
        data: data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create marketplace test data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear DAO test data
   */
  private static async clearDAOTestData(): Promise<void> {
    console.log('🧹 Clearing existing DAO test data...');

    // Clear in order due to foreign key constraints
    await supabase.from('dao_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('dao_proposals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('dao_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('dao_organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }

  /**
   * Get test data summary
   */
  static async getTestDataSummary(): Promise<TestDataResult> {
    try {
      console.log('📊 Getting test data summary...');

      // Get counts from all tables
      const [orgsResult, membersResult, proposalsResult, votesResult, subscriptionPlansResult, merchantsResult, transactionsResult, listingsResult] = await Promise.all([
        supabase.from('dao_organizations').select('id', { count: 'exact', head: true }),
        supabase.from('dao_members').select('id', { count: 'exact', head: true }),
        supabase.from('dao_proposals').select('id', { count: 'exact', head: true }),
        supabase.from('dao_votes').select('id', { count: 'exact', head: true }),
        supabase.from('merchant_subscription_plans').select('id', { count: 'exact', head: true }),
        supabase.from('merchants').select('id', { count: 'exact', head: true }),
        supabase.from('loyalty_transactions').select('id', { count: 'exact', head: true }),
        supabase.from('marketplace_listings').select('id', { count: 'exact', head: true })
      ]);

      const summary: TestDataSummary = {
        dao: {
          organizations: orgsResult.count || 0,
          members: membersResult.count || 0,
          proposals: proposalsResult.count || 0,
          votes: votesResult.count || 0
        },
        subscriptionPlans: subscriptionPlansResult.count || 0,
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

      // Clear DAO data
      await this.clearDAOTestData();

      // Clear other test data
      await supabase.from('loyalty_transactions').delete().like('id', 'transaction-%');
      await supabase.from('merchants').delete().like('id', 'merchant-%');
      await supabase.from('marketplace_listings').delete().like('id', 'listing-%');

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
