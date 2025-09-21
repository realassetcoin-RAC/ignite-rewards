#!/usr/bin/env node

const { Client } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function verifyTestData() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    console.log('\n📊 Verifying Test Data for Browser MCP Testing...\n');

    // Check users
    const userCount = await client.query('SELECT COUNT(*) FROM profiles WHERE email LIKE \'%test%\'');
    console.log(`👥 Test Users: ${userCount.rows[0].count}`);

    // Check merchants
    const merchantCount = await client.query('SELECT COUNT(*) FROM merchants WHERE contact_email LIKE \'%test%\'');
    console.log(`🏪 Test Merchants: ${merchantCount.rows[0].count}`);

    // Check loyalty cards
    const cardCount = await client.query('SELECT COUNT(*) FROM user_loyalty_cards WHERE email LIKE \'%test%\'');
    console.log(`💳 Loyalty Cards: ${cardCount.rows[0].count}`);

    // Check transactions
    const txnCount = await client.query('SELECT COUNT(*) FROM loyalty_transactions WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE \'%test%\')');
    console.log(`💸 Transactions: ${txnCount.rows[0].count}`);

    // List specific test users
    console.log('\n👤 Available Test Users:');
    const users = await client.query('SELECT email, full_name, role FROM profiles WHERE email LIKE \'%test%\' ORDER BY email');
    users.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.full_name}) - ${user.role}`);
    });

    // List specific test merchants
    console.log('\n🏪 Available Test Merchants:');
    const merchants = await client.query('SELECT contact_email, business_name FROM merchants WHERE contact_email LIKE \'%test%\' ORDER BY contact_email');
    merchants.rows.forEach(merchant => {
      console.log(`  - ${merchant.contact_email} (${merchant.business_name})`);
    });

    console.log('\n✅ Test data verification completed!');
    console.log('\n🎯 Ready for Browser MCP Testing!');
    console.log('\n📋 Quick Test Credentials:');
    console.log('👤 Regular User: john.doe@test.com / password123');
    console.log('👑 Admin User: admin@test.com / admin123!');
    console.log('🏪 Merchant User: merchant@test.com / password123');

  } catch (error) {
    console.error('❌ Error verifying test data:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

verifyTestData();
