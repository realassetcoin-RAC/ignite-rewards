-- Simple Test Data Insert Script
-- Run this directly in Supabase SQL Editor to insert test data into existing tables

-- Clear existing test data first
DELETE FROM public.dao_votes WHERE id IN (
  '950e8400-e29b-41d4-a716-446655440001',
  '950e8400-e29b-41d4-a716-446655440002',
  '950e8400-e29b-41d4-a716-446655440003',
  '950e8400-e29b-41d4-a716-446655440004',
  '950e8400-e29b-41d4-a716-446655440005',
  '950e8400-e29b-41d4-a716-446655440006'
);

DELETE FROM public.dao_proposals WHERE id IN (
  '850e8400-e29b-41d4-a716-446655440001',
  '850e8400-e29b-41d4-a716-446655440002',
  '850e8400-e29b-41d4-a716-446655440003',
  '850e8400-e29b-41d4-a716-446655440004',
  '850e8400-e29b-41d4-a716-446655440005'
);

DELETE FROM public.dao_members WHERE id IN (
  '650e8400-e29b-41d4-a716-446655440001',
  '650e8400-e29b-41d4-a716-446655440002',
  '650e8400-e29b-41d4-a716-446655440003',
  '650e8400-e29b-41d4-a716-446655440004'
);

DELETE FROM public.dao_organizations WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Clear other test data (using specific IDs since UUID columns don't support LIKE)
DELETE FROM public.loyalty_transactions WHERE id IN (
  'test_transaction_1',
  'test_transaction_2', 
  'test_transaction_3',
  'test_transaction_4'
);
DELETE FROM public.merchants WHERE id IN (
  'test_merchant_1',
  'test_merchant_2',
  'test_merchant_3'
);
DELETE FROM public.marketplace_listings WHERE id IN (
  'test_listing_1',
  'test_listing_2',
  'test_listing_3'
);

-- Insert DAO organization
INSERT INTO public.dao_organizations (
  id,
  name,
  description,
  governance_token_symbol,
  governance_token_decimals,
  min_proposal_threshold,
  voting_period_days,
  execution_delay_hours,
  quorum_percentage,
  super_majority_threshold,
  is_active
) VALUES (
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
);

-- Insert DAO members
INSERT INTO public.dao_members (
  id,
  dao_id,
  user_id,
  wallet_address,
  role,
  governance_tokens,
  voting_power,
  is_active,
  user_email,
  user_full_name
) VALUES 
(
  '650e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440001',
  'AdminWallet123456789',
  'admin',
  10000,
  10000,
  true,
  'admin@rac.com',
  'DAO Admin'
),
(
  '650e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440002',
  'MemberWallet123456789',
  'member',
  5000,
  5000,
  true,
  'member1@rac.com',
  'DAO Member 1'
),
(
  '650e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440003',
  'MemberWallet987654321',
  'member',
  3000,
  3000,
  true,
  'member2@rac.com',
  'DAO Member 2'
),
(
  '650e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440004',
  'MemberWallet456789123',
  'member',
  2000,
  2000,
  true,
  'member3@rac.com',
  'DAO Member 3'
);

-- Insert DAO proposals (without tags column)
INSERT INTO public.dao_proposals (
  id,
  dao_id,
  proposer_id,
  title,
  description,
  full_description,
  category,
  voting_type,
  status,
  start_time,
  end_time,
  total_votes,
  yes_votes,
  no_votes,
  abstain_votes,
  participation_rate,
  treasury_impact_amount,
  treasury_impact_currency
) VALUES 
(
  '850e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440001',
  'Increase Loyalty Point Rewards by 20%',
  'Proposal to increase the loyalty point multiplier from 1x to 1.2x for all merchants',
  'This proposal aims to increase customer engagement by boosting the loyalty point rewards. The change would affect all merchants on the platform and require updates to the reward calculation system.',
  'governance',
  'simple_majority',
  'active',
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '5 days',
  0,
  0,
  0,
  0,
  0,
  0,
  'SOL'
),
(
  '850e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440002',
  'Add Solana USDC as Payment Option',
  'Enable USDC payments on Solana blockchain for loyalty transactions',
  'This proposal would integrate Solana USDC as a payment method, allowing users to pay for loyalty transactions using USDC.',
  'technical',
  'simple_majority',
  'active',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '6 days',
  0,
  0,
  0,
  0,
  0,
  0,
  'USDC'
),
(
  '850e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440001',
  'Implement Quadratic Voting for Governance',
  'Change voting mechanism from simple majority to quadratic voting',
  'This proposal would implement quadratic voting to reduce the influence of large token holders.',
  'governance',
  'super_majority',
  'passed',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '3 days',
  3,
  2,
  1,
  0,
  75.0,
  0,
  'SOL'
),
(
  '850e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440003',
  'Increase Platform Fees by 50%',
  'Proposal to increase transaction fees to fund development',
  'This proposal would increase platform fees from 2% to 3% to provide additional funding.',
  'treasury',
  'simple_majority',
  'rejected',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '8 days',
  3,
  1,
  2,
  0,
  75.0,
  0,
  'SOL'
),
(
  '850e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440002',
  'Add NFT Rewards for High-Value Customers',
  'Proposal to create NFT rewards for customers with high loyalty points',
  'This proposal would create a new NFT reward system for customers who accumulate high loyalty points.',
  'rewards',
  'simple_majority',
  'draft',
  0,
  0,
  0,
  0,
  0,
  0,
  'SOL'
);

-- Insert DAO votes
INSERT INTO public.dao_votes (
  id,
  proposal_id,
  voter_id,
  choice,
  voting_power,
  reason
) VALUES 
(
  '950e8400-e29b-41d4-a716-446655440001',
  '850e8400-e29b-41d4-a716-446655440003',
  '750e8400-e29b-41d4-a716-446655440001',
  'yes',
  10000,
  'This will make our governance more democratic and fair for all members.'
),
(
  '950e8400-e29b-41d4-a716-446655440002',
  '850e8400-e29b-41d4-a716-446655440003',
  '750e8400-e29b-41d4-a716-446655440002',
  'yes',
  5000,
  'I support this change to reduce the influence of large holders.'
),
(
  '950e8400-e29b-41d4-a716-446655440003',
  '850e8400-e29b-41d4-a716-446655440003',
  '750e8400-e29b-41d4-a716-446655440003',
  'no',
  3000,
  'The current system works fine and this change might be too complex.'
),
(
  '950e8400-e29b-41d4-a716-446655440004',
  '850e8400-e29b-41d4-a716-446655440004',
  '750e8400-e29b-41d4-a716-446655440001',
  'yes',
  10000,
  'We need more funding for development and platform improvements.'
),
(
  '950e8400-e29b-41d4-a716-446655440005',
  '850e8400-e29b-41d4-a716-446655440004',
  '750e8400-e29b-41d4-a716-446655440002',
  'no',
  5000,
  'Higher fees will discourage users from using the platform.'
),
(
  '950e8400-e29b-41d4-a716-446655440006',
  '850e8400-e29b-41d4-a716-446655440004',
  '750e8400-e29b-41d4-a716-446655440003',
  'no',
  3000,
  'This will hurt small merchants and users.'
);

-- Insert merchants
INSERT INTO public.merchants (
  id,
  name,
  email,
  phone,
  business_type,
  address,
  city,
  state,
  country,
  postal_code,
  website,
  description,
  logo_url,
  is_active
) VALUES 
(
  'test_merchant_1',
  'TechStore Pro',
  'contact@techstorepro.com',
  '+1-555-0101',
  'electronics',
  '123 Tech Street',
  'San Francisco',
  'CA',
  'USA',
  '94105',
  'https://techstorepro.com',
  'Premium electronics and gadgets store',
  'https://example.com/logo1.png',
  true
),
(
  'test_merchant_2',
  'Fashion Forward',
  'hello@fashionforward.com',
  '+1-555-0102',
  'fashion',
  '456 Fashion Ave',
  'New York',
  'NY',
  'USA',
  '10001',
  'https://fashionforward.com',
  'Trendy fashion and accessories',
  'https://example.com/logo2.png',
  true
),
(
  'test_merchant_3',
  'Green Grocer',
  'info@greengrocer.com',
  '+1-555-0103',
  'food',
  '789 Organic Lane',
  'Portland',
  'OR',
  'USA',
  '97201',
  'https://greengrocer.com',
  'Organic and sustainable food products',
  'https://example.com/logo3.png',
  true
);

-- Insert loyalty transactions
INSERT INTO public.loyalty_transactions (
  id,
  user_id,
  merchant_id,
  transaction_type,
  points_earned,
  points_redeemed,
  transaction_amount,
  currency,
  description,
  status,
  created_at
) VALUES 
(
  'test_transaction_1',
  '750e8400-e29b-41d4-a716-446655440001',
  'test_merchant_1',
  'purchase',
  100,
  0,
  50.00,
  'USD',
  'Electronics purchase',
  'completed',
  NOW() - INTERVAL '1 day'
),
(
  'test_transaction_2',
  '750e8400-e29b-41d4-a716-446655440002',
  'test_merchant_2',
  'purchase',
  75,
  0,
  37.50,
  'USD',
  'Fashion purchase',
  'completed',
  NOW() - INTERVAL '2 days'
),
(
  'test_transaction_3',
  '750e8400-e29b-41d4-a716-446655440001',
  'test_merchant_3',
  'purchase',
  50,
  0,
  25.00,
  'USD',
  'Grocery purchase',
  'completed',
  NOW() - INTERVAL '3 days'
),
(
  'test_transaction_4',
  '750e8400-e29b-41d4-a716-446655440003',
  'test_merchant_1',
  'redemption',
  0,
  50,
  0,
  'USD',
  'Points redemption for discount',
  'completed',
  NOW() - INTERVAL '4 days'
);

-- Insert marketplace listings
INSERT INTO public.marketplace_listings (
  id,
  title,
  description,
  price,
  currency,
  category,
  condition,
  seller_id,
  images,
  is_active,
  created_at
) VALUES 
(
  'test_listing_1',
  'Vintage Gaming Console',
  'Classic gaming console in excellent condition',
  299.99,
  'USD',
  'electronics',
  'excellent',
  '750e8400-e29b-41d4-a716-446655440001',
  ARRAY['https://example.com/image1.jpg'],
  true,
  NOW() - INTERVAL '1 day'
),
(
  'test_listing_2',
  'Designer Handbag',
  'Luxury designer handbag, barely used',
  450.00,
  'USD',
  'fashion',
  'like_new',
  '750e8400-e29b-41d4-a716-446655440002',
  ARRAY['https://example.com/image2.jpg'],
  true,
  NOW() - INTERVAL '2 days'
),
(
  'test_listing_3',
  'Organic Coffee Beans',
  'Premium organic coffee beans, 2lb bag',
  24.99,
  'USD',
  'food',
  'new',
  '750e8400-e29b-41d4-a716-446655440003',
  ARRAY['https://example.com/image3.jpg'],
  true,
  NOW() - INTERVAL '3 days'
);

-- Success message
SELECT 'Test data inserted successfully!' as message;
