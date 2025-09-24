-- Insert Sample Data for Local Development (Using gen_random_uuid())
-- Run this script to populate your local database with test data

-- Connect to the ignite_rewards database
\c ignite_rewards;

-- 1. Insert sample users (in addition to the admin user)
INSERT INTO auth.users (id, email, role, is_super_admin) VALUES
('11111111-1111-1111-1111-111111111111', 'merchant1@example.com', 'merchant', false),
('22222222-2222-2222-2222-222222222222', 'merchant2@example.com', 'merchant', false),
('33333333-3333-3333-3333-333333333333', 'customer1@example.com', 'user', false),
('44444444-4444-4444-4444-444444444444', 'customer2@example.com', 'user', false)
ON CONFLICT (email) DO NOTHING;

-- 2. Insert corresponding profiles
INSERT INTO public.profiles (id, email, full_name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'merchant1@example.com', 'John Merchant', 'merchant'),
('22222222-2222-2222-2222-222222222222', 'merchant2@example.com', 'Jane Business', 'merchant'),
('33333333-3333-3333-3333-333333333333', 'customer1@example.com', 'Alice Customer', 'user'),
('44444444-4444-4444-4444-444444444444', 'customer2@example.com', 'Bob User', 'user')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert sample merchants
INSERT INTO public.merchants (id, user_id, business_name, business_type, contact_email, phone, address, city, state, zip_code, country, website, description, is_verified, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Coffee Corner', 'Food & Beverage', 'contact@coffeecorner.com', '+1-555-0101', '123 Main St', 'New York', 'NY', '10001', 'US', 'https://coffeecorner.com', 'Premium coffee and pastries', true, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Tech Store', 'Electronics', 'sales@techstore.com', '+1-555-0102', '456 Tech Ave', 'San Francisco', 'CA', '94102', 'US', 'https://techstore.com', 'Latest electronics and gadgets', true, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert sample virtual cards
INSERT INTO public.virtual_cards (id, user_id, card_number, card_holder_name, expiry_month, expiry_year, cvv, is_active, balance) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', '4111111111111111', 'Alice Customer', 12, 2025, '123', true, 100.00),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', '4222222222222222', 'Bob User', 11, 2026, '456', true, 50.00)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert sample loyalty transactions (using gen_random_uuid())
INSERT INTO public.loyalty_transactions (id, user_id, merchant_id, amount, points_earned, points_redeemed, transaction_type, status) VALUES
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 15.50, 155, 0, 'purchase', 'completed'),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 299.99, 2999, 0, 'purchase', 'completed'),
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, 0, 50, 'redemption', 'completed');

-- 6. Insert sample user loyalty cards (using gen_random_uuid())
INSERT INTO public.user_loyalty_cards (id, user_id, merchant_id, card_number, points_balance, tier_level, is_active) VALUES
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'LC001', 105, 'silver', true),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'LC002', 2999, 'gold', true);

-- 7. Insert sample user points (using gen_random_uuid())
INSERT INTO public.user_points (id, user_id, points_balance, lifetime_points, tier_level) VALUES
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 105, 105, 'silver'),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 2999, 2999, 'gold');

-- 8. Insert sample user wallets (using gen_random_uuid())
INSERT INTO public.user_wallets (id, user_id, wallet_address, wallet_type, is_primary) VALUES
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 'ethereum', true),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', 'solana', true);

-- 9. Insert sample merchant cards (using gen_random_uuid())
INSERT INTO public.merchant_cards (id, merchant_id, card_name, card_type, is_active) VALUES
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coffee Rewards Card', 'loyalty', true),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tech Points Card', 'loyalty', true);

-- 10. Insert sample merchant subscriptions (using gen_random_uuid())
INSERT INTO public.merchant_subscriptions (id, merchant_id, plan_id, status, start_date, end_date) VALUES
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM public.merchant_subscription_plans WHERE plan_name = 'Pro' LIMIT 1), 'active', NOW(), NOW() + INTERVAL '1 month'),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM public.merchant_subscription_plans WHERE plan_name = 'Enterprise' LIMIT 1), 'active', NOW(), NOW() + INTERVAL '1 month');

-- 11. Insert sample referral campaigns (using gen_random_uuid())
INSERT INTO public.referral_campaigns (id, campaign_name, description, reward_amount, max_referrals, is_active, start_date, end_date) VALUES
(gen_random_uuid(), 'Welcome Bonus', 'Get $10 for each friend you refer', 10.00, 100, true, NOW(), NOW() + INTERVAL '3 months'),
(gen_random_uuid(), 'Holiday Special', 'Double rewards during holiday season', 20.00, 50, true, NOW(), NOW() + INTERVAL '1 month');

-- 12. Insert sample user referrals (using gen_random_uuid())
INSERT INTO public.user_referrals (id, referrer_id, referred_id, referral_code, status, reward_amount) VALUES
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'REF001', 'completed', 10.00);

-- 13. Insert sample subscribers (using gen_random_uuid())
INSERT INTO public.subscribers (id, email, is_active, subscribed_at) VALUES
(gen_random_uuid(), 'newsletter@example.com', true, NOW()),
(gen_random_uuid(), 'updates@example.com', true, NOW());

-- 14. Insert sample NFT types (using gen_random_uuid())
INSERT INTO public.nft_types (id, nft_name, display_name, description, buy_price_usdt, rarity, mint_quantity, is_upgradeable, is_evolvable, is_fractional_eligible, is_custodial, auto_staking_duration, earn_on_spend_ratio, upgrade_bonus_ratio, evolution_min_investment, evolution_earnings_ratio, passive_income_rate, custodial_income_rate, pricing_type, one_time_fee, features) VALUES
(gen_random_uuid(), 'Gold VIP Card', 'Gold VIP Card', 'Premium VIP card with exclusive benefits', 199.99, 'Legendary', 100, true, true, true, true, 'Forever', 0.0200, 0.0100, 500.00, 0.0050, 0.0150, 0.0050, 'one_time', 199.99, '["VIP Support", "Highest Earning Rates", "Exclusive Events", "Priority Access"]'),
(gen_random_uuid(), 'Silver Member Card', 'Silver Member Card', 'Mid-tier membership card', 49.99, 'Rare', 500, true, true, true, true, 'Forever', 0.0125, 0.0025, 200.00, 0.0025, 0.0125, 0.0025, 'one_time', 49.99, '["Priority Support", "Enhanced Earning Rates", "Member Benefits"]');

-- 15. Verify the data
SELECT 'Sample Data Insertion Complete!' as status;

-- Show summary of inserted data
SELECT 'Users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'Merchants', COUNT(*) FROM public.merchants
UNION ALL
SELECT 'Virtual Cards', COUNT(*) FROM public.virtual_cards
UNION ALL
SELECT 'Loyalty Transactions', COUNT(*) FROM public.loyalty_transactions
UNION ALL
SELECT 'User Loyalty Cards', COUNT(*) FROM public.user_loyalty_cards
UNION ALL
SELECT 'User Points', COUNT(*) FROM public.user_points
UNION ALL
SELECT 'User Wallets', COUNT(*) FROM public.user_wallets
UNION ALL
SELECT 'Merchant Cards', COUNT(*) FROM public.merchant_cards
UNION ALL
SELECT 'Merchant Subscriptions', COUNT(*) FROM public.merchant_subscriptions
UNION ALL
SELECT 'Referral Campaigns', COUNT(*) FROM public.referral_campaigns
UNION ALL
SELECT 'User Referrals', COUNT(*) FROM public.user_referrals
UNION ALL
SELECT 'Subscribers', COUNT(*) FROM public.subscribers
UNION ALL
SELECT 'NFT Types', COUNT(*) FROM public.nft_types
ORDER BY table_name;
