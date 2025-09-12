import { supabase } from '@/integrations/supabase/client';

interface TestUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'customer' | 'admin';
  created_at: string;
}

interface TestMerchant {
  id: string;
  user_id: string;
  business_name: string;
  business_type?: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  subscription_plan?: string;
  status?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  monthly_fee?: number;
  annual_fee?: number;
  created_at: string;
  updated_at: string;
}

interface TestDAO {
  id: string;
  name: string;
  description: string;
  governance_token_symbol: string;
  governance_token_decimals: number;
  min_proposal_threshold: number;
  voting_period_days: number;
  quorum_percentage: number;
  is_active: boolean;
  created_at: string;
}

interface TestProposal {
  id: string;
  dao_id: string;
  proposer_id: string;
  title: string;
  description: string;
  category: string;
  voting_type: string;
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';
  total_votes: number;
  yes_votes: number;
  no_votes: number;
  abstain_votes: number;
  created_at: string;
  start_time: string;
  end_time: string;
}

interface TestTransaction {
  id: string;
  merchant_id: string;
  user_id: string;
  loyalty_number: string;
  transaction_amount: number;
  points_earned: number;
  transaction_reference: string;
  created_at: string;
}

interface TestMarketplaceListing {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  funding_goal: number;
  min_investment?: number;
  max_investment?: number;
  start_time?: string;
  end_time?: string;
  token_ticker?: string;
  token_supply?: number;
  status: string;
  created_at: string;
}

class TestDataGenerator {
  private users: TestUser[] = [];
  private merchants: TestMerchant[] = [];
  private daos: TestDAO[] = [];
  private proposals: TestProposal[] = [];
  private transactions: TestTransaction[] = [];
  private marketplaceListings: TestMarketplaceListing[] = [];

  // Generate random data helpers
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomFloat(min: number, max: number, decimals: number = 2): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
  }

  private randomDate(start: Date, end: Date): string {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
  }

  private generateId(): string {
    // Generate a proper UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Generate test users
  generateUsers(count: number = 50): TestUser[] {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Jennifer', 'Daniel', 'Lisa', 'Matthew', 'Nancy', 'Anthony', 'Karen'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com'];

    for (let i = 0; i < count; i++) {
      const firstName = this.randomChoice(firstNames);
      const lastName = this.randomChoice(lastNames);
      const domain = this.randomChoice(domains);
      
      this.users.push({
        id: this.generateId(),
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domain}`,
        full_name: `${firstName} ${lastName}`,
        phone: `+1-${this.randomInt(200, 999)}-${this.randomInt(100, 999)}-${this.randomInt(1000, 9999)}`,
        role: this.randomChoice(['customer', 'admin']),
        // Add DAO-specific fields
        governance_tokens: this.randomInt(100, 10000),
        voting_power: this.randomInt(100, 10000),
        wallet_address: `0x${this.generateId().replace(/-/g, '').substring(0, 40)}`,
        avatar_url: `https://images.unsplash.com/photo-${1500000000000 + i}?w=100`,
        created_at: this.randomDate(new Date(2023, 0, 1), new Date())
      });
    }

    return this.users;
  }

  // Generate test merchants
  generateMerchants(count: number = 20): TestMerchant[] {
    const businessTypes = ['Restaurant', 'Retail Store', 'Service Provider', 'Online Store', 'Gym', 'Salon', 'Gas Station', 'Grocery Store', 'Pharmacy', 'Electronics Store'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
    const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'India', 'Mexico'];
    const subscriptionPlans = ['basic', 'standard', 'premium', 'enterprise'];
    const statuses = ['pending', 'active', 'inactive', 'suspended'];

    for (let i = 0; i < count; i++) {
      const businessType = this.randomChoice(businessTypes);
      const city = this.randomChoice(cities);
      const country = this.randomChoice(countries);
      const plan = this.randomChoice(subscriptionPlans);
      const status = this.randomChoice(statuses);
      
      const startDate = this.randomDate(new Date(2023, 0, 1), new Date());
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      this.merchants.push({
        id: this.generateId(),
        user_id: this.generateId(), // This should reference a real user_id
        business_name: `${businessType} ${i + 1}`,
        business_type: businessType,
        contact_email: `contact@${businessType.toLowerCase().replace(/\s+/g, '')}${i + 1}.com`,
        phone: `+1-${this.randomInt(200, 999)}-${this.randomInt(100, 999)}-${this.randomInt(1000, 9999)}`,
        address: `${this.randomInt(100, 9999)} ${businessType} Street`,
        city: city,
        country: country,
        subscription_plan: plan,
        status: status,
        subscription_start_date: startDate,
        subscription_end_date: endDate,
        monthly_fee: this.randomFloat(29.99, 299.99),
        annual_fee: this.randomFloat(299.99, 2999.99),
        created_at: startDate,
        updated_at: startDate
      });
    }

    return this.merchants;
  }

  // Generate test DAOs
  generateDAOs(count: number = 5): TestDAO[] {
    const daoNames = ['RAC Governance DAO', 'Community Treasury DAO', 'Development Fund DAO', 'Marketing DAO', 'Partnership DAO'];
    const descriptions = [
      'Decentralized governance for the RAC Rewards platform',
      'Community-managed treasury for platform development',
      'Funding mechanism for new feature development',
      'Marketing and promotion initiatives',
      'Strategic partnerships and collaborations'
    ];
    const tokens = ['RAC', 'GOV', 'TREASURY', 'DEV', 'MKT'];

    for (let i = 0; i < count; i++) {
      this.daos.push({
        id: this.generateId(),
        name: daoNames[i] || `DAO ${i + 1}`,
        description: descriptions[i] || `Description for DAO ${i + 1}`,
        logo_url: `https://images.unsplash.com/photo-${1500000000000 + i}?w=200`,
        website_url: `https://dao${i + 1}.example.com`,
        discord_url: `https://discord.gg/dao${i + 1}`,
        twitter_url: `https://twitter.com/dao${i + 1}`,
        github_url: `https://github.com/dao${i + 1}`,
        governance_token_address: `0x${this.generateId().replace(/-/g, '')}`,
        governance_token_symbol: tokens[i] || 'TOKEN',
        governance_token_decimals: 9,
        min_proposal_threshold: this.randomInt(100, 1000),
        voting_period_days: this.randomInt(3, 14),
        execution_delay_hours: this.randomInt(24, 72),
        quorum_percentage: this.randomFloat(10, 30),
        super_majority_threshold: this.randomFloat(60, 80),
        treasury_address: `0x${this.generateId().replace(/-/g, '')}`,
        created_by: this.generateId(),
        created_at: this.randomDate(new Date(2023, 0, 1), new Date()),
        updated_at: this.randomDate(new Date(2023, 0, 1), new Date()),
        is_active: Math.random() > 0.2
      });
    }

    return this.daos;
  }

  // Generate test proposals
  generateProposals(count: number = 30): TestProposal[] {
    const titles = [
      'Increase reward points for premium users',
      'Implement new loyalty program features',
      'Allocate funds for marketing campaign',
      'Update platform security measures',
      'Add new payment methods',
      'Expand to new markets',
      'Improve user interface design',
      'Implement AI-powered recommendations',
      'Add social media integration',
      'Create mobile app for merchants'
    ];
    const descriptions = [
      'This proposal aims to increase the reward points given to premium users to incentivize higher engagement.',
      'We propose implementing new features in the loyalty program to enhance user experience.',
      'Allocate a portion of the treasury for a comprehensive marketing campaign.',
      'Update and strengthen the platform\'s security measures to protect user data.',
      'Add support for additional payment methods to improve user convenience.',
      'Expand the platform to new geographical markets to increase user base.',
      'Redesign the user interface to be more intuitive and user-friendly.',
      'Implement AI-powered recommendation system to personalize user experience.',
      'Add integration with popular social media platforms.',
      'Develop a dedicated mobile application for merchants.'
    ];
    const categories = ['governance', 'treasury', 'technical', 'community', 'partnership', 'marketing', 'general'];
    const votingTypes = ['simple_majority', 'super_majority', 'unanimous', 'weighted', 'quadratic'];

    for (let i = 0; i < count; i++) {
      const dao = this.randomChoice(this.daos);
      const user = this.randomChoice(this.users);
      const createdDate = new Date(2023, 0, 1).getTime() + Math.random() * (new Date().getTime() - new Date(2023, 0, 1).getTime());
      const createdDateObj = new Date(createdDate);
      const votingStart = new Date(createdDateObj);
      votingStart.setDate(votingStart.getDate() + 1);
      const votingEnd = new Date(votingStart);
      votingEnd.setDate(votingEnd.getDate() + 7);

      const totalVotes = this.randomInt(10, 150);
      const yesVotes = this.randomInt(0, Math.floor(totalVotes * 0.8));
      const noVotes = this.randomInt(0, Math.floor(totalVotes * 0.3));
      const abstainVotes = totalVotes - yesVotes - noVotes;
      
      const status = this.randomChoice(['draft', 'active', 'passed', 'rejected', 'executed', 'cancelled']);
      const isActive = status === 'active';
      const isEnded = ['passed', 'rejected', 'executed'].includes(status);
      
      // Calculate execution time for passed proposals
      const executionTime = status === 'passed' ? new Date(votingEnd.getTime() + 24 * 60 * 60 * 1000) : null;
      
      // Determine voting status
      let votingStatus: 'upcoming' | 'active' | 'ended';
      if (isActive) {
        votingStatus = 'active';
      } else if (isEnded) {
        votingStatus = 'ended';
      } else {
        votingStatus = 'upcoming';
      }

      this.proposals.push({
        id: this.generateId(),
        dao_id: dao.id,
        proposer_id: user.id,
        title: this.randomChoice(titles),
        description: this.randomChoice(descriptions),
        full_description: this.randomChoice(descriptions) + ' This is a more detailed description of the proposal that provides additional context and implementation details.',
        category: this.randomChoice(categories),
        voting_type: this.randomChoice(votingTypes),
        status: status,
        
        // Voting parameters
        start_time: votingStart.toISOString(),
        end_time: votingEnd.toISOString(),
        execution_time: executionTime ? executionTime.toISOString() : undefined,
        
        // Voting results
        total_votes: totalVotes,
        yes_votes: yesVotes,
        no_votes: noVotes,
        abstain_votes: Math.max(0, abstainVotes),
        participation_rate: this.randomFloat(20, 95),
        
        // Treasury impact
        treasury_impact_amount: this.randomFloat(0, 10000),
        treasury_impact_currency: this.randomChoice(['SOL', 'USDC', 'USDT']),
        
        // Metadata - fix tags to be flat array
        tags: this.randomChoice([
          ['governance', 'voting'],
          ['technical', 'development'],
          ['treasury', 'funding'],
          ['community', 'engagement'],
          ['partnership', 'collaboration'],
          ['marketing', 'growth']
        ]),
        
        // Timestamps
        created_at: createdDateObj.toISOString(),
        updated_at: createdDateObj.toISOString(),
        executed_at: status === 'executed' ? executionTime?.toISOString() : undefined,
        
        // Extended fields for UI functionality
        dao_name: dao.name,
        proposer_email: user.email,
        proposer_tokens: user.governance_tokens || 0,
        voting_status: votingStatus,
        user_vote: undefined, // Will be set by the UI based on user's actual vote
        user_voting_power: user.voting_power || 0,
        can_vote: isActive && user.voting_power > 0,
        can_execute: status === 'passed' && user.role === 'admin'
      });
    }

    return this.proposals;
  }

  // Generate test DAO votes
  generateDAOVotes(count: number = 100): any[] {
    const votes: any[] = [];
    
    for (let i = 0; i < count; i++) {
      const proposal = this.randomChoice(this.proposals);
      const user = this.randomChoice(this.users);
      const voteChoice = this.randomChoice(['yes', 'no', 'abstain']);
      const votingPower = this.randomInt(1, 1000);
      
      votes.push({
        id: this.generateId(),
        proposal_id: proposal.id,
        voter_id: user.id,
        vote_choice: voteChoice,
        voting_power: votingPower,
        voting_weight: votingPower,
        reason: this.randomChoice([
          'I support this proposal because it aligns with our community values.',
          'This proposal needs more discussion before implementation.',
          'I have concerns about the treasury impact.',
          'This is a great step forward for our DAO.',
          'I need more information about the technical implementation.',
          'This proposal will benefit our community significantly.',
          'I disagree with the proposed changes.',
          'I abstain from voting on this matter.'
        ]),
        transaction_hash: `0x${this.generateId().replace(/-/g, '').substring(0, 64)}`,
        created_at: this.randomDate(new Date(2023, 0, 1), new Date()),
        voter_email: user.email,
        voter_avatar_url: user.avatar_url
      });
    }
    
    return votes;
  }

  // Generate test transactions
  generateTransactions(count: number = 200): TestTransaction[] {
    for (let i = 0; i < count; i++) {
      const merchant = this.randomChoice(this.merchants);
      const user = this.randomChoice(this.users);
      const amount = this.randomFloat(10, 1000);
      const rewardPoints = Math.floor(amount); // 1 point per dollar

      this.transactions.push({
        id: this.generateId(),
        merchant_id: merchant.id,
        user_id: user.id,
        loyalty_number: `LOY-${this.randomInt(100000, 999999)}`,
        transaction_amount: amount,
        points_earned: rewardPoints,
        transaction_reference: `RCP-${this.randomInt(100000, 999999)}`,
        created_at: this.randomDate(new Date(2023, 0, 1), new Date())
      });
    }

    return this.transactions;
  }

  // Generate test marketplace listings
  generateMarketplaceListings(count: number = 15): TestMarketplaceListing[] {
    const titles = [
      'Downtown Office Building',
      'Green Energy Startup',
      'Tech Innovation Fund',
      'Real Estate Development',
      'Sustainable Agriculture Project',
      'Healthcare Technology Initiative',
      'Educational Platform Development',
      'Renewable Energy Infrastructure',
      'Smart City Solutions',
      'Biotech Research Fund'
    ];
    const descriptions = [
      'Premium office space in the heart of downtown with high rental yields and appreciation potential.',
      'Revolutionary solar panel technology startup seeking funding for expansion and R&D.',
      'Investment fund focused on emerging technology companies with high growth potential.',
      'Mixed-use real estate development project in growing metropolitan area.',
      'Sustainable farming initiative using advanced agricultural technology.',
      'Healthcare technology platform improving patient care through AI and data analytics.',
      'Educational technology platform revolutionizing online learning experiences.',
      'Large-scale renewable energy infrastructure project with long-term returns.',
      'Smart city technology solutions for urban development and sustainability.',
      'Biotechnology research fund supporting breakthrough medical discoveries.'
    ];
    const statuses = ['active', 'draft', 'completed', 'cancelled'];
    const tokenTickers = ['RAC', 'GREEN', 'TECH', 'REAL', 'BIO', 'EDU', 'ENERGY', 'SMART'];

    for (let i = 0; i < count; i++) {
      const title = this.randomChoice(titles);
      const description = this.randomChoice(descriptions);
      const createdDate = this.randomDate(new Date(2023, 0, 1), new Date());
      const endDate = new Date(createdDate);
      endDate.setDate(endDate.getDate() + this.randomInt(30, 365));
      const fundingGoal = this.randomInt(100000, 10000000);

      this.marketplaceListings.push({
        id: this.generateId(),
        title: `${title} ${i + 1}`,
        description: `${description} This is listing number ${i + 1}.`,
        image_url: `https://images.unsplash.com/photo-${1500000000000 + i}?w=500`,
        funding_goal: fundingGoal,
        min_investment: this.randomInt(100, 1000),
        max_investment: this.randomInt(10000, 100000),
        start_time: createdDate,
        end_time: endDate.toISOString(),
        token_ticker: this.randomChoice(tokenTickers),
        token_supply: this.randomInt(1000000, 10000000),
        status: this.randomChoice(statuses),
        created_at: createdDate
      });
    }

    return this.marketplaceListings;
  }

  // Insert data into database
  async insertTestData(): Promise<void> {
    try {
      console.log('🚀 Starting test data generation...');

      // Generate all test data
      this.generateUsers(50);
      this.generateMerchants(20);
      this.generateDAOs(5);
      this.generateProposals(30);
      const daoVotes = this.generateDAOVotes(100);
      this.generateTransactions(200);
      this.generateMarketplaceListings(15);

      console.log('📊 Generated test data:');
      console.log(`- Users: ${this.users.length}`);
      console.log(`- Merchants: ${this.merchants.length}`);
      console.log(`- DAOs: ${this.daos.length}`);
      console.log(`- Proposals: ${this.proposals.length}`);
      console.log(`- DAO Votes: ${daoVotes.length}`);
      console.log(`- Transactions: ${this.transactions.length}`);
      console.log(`- Marketplace Listings: ${this.marketplaceListings.length}`);

      // Insert users (profiles table)
      console.log('👥 Inserting users...');
      const userProfiles = this.users.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at
      }));

      // Note: Cannot directly insert into profiles table as it's in api schema
      // This would need to be handled through RPC functions or proper schema setup
      console.log('⚠️ Skipping user profile insertion - requires RPC function or schema fix');

      console.log('✅ User profile insertion skipped (schema limitation)');

      // Insert merchants (skip if table doesn't exist)
      console.log('🏪 Inserting merchants...');
      try {
        // Use the absolute minimal merchant schema
        const minimalMerchants = this.merchants.map(merchant => ({
          id: merchant.id,
          name: merchant.business_name,
          description: `${merchant.business_type} business`,
          created_at: merchant.created_at,
          updated_at: merchant.updated_at
        }));

        console.log(`📊 Inserting ${minimalMerchants.length} merchants with IDs:`, minimalMerchants.map(m => m.id));
        
        // Use direct SQL since merchants table is not in TypeScript types
        const { error: merchantsError } = await supabase
          .from('merchants' as any)
          .upsert(minimalMerchants);

        if (merchantsError) {
          console.error('❌ Error inserting merchants:', merchantsError.message);
          console.warn('⚠️ Merchants table may not exist or have schema issues, skipping...');
        } else {
          console.log('✅ Merchants inserted successfully');
        }
      } catch (error) {
        console.error('❌ Error inserting merchants:', error);
        console.warn('⚠️ Merchants table may not exist, skipping...');
      }

      // Insert DAOs
      console.log('🗳️ Inserting DAOs...');
      try {
        const { error: daosError } = await supabase
          .from('dao_organizations' as any)
          .upsert(this.daos);

        if (daosError) {
          console.error('❌ Error inserting DAOs:', daosError.message);
        } else {
          console.log('✅ DAOs inserted successfully');
        }
      } catch (error) {
        console.error('❌ Error inserting DAOs:', error);
      }

      // Insert proposals (handle schema mismatches)
      console.log('📋 Inserting proposals...');
      try {
        // Filter out fields that might not exist in the database schema
        const filteredProposals = this.proposals.map(proposal => ({
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
          total_votes: proposal.total_votes,
          yes_votes: proposal.yes_votes,
          no_votes: proposal.no_votes,
          abstain_votes: proposal.abstain_votes,
          participation_rate: proposal.participation_rate,
          treasury_impact_amount: proposal.treasury_impact_amount,
          treasury_impact_currency: proposal.treasury_impact_currency,
          tags: proposal.tags,
          created_at: proposal.created_at,
          updated_at: proposal.updated_at,
          executed_at: proposal.executed_at
        }));

        const { error: proposalsError } = await supabase
          .from('dao_proposals' as any)
          .upsert(filteredProposals);

        if (proposalsError) {
          console.error('❌ Error inserting proposals:', proposalsError.message);
        } else {
          console.log('✅ Proposals inserted successfully');
        }
      } catch (error) {
        console.error('❌ Error inserting proposals:', error);
      }

      // Insert DAO votes (handle schema mismatches)
      console.log('🗳️ Inserting DAO votes...');
      try {
        // Filter out fields that might not exist in the database schema
        const filteredVotes = daoVotes.map(vote => ({
          id: vote.id,
          proposal_id: vote.proposal_id,
          voter_id: vote.voter_id,
          vote_choice: vote.vote_choice,
          voting_power: vote.voting_power,
          voting_weight: vote.voting_weight,
          reason: vote.reason,
          transaction_hash: vote.transaction_hash,
          created_at: vote.created_at,
          voter_email: vote.voter_email,
          voter_avatar_url: vote.voter_avatar_url
        }));

        const { error: votesError } = await supabase
          .from('dao_votes' as any)
          .upsert(filteredVotes);

        if (votesError) {
          console.error('❌ Error inserting DAO votes:', votesError.message);
        } else {
          console.log('✅ DAO votes inserted successfully');
        }
      } catch (error) {
        console.error('❌ Error inserting DAO votes:', error);
      }

      // Insert transactions (work with actual schema)
      console.log('💳 Inserting transactions...');
      try {
        // Get current user for RLS policy compliance
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.warn('⚠️ No authenticated user found, skipping transaction insertion due to RLS policies');
          return;
        }

        // First, try to get existing merchants to use their IDs
        // Add a small delay to ensure merchants are committed to the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: existingMerchants, error: merchantsQueryError } = await supabase
          .from('merchants' as any)
          .select('id, name')
          .limit(10);

        if (merchantsQueryError) {
          console.error('❌ Error querying merchants:', merchantsQueryError.message);
          console.warn('⚠️ Cannot query merchants, skipping transaction insertion due to foreign key constraints');
          return;
        }

        if (!existingMerchants || existingMerchants.length === 0) {
          console.warn('⚠️ No existing merchants found, skipping transaction insertion due to foreign key constraints');
          return;
        }

        console.log(`📊 Found ${existingMerchants.length} existing merchants for transaction insertion`);
        console.log(`📊 Merchant IDs:`, existingMerchants.map(m => m.id));
        console.log(`📊 Merchant names:`, existingMerchants.map(m => m.name));

        // Convert transactions to match the actual loyalty_transactions schema - try just one first
        const loyaltyTransactions = this.transactions.slice(0, 1).map((transaction, index) => {
          const merchantId = existingMerchants[index % existingMerchants.length].id;
          console.log(`📊 Using merchant ID ${merchantId} for transaction ${transaction.id}`);
          
          const transactionData = {
            id: transaction.id,
            user_id: user.id, // Use real user ID for RLS compliance
            merchant_id: merchantId, // Use existing merchant ID
            loyalty_number: `LOY${transaction.id.substring(0, 8).toUpperCase()}`,
            transaction_amount: transaction.transaction_amount,
            points_earned: transaction.points_earned,
            transaction_date: transaction.created_at,
            transaction_reference: transaction.transaction_reference || `TXN${transaction.id.substring(0, 8).toUpperCase()}`,
            created_at: transaction.created_at
          };
          
          console.log(`📊 Transaction data:`, transactionData);
          return transactionData;
        });

        console.log(`📊 About to insert ${loyaltyTransactions.length} transactions`);
        console.log(`📊 First transaction merchant_id: ${loyaltyTransactions[0]?.merchant_id}`);
        
        // Verify that the merchant ID actually exists in the database
        const { data: verifyMerchant, error: verifyError } = await supabase
          .from('merchants' as any)
          .select('id')
          .eq('id', loyaltyTransactions[0]?.merchant_id)
          .single();
          
        if (verifyError || !verifyMerchant) {
          console.error('❌ Merchant ID verification failed:', verifyError?.message || 'Merchant not found');
          console.warn('⚠️ Skipping transaction insertion due to merchant verification failure');
          return;
        }
        
        console.log('✅ Merchant ID verified successfully');
        
        const { error: transactionsError } = await supabase
          .from('loyalty_transactions')
          .upsert(loyaltyTransactions);

        if (transactionsError) {
          console.error('❌ Error inserting transactions:', transactionsError.message);
        } else {
          console.log('✅ Transactions inserted successfully');
        }
      } catch (error) {
        console.error('❌ Error inserting transactions:', error);
      }

      // Insert marketplace listings (skip if table doesn't exist)
      console.log('🏪 Inserting marketplace listings...');
      try {
        // Use the absolute minimal marketplace_listings schema - only the most basic fields
        const minimalMarketplaceListings = this.marketplaceListings.map(listing => ({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          listing_type: 'asset', // Add required listing_type field with valid enum value
          total_funding_goal: listing.funding_goal || 10000, // Add required total_funding_goal field
          created_at: listing.created_at
        }));

        const { error: listingsError } = await supabase
          .from('marketplace_listings' as any)
          .upsert(minimalMarketplaceListings);

        if (listingsError) {
          console.error('❌ Error inserting marketplace listings:', listingsError.message);
          console.warn('⚠️ Marketplace listings table may not exist or have schema issues, skipping...');
        } else {
          console.log('✅ Marketplace listings inserted successfully');
        }
      } catch (error) {
        console.error('❌ Error inserting marketplace listings:', error);
        console.warn('⚠️ Marketplace listings table may not exist, skipping...');
      }

      console.log('🎉 Test data generation completed successfully!');

    } catch (error) {
      console.error('❌ Error generating test data:', error);
      throw error;
    }
  }

  // Clear all test data
  async clearTestData(): Promise<void> {
    try {
      console.log('🧹 Clearing test data...');

      const tables = [
        'marketplace_listings',
        'loyalty_transactions',
        'dao_proposals',
        'dao_organizations',
        'merchants'
        // Note: profiles table is in api schema and cannot be directly accessed
      ];

      for (const table of tables) {
        try {
        const { error } = await supabase
          .from(table as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

          if (error) {
            console.error(`Error clearing ${table}:`, error.message);
          } else {
            console.log(`✅ Cleared ${table}`);
          }
        } catch (tableError) {
          console.error(`Error clearing ${table}:`, tableError);
        }
      }

      console.log('🎉 Test data cleared successfully!');
    } catch (error) {
      console.error('❌ Error clearing test data:', error);
      throw error;
    }
  }

  // Get generated data for inspection
  getGeneratedData() {
    return {
      users: this.users,
      merchants: this.merchants,
      daos: this.daos,
      proposals: this.proposals,
      transactions: this.transactions,
      marketplaceListings: this.marketplaceListings
    };
  }
}

export default TestDataGenerator;
