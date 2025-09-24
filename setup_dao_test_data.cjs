const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'postgres'
});

async function setupDAOTestData() {
  try {
    await client.connect();
    console.log('Connected to database');

    // First, get existing user IDs from profiles table
    const usersResult = await client.query('SELECT id, email FROM profiles LIMIT 5');
    console.log('\nFound test users:');
    usersResult.rows.forEach((row, index) => {
      console.log(`User ${index + 1}: ${row.id} - ${row.email}`);
    });

    if (usersResult.rows.length === 0) {
      console.log('No test users found. Please run create_test_data.cjs first.');
      return;
    }

    // Clear existing DAO test data
    console.log('\nClearing existing DAO test data...');
    await client.query('DELETE FROM dao_votes WHERE proposal_id IN (SELECT id FROM dao_proposals WHERE dao_id = $1)', ['550e8400-e29b-41d4-a716-446655440000']);
    await client.query('DELETE FROM dao_proposals WHERE dao_id = $1', ['550e8400-e29b-41d4-a716-446655440000']);
    await client.query('DELETE FROM dao_members WHERE dao_id = $1', ['550e8400-e29b-41d4-a716-446655440000']);
    await client.query('DELETE FROM dao_organizations WHERE id = $1', ['550e8400-e29b-41d4-a716-446655440000']);

    // Create DAO organization
    console.log('\nCreating DAO organization...');
    await client.query(`
      INSERT INTO dao_organizations (
        id, name, description, governance_token_symbol, governance_token_decimals,
        min_proposal_threshold, voting_period_days, execution_delay_hours,
        quorum_percentage, super_majority_threshold, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
    `, [
      '550e8400-e29b-41d4-a716-446655440000',
      'RAC Rewards DAO',
      'Decentralized governance for the RAC Rewards loyalty platform',
      'RAC',
      9,
      100,
      7,
      24,
      10.0,
      66.67,
      true
    ]);

    // Create DAO members using real user IDs
    console.log('\nCreating DAO members...');
    const adminUser = usersResult.rows[0]; // First user as admin
    const memberUsers = usersResult.rows.slice(1, 4); // Next 3 users as members

    // Admin member
    await client.query(`
      INSERT INTO dao_members (
        id, dao_id, user_id, wallet_address, role, governance_tokens,
        voting_power, is_active, user_email, user_full_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      uuidv4(),
      '550e8400-e29b-41d4-a716-446655440000',
      adminUser.id,
      'AdminWallet123456789',
      'admin',
      10000,
      10000,
      true,
      adminUser.email,
      'DAO Admin'
    ]);

    // Regular members
    for (let i = 0; i < memberUsers.length; i++) {
      const user = memberUsers[i];
      await client.query(`
        INSERT INTO dao_members (
          id, dao_id, user_id, wallet_address, role, governance_tokens,
          voting_power, is_active, user_email, user_full_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        uuidv4(),
        '550e8400-e29b-41d4-a716-446655440000',
        user.id,
        `MemberWallet${i + 1}123456789`,
        'member',
        5000 - (i * 1000), // Decreasing voting power
        5000 - (i * 1000),
        true,
        user.email,
        `DAO Member ${i + 1}`
      ]);
    }

    // Create test proposals
    console.log('\nCreating DAO proposals...');
    
    // Active proposal 1
    await client.query(`
      INSERT INTO dao_proposals (
        id, dao_id, proposer_id, title, description, full_description,
        category, voting_type, status, start_time, end_time,
        treasury_impact_amount, treasury_impact_currency, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      uuidv4(),
      '550e8400-e29b-41d4-a716-446655440000',
      adminUser.id,
      'Increase Loyalty Point Rewards by 20%',
      'Proposal to increase the loyalty point multiplier from 1x to 1.2x for all merchants',
      'This proposal aims to increase customer engagement by boosting the loyalty point rewards. The change would affect all merchants on the platform and require updates to the reward calculation system. This would incentivize more customer participation and increase overall platform usage.',
      'governance',
      'simple_majority',
      'active',
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      0,
      'SOL',
      ['governance', 'rewards', 'loyalty']
    ]);

    // Active proposal 2
    await client.query(`
      INSERT INTO dao_proposals (
        id, dao_id, proposer_id, title, description, full_description,
        category, voting_type, status, start_time, end_time,
        treasury_impact_amount, treasury_impact_currency, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      uuidv4(),
      '550e8400-e29b-41d4-a716-446655440000',
      memberUsers[0]?.id || adminUser.id,
      'Add Solana USDC as Payment Option',
      'Enable USDC payments on Solana blockchain for loyalty transactions',
      'This proposal would integrate Solana USDC as a payment method, allowing users to pay for loyalty transactions using USDC. This would require integration with Solana wallet providers and USDC token handling.',
      'technical',
      'simple_majority',
      'active',
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      0,
      'USDC',
      ['technical', 'payments', 'solana']
    ]);

    // Passed proposal
    await client.query(`
      INSERT INTO dao_proposals (
        id, dao_id, proposer_id, title, description, full_description,
        category, voting_type, status, start_time, end_time,
        total_votes, yes_votes, no_votes, abstain_votes, participation_rate,
        treasury_impact_amount, treasury_impact_currency, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `, [
      uuidv4(),
      '550e8400-e29b-41d4-a716-446655440000',
      adminUser.id,
      'Implement Quadratic Voting for Governance',
      'Change voting mechanism from simple majority to quadratic voting',
      'This proposal would implement quadratic voting to reduce the influence of large token holders and promote more democratic decision-making.',
      'governance',
      'super_majority',
      'passed',
      new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      3,
      2,
      1,
      0,
      75.0,
      0,
      'SOL',
      ['governance', 'voting', 'democracy']
    ]);

    // Draft proposal
    await client.query(`
      INSERT INTO dao_proposals (
        id, dao_id, proposer_id, title, description, full_description,
        category, voting_type, status, treasury_impact_amount, treasury_impact_currency, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      uuidv4(),
      '550e8400-e29b-41d4-a716-446655440000',
      memberUsers[1]?.id || adminUser.id,
      'Add NFT Rewards for High-Value Customers',
      'Proposal to create NFT rewards for customers with high loyalty points',
      'This proposal would create a new NFT reward system for customers who accumulate high loyalty points. The NFTs would be unique and could provide additional benefits.',
      'rewards',
      'simple_majority',
      'draft',
      0,
      'SOL',
      ['rewards', 'nft', 'loyalty']
    ]);

    // Get the passed proposal ID to add votes
    const passedProposalResult = await client.query(`
      SELECT id FROM dao_proposals 
      WHERE title = 'Implement Quadratic Voting for Governance' AND status = 'passed'
    `);
    
    if (passedProposalResult.rows.length > 0) {
      const passedProposalId = passedProposalResult.rows[0].id;
      
      console.log('\nCreating votes for passed proposal...');
      
      // Add votes for the passed proposal
      await client.query(`
        INSERT INTO dao_votes (id, proposal_id, voter_id, choice, voting_power, reason)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        uuidv4(),
        passedProposalId,
        adminUser.id,
        'yes',
        10000,
        'This will make our governance more democratic and fair for all members.'
      ]);

      if (memberUsers[0]) {
        await client.query(`
          INSERT INTO dao_votes (id, proposal_id, voter_id, choice, voting_power, reason)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          uuidv4(),
          passedProposalId,
          memberUsers[0].id,
          'yes',
          5000,
          'I support this change to reduce the influence of large holders.'
        ]);
      }

      if (memberUsers[1]) {
        await client.query(`
          INSERT INTO dao_votes (id, proposal_id, voter_id, choice, voting_power, reason)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          uuidv4(),
          passedProposalId,
          memberUsers[1].id,
          'no',
          3000,
          'The current system works fine and this change might be too complex.'
        ]);
      }
    }

    // Display summary
    console.log('\n=== DAO Test Data Setup Complete ===');
    
    const orgCount = await client.query('SELECT COUNT(*) FROM dao_organizations');
    const memberCount = await client.query('SELECT COUNT(*) FROM dao_members');
    const proposalCount = await client.query('SELECT COUNT(*) FROM dao_proposals');
    const voteCount = await client.query('SELECT COUNT(*) FROM dao_votes');

    console.log(`DAO Organizations: ${orgCount.rows[0].count}`);
    console.log(`DAO Members: ${memberCount.rows[0].count}`);
    console.log(`DAO Proposals: ${proposalCount.rows[0].count}`);
    console.log(`DAO Votes: ${voteCount.rows[0].count}`);

    // Display active proposals
    const activeProposals = await client.query(`
      SELECT id, title, status, start_time, end_time, total_votes, yes_votes, no_votes
      FROM dao_proposals 
      WHERE status = 'active'
      ORDER BY created_at DESC
    `);

    console.log('\n=== Active Proposals ===');
    activeProposals.rows.forEach((proposal, index) => {
      console.log(`${index + 1}. ${proposal.title}`);
      console.log(`   Status: ${proposal.status}`);
      console.log(`   Votes: ${proposal.total_votes} (Yes: ${proposal.yes_votes}, No: ${proposal.no_votes})`);
      console.log(`   End Time: ${proposal.end_time}`);
      console.log('');
    });

    await client.end();
    console.log('\nDAO test data setup completed successfully!');

  } catch (error) {
    console.error('Error setting up DAO test data:', error);
    await client.end();
  }
}

setupDAOTestData();
