-- Comprehensive Test Data Creation Script
-- Creates 10 test users and 5 test merchants with realistic data

-- First, let's ensure we have the necessary tables and clean up any existing test data
DELETE FROM user_loyalty_cards WHERE email LIKE '%test%' OR email LIKE '%example%';
DELETE FROM loyalty_transactions WHERE user_email LIKE '%test%' OR user_email LIKE '%example%';
DELETE FROM merchants WHERE email LIKE '%test%' OR email LIKE '%example%';
DELETE FROM profiles WHERE email LIKE '%test%' OR email LIKE '%example%';

-- Create 10 test users with different profiles
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at) VALUES
-- Regular users
('user-001', 'john.doe@test.com', 'John Doe', 'user', NOW(), NOW()),
('user-002', 'jane.smith@test.com', 'Jane Smith', 'user', NOW(), NOW()),
('user-003', 'mike.johnson@test.com', 'Mike Johnson', 'user', NOW(), NOW()),
('user-004', 'sarah.wilson@test.com', 'Sarah Wilson', 'user', NOW(), NOW()),
('user-005', 'david.brown@test.com', 'David Brown', 'user', NOW(), NOW()),
('user-006', 'lisa.garcia@test.com', 'Lisa Garcia', 'user', NOW(), NOW()),
('user-007', 'robert.miller@test.com', 'Robert Miller', 'user', NOW(), NOW()),
('user-008', 'emily.davis@test.com', 'Emily Davis', 'user', NOW(), NOW()),
-- Admin user
('admin-001', 'admin@test.com', 'Test Admin', 'admin', NOW(), NOW()),
-- Merchant user
('merchant-001', 'merchant@test.com', 'Test Merchant', 'merchant', NOW(), NOW());

-- Create user loyalty cards for the regular users
INSERT INTO user_loyalty_cards (id, user_id, email, card_type, card_name, price, earning_ratio, features, is_active, created_at) VALUES
-- Free cards for most users
('card-001', 'user-001', 'john.doe@test.com', 'free', 'Pearl White', 0, 1.0, '["Basic rewards", "QR code access"]', true, NOW()),
('card-002', 'user-002', 'jane.smith@test.com', 'free', 'Pearl White', 0, 1.0, '["Basic rewards", "QR code access"]', true, NOW()),
('card-003', 'user-003', 'mike.johnson@test.com', 'free', 'Pearl White', 0, 1.0, '["Basic rewards", "QR code access"]', true, NOW()),
('card-004', 'user-004', 'sarah.wilson@test.com', 'free', 'Pearl White', 0, 1.0, '["Basic rewards", "QR code access"]', true, NOW()),
('card-005', 'user-005', 'david.brown@test.com', 'free', 'Pearl White', 0, 1.0, '["Basic rewards", "QR code access"]', true, NOW()),

-- Premium cards for some users
('card-006', 'user-006', 'lisa.garcia@test.com', 'premium', 'Lava Orange', 99, 1.5, '["Enhanced rewards", "Priority support", "Exclusive offers"]', true, NOW()),
('card-007', 'user-007', 'robert.miller@test.com', 'premium', 'Gold', 199, 2.0, '["Premium rewards", "VIP support", "Exclusive events"]', true, NOW()),
('card-008', 'user-008', 'emily.davis@test.com', 'premium', 'Black', 299, 2.5, '["Ultimate rewards", "Concierge service", "All access"]', true, NOW());

-- Create some sample loyalty transactions
INSERT INTO loyalty_transactions (id, user_email, merchant_id, amount, points_earned, transaction_date, status, created_at) VALUES
('txn-001', 'john.doe@test.com', 'merchant-001', 25.50, 25, NOW() - INTERVAL '5 days', 'completed', NOW() - INTERVAL '5 days'),
('txn-002', 'jane.smith@test.com', 'merchant-001', 45.00, 45, NOW() - INTERVAL '3 days', 'completed', NOW() - INTERVAL '3 days'),
('txn-003', 'mike.johnson@test.com', 'merchant-002', 12.75, 12, NOW() - INTERVAL '2 days', 'completed', NOW() - INTERVAL '2 days'),
('txn-004', 'sarah.wilson@test.com', 'merchant-002', 89.99, 89, NOW() - INTERVAL '1 day', 'completed', NOW() - INTERVAL '1 day'),
('txn-005', 'david.brown@test.com', 'merchant-003', 67.25, 67, NOW() - INTERVAL '6 hours', 'completed', NOW() - INTERVAL '6 hours'),
('txn-006', 'lisa.garcia@test.com', 'merchant-003', 156.80, 235, NOW() - INTERVAL '4 hours', 'completed', NOW() - INTERVAL '4 hours'), -- Premium card 1.5x multiplier
('txn-007', 'robert.miller@test.com', 'merchant-004', 200.00, 400, NOW() - INTERVAL '2 hours', 'completed', NOW() - INTERVAL '2 hours'), -- Gold card 2.0x multiplier
('txn-008', 'emily.davis@test.com', 'merchant-005', 120.50, 301, NOW() - INTERVAL '1 hour', 'completed', NOW() - INTERVAL '1 hour'); -- Black card 2.5x multiplier

-- Create 5 test merchants with different subscription plans
INSERT INTO merchants (id, email, business_name, contact_name, phone, address, city, state, zip_code, country, subscription_plan, status, created_at, updated_at) VALUES
-- Free Trial Merchant
('merchant-001', 'coffee.shop@test.com', 'Test Coffee Shop', 'Alice Johnson', '+1-555-0101', '123 Main St', 'New York', 'NY', '10001', 'USA', 'free_trial', 'active', NOW(), NOW()),

-- Starter Plan Merchant
('merchant-002', 'bookstore@test.com', 'Test Bookstore', 'Bob Smith', '+1-555-0102', '456 Oak Ave', 'Los Angeles', 'CA', '90210', 'USA', 'starter', 'active', NOW(), NOW()),

-- Growth Plan Merchant
('merchant-003', 'restaurant@test.com', 'Test Restaurant', 'Carol Davis', '+1-555-0103', '789 Pine Rd', 'Chicago', 'IL', '60601', 'USA', 'growth', 'active', NOW(), NOW()),

-- Professional Plan Merchant
('merchant-004', 'electronics@test.com', 'Test Electronics Store', 'David Wilson', '+1-555-0104', '321 Elm St', 'Houston', 'TX', '77001', 'USA', 'professional', 'active', NOW(), NOW()),

-- Enterprise Plan Merchant
('merchant-005', 'department.store@test.com', 'Test Department Store', 'Eva Brown', '+1-555-0105', '654 Maple Dr', 'Phoenix', 'AZ', '85001', 'USA', 'enterprise', 'active', NOW(), NOW());

-- Create some sample QR codes for merchants
INSERT INTO qr_codes (id, merchant_id, code_data, is_active, created_at) VALUES
('qr-001', 'merchant-001', 'coffee_shop_001', true, NOW()),
('qr-002', 'merchant-001', 'coffee_shop_002', true, NOW()),
('qr-003', 'merchant-002', 'bookstore_001', true, NOW()),
('qr-004', 'merchant-003', 'restaurant_001', true, NOW()),
('qr-005', 'merchant-003', 'restaurant_002', true, NOW()),
('qr-006', 'merchant-004', 'electronics_001', true, NOW()),
('qr-007', 'merchant-005', 'department_store_001', true, NOW()),
('qr-008', 'merchant-005', 'department_store_002', true, NOW());

-- Create some referral data
INSERT INTO referrals (id, referrer_email, referred_email, status, points_awarded, created_at) VALUES
('ref-001', 'john.doe@test.com', 'jane.smith@test.com', 'completed', 100, NOW() - INTERVAL '10 days'),
('ref-002', 'mike.johnson@test.com', 'sarah.wilson@test.com', 'completed', 100, NOW() - INTERVAL '8 days'),
('ref-003', 'david.brown@test.com', 'lisa.garcia@test.com', 'completed', 100, NOW() - INTERVAL '5 days'),
('ref-004', 'robert.miller@test.com', 'emily.davis@test.com', 'pending', 0, NOW() - INTERVAL '2 days');

-- Create some loyalty network data
INSERT INTO loyalty_networks (id, name, description, conversion_rate, is_active, created_at) VALUES
('network-001', 'Test Airlines', 'Test Airlines loyalty program', 0.8, true, NOW()),
('network-002', 'Test Hotels', 'Test Hotels rewards program', 1.2, true, NOW()),
('network-003', 'Test Retail', 'Test Retail loyalty program', 1.0, true, NOW());

-- Create some user loyalty network links
INSERT INTO user_loyalty_networks (id, user_email, network_id, loyalty_number, points_balance, is_verified, created_at) VALUES
('uln-001', 'john.doe@test.com', 'network-001', 'TA123456', 2500, true, NOW() - INTERVAL '15 days'),
('uln-002', 'jane.smith@test.com', 'network-002', 'TH789012', 1800, true, NOW() - INTERVAL '12 days'),
('uln-003', 'mike.johnson@test.com', 'network-003', 'TR345678', 3200, true, NOW() - INTERVAL '8 days');

-- Create some marketplace items
INSERT INTO marketplace_items (id, name, description, price_points, category, is_active, created_at) VALUES
('item-001', 'Test Gift Card $10', 'Test gift card worth $10', 1000, 'gift_cards', true, NOW()),
('item-002', 'Test Gift Card $25', 'Test gift card worth $25', 2500, 'gift_cards', true, NOW()),
('item-003', 'Test Gift Card $50', 'Test gift card worth $50', 5000, 'gift_cards', true, NOW()),
('item-004', 'Test Electronics Voucher', 'Test electronics store voucher', 3000, 'vouchers', true, NOW()),
('item-005', 'Test Restaurant Voucher', 'Test restaurant voucher', 2000, 'vouchers', true, NOW());

-- Create some user marketplace transactions
INSERT INTO marketplace_transactions (id, user_email, item_id, points_spent, status, created_at) VALUES
('mkt-001', 'john.doe@test.com', 'item-001', 1000, 'completed', NOW() - INTERVAL '7 days'),
('mkt-002', 'jane.smith@test.com', 'item-002', 2500, 'completed', NOW() - INTERVAL '5 days'),
('mkt-003', 'mike.johnson@test.com', 'item-004', 3000, 'completed', NOW() - INTERVAL '3 days'),
('mkt-004', 'sarah.wilson@test.com', 'item-005', 2000, 'pending', NOW() - INTERVAL '1 day');

-- Create some DAO proposals for testing
INSERT INTO dao_proposals (id, title, description, proposal_type, status, created_by, created_at) VALUES
('proposal-001', 'Test Proposal 1', 'This is a test proposal for testing DAO functionality', 'feature', 'active', 'admin-001', NOW() - INTERVAL '5 days'),
('proposal-002', 'Test Proposal 2', 'Another test proposal for testing voting functionality', 'governance', 'active', 'user-001', NOW() - INTERVAL '3 days'),
('proposal-003', 'Test Proposal 3', 'A third test proposal for comprehensive testing', 'budget', 'draft', 'user-002', NOW() - INTERVAL '1 day');

-- Create some DAO votes
INSERT INTO dao_votes (id, proposal_id, voter_email, vote_type, voting_power, created_at) VALUES
('vote-001', 'proposal-001', 'john.doe@test.com', 'for', 1, NOW() - INTERVAL '4 days'),
('vote-002', 'proposal-001', 'jane.smith@test.com', 'for', 1, NOW() - INTERVAL '4 days'),
('vote-003', 'proposal-001', 'mike.johnson@test.com', 'against', 1, NOW() - INTERVAL '3 days'),
('vote-004', 'proposal-002', 'sarah.wilson@test.com', 'for', 1, NOW() - INTERVAL '2 days'),
('vote-005', 'proposal-002', 'david.brown@test.com', 'abstain', 1, NOW() - INTERVAL '2 days');

-- Display summary of created data
SELECT 'Test Data Creation Summary' as summary;
SELECT 'Users Created:' as type, COUNT(*) as count FROM profiles WHERE email LIKE '%test%' OR email LIKE '%example%'
UNION ALL
SELECT 'Merchants Created:' as type, COUNT(*) as count FROM merchants WHERE email LIKE '%test%' OR email LIKE '%example%'
UNION ALL
SELECT 'Loyalty Cards Created:' as type, COUNT(*) as count FROM user_loyalty_cards WHERE email LIKE '%test%' OR email LIKE '%example%'
UNION ALL
SELECT 'Transactions Created:' as type, COUNT(*) as count FROM loyalty_transactions WHERE user_email LIKE '%test%' OR user_email LIKE '%example%'
UNION ALL
SELECT 'QR Codes Created:' as type, COUNT(*) as count FROM qr_codes
UNION ALL
SELECT 'Referrals Created:' as type, COUNT(*) as count FROM referrals
UNION ALL
SELECT 'Loyalty Networks Created:' as type, COUNT(*) as count FROM loyalty_networks
UNION ALL
SELECT 'Marketplace Items Created:' as type, COUNT(*) as count FROM marketplace_items
UNION ALL
SELECT 'DAO Proposals Created:' as type, COUNT(*) as count FROM dao_proposals
UNION ALL
SELECT 'DAO Votes Created:' as type, COUNT(*) as count FROM dao_votes;
