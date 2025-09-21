#!/usr/bin/env node

/**
 * Test Data Creation Script
 * Creates 10 test users and 5 test merchants with comprehensive test data
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

// Test data with proper UUIDs
const testUsers = [
  { id: uuidv4(), email: 'john.doe@test.com', name: 'John Doe', role: 'user' },
  { id: uuidv4(), email: 'jane.smith@test.com', name: 'Jane Smith', role: 'user' },
  { id: uuidv4(), email: 'mike.johnson@test.com', name: 'Mike Johnson', role: 'user' },
  { id: uuidv4(), email: 'sarah.wilson@test.com', name: 'Sarah Wilson', role: 'user' },
  { id: uuidv4(), email: 'david.brown@test.com', name: 'David Brown', role: 'user' },
  { id: uuidv4(), email: 'lisa.garcia@test.com', name: 'Lisa Garcia', role: 'user' },
  { id: uuidv4(), email: 'robert.miller@test.com', name: 'Robert Miller', role: 'user' },
  { id: uuidv4(), email: 'emily.davis@test.com', name: 'Emily Davis', role: 'user' },
  { id: uuidv4(), email: 'admin@test.com', name: 'Test Admin', role: 'admin' },
  { id: uuidv4(), email: 'merchant@test.com', name: 'Test Merchant', role: 'merchant' }
];

const testMerchants = [
  {
    id: uuidv4(),
    email: 'coffee.shop@test.com',
    business_name: 'Test Coffee Shop',
    contact_name: 'Alice Johnson',
    phone: '+1-555-0101',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip_code: '10001',
    country: 'USA',
    subscription_plan: 'free_trial',
    status: 'active'
  },
  {
    id: uuidv4(),
    email: 'bookstore@test.com',
    business_name: 'Test Bookstore',
    contact_name: 'Bob Smith',
    phone: '+1-555-0102',
    address: '456 Oak Ave',
    city: 'Los Angeles',
    state: 'CA',
    zip_code: '90210',
    country: 'USA',
    subscription_plan: 'starter',
    status: 'active'
  },
  {
    id: uuidv4(),
    email: 'restaurant@test.com',
    business_name: 'Test Restaurant',
    contact_name: 'Carol Davis',
    phone: '+1-555-0103',
    address: '789 Pine Rd',
    city: 'Chicago',
    state: 'IL',
    zip_code: '60601',
    country: 'USA',
    subscription_plan: 'growth',
    status: 'active'
  },
  {
    id: uuidv4(),
    email: 'electronics@test.com',
    business_name: 'Test Electronics Store',
    contact_name: 'David Wilson',
    phone: '+1-555-0104',
    address: '321 Elm St',
    city: 'Houston',
    state: 'TX',
    zip_code: '77001',
    country: 'USA',
    subscription_plan: 'professional',
    status: 'active'
  },
  {
    id: uuidv4(),
    email: 'department.store@test.com',
    business_name: 'Test Department Store',
    contact_name: 'Eva Brown',
    phone: '+1-555-0105',
    address: '654 Maple Dr',
    city: 'Phoenix',
    state: 'AZ',
    zip_code: '85001',
    country: 'USA',
    subscription_plan: 'enterprise',
    status: 'active'
  }
];

// Loyalty cards will be created dynamically based on users

async function createTestData() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Clean up existing test data
    console.log('🧹 Cleaning up existing test data...');
    await client.query(`
      DELETE FROM user_loyalty_cards WHERE email LIKE '%test%' OR email LIKE '%example%';
      DELETE FROM loyalty_transactions WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE '%test%' OR email LIKE '%example%');
      DELETE FROM merchants WHERE contact_email LIKE '%test%' OR contact_email LIKE '%example%';
      DELETE FROM profiles WHERE email LIKE '%test%' OR email LIKE '%example%';
      DELETE FROM auth.users WHERE email LIKE '%test%' OR email LIKE '%example%';
    `);
    console.log('✅ Cleaned up existing test data');

    // Create test users
    console.log('👥 Creating test users...');
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      const loyaltyNumber = `${user.name.charAt(0).toUpperCase()}${String(i + 1).padStart(7, '0')}`;
      
      // First create user in auth.users table
      await client.query(`
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role)
        VALUES ($1, $2, $3, NOW(), NOW(), NOW(), $4)
        ON CONFLICT (id) DO NOTHING
      `, [user.id, user.email, 'mock_password_hash', user.role]);
      
      // Then create profile
      await client.query(`
        INSERT INTO profiles (id, email, full_name, role, loyalty_number, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [user.id, user.email, user.name, user.role, loyaltyNumber]);
    }
    console.log(`✅ Created ${testUsers.length} test users`);

    // Create loyalty cards for regular users
    console.log('💳 Creating loyalty cards...');
    const regularUsers = testUsers.filter(user => user.role === 'user');
    for (let i = 0; i < regularUsers.length; i++) {
      const user = regularUsers[i];
      const cardTypes = ['free', 'free', 'free', 'free', 'free', 'premium', 'premium', 'premium'];
      const cardType = cardTypes[i] || 'free';
      
      await client.query(`
        INSERT INTO user_loyalty_cards (id, user_id, email, card_number, points_balance, tier_level, is_active, created_at, full_name)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), $7)
        ON CONFLICT (id) DO NOTHING
      `, [
        uuidv4(),
        user.id,
        user.email,
        `CARD-${user.email.split('@')[0].toUpperCase().replace('.', '')}`,
        Math.floor(Math.random() * 1000) + 100, // Random points balance
        cardType,
        user.name
      ]);
    }
    console.log(`✅ Created ${regularUsers.length} loyalty cards`);

    // Create test merchants
    console.log('🏪 Creating test merchants...');
    for (const merchant of testMerchants) {
      await client.query(`
        INSERT INTO merchants (id, business_name, contact_email, phone, address, city, state, zip_code, country, is_active, is_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [
        merchant.id,
        merchant.business_name,
        merchant.email,
        merchant.phone,
        merchant.address,
        merchant.city,
        merchant.state,
        merchant.zip_code,
        merchant.country,
        true, // is_active
        true  // is_verified
      ]);
    }
    console.log(`✅ Created ${testMerchants.length} test merchants`);

    // Create sample transactions
    console.log('💸 Creating sample transactions...');
    const usersForTransactions = testUsers.filter(user => user.role === 'user');
    const merchantIds = testMerchants.map(m => m.id);
    
    for (let i = 0; i < Math.min(usersForTransactions.length, 8); i++) {
      const user = usersForTransactions[i];
      const merchantId = merchantIds[i % merchantIds.length];
      const amounts = [25.50, 45.00, 12.75, 89.99, 67.25, 156.80, 200.00, 120.50];
      const amount = amounts[i] || 50.00;
      const daysAgo = Math.floor(Math.random() * 7);
      
      await client.query(`
        INSERT INTO loyalty_transactions (id, user_id, merchant_id, amount, points_earned, transaction_type, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'purchase', 'completed', NOW() - INTERVAL '${daysAgo} days')
        ON CONFLICT (id) DO NOTHING
      `, [
        uuidv4(),
        user.id,
        merchantId,
        amount,
        Math.floor(amount) // Simple 1:1 point ratio for now
      ]);
    }
    console.log(`✅ Created ${Math.min(usersForTransactions.length, 8)} sample transactions`);

    // Note: QR codes and referrals tables don't exist in current schema
    console.log('📱 Skipping QR codes (table does not exist)');
    console.log('🎁 Skipping referrals (table does not exist)');

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
    console.log('  - robert.miller@test.com (password: password123) - Gold Card');
    console.log('  - emily.davis@test.com (password: password123) - Black Card');
    console.log('\n👑 Admin User:');
    console.log('  - admin@test.com (password: admin123!)');
    console.log('\n🏪 Merchant Users:');
    console.log('  - coffee.shop@test.com (password: password123) - Free Trial');
    console.log('  - bookstore@test.com (password: password123) - Starter Plan');
    console.log('  - restaurant@test.com (password: password123) - Growth Plan');
    console.log('  - electronics@test.com (password: password123) - Professional Plan');
    console.log('  - department.store@test.com (password: password123) - Enterprise Plan');

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
  createTestData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestData, testUsers, testMerchants };
