#!/usr/bin/env node

/**
 * Test Data Creation Script
 * Creates 10 test users and 5 test merchants with comprehensive test data
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

// Test data
const testUsers = [
  { id: 'user-001', email: 'john.doe@test.com', name: 'John Doe', role: 'user' },
  { id: 'user-002', email: 'jane.smith@test.com', name: 'Jane Smith', role: 'user' },
  { id: 'user-003', email: 'mike.johnson@test.com', name: 'Mike Johnson', role: 'user' },
  { id: 'user-004', email: 'sarah.wilson@test.com', name: 'Sarah Wilson', role: 'user' },
  { id: 'user-005', email: 'david.brown@test.com', name: 'David Brown', role: 'user' },
  { id: 'user-006', email: 'lisa.garcia@test.com', name: 'Lisa Garcia', role: 'user' },
  { id: 'user-007', email: 'robert.miller@test.com', name: 'Robert Miller', role: 'user' },
  { id: 'user-008', email: 'emily.davis@test.com', name: 'Emily Davis', role: 'user' },
  { id: 'admin-001', email: 'admin@test.com', name: 'Test Admin', role: 'admin' },
  { id: 'merchant-001', email: 'merchant@test.com', name: 'Test Merchant', role: 'merchant' }
];

const testMerchants = [
  {
    id: 'merchant-001',
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
    id: 'merchant-002',
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
    id: 'merchant-003',
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
    id: 'merchant-004',
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
    id: 'merchant-005',
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

const loyaltyCards = [
  { user_id: 'user-001', email: 'john.doe@test.com', card_type: 'free', card_name: 'Pearl White', price: 0, earning_ratio: 1.0 },
  { user_id: 'user-002', email: 'jane.smith@test.com', card_type: 'free', card_name: 'Pearl White', price: 0, earning_ratio: 1.0 },
  { user_id: 'user-003', email: 'mike.johnson@test.com', card_type: 'free', card_name: 'Pearl White', price: 0, earning_ratio: 1.0 },
  { user_id: 'user-004', email: 'sarah.wilson@test.com', card_type: 'free', card_name: 'Pearl White', price: 0, earning_ratio: 1.0 },
  { user_id: 'user-005', email: 'david.brown@test.com', card_type: 'free', card_name: 'Pearl White', price: 0, earning_ratio: 1.0 },
  { user_id: 'user-006', email: 'lisa.garcia@test.com', card_type: 'premium', card_name: 'Lava Orange', price: 99, earning_ratio: 1.5 },
  { user_id: 'user-007', email: 'robert.miller@test.com', card_type: 'premium', card_name: 'Gold', price: 199, earning_ratio: 2.0 },
  { user_id: 'user-008', email: 'emily.davis@test.com', card_type: 'premium', card_name: 'Black', price: 299, earning_ratio: 2.5 }
];

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
      DELETE FROM loyalty_transactions WHERE user_email LIKE '%test%' OR user_email LIKE '%example%';
      DELETE FROM merchants WHERE email LIKE '%test%' OR email LIKE '%example%';
      DELETE FROM profiles WHERE email LIKE '%test%' OR email LIKE '%example%';
    `);
    console.log('✅ Cleaned up existing test data');

    // Create test users
    console.log('👥 Creating test users...');
    for (const user of testUsers) {
      await client.query(`
        INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [user.id, user.email, user.name, user.role]);
    }
    console.log(`✅ Created ${testUsers.length} test users`);

    // Create loyalty cards
    console.log('💳 Creating loyalty cards...');
    for (const card of loyaltyCards) {
      await client.query(`
        INSERT INTO user_loyalty_cards (id, user_id, email, card_type, card_name, price, earning_ratio, features, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
        ON CONFLICT (id) DO NOTHING
      `, [
        `card-${card.user_id}`,
        card.user_id,
        card.email,
        card.card_type,
        card.card_name,
        card.price,
        card.earning_ratio,
        JSON.stringify(['Basic rewards', 'QR code access'])
      ]);
    }
    console.log(`✅ Created ${loyaltyCards.length} loyalty cards`);

    // Create test merchants
    console.log('🏪 Creating test merchants...');
    for (const merchant of testMerchants) {
      await client.query(`
        INSERT INTO merchants (id, email, business_name, contact_name, phone, address, city, state, zip_code, country, subscription_plan, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [
        merchant.id,
        merchant.email,
        merchant.business_name,
        merchant.contact_name,
        merchant.phone,
        merchant.address,
        merchant.city,
        merchant.state,
        merchant.zip_code,
        merchant.country,
        merchant.subscription_plan,
        merchant.status
      ]);
    }
    console.log(`✅ Created ${testMerchants.length} test merchants`);

    // Create sample transactions
    console.log('💸 Creating sample transactions...');
    const transactions = [
      { user_email: 'john.doe@test.com', merchant_id: 'merchant-001', amount: 25.50, points: 25, days_ago: 5 },
      { user_email: 'jane.smith@test.com', merchant_id: 'merchant-001', amount: 45.00, points: 45, days_ago: 3 },
      { user_email: 'mike.johnson@test.com', merchant_id: 'merchant-002', amount: 12.75, points: 12, days_ago: 2 },
      { user_email: 'sarah.wilson@test.com', merchant_id: 'merchant-002', amount: 89.99, points: 89, days_ago: 1 },
      { user_email: 'david.brown@test.com', merchant_id: 'merchant-003', amount: 67.25, points: 67, days_ago: 0 },
      { user_email: 'lisa.garcia@test.com', merchant_id: 'merchant-003', amount: 156.80, points: 235, days_ago: 0 }, // Premium 1.5x
      { user_email: 'robert.miller@test.com', merchant_id: 'merchant-004', amount: 200.00, points: 400, days_ago: 0 }, // Gold 2.0x
      { user_email: 'emily.davis@test.com', merchant_id: 'merchant-005', amount: 120.50, points: 301, days_ago: 0 } // Black 2.5x
    ];

    for (const txn of transactions) {
      await client.query(`
        INSERT INTO loyalty_transactions (id, user_email, merchant_id, amount, points_earned, transaction_date, status, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${txn.days_ago} days', 'completed', NOW() - INTERVAL '${txn.days_ago} days')
        ON CONFLICT (id) DO NOTHING
      `, [
        `txn-${txn.user_email.split('@')[0]}-${txn.merchant_id}`,
        txn.user_email,
        txn.merchant_id,
        txn.amount,
        txn.points
      ]);
    }
    console.log(`✅ Created ${transactions.length} sample transactions`);

    // Create QR codes for merchants
    console.log('📱 Creating QR codes...');
    const qrCodes = [
      { merchant_id: 'merchant-001', code: 'coffee_shop_001' },
      { merchant_id: 'merchant-001', code: 'coffee_shop_002' },
      { merchant_id: 'merchant-002', code: 'bookstore_001' },
      { merchant_id: 'merchant-003', code: 'restaurant_001' },
      { merchant_id: 'merchant-003', code: 'restaurant_002' },
      { merchant_id: 'merchant-004', code: 'electronics_001' },
      { merchant_id: 'merchant-005', code: 'department_store_001' },
      { merchant_id: 'merchant-005', code: 'department_store_002' }
    ];

    for (const qr of qrCodes) {
      await client.query(`
        INSERT INTO qr_codes (id, merchant_id, code_data, is_active, created_at)
        VALUES ($1, $2, $3, true, NOW())
        ON CONFLICT (id) DO NOTHING
      `, [`qr-${qr.code}`, qr.merchant_id, qr.code]);
    }
    console.log(`✅ Created ${qrCodes.length} QR codes`);

    // Create referrals
    console.log('🎁 Creating referrals...');
    const referrals = [
      { referrer: 'john.doe@test.com', referred: 'jane.smith@test.com', days_ago: 10 },
      { referrer: 'mike.johnson@test.com', referred: 'sarah.wilson@test.com', days_ago: 8 },
      { referrer: 'david.brown@test.com', referred: 'lisa.garcia@test.com', days_ago: 5 },
      { referrer: 'robert.miller@test.com', referred: 'emily.davis@test.com', days_ago: 2 }
    ];

    for (const ref of referrals) {
      await client.query(`
        INSERT INTO referrals (id, referrer_email, referred_email, status, points_awarded, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${ref.days_ago} days')
        ON CONFLICT (id) DO NOTHING
      `, [
        `ref-${ref.referrer.split('@')[0]}-${ref.referred.split('@')[0]}`,
        ref.referrer,
        ref.referred,
        ref.days_ago > 3 ? 'completed' : 'pending',
        ref.days_ago > 3 ? 100 : 0
      ]);
    }
    console.log(`✅ Created ${referrals.length} referrals`);

    // Get summary
    console.log('\n📊 Test Data Summary:');
    const userCount = await client.query('SELECT COUNT(*) FROM profiles WHERE email LIKE \'%test%\'');
    const merchantCount = await client.query('SELECT COUNT(*) FROM merchants WHERE email LIKE \'%test%\'');
    const cardCount = await client.query('SELECT COUNT(*) FROM user_loyalty_cards WHERE email LIKE \'%test%\'');
    const txnCount = await client.query('SELECT COUNT(*) FROM loyalty_transactions WHERE user_email LIKE \'%test%\'');
    
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
