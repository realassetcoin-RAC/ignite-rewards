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
  name: string;
  description: string;
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
  image_url: string;
  funding_goal: number;
  current_funding: number;
  status: 'active' | 'draft' | 'completed' | 'cancelled';
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
    const subscriptionPlans = ['basic', 'premium', 'enterprise'];

    for (let i = 0; i < count; i++) {
      const businessType = this.randomChoice(businessTypes);
      const city = this.randomChoice(cities);
      const country = this.randomChoice(countries);
      const plan = this.randomChoice(subscriptionPlans);
      
      const startDate = this.randomDate(new Date(2023, 0, 1), new Date());
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      this.merchants.push({
        id: this.generateId(),
        user_id: this.generateId(), // This should reference a real user_id
        name: `${businessType} ${i + 1}`,
        description: `A ${businessType.toLowerCase()} located in ${city}, ${country}. This is merchant number ${i + 1}.`,
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
        governance_token_symbol: tokens[i] || 'TOKEN',
        governance_token_decimals: 9,
        min_proposal_threshold: this.randomInt(1, 10),
        voting_period_days: this.randomInt(3, 14),
        quorum_percentage: this.randomFloat(10, 30),
        is_active: Math.random() > 0.2,
        created_at: this.randomDate(new Date(2023, 0, 1), new Date())
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
    const categories = ['governance', 'treasury', 'technical', 'community'];
    const votingTypes = ['simple_majority', 'super_majority', 'unanimous'];

    for (let i = 0; i < count; i++) {
      const dao = this.randomChoice(this.daos);
      const user = this.randomChoice(this.users);
      const createdDate = this.randomDate(new Date(2023, 0, 1), new Date());
      const votingStart = new Date(createdDate);
      votingStart.setDate(votingStart.getDate() + 1);
      const votingEnd = new Date(votingStart);
      votingEnd.setDate(votingEnd.getDate() + 7);

      this.proposals.push({
        id: this.generateId(),
        dao_id: dao.id,
        proposer_id: user.id,
        title: this.randomChoice(titles),
        description: this.randomChoice(descriptions),
        category: this.randomChoice(categories),
        voting_type: this.randomChoice(votingTypes),
        status: this.randomChoice(['draft', 'active', 'passed', 'rejected', 'executed', 'cancelled']),
        total_votes: this.randomInt(10, 150),
        yes_votes: this.randomInt(0, 100),
        no_votes: this.randomInt(0, 50),
        abstain_votes: this.randomInt(0, 20),
        created_at: createdDate,
        start_time: votingStart.toISOString(),
        end_time: votingEnd.toISOString()
      });
    }

    return this.proposals;
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
    const assetTypes = ['real_estate', 'startup', 'fund', 'infrastructure', 'technology'];
    const riskLevels = ['low', 'medium', 'high'];
    const tags = ['real-estate', 'technology', 'sustainability', 'healthcare', 'education', 'energy', 'infrastructure'];

    for (let i = 0; i < count; i++) {
      const title = this.randomChoice(titles);
      const description = this.randomChoice(descriptions);
      const createdDate = this.randomDate(new Date(2023, 0, 1), new Date());
      const endDate = new Date(createdDate);
      endDate.setDate(endDate.getDate() + this.randomInt(30, 365));

      this.marketplaceListings.push({
        id: this.generateId(),
        title: `${title} ${i + 1}`,
        description: `${description} This is listing number ${i + 1}.`,
        image_url: `https://images.unsplash.com/photo-${1500000000000 + i}?w=500`,
        funding_goal: this.randomInt(100000, 10000000),
        current_funding: this.randomInt(0, 5000000),
        status: this.randomChoice(['active', 'draft', 'completed', 'cancelled']),
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
      this.generateTransactions(200);
      this.generateMarketplaceListings(15);

      console.log('📊 Generated test data:');
      console.log(`- Users: ${this.users.length}`);
      console.log(`- Merchants: ${this.merchants.length}`);
      console.log(`- DAOs: ${this.daos.length}`);
      console.log(`- Proposals: ${this.proposals.length}`);
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

      // Insert merchants
      console.log('🏪 Inserting merchants...');
      const { error: merchantsError } = await supabase
        .from('merchants')
        .upsert(this.merchants);

      if (merchantsError) {
        console.error('Error inserting merchants:', merchantsError);
      } else {
        console.log('✅ Merchants inserted successfully');
      }

      // Insert DAOs
      console.log('🗳️ Inserting DAOs...');
      const { error: daosError } = await supabase
        .from('dao_organizations')
        .upsert(this.daos);

      if (daosError) {
        console.error('Error inserting DAOs:', daosError);
      } else {
        console.log('✅ DAOs inserted successfully');
      }

      // Insert proposals
      console.log('📋 Inserting proposals...');
      const { error: proposalsError } = await supabase
        .from('dao_proposals')
        .upsert(this.proposals);

      if (proposalsError) {
        console.error('Error inserting proposals:', proposalsError);
      } else {
        console.log('✅ Proposals inserted successfully');
      }

      // Insert transactions
      console.log('💳 Inserting transactions...');
      const { error: transactionsError } = await supabase
        .from('loyalty_transactions')
        .upsert(this.transactions);

      if (transactionsError) {
        console.error('Error inserting transactions:', transactionsError);
      } else {
        console.log('✅ Transactions inserted successfully');
      }

      // Insert marketplace listings
      console.log('🏪 Inserting marketplace listings...');
      const { error: listingsError } = await supabase
        .from('marketplace_listings')
        .upsert(this.marketplaceListings);

      if (listingsError) {
        console.error('Error inserting marketplace listings:', listingsError);
      } else {
        console.log('✅ Marketplace listings inserted successfully');
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
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

        if (error) {
          console.error(`Error clearing ${table}:`, error);
        } else {
          console.log(`✅ Cleared ${table}`);
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
