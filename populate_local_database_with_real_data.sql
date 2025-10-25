-- Populate Local Database with Real Test Data
-- This script adds realistic test data to your local PostgreSQL database
-- Run this to see actual data in your application instead of empty tables

-- =============================================================================
-- 1. INSERT REAL NFT TYPES DATA
-- =============================================================================

-- Clear existing data and insert real NFT types
DELETE FROM public.nft_types;

INSERT INTO public.nft_types (
    id, collection_id, collection, nft_name, display_name, description, 
    image_url, evolution_image_url, buy_price_usdt, rarity, mint_quantity,
    is_upgradeable, is_evolvable, is_fractional_eligible, is_custodial,
    auto_staking_duration, earn_on_spend_ratio, upgrade_bonus_ratio,
    evolution_min_investment, evolution_earnings_ratio, passive_income_rate,
    custodial_income_rate, is_active, created_at, updated_at
) VALUES 
-- Classic Collection
(
    gen_random_uuid(),
    (SELECT id FROM public.nft_collections WHERE collection_name = 'Classic' LIMIT 1),
    'Classic',
    'Pearl White',
    'Pearl White',
    'A classic white card with elegant design and premium feel',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400',
    0.00,
    'Common',
    10000,
    true,
    true,
    false,
    true,
    'Forever',
    0.01,
    0.00,
    100.00,
    0.0025,
    0.01,
    0.00,
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM public.nft_collections WHERE collection_name = 'Classic' LIMIT 1),
    'Classic',
    'Lava Orange',
    'Lava Orange',
    'Bold orange card with fiery design and high energy',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    100.00,
    'Less Common',
    3000,
    true,
    true,
    false,
    true,
    'Forever',
    0.015,
    0.05,
    200.00,
    0.005,
    0.015,
    0.005,
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM public.nft_collections WHERE collection_name = 'Classic' LIMIT 1),
    'Classic',
    'Ocean Blue',
    'Ocean Blue',
    'Deep blue card representing the vast ocean and endless possibilities',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
    250.00,
    'Rare',
    1000,
    true,
    true,
    true,
    true,
    'Forever',
    0.02,
    0.10,
    500.00,
    0.01,
    0.02,
    0.01,
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM public.nft_collections WHERE collection_name = 'Classic' LIMIT 1),
    'Classic',
    'Forest Green',
    'Forest Green',
    'Rich green card symbolizing growth and prosperity',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    500.00,
    'Very Rare',
    500,
    true,
    true,
    true,
    true,
    'Forever',
    0.025,
    0.15,
    1000.00,
    0.015,
    0.025,
    0.015,
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM public.nft_collections WHERE collection_name = 'Classic' LIMIT 1),
    'Classic',
    'Royal Purple',
    'Royal Purple',
    'Exclusive purple card for VIP members with premium benefits',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    1000.00,
    'Legendary',
    100,
    true,
    true,
    true,
    true,
    'Forever',
    0.03,
    0.25,
    2000.00,
    0.02,
    0.03,
    0.02,
    true,
    NOW(),
    NOW()
);

-- =============================================================================
-- 2. INSERT REAL MERCHANT SUBSCRIPTION PLANS
-- =============================================================================

-- Clear existing data and insert real subscription plans
DELETE FROM public.merchant_subscription_plans;

INSERT INTO public.merchant_subscription_plans (
    id, plan_name, description, price_monthly, price_yearly, 
    features, trial_days, is_active, is_popular, plan_type,
    created_at, updated_at
) VALUES 
(
    gen_random_uuid(),
    'Startup Plan',
    'Perfect for small businesses just getting started',
    29.99,
    299.99,
    '{"max_points_distribution": 100, "max_transactions": 100, "analytics": true, "support": "email", "custom_branding": false}',
    14,
    true,
    false,
    'startup',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Momentum Plan',
    'Ideal for growing businesses with increasing customer base',
    79.99,
    799.99,
    '{"max_points_distribution": 300, "max_transactions": 300, "analytics": true, "support": "priority", "custom_branding": true, "api_access": true}',
    14,
    true,
    true,
    'momentum',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Energizer Plan',
    'For established businesses ready to scale',
    149.99,
    1499.99,
    '{"max_points_distribution": 600, "max_transactions": 600, "analytics": "advanced", "support": "phone", "custom_branding": true, "api_access": true, "white_label": false}',
    14,
    true,
    false,
    'energizer',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Cloud9 Plan',
    'Premium solution for large enterprises',
    299.99,
    2999.99,
    '{"max_points_distribution": 1800, "max_transactions": 1800, "analytics": "enterprise", "support": "dedicated", "custom_branding": true, "api_access": true, "white_label": true, "custom_integrations": true}',
    14,
    true,
    false,
    'cloud9',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Super Plan',
    'Ultimate solution for enterprise-level operations',
    599.99,
    5999.99,
    '{"max_points_distribution": 4000, "max_transactions": 4000, "analytics": "enterprise", "support": "dedicated", "custom_branding": true, "api_access": true, "white_label": true, "custom_integrations": true, "priority_processing": true}',
    14,
    true,
    false,
    'super',
    NOW(),
    NOW()
);

-- =============================================================================
-- 3. INSERT REAL MERCHANTS DATA
-- =============================================================================

-- Clear existing data and insert real merchants
DELETE FROM public.merchants;

INSERT INTO public.merchants (
    id, user_id, business_name, business_type, contact_email, phone,
    address, city, state, zip_code, country, website, description,
    logo_url, is_verified, is_active, contact_name, terms_accepted,
    privacy_accepted, free_trial_months, subscription_plan, status,
    created_at, updated_at
) VALUES 
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'TechCorp Solutions',
    'Technology',
    'contact@techcorp.com',
    '+1-555-0123',
    '123 Tech Street',
    'San Francisco',
    'CA',
    '94105',
    'United States',
    'https://techcorp.com',
    'Leading technology solutions provider',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200',
    true,
    true,
    'John Smith',
    true,
    true,
    0,
    'momentum',
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    'Green Earth Cafe',
    'Food & Beverage',
    'info@greenearthcafe.com',
    '+1-555-0456',
    '456 Green Avenue',
    'Portland',
    'OR',
    '97201',
    'United States',
    'https://greenearthcafe.com',
    'Organic coffee and sustainable dining',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200',
    true,
    true,
    'Sarah Johnson',
    true,
    true,
    1,
    'startup',
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    'Fashion Forward',
    'Retail',
    'hello@fashionforward.com',
    '+1-555-0789',
    '789 Fashion Boulevard',
    'New York',
    'NY',
    '10001',
    'United States',
    'https://fashionforward.com',
    'Trendy fashion and accessories',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200',
    false,
    true,
    'Michael Chen',
    true,
    true,
    0,
    'energizer',
    'pending',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004',
    'FitLife Gym',
    'Health & Fitness',
    'membership@fitlifegym.com',
    '+1-555-0321',
    '321 Fitness Way',
    'Austin',
    'TX',
    '73301',
    'United States',
    'https://fitlifegym.com',
    'Premium fitness and wellness center',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200',
    true,
    true,
    'Emily Rodriguez',
    true,
    true,
    2,
    'cloud9',
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000005',
    'Global Enterprises',
    'Consulting',
    'contact@globalenterprises.com',
    '+1-555-0654',
    '654 Corporate Plaza',
    'Chicago',
    'IL',
    '60601',
    'United States',
    'https://globalenterprises.com',
    'International business consulting services',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    true,
    true,
    'David Wilson',
    true,
    true,
    0,
    'super',
    'active',
    NOW(),
    NOW()
);

-- =============================================================================
-- 4. INSERT REAL USER PROFILES DATA
-- =============================================================================

-- Clear existing data and insert real user profiles
DELETE FROM public.profiles;

INSERT INTO public.profiles (
    id, email, full_name, avatar_url, role, phone, city, referral_code,
    terms_accepted, privacy_accepted, loyalty_card_number, first_name,
    last_name, wallet_address, created_at, updated_at
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'john.smith@example.com',
    'John Smith',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    'user',
    '+1-555-0101',
    'San Francisco',
    'REF001',
    true,
    true,
    'J0000001',
    'John',
    'Smith',
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000002',
    'sarah.johnson@example.com',
    'Sarah Johnson',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200',
    'user',
    '+1-555-0202',
    'Portland',
    'REF002',
    true,
    true,
    'S0000002',
    'Sarah',
    'Johnson',
    '0x8ba1f109551bD432803012645Hac136c4c8b8d8e',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000003',
    'michael.chen@example.com',
    'Michael Chen',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    'user',
    '+1-555-0303',
    'New York',
    'REF003',
    true,
    true,
    'M0000003',
    'Michael',
    'Chen',
    '0x9ca2f209661cE543914023756Ibd247d5d9c9e9f',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000004',
    'emily.rodriguez@example.com',
    'Emily Rodriguez',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    'user',
    '+1-555-0404',
    'Austin',
    'REF004',
    true,
    true,
    'E0000004',
    'Emily',
    'Rodriguez',
    '0x0db3f309771dF654025134867Jce358e6e0d0f0g',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000005',
    'david.wilson@example.com',
    'David Wilson',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    'admin',
    '+1-555-0505',
    'Chicago',
    'REF005',
    true,
    true,
    'D0000005',
    'David',
    'Wilson',
    '0x1ec4f409881eG765136245978Kdf469f7f1e1g1h',
    NOW(),
    NOW()
);

-- =============================================================================
-- 5. INSERT REAL USER POINTS DATA
-- =============================================================================

-- Clear existing data and insert real user points
DELETE FROM public.user_points;

INSERT INTO public.user_points (
    id, user_id, points_balance, total_earned, total_spent, tier_level,
    last_updated, created_at
) VALUES 
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    1250,
    1500,
    250,
    'silver',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    3200,
    4000,
    800,
    'gold',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    750,
    1000,
    250,
    'bronze',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004',
    8500,
    10000,
    1500,
    'platinum',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000005',
    15000,
    20000,
    5000,
    'diamond',
    NOW(),
    NOW()
);

-- =============================================================================
-- 6. INSERT REAL LOYALTY TRANSACTIONS DATA
-- =============================================================================

-- Clear existing data and insert real loyalty transactions
DELETE FROM public.loyalty_transactions;

INSERT INTO public.loyalty_transactions (
    id, user_id, merchant_id, loyalty_number, transaction_amount,
    points_earned, points_spent, transaction_reference, transaction_type,
    transaction_date, created_at
) VALUES 
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM public.merchants WHERE business_name = 'TechCorp Solutions' LIMIT 1),
    'J0000001',
    150.00,
    15,
    0,
    'TXN001',
    'earn',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    (SELECT id FROM public.merchants WHERE business_name = 'Green Earth Cafe' LIMIT 1),
    'S0000002',
    25.50,
    25,
    0,
    'TXN002',
    'earn',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    (SELECT id FROM public.merchants WHERE business_name = 'Fashion Forward' LIMIT 1),
    'M0000003',
    89.99,
    90,
    0,
    'TXN003',
    'earn',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004',
    (SELECT id FROM public.merchants WHERE business_name = 'FitLife Gym' LIMIT 1),
    'E0000004',
    75.00,
    75,
    0,
    'TXN004',
    'earn',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM public.merchants WHERE business_name = 'TechCorp Solutions' LIMIT 1),
    'J0000001',
    0.00,
    0,
    250,
    'REDEEM001',
    'spend',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
);

-- =============================================================================
-- 7. INSERT REAL MARKETPLACE LISTINGS DATA
-- =============================================================================

-- Clear existing data and insert real marketplace listings
DELETE FROM public.marketplace_listings;

INSERT INTO public.marketplace_listings (
    id, title, description, category, total_funding_goal, current_funding_amount,
    minimum_investment, token_price, status, creator_id, created_at, updated_at
) VALUES 
(
    gen_random_uuid(),
    'Green Energy Solar Farm',
    'Invest in our new solar farm project in California. Expected ROI of 12% annually.',
    'Renewable Energy',
    1000000.00,
    250000.00,
    100.00,
    1.00,
    'active',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Tech Startup Innovation Fund',
    'Support innovative tech startups with our venture capital fund.',
    'Technology',
    500000.00,
    125000.00,
    500.00,
    5.00,
    'active',
    '00000000-0000-0000-0000-000000000002',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Real Estate Development',
    'Commercial real estate development in downtown area.',
    'Real Estate',
    2000000.00,
    800000.00,
    1000.00,
    10.00,
    'active',
    '00000000-0000-0000-0000-000000000003',
    NOW(),
    NOW()
);

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Local database populated with real test data!';
    RAISE NOTICE '📊 Added realistic NFT types, merchants, users, and transactions';
    RAISE NOTICE '🎯 Your application will now show actual data instead of empty tables';
    RAISE NOTICE '🚀 Test the application functionality with real data!';
END $$;
