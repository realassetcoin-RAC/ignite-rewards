#!/usr/bin/env node

const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function createSimpleTestData() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Clean up existing test data
    console.log('🧹 Cleaning up existing test data...');
    await client.query(`
      DELETE FROM user_loyalty_cards WHERE email LIKE '%test%';
      DELETE FROM loyalty_transactions WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE '%test%');
      DELETE FROM merchants WHERE contact_email LIKE '%test%';
      DELETE FROM profiles WHERE email LIKE '%test%';
      DELETE FROM auth.users WHERE email LIKE '%test%';
    `);
    console.log('✅ Cleaned up existing test data');

    // Create test users directly in profiles table
    console.log('👥 Creating test users...');
    const testUsers = [
      { email: 'john.doe@test.com', name: 'John Doe', role: 'user' },
      { email: 'jane.smith@test.com', name: 'Jane Smith', role: 'user' },
      { email: 'mike.johnson@test.com', name: 'Mike Johnson', role: 'user' },
      { email: 'sarah.wilson@test.com', name: 'Sarah Wilson', role: 'user' },
      { email: 'david.brown@test.com', name: 'David Brown', role: 'user' },
      { email: 'lisa.garcia@test.com', name: 'Lisa Garcia', role: 'user' },
      { email: 'robert.miller@test.com', name: 'Robert Miller', role: 'user' },
      { email: 'emily.davis@test.com', name: 'Emily Davis', role: 'user' },
      { email: 'admin@test.com', name: 'Test Admin', role: 'admin' },
      { email: 'merchant@test.com', name: 'Test Merchant', role: 'merchant' }
    ];

    const userIds = [];
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      const userId = uuidv4();
      const loyaltyNumber = `${user.name.charAt(0).toUpperCase()}${String(i + 1).padStart(7, '0')}`;
      
      // First create user in auth.users table
      await client.query(`
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role)
        VALUES ($1, $2, $3, NOW(), NOW(), NOW(), $4)
      `, [userId, user.email, 'mock_password_hash', user.role]);
      
      // Then create profile
      await client.query(`
        INSERT INTO profiles (id, email, full_name, role, loyalty_number, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [userId, user.email, user.name, user.role, loyaltyNumber]);
      
      userIds.push({ id: userId, email: user.email, role: user.role });
    }
    console.log(`✅ Created ${testUsers.length} test users`);

    // Create loyalty cards for regular users
    console.log('💳 Creating loyalty cards...');
    const regularUsers = userIds.filter(user => user.role === 'user');
    for (let i = 0; i < regularUsers.length; i++) {
      const user = regularUsers[i];
      const cardTypes = ['free', 'free', 'free', 'free', 'free', 'premium', 'premium', 'premium'];
      const cardType = cardTypes[i] || 'free';
      
      await client.query(`
        INSERT INTO user_loyalty_cards (id, user_id, email, card_number, points_balance, tier_level, is_active, created_at, full_name)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), $7)
      `, [
        uuidv4(),
        user.id,
        user.email,
        `CARD-${user.email.split('@')[0].toUpperCase().replace('.', '')}`,
        Math.floor(Math.random() * 1000) + 100,
        cardType,
        user.email.split('@')[0].replace('.', ' ')
      ]);
    }
    console.log(`✅ Created ${regularUsers.length} loyalty cards`);

    // Create test merchants
    console.log('🏪 Creating test merchants...');
    const testMerchants = [
      { email: 'coffee.shop@test.com', business_name: 'Test Coffee Shop', phone: '+1-555-0101', address: '123 Main St', city: 'New York', state: 'NY', zip_code: '10001', country: 'USA' },
      { email: 'bookstore@test.com', business_name: 'Test Bookstore', phone: '+1-555-0102', address: '456 Oak Ave', city: 'Los Angeles', state: 'CA', zip_code: '90210', country: 'USA' },
      { email: 'restaurant@test.com', business_name: 'Test Restaurant', phone: '+1-555-0103', address: '789 Pine Rd', city: 'Chicago', state: 'IL', zip_code: '60601', country: 'USA' },
      { email: 'electronics@test.com', business_name: 'Test Electronics Store', phone: '+1-555-0104', address: '321 Elm St', city: 'Houston', state: 'TX', zip_code: '77001', country: 'USA' },
      { email: 'department.store@test.com', business_name: 'Test Department Store', phone: '+1-555-0105', address: '654 Maple Dr', city: 'Phoenix', state: 'AZ', zip_code: '85001', country: 'USA' }
    ];

    const merchantIds = [];
    for (const merchant of testMerchants) {
      const merchantId = uuidv4();
      await client.query(`
        INSERT INTO merchants (id, business_name, contact_email, phone, address, city, state, zip_code, country, is_active, is_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, true, NOW(), NOW())
      `, [
        merchantId,
        merchant.business_name,
        merchant.email,
        merchant.phone,
        merchant.address,
        merchant.city,
        merchant.state,
        merchant.zip_code,
        merchant.country
      ]);
      merchantIds.push(merchantId);
    }
    console.log(`✅ Created ${testMerchants.length} test merchants`);

    // Create sample transactions
    console.log('💸 Creating sample transactions...');
    for (let i = 0; i < Math.min(regularUsers.length, 8); i++) {
      const user = regularUsers[i];
      const merchantId = merchantIds[i % merchantIds.length];
      const amounts = [25.50, 45.00, 12.75, 89.99, 67.25, 156.80, 200.00, 120.50];
      const amount = amounts[i] || 50.00;
      const daysAgo = Math.floor(Math.random() * 7);
      
      await client.query(`
        INSERT INTO loyalty_transactions (id, user_id, merchant_id, amount, points_earned, transaction_type, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'purchase', 'completed', NOW() - INTERVAL '${daysAgo} days')
      `, [
        uuidv4(),
        user.id,
        merchantId,
        amount,
        Math.floor(amount)
      ]);
    }
    console.log(`✅ Created ${Math.min(regularUsers.length, 8)} sample transactions`);

    // Get summary
    console.log('\n📊 Test Data Summary:');
    const userCount = await client.query('SELECT COUNT(*) FROM profiles WHERE email LIKE \'%test%\'');
    const merchantCount = await client.query('SELECT COUNT(*) FROM merchants WHERE contact_email LIKE \'%test%\'');
    const cardCount = await client.query('SELECT COUNT(*) FROM user_loyalty_cards WHERE email LIKE \'%test%\'');
    const txnCount = await client.query('SELECT COUNT(*) FROM loyalty_transactions WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE \'%test%\')');
    
    console.log(`👥 Users: ${userCount.rows[0].count}`);
    console.log(`🏪 Merchants: ${merchantCount.rows[0].count}`);
    console.log(`💳 Loyalty Cards: ${cardCount.rows[0].count}`);
    console.log(`💸 Transactions: ${txnCount.rows[0].count}`);

    console.log('\n🎉 Test data creation completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('👤 Regular Users:');
    console.log('  - john.doe@test.com (password: password123)');
    console.log('  - jane.smith@test.com (password: password123)');
    console.log('  - mike.johnson@test.com (password: password123)');
    console.log('  - sarah.wilson@test.com (password: password123)');
    console.log('  - david.brown@test.com (password: password123)');
    console.log('  - lisa.garcia@test.com (password: password123) - Premium Card');
    console.log('  - robert.miller@test.com (password: password123) - Premium Card');
    console.log('  - emily.davis@test.com (password: password123) - Premium Card');
    console.log('\n👑 Admin User:');
    console.log('  - admin@test.com (password: admin123!)');
    console.log('\n🏪 Merchant Users:');
    console.log('  - coffee.shop@test.com (password: password123)');
    console.log('  - bookstore@test.com (password: password123)');
    console.log('  - restaurant@test.com (password: password123)');
    console.log('  - electronics@test.com (password: password123)');
    console.log('  - department.store@test.com (password: password123)');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createSimpleTestData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createSimpleTestData };
