#!/usr/bin/env node

/**
 * Comprehensive DAO System Setup Script
 * 
 * This script sets up the complete DAO system with:
 * - Database tables and schema
 * - 100+ test records with different statuses and categories
 * - Comprehensive test validation
 * - Performance testing
 * 
 * Usage: node setup-comprehensive-dao-system.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'your-supabase-url') {
  console.error('❌ Please set your Supabase environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class ComprehensiveDAOSetup {
  constructor() {
    this.results = {
      tables: { created: 0, errors: [] },
      data: { created: 0, errors: [] },
      tests: { passed: 0, failed: 0, errors: [] }
    };
  }

  async run() {
    console.log('🚀 Starting Comprehensive DAO System Setup...\n');

    try {
      // Step 1: Create database tables
      await this.createTables();
      
      // Step 2: Create comprehensive test data
      await this.createTestData();
      
      // Step 3: Run validation tests
      await this.runValidationTests();
      
      // Step 4: Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async createTables() {
    console.log('📋 Step 1: Creating Database Tables...');
    
    try {
      // Read the SQL file
      const sqlPath = path.join(__dirname, 'comprehensive-dao-setup.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      
      // Split into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`   Executing ${statements.length} SQL statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX')) {
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
              console.warn(`   ⚠️  Warning on statement ${i + 1}: ${error.message}`);
            } else {
              this.results.tables.created++;
            }
          } catch (err) {
            this.results.tables.errors.push(`Statement ${i + 1}: ${err.message}`);
          }
        }
      }
      
      console.log(`   ✅ Created ${this.results.tables.created} database objects`);
      if (this.results.tables.errors.length > 0) {
        console.log(`   ⚠️  ${this.results.tables.errors.length} warnings`);
      }
      
    } catch (error) {
      console.error('   ❌ Failed to create tables:', error.message);
      throw error;
    }
  }

  async createTestData() {
    console.log('\n📊 Step 2: Creating Comprehensive Test Data...');
    
    try {
      // Create DAO organizations
      const organizations = await this.createDAOOrganizations();
      console.log(`   ✅ Created ${organizations.length} DAO organizations`);
      
      // Create DAO members
      const members = await this.createDAOMembers(organizations);
      console.log(`   ✅ Created ${members.length} DAO members`);
      
      // Create DAO proposals
      const proposals = await this.createDAOProposals(organizations, members);
      console.log(`   ✅ Created ${proposals.length} DAO proposals`);
      
      // Create DAO votes
      const votes = await this.createDAOVotes(proposals, members);
      console.log(`   ✅ Created ${votes.length} DAO votes`);
      
      this.results.data.created = organizations.length + members.length + proposals.length + votes.length;
      
    } catch (error) {
      console.error('   ❌ Failed to create test data:', error.message);
      this.results.data.errors.push(error.message);
    }
  }

  async createDAOOrganizations() {
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
        super_majority_threshold: 66.67,
        is_active: true
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
        super_majority_threshold: 60.0,
        is_active: true
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
        super_majority_threshold: 75.0,
        is_active: true
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
        super_majority_threshold: 80.0,
        is_active: true
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
        super_majority_threshold: 70.0,
        is_active: true
      }
    ];

    const { data, error } = await supabase
      .from('dao_organizations')
      .insert(organizations)
      .select();

    if (error) throw error;
    return data;
  }

  async createDAOMembers(organizations) {
    const members = [];
    const roles = ['admin', 'moderator', 'member'];

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

    if (error) throw error;
    return data;
  }

  async createDAOProposals(organizations, members) {
    const proposals = [];
    const categories = ['governance', 'treasury', 'technical', 'community', 'partnership', 'marketing', 'rewards', 'general'];
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
        ? new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
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

    if (error) throw error;
    return data;
  }

  async createDAOVotes(proposals, members) {
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

    if (error) throw error;
    return data;
  }

  async runValidationTests() {
    console.log('\n🧪 Step 3: Running Validation Tests...');
    
    const tests = [
      { name: 'Database Connection', fn: () => this.testDatabaseConnection() },
      { name: 'DAO Tables Exist', fn: () => this.testDAOTablesExist() },
      { name: 'Data Counts Validation', fn: () => this.testDataCounts() },
      { name: 'Data Relationships', fn: () => this.testDataRelationships() },
      { name: 'Performance Test', fn: () => this.testPerformance() }
    ];

    for (const test of tests) {
      try {
        await test.fn();
        console.log(`   ✅ ${test.name} - PASSED`);
        this.results.tests.passed++;
      } catch (error) {
        console.log(`   ❌ ${test.name} - FAILED: ${error.message}`);
        this.results.tests.failed++;
        this.results.tests.errors.push(`${test.name}: ${error.message}`);
      }
    }
  }

  async testDatabaseConnection() {
    const { data, error } = await supabase
      .from('dao_organizations')
      .select('count')
      .limit(1);
    
    if (error) throw new Error(`Database connection failed: ${error.message}`);
  }

  async testDAOTablesExist() {
    const tables = ['dao_organizations', 'dao_members', 'dao_proposals', 'dao_votes'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) throw new Error(`Table ${table} does not exist: ${error.message}`);
    }
  }

  async testDataCounts() {
    const [orgsResult, membersResult, proposalsResult, votesResult] = await Promise.all([
      supabase.from('dao_organizations').select('id', { count: 'exact', head: true }),
      supabase.from('dao_members').select('id', { count: 'exact', head: true }),
      supabase.from('dao_proposals').select('id', { count: 'exact', head: true }),
      supabase.from('dao_votes').select('id', { count: 'exact', head: true })
    ]);

    if (orgsResult.count < 5) throw new Error(`Expected at least 5 organizations, got ${orgsResult.count}`);
    if (membersResult.count < 50) throw new Error(`Expected at least 50 members, got ${membersResult.count}`);
    if (proposalsResult.count < 100) throw new Error(`Expected at least 100 proposals, got ${proposalsResult.count}`);
    if (votesResult.count < 100) throw new Error(`Expected at least 100 votes, got ${votesResult.count}`);
  }

  async testDataRelationships() {
    // Test that all members belong to existing organizations
    const { data: members, error: membersError } = await supabase
      .from('dao_members')
      .select('dao_id')
      .limit(10);

    if (membersError) throw new Error(`Failed to fetch DAO members: ${membersError.message}`);

    for (const member of members || []) {
      const { data: org, error: orgError } = await supabase
        .from('dao_organizations')
        .select('id')
        .eq('id', member.dao_id)
        .single();

      if (orgError || !org) {
        throw new Error(`Member references non-existent DAO organization: ${member.dao_id}`);
      }
    }
  }

  async testPerformance() {
    const startTime = Date.now();
    
    const { data: allProposals, error } = await supabase
      .from('dao_proposals')
      .select('*')
      .limit(1000);

    const duration = Date.now() - startTime;
    
    if (error) throw new Error(`Performance test failed: ${error.message}`);
    if (duration > 5000) throw new Error(`Performance test too slow: ${duration}ms`);
    if (!allProposals || allProposals.length < 100) {
      throw new Error(`Performance test insufficient data: ${allProposals?.length || 0}`);
    }
  }

  generateReport() {
    console.log('\n📊 Setup Report:');
    console.log('================');
    console.log(`✅ Database Objects Created: ${this.results.tables.created}`);
    console.log(`✅ Test Records Created: ${this.results.data.created}`);
    console.log(`✅ Tests Passed: ${this.results.tests.passed}`);
    console.log(`❌ Tests Failed: ${this.results.tests.failed}`);
    
    if (this.results.tables.errors.length > 0) {
      console.log(`\n⚠️  Table Creation Warnings (${this.results.tables.errors.length}):`);
      this.results.tables.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (this.results.data.errors.length > 0) {
      console.log(`\n❌ Data Creation Errors (${this.results.data.errors.length}):`);
      this.results.data.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (this.results.tests.errors.length > 0) {
      console.log(`\n❌ Test Failures (${this.results.tests.errors.length}):`);
      this.results.tests.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    const successRate = (this.results.tests.passed / (this.results.tests.passed + this.results.tests.failed)) * 100;
    console.log(`\n🎯 Overall Success Rate: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 80) {
      console.log('🎉 Setup completed successfully! Your DAO system is ready for testing.');
    } else {
      console.log('⚠️  Setup completed with some issues. Please review the errors above.');
    }
  }
}

// Run the setup
if (require.main === module) {
  const setup = new ComprehensiveDAOSetup();
  setup.run().catch(console.error);
}

module.exports = ComprehensiveDAOSetup;
