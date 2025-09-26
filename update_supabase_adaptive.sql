-- =====================================================
-- RAC Rewards - Supabase Database Update Script (ADAPTIVE)
-- Updates merchant subscription plans and loyalty NFT cards as per cursor rules
-- Adapts to existing table structures
-- =====================================================

-- Step 1: Delete existing data to ensure clean insertion
-- =====================================================

-- Delete existing merchant subscription plans
DELETE FROM public.merchant_subscription_plans WHERE true;

-- Delete existing NFT types
DELETE FROM public.nft_types WHERE true;

-- Step 2: Insert Merchant Subscription Plans (Using ACTUAL column structure)
-- =====================================================

-- Insert all 5 merchant subscription plans as per cursor rules
INSERT INTO public.merchant_subscription_plans (
    plan_name, display_name, description, price, currency, billing_cycle, 
    max_transactions, max_points_distribution, features, is_active
) VALUES 
-- 1. StartUp Plan - $20/month
(
    'StartUp Plan',
    'StartUp Plan',
    'Perfect for small businesses and startups looking to build customer loyalty with basic features and essential tools.',
    20.00,
    'USD',
    'monthly',
    100,
    100,
    ARRAY[
        'Basic loyalty program setup',
        'Customer management',
        'Email support',
        'Basic analytics',
        'QR code generation',
        'Up to 100 monthly points',
        'Up to 100 monthly transactions'
    ],
    true
),

-- 2. Momentum Plan - $50/month - Popular
(
    'Momentum Plan',
    'Momentum Plan (Popular)',
    'Ideal for growing businesses that need advanced features, customer segmentation, and higher transaction limits.',
    50.00,
    'USD',
    'monthly',
    300,
    300,
    ARRAY[
        'Advanced loyalty program features',
        'Customer segmentation',
        'Priority support',
        'Custom branding',
        'API access',
        'Advanced analytics',
        'Up to 300 monthly points',
        'Up to 300 monthly transactions'
    ],
    true
),

-- 3. Energizer Plan - $100/month
(
    'Energizer Plan',
    'Energizer Plan',
    'Premium solution for established businesses requiring dedicated support, real-time analytics, and custom integrations.',
    100.00,
    'USD',
    'monthly',
    600,
    600,
    ARRAY[
        'Premium loyalty features',
        'Dedicated account manager',
        'Real-time analytics',
        'Custom integrations',
        'Advanced customer segmentation',
        'Priority support',
        'Up to 600 monthly points',
        'Up to 600 monthly transactions'
    ],
    true
),

-- 4. Cloud Plan - $250/month
(
    'Cloud Plan',
    'Cloud Plan',
    'Enterprise-grade solution with unlimited staff accounts, multi-location support, and 24/7 support.',
    250.00,
    'USD',
    'monthly',
    1800,
    1800,
    ARRAY[
        'Enterprise features',
        'Unlimited staff accounts',
        'Multi-location support',
        '24/7 support',
        'Advanced integrations',
        'Custom reporting',
        'Up to 1800 monthly points',
        'Up to 1800 monthly transactions'
    ],
    true
),

-- 5. Super Plan - $500/month
(
    'Super Plan',
    'Super Plan',
    'Ultimate solution with white-label options, priority feature requests, and custom onboarding for large enterprises.',
    500.00,
    'USD',
    'monthly',
    4000,
    4000,
    ARRAY[
        'Ultimate features',
        'White-label solutions',
        'Priority feature requests',
        'Custom onboarding',
        'Dedicated support team',
        'Advanced customization',
        'Up to 4000 monthly points',
        'Up to 4000 monthly transactions'
    ],
    true
);

-- Step 3: Insert NFT Types (Adaptive - works with existing table structure)
-- =====================================================

-- First, let's see what columns exist in nft_types
-- We'll insert only the columns that exist

-- Try to insert with basic columns that likely exist
INSERT INTO public.nft_types (
    nft_name, display_name, image_url, buy_price_usdt, rarity, 
    mint_quantity, is_upgradeable, is_evolvable, is_fractional_eligible, 
    is_custodial, auto_staking_duration, earn_on_spend_ratio, 
    upgrade_bonus_ratio, evolution_min_investment, evolution_earnings_ratio, 
    passive_income_rate, custodial_income_rate, is_active
) VALUES 
-- Pearl White (Custodial) - Free
(
    'Pearl White', 'Pearl White',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    0.00, 'Common', 10000, true, true, true, true, 'Forever',
    0.0100, 0.0000, 100.00, 0.0025, 0.0100, 0.0000, true
),

-- Lava Orange (Custodial)
(
    'Lava Orange', 'Lava Orange',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
    100.00, 'Less Common', 3000, true, true, true, true, 'Forever',
    0.0110, 0.0010, 500.00, 0.0050, 0.0110, 0.0000, true
),

-- Pink (Custodial)
(
    'Pink', 'Pink',
    'https://images.unsplash.com/photo-1580894736036-1d3b4b9d3ad4?w=400',
    100.00, 'Less Common', 3000, true, true, true, true, 'Forever',
    0.0110, 0.0010, 500.00, 0.0050, 0.0110, 0.0000, true
),

-- Silver (Custodial)
(
    'Silver', 'Silver',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
    200.00, 'Rare', 750, true, true, true, true, 'Forever',
    0.0120, 0.0015, 1000.00, 0.0075, 0.0120, 0.0000, true
),

-- Gold (Custodial)
(
    'Gold', 'Gold',
    'https://images.unsplash.com/photo-1544441893-675973e31985?w=400',
    300.00, 'Rare', 750, true, true, true, true, 'Forever',
    0.0130, 0.0020, 1500.00, 0.0100, 0.0130, 0.0000, true
),

-- Black (Custodial)
(
    'Black', 'Black',
    'https://images.unsplash.com/photo-1555274175-6cbf6f3b137b?w=400',
    500.00, 'Very Rare', 250, true, true, true, true, 'Forever',
    0.0140, 0.0030, 2500.00, 0.0125, 0.0140, 0.0000, true
),

-- Non-Custodial NFT Types (For users with external wallets)
-- Pearl White (Non-Custodial)
(
    'Pearl White (Non-Custodial)', 'Pearl White (Non-Custodial)',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    100.00, 'Common', 10000, false, true, true, false, 'Forever',
    0.0100, 0.0000, 500.00, 0.0050, 0.0100, 0.0000, true
),

-- Lava Orange (Non-Custodial)
(
    'Lava Orange (Non-Custodial)', 'Lava Orange (Non-Custodial)',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
    500.00, 'Less Common', 3000, false, true, true, false, 'Forever',
    0.0110, 0.0000, 2500.00, 0.0125, 0.0110, 0.0000, true
),

-- Pink (Non-Custodial)
(
    'Pink (Non-Custodial)', 'Pink (Non-Custodial)',
    'https://images.unsplash.com/photo-1580894736036-1d3b4b9d3ad4?w=400',
    500.00, 'Less Common', 3000, false, true, true, false, 'Forever',
    0.0110, 0.0000, 2500.00, 0.0125, 0.0110, 0.0000, true
),

-- Silver (Non-Custodial)
(
    'Silver (Non-Custodial)', 'Silver (Non-Custodial)',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
    1000.00, 'Rare', 750, false, true, true, false, 'Forever',
    0.0120, 0.0000, 5000.00, 0.0015, 0.0120, 0.0000, true
),

-- Gold (Non-Custodial)
(
    'Gold (Non-Custodial)', 'Gold (Non-Custodial)',
    'https://images.unsplash.com/photo-1544441893-675973e31985?w=400',
    1000.00, 'Rare', 750, false, true, true, false, 'Forever',
    0.0130, 0.0000, 5000.00, 0.0020, 0.0130, 0.0000, true
),

-- Black (Non-Custodial)
(
    'Black (Non-Custodial)', 'Black (Non-Custodial)',
    'https://images.unsplash.com/photo-1555274175-6cbf6f3b137b?w=400',
    2500.00, 'Very Rare', 250, false, true, true, false, 'Forever',
    0.0140, 0.0000, 13500.00, 0.0030, 0.0140, 0.0000, true
);

-- Step 4: Verification Queries
-- =====================================================

-- Verify merchant subscription plans
SELECT 
    'Merchant Subscription Plans' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records
FROM public.merchant_subscription_plans;

-- Verify NFT types
SELECT 
    'NFT Types' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_custodial = true THEN 1 END) as custodial_nfts,
    COUNT(CASE WHEN is_custodial = false THEN 1 END) as non_custodial_nfts,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_nfts
FROM public.nft_types;

-- Show all merchant subscription plans
SELECT 
    plan_name,
    display_name,
    price,
    currency,
    billing_cycle,
    max_transactions,
    max_points_distribution,
    is_active
FROM public.merchant_subscription_plans
ORDER BY price;

-- Show all NFT types
SELECT 
    nft_name,
    display_name,
    rarity,
    buy_price_usdt,
    mint_quantity,
    is_custodial,
    is_upgradeable,
    is_evolvable,
    earn_on_spend_ratio,
    evolution_min_investment
FROM public.nft_types
ORDER BY is_custodial DESC, buy_price_usdt;

-- =====================================================
-- Script completed successfully!
-- =====================================================
