-- ===========================================
-- COMPREHENSIVE TEST DATA FOR REWARDS APPLICATION (CORRECTED)
-- ===========================================
-- This script creates 10 test users and 5 test merchants
-- with different subscription plans and NFT types for complete testing
-- 
-- IMPORTANT: Run fix-test-data-issues-corrected.sql FIRST before running this script

-- ===========================================
-- 1. CLEAN UP EXISTING TEST DATA (OPTIONAL)
-- ===========================================

-- Uncomment the following lines if you want to clean up existing test data
-- DELETE FROM public.loyalty_transactions WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test%');
-- DELETE FROM public.user_points WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test%');
-- DELETE FROM public.user_loyalty_cards WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test%');
-- DELETE FROM public.merchants WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test%');
-- DELETE FROM public.profiles WHERE email LIKE '%test%';
-- DELETE FROM auth.users WHERE email LIKE '%test%';

-- ===========================================
-- 2. ENSURE NFT TYPES EXIST
-- ===========================================

-- Insert NFT types if they don't exist
INSERT INTO public.nft_types (
    nft_name, display_name, buy_price_usdt, rarity, mint_quantity,
    is_upgradeable, is_evolvable, is_fractional_eligible, auto_staking_duration,
    earn_on_spend_ratio, upgrade_bonus_ratio, evolution_min_investment,
    evolution_earnings_ratio, is_custodial, is_active
) VALUES 
-- Custodial NFTs
('Pearl White', 'Pearl White NFT', 100.00, 'Common', 1000, false, true, true, 'Forever', 0.0100, 0.0000, 0.00, 0.0000, true, true),
('Lava Orange', 'Lava Orange NFT', 500.00, 'Less Common', 500, false, true, true, 'Forever', 0.0150, 0.0000, 0.00, 0.0000, true, true),
('Pink', 'Pink NFT', 500.00, 'Less Common', 500, false, true, true, 'Forever', 0.0150, 0.0000, 0.00, 0.0000, true, true),
('Silver', 'Silver NFT', 1000.00, 'Rare', 250, true, true, true, 'Forever', 0.0200, 0.0050, 100.00, 0.0100, true, true),
('Gold', 'Gold NFT', 1000.00, 'Rare', 250, true, true, true, 'Forever', 0.0250, 0.0075, 150.00, 0.0150, true, true),
('Black', 'Black NFT', 2500.00, 'Very Rare', 100, true, true, true, 'Forever', 0.0300, 0.0100, 200.00, 0.0200, true, true),
-- Non-Custodial NFTs
('Pearl White', 'Pearl White NFT (Non-Custodial)', 0.00, 'Common', 1000, false, true, true, 'Forever', 0.0100, 0.0000, 0.00, 0.0000, false, true),
('Lava Orange', 'Lava Orange NFT (Non-Custodial)', 0.00, 'Less Common', 500, false, true, true, 'Forever', 0.0150, 0.0000, 0.00, 0.0000, false, true),
('Pink', 'Pink NFT (Non-Custodial)', 0.00, 'Less Common', 500, false, true, true, 'Forever', 0.0150, 0.0000, 0.00, 0.0000, false, true),
('Silver', 'Silver NFT (Non-Custodial)', 0.00, 'Rare', 250, false, true, true, 'Forever', 0.0200, 0.0000, 100.00, 0.0100, false, true),
('Gold', 'Gold NFT (Non-Custodial)', 0.00, 'Rare', 250, false, true, true, 'Forever', 0.0250, 0.0000, 150.00, 0.0150, false, true),
('Black', 'Black NFT (Non-Custodial)', 0.00, 'Very Rare', 100, false, true, true, 'Forever', 0.0300, 0.0000, 200.00, 0.0200, false, true)
ON CONFLICT (nft_name, is_custodial) DO NOTHING;

-- ===========================================
-- 3. CREATE TEST USERS (10 USERS)
-- ===========================================

-- Test User 1: Admin User
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, is_super_admin, role
) VALUES (
    gen_random_uuid(),
    'admin.test@rewardsapp.com',
    crypt('TestAdmin123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Admin Test User"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Test User 2: Regular User with Pearl White NFT
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, is_super_admin, role
) VALUES (
    gen_random_uuid(),
    'user1.test@rewardsapp.com',
    crypt('TestUser123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "John Smith"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Test User 3: User with Lava Orange NFT
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, is_super_admin, role
) VALUES (
    gen_random_uuid(),
    'user2.test@rewardsapp.com',
    crypt('TestUser123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Sarah Johnson"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Test User 4: User with Pink NFT
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, is_super_admin, role
) VALUES (
    gen_random_uuid(),
    'user3.test@rewardsapp.com',
    crypt('TestUser123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Mike Davis"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Test User 5: User with Silver NFT
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, is_super_admin, role
) VALUES (
    gen_random_uuid(),
    'user4.test@rewardsapp.com',
    crypt('TestUser123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Emily Wilson"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Test User 6: User with Gold NFT
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, is_super_admin, role
) VALUES (
    gen_random_uuid(),
    'user5.test@rewardsapp.com',
    crypt('TestUser123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "David Brown"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Test User 7: User with Black NFT
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, is_super_admin, role
) VALUES (
    gen_random_uuid(),
    'user6.test@rewardsapp.com',
    crypt('TestUser123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Lisa Anderson"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Test User 8: User with Non-Custodial Pearl White
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, is_super_admin, role
) VALUES (
    gen_random_uuid(),
    'user7.test@rewardsapp.com',
    crypt('TestUser123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Robert Taylor"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Test User 9: User with Non-Custodial Gold
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, is_super_admin, role
) VALUES (
    gen_random_uuid(),
    'user8.test@rewardsapp.com',
    crypt('TestUser123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Jennifer Martinez"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Test User 10: User with Multiple NFTs
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, is_super_admin, role
) VALUES (
    gen_random_uuid(),
    'user9.test@rewardsapp.com',
    crypt('TestUser123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Michael Garcia"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- ===========================================
-- 4. CREATE USER PROFILES (TRIGGERS WILL CREATE THESE)
-- ===========================================

-- Update admin profile to have admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin.test@rewardsapp.com';

-- ===========================================
-- 5. CREATE TEST MERCHANTS (5 MERCHANTS)
-- ===========================================

-- Merchant 1: StartUp Plan
INSERT INTO public.merchants (
    user_id, business_name, business_type, contact_email, phone, address, city, country,
    subscription_plan, status, subscription_start_date, subscription_end_date
)
SELECT 
    u.id, 'TechStart Solutions', 'Technology', 'merchant1@techstart.com', '+1-555-0101',
    '123 Innovation Drive', 'San Francisco', 'US', 'startup-plan'::public.subscription_plan,
    'active'::public.merchant_status, NOW(), NOW() + INTERVAL '1 year'
FROM auth.users u WHERE u.email = 'user1.test@rewardsapp.com'
ON CONFLICT (user_id) DO NOTHING;

-- Merchant 2: Momentum Plan
INSERT INTO public.merchants (
    user_id, business_name, business_type, contact_email, phone, address, city, country,
    subscription_plan, status, subscription_start_date, subscription_end_date
)
SELECT 
    u.id, 'Cafe Delight', 'Food & Beverage', 'merchant2@cafedelight.com', '+1-555-0102',
    '456 Main Street', 'New York', 'US', 'momentum-plan'::public.subscription_plan,
    'active'::public.merchant_status, NOW(), NOW() + INTERVAL '1 year'
FROM auth.users u WHERE u.email = 'user2.test@rewardsapp.com'
ON CONFLICT (user_id) DO NOTHING;

-- Merchant 3: Energizer Plan
INSERT INTO public.merchants (
    user_id, business_name, business_type, contact_email, phone, address, city, country,
    subscription_plan, status, subscription_start_date, subscription_end_date
)
SELECT 
    u.id, 'Fashion Forward', 'Retail', 'merchant3@fashionforward.com', '+1-555-0103',
    '789 Fashion Avenue', 'Los Angeles', 'US', 'energizer-plan'::public.subscription_plan,
    'active'::public.merchant_status, NOW(), NOW() + INTERVAL '1 year'
FROM auth.users u WHERE u.email = 'user3.test@rewardsapp.com'
ON CONFLICT (user_id) DO NOTHING;

-- Merchant 4: Cloud9 Plan
INSERT INTO public.merchants (
    user_id, business_name, business_type, contact_email, phone, address, city, country,
    subscription_plan, status, subscription_start_date, subscription_end_date
)
SELECT 
    u.id, 'Health & Wellness Center', 'Healthcare', 'merchant4@healthwell.com', '+1-555-0104',
    '321 Wellness Boulevard', 'Chicago', 'US', 'cloud9-plan'::public.subscription_plan,
    'active'::public.merchant_status, NOW(), NOW() + INTERVAL '1 year'
FROM auth.users u WHERE u.email = 'user4.test@rewardsapp.com'
ON CONFLICT (user_id) DO NOTHING;

-- Merchant 5: Super Plan
INSERT INTO public.merchants (
    user_id, business_name, business_type, contact_email, phone, address, city, country,
    subscription_plan, status, subscription_start_date, subscription_end_date
)
SELECT 
    u.id, 'Luxury Auto Dealership', 'Automotive', 'merchant5@luxuryauto.com', '+1-555-0105',
    '654 Premium Drive', 'Miami', 'US', 'super-plan'::public.subscription_plan,
    'active'::public.merchant_status, NOW(), NOW() + INTERVAL '1 year'
FROM auth.users u WHERE u.email = 'user5.test@rewardsapp.com'
ON CONFLICT (user_id) DO NOTHING;

-- ===========================================
-- 6. CREATE USER LOYALTY CARDS
-- ===========================================

-- User 1: Pearl White NFT
INSERT INTO public.user_loyalty_cards (user_id, loyalty_number, full_name, email, phone)
SELECT u.id, 'L0000001', 'John Smith', 'user1.test@rewardsapp.com', '+1-555-1001'
FROM auth.users u WHERE u.email = 'user1.test@rewardsapp.com'
ON CONFLICT (loyalty_number) DO NOTHING;

-- User 2: Lava Orange NFT
INSERT INTO public.user_loyalty_cards (user_id, loyalty_number, full_name, email, phone)
SELECT u.id, 'L0000002', 'Sarah Johnson', 'user2.test@rewardsapp.com', '+1-555-1002'
FROM auth.users u WHERE u.email = 'user2.test@rewardsapp.com'
ON CONFLICT (loyalty_number) DO NOTHING;

-- User 3: Pink NFT
INSERT INTO public.user_loyalty_cards (user_id, loyalty_number, full_name, email, phone)
SELECT u.id, 'L0000003', 'Mike Davis', 'user3.test@rewardsapp.com', '+1-555-1003'
FROM auth.users u WHERE u.email = 'user3.test@rewardsapp.com'
ON CONFLICT (loyalty_number) DO NOTHING;

-- User 4: Silver NFT
INSERT INTO public.user_loyalty_cards (user_id, loyalty_number, full_name, email, phone)
SELECT u.id, 'L0000004', 'Emily Wilson', 'user4.test@rewardsapp.com', '+1-555-1004'
FROM auth.users u WHERE u.email = 'user4.test@rewardsapp.com'
ON CONFLICT (loyalty_number) DO NOTHING;

-- User 5: Gold NFT
INSERT INTO public.user_loyalty_cards (user_id, loyalty_number, full_name, email, phone)
SELECT u.id, 'L0000005', 'David Brown', 'user5.test@rewardsapp.com', '+1-555-1005'
FROM auth.users u WHERE u.email = 'user5.test@rewardsapp.com'
ON CONFLICT (loyalty_number) DO NOTHING;

-- User 6: Black NFT
INSERT INTO public.user_loyalty_cards (user_id, loyalty_number, full_name, email, phone)
SELECT u.id, 'L0000006', 'Lisa Anderson', 'user6.test@rewardsapp.com', '+1-555-1006'
FROM auth.users u WHERE u.email = 'user6.test@rewardsapp.com'
ON CONFLICT (loyalty_number) DO NOTHING;

-- User 7: Non-Custodial Pearl White
INSERT INTO public.user_loyalty_cards (user_id, loyalty_number, full_name, email, phone)
SELECT u.id, 'L0000007', 'Robert Taylor', 'user7.test@rewardsapp.com', '+1-555-1007'
FROM auth.users u WHERE u.email = 'user7.test@rewardsapp.com'
ON CONFLICT (loyalty_number) DO NOTHING;

-- User 8: Non-Custodial Gold
INSERT INTO public.user_loyalty_cards (user_id, loyalty_number, full_name, email, phone)
SELECT u.id, 'L0000008', 'Jennifer Martinez', 'user8.test@rewardsapp.com', '+1-555-1008'
FROM auth.users u WHERE u.email = 'user8.test@rewardsapp.com'
ON CONFLICT (loyalty_number) DO NOTHING;

-- User 9: Multiple NFTs
INSERT INTO public.user_loyalty_cards (user_id, loyalty_number, full_name, email, phone)
SELECT u.id, 'L0000009', 'Michael Garcia', 'user9.test@rewardsapp.com', '+1-555-1009'
FROM auth.users u WHERE u.email = 'user9.test@rewardsapp.com'
ON CONFLICT (loyalty_number) DO NOTHING;

-- ===========================================
-- 7. CREATE USER POINTS
-- ===========================================

-- Initialize user points for all test users
INSERT INTO public.user_points (user_id, total_points, available_points, lifetime_points)
SELECT u.id, 
    CASE 
        WHEN u.email = 'user1.test@rewardsapp.com' THEN 150  -- Pearl White user
        WHEN u.email = 'user2.test@rewardsapp.com' THEN 300  -- Lava Orange user
        WHEN u.email = 'user3.test@rewardsapp.com' THEN 300  -- Pink user
        WHEN u.email = 'user4.test@rewardsapp.com' THEN 500  -- Silver user
        WHEN u.email = 'user5.test@rewardsapp.com' THEN 750  -- Gold user
        WHEN u.email = 'user6.test@rewardsapp.com' THEN 1000 -- Black user
        WHEN u.email = 'user7.test@rewardsapp.com' THEN 200  -- Non-custodial Pearl White
        WHEN u.email = 'user8.test@rewardsapp.com' THEN 800  -- Non-custodial Gold
        WHEN u.email = 'user9.test@rewardsapp.com' THEN 1200 -- Multiple NFTs
        ELSE 100
    END,
    CASE 
        WHEN u.email = 'user1.test@rewardsapp.com' THEN 150
        WHEN u.email = 'user2.test@rewardsapp.com' THEN 300
        WHEN u.email = 'user3.test@rewardsapp.com' THEN 300
        WHEN u.email = 'user4.test@rewardsapp.com' THEN 500
        WHEN u.email = 'user5.test@rewardsapp.com' THEN 750
        WHEN u.email = 'user6.test@rewardsapp.com' THEN 1000
        WHEN u.email = 'user7.test@rewardsapp.com' THEN 200
        WHEN u.email = 'user8.test@rewardsapp.com' THEN 800
        WHEN u.email = 'user9.test@rewardsapp.com' THEN 1200
        ELSE 100
    END,
    CASE 
        WHEN u.email = 'user1.test@rewardsapp.com' THEN 150
        WHEN u.email = 'user2.test@rewardsapp.com' THEN 300
        WHEN u.email = 'user3.test@rewardsapp.com' THEN 300
        WHEN u.email = 'user4.test@rewardsapp.com' THEN 500
        WHEN u.email = 'user5.test@rewardsapp.com' THEN 750
        WHEN u.email = 'user6.test@rewardsapp.com' THEN 1000
        WHEN u.email = 'user7.test@rewardsapp.com' THEN 200
        WHEN u.email = 'user8.test@rewardsapp.com' THEN 800
        WHEN u.email = 'user9.test@rewardsapp.com' THEN 1200
        ELSE 100
    END
FROM auth.users u 
WHERE u.email LIKE '%test@rewardsapp.com'
ON CONFLICT (user_id) DO UPDATE SET
    total_points = EXCLUDED.total_points,
    available_points = EXCLUDED.available_points,
    lifetime_points = EXCLUDED.lifetime_points;

-- ===========================================
-- 8. CREATE SAMPLE LOYALTY TRANSACTIONS
-- ===========================================

-- Create sample transactions for testing
INSERT INTO public.loyalty_transactions (
    user_id, merchant_id, loyalty_number, transaction_amount, points_earned, transaction_reference
)
SELECT 
    u.id,
    m.id,
    ulc.loyalty_number,
    25.00,
    25, -- 1 point per dollar
    'TXN-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-001'
FROM auth.users u
JOIN public.user_loyalty_cards ulc ON u.id = ulc.user_id
JOIN public.merchants m ON m.user_id != u.id  -- Different merchant
WHERE u.email = 'user1.test@rewardsapp.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.loyalty_transactions (
    user_id, merchant_id, loyalty_number, transaction_amount, points_earned, transaction_reference
)
SELECT 
    u.id,
    m.id,
    ulc.loyalty_number,
    50.00,
    75, -- 1.5 points per dollar (Lava Orange bonus)
    'TXN-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-002'
FROM auth.users u
JOIN public.user_loyalty_cards ulc ON u.id = ulc.user_id
JOIN public.merchants m ON m.user_id != u.id
WHERE u.email = 'user2.test@rewardsapp.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.loyalty_transactions (
    user_id, merchant_id, loyalty_number, transaction_amount, points_earned, transaction_reference
)
SELECT 
    u.id,
    m.id,
    ulc.loyalty_number,
    100.00,
    200, -- 2 points per dollar (Silver bonus)
    'TXN-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-003'
FROM auth.users u
JOIN public.user_loyalty_cards ulc ON u.id = ulc.user_id
JOIN public.merchants m ON m.user_id != u.id
WHERE u.email = 'user4.test@rewardsapp.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ===========================================
-- 9. VERIFICATION QUERIES
-- ===========================================

-- Verify test data creation
SELECT 'Test Users Created' as category, COUNT(*) as count FROM auth.users WHERE email LIKE '%test@rewardsapp.com'
UNION ALL
SELECT 'User Profiles Created', COUNT(*) FROM public.profiles WHERE email LIKE '%test@rewardsapp.com'
UNION ALL
SELECT 'Test Merchants Created', COUNT(*) FROM public.merchants WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com')
UNION ALL
SELECT 'Loyalty Cards Created', COUNT(*) FROM public.user_loyalty_cards WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com')
UNION ALL
SELECT 'User Points Created', COUNT(*) FROM public.user_points WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com')
UNION ALL
SELECT 'NFT Types Available', COUNT(*) FROM public.nft_types WHERE is_active = true
UNION ALL
SELECT 'Sample Transactions', COUNT(*) FROM public.loyalty_transactions WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com');

-- Show test user details
SELECT 
    u.email,
    p.full_name,
    p.role,
    m.business_name,
    m.subscription_plan,
    ulc.loyalty_number,
    up.total_points
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.merchants m ON u.id = m.user_id
LEFT JOIN public.user_loyalty_cards ulc ON u.id = ulc.user_id
LEFT JOIN public.user_points up ON u.id = up.user_id
WHERE u.email LIKE '%test@rewardsapp.com'
ORDER BY u.email;

-- Show NFT types
SELECT nft_name, display_name, rarity, buy_price_usdt, is_custodial, earn_on_spend_ratio
FROM public.nft_types 
WHERE is_active = true
ORDER BY 
    CASE rarity 
        WHEN 'Common' THEN 1 
        WHEN 'Less Common' THEN 2 
        WHEN 'Rare' THEN 3 
        WHEN 'Very Rare' THEN 4 
    END,
    is_custodial DESC,
    buy_price_usdt;

-- ===========================================
-- 10. SUCCESS MESSAGE
-- ===========================================

SELECT '✅ Test data created successfully!' as message,
       'You can now run the comprehensive testing script.' as next_step;
