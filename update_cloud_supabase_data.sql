-- =====================================================
-- RAC Rewards - Cloud Supabase Database Update Script
-- Updates merchant subscription plans and loyalty NFT cards as per cursor rules
-- =====================================================

-- Step 1: Delete existing data to ensure clean insertion
-- =====================================================

-- Delete existing merchant subscription plans
DELETE FROM public.merchant_subscription_plans WHERE true;

-- Delete existing NFT types
DELETE FROM public.nft_types WHERE true;

-- Reset sequences if they exist
DO $$
BEGIN
    -- Reset merchant_subscription_plans sequence if it exists
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'merchant_subscription_plans_id_seq') THEN
        ALTER SEQUENCE public.merchant_subscription_plans_id_seq RESTART WITH 1;
    END IF;
    
    -- Reset nft_types sequence if it exists
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'nft_types_id_seq') THEN
        ALTER SEQUENCE public.nft_types_id_seq RESTART WITH 1;
    END IF;
END $$;

-- Step 2: Insert Merchant Subscription Plans (Official Specifications)
-- =====================================================

-- Create merchant_subscription_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.merchant_subscription_plans (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    plan_number INTEGER NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    yearly_price DECIMAL(10,2) NOT NULL,
    monthly_points INTEGER NOT NULL,
    monthly_transactions INTEGER NOT NULL,
    features JSONB NOT NULL DEFAULT '{}',
    trial_days INTEGER NOT NULL DEFAULT 14,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert all 5 merchant subscription plans as per cursor rules
INSERT INTO public.merchant_subscription_plans (
    plan_name, plan_number, monthly_price, yearly_price, monthly_points, 
    monthly_transactions, features, trial_days, is_popular, is_active
) VALUES 
-- 1. StartUp Plan - $20/month ($150/year)
(
    'StartUp Plan',
    1,
    20.00,
    150.00,
    100,
    100,
    '{
        "basic_loyalty_program": true,
        "customer_management": true,
        "email_support": true,
        "basic_analytics": true,
        "qr_code_generation": true,
        "advanced_features": false,
        "customer_segmentation": false,
        "priority_support": false,
        "custom_branding": false,
        "api_access": false,
        "premium_features": false,
        "dedicated_account_manager": false,
        "real_time_analytics": false,
        "custom_integrations": false,
        "enterprise_features": false,
        "unlimited_staff_accounts": false,
        "multi_location_support": false,
        "24_7_support": false,
        "ultimate_features": false,
        "white_label_solutions": false,
        "priority_feature_requests": false,
        "custom_onboarding": false
    }'::jsonb,
    14,
    false,
    true
),

-- 2. Momentum Plan - $50/month ($500/year) - Popular
(
    'Momentum Plan',
    2,
    50.00,
    500.00,
    300,
    300,
    '{
        "basic_loyalty_program": true,
        "customer_management": true,
        "email_support": true,
        "basic_analytics": true,
        "qr_code_generation": true,
        "advanced_features": true,
        "customer_segmentation": true,
        "priority_support": true,
        "custom_branding": true,
        "api_access": true,
        "premium_features": false,
        "dedicated_account_manager": false,
        "real_time_analytics": false,
        "custom_integrations": false,
        "enterprise_features": false,
        "unlimited_staff_accounts": false,
        "multi_location_support": false,
        "24_7_support": false,
        "ultimate_features": false,
        "white_label_solutions": false,
        "priority_feature_requests": false,
        "custom_onboarding": false
    }'::jsonb,
    14,
    true,
    true
),

-- 3. Energizer Plan - $100/month ($1000/year)
(
    'Energizer Plan',
    3,
    100.00,
    1000.00,
    600,
    600,
    '{
        "basic_loyalty_program": true,
        "customer_management": true,
        "email_support": true,
        "basic_analytics": true,
        "qr_code_generation": true,
        "advanced_features": true,
        "customer_segmentation": true,
        "priority_support": true,
        "custom_branding": true,
        "api_access": true,
        "premium_features": true,
        "dedicated_account_manager": true,
        "real_time_analytics": true,
        "custom_integrations": true,
        "enterprise_features": false,
        "unlimited_staff_accounts": false,
        "multi_location_support": false,
        "24_7_support": false,
        "ultimate_features": false,
        "white_label_solutions": false,
        "priority_feature_requests": false,
        "custom_onboarding": false
    }'::jsonb,
    21,
    false,
    true
),

-- 4. Cloud Plan - $250/month ($2500/year)
(
    'Cloud Plan',
    4,
    250.00,
    2500.00,
    1800,
    1800,
    '{
        "basic_loyalty_program": true,
        "customer_management": true,
        "email_support": true,
        "basic_analytics": true,
        "qr_code_generation": true,
        "advanced_features": true,
        "customer_segmentation": true,
        "priority_support": true,
        "custom_branding": true,
        "api_access": true,
        "premium_features": true,
        "dedicated_account_manager": true,
        "real_time_analytics": true,
        "custom_integrations": true,
        "enterprise_features": true,
        "unlimited_staff_accounts": true,
        "multi_location_support": true,
        "24_7_support": true,
        "ultimate_features": false,
        "white_label_solutions": false,
        "priority_feature_requests": false,
        "custom_onboarding": false
    }'::jsonb,
    30,
    false,
    true
),

-- 5. Super Plan - $500/month ($5000/year)
(
    'Super Plan',
    5,
    500.00,
    5000.00,
    4000,
    4000,
    '{
        "basic_loyalty_program": true,
        "customer_management": true,
        "email_support": true,
        "basic_analytics": true,
        "qr_code_generation": true,
        "advanced_features": true,
        "customer_segmentation": true,
        "priority_support": true,
        "custom_branding": true,
        "api_access": true,
        "premium_features": true,
        "dedicated_account_manager": true,
        "real_time_analytics": true,
        "custom_integrations": true,
        "enterprise_features": true,
        "unlimited_staff_accounts": true,
        "multi_location_support": true,
        "24_7_support": true,
        "ultimate_features": true,
        "white_label_solutions": true,
        "priority_feature_requests": true,
        "custom_onboarding": true
    }'::jsonb,
    30,
    false,
    true
);

-- Step 3: Create NFT Types Table and Insert Loyalty NFT Cards
-- =====================================================

-- Create nft_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nft_types (
    id SERIAL PRIMARY KEY,
    collection VARCHAR(100) NOT NULL,
    nft_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    image_url TEXT,
    evolution_image_url TEXT,
    buy_price_usdt DECIMAL(10,2) NOT NULL DEFAULT 0,
    buy_price_nft DECIMAL(10,2) NOT NULL DEFAULT 0,
    rarity VARCHAR(50) NOT NULL,
    mint_quantity INTEGER NOT NULL,
    is_upgradeable BOOLEAN NOT NULL DEFAULT FALSE,
    is_evolvable BOOLEAN NOT NULL DEFAULT FALSE,
    is_fractional_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    is_custodial BOOLEAN NOT NULL DEFAULT TRUE,
    auto_staking_duration VARCHAR(50) NOT NULL DEFAULT 'Forever',
    earn_on_spend_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.01,
    upgrade_bonus_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.00,
    evolution_min_investment DECIMAL(10,2) NOT NULL DEFAULT 0,
    evolution_earnings_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.00,
    passive_income_rate DECIMAL(5,4) NOT NULL DEFAULT 0.01,
    custodial_income_rate DECIMAL(5,4) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Custodial NFT Types (Free for users with custodial wallets)
INSERT INTO public.nft_types (
    collection, nft_name, display_name, image_url, evolution_image_url,
    buy_price_usdt, buy_price_nft, rarity, mint_quantity, is_upgradeable,
    is_evolvable, is_fractional_eligible, is_custodial, auto_staking_duration,
    earn_on_spend_ratio, upgrade_bonus_ratio, evolution_min_investment,
    evolution_earnings_ratio, passive_income_rate, custodial_income_rate, is_active
) VALUES 
-- Pearl White (Custodial) - Free
(
    'Classic',
    'Pearl White',
    'Pearl White',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400',
    0.00, 0.00, 'Common', 10000, true, true, true, true, 'Forever',
    0.0100, 0.0000, 100.00, 0.0025, 0.0100, 0.0000, true
),

-- Lava Orange (Custodial)
(
    'Classic',
    'Lava Orange',
    'Lava Orange',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    100.00, 100.00, 'Less Common', 3000, true, true, true, true, 'Forever',
    0.0110, 0.0010, 500.00, 0.0050, 0.0110, 0.0000, true
),

-- Pink (Custodial)
(
    'Classic',
    'Pink',
    'Pink',
    'https://images.unsplash.com/photo-1580894736036-1d3b4b9d3ad4?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    100.00, 100.00, 'Less Common', 3000, true, true, true, true, 'Forever',
    0.0110, 0.0010, 500.00, 0.0050, 0.0110, 0.0000, true
),

-- Silver (Custodial)
(
    'Premium',
    'Silver',
    'Silver',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    200.00, 200.00, 'Rare', 750, true, true, true, true, 'Forever',
    0.0120, 0.0015, 1000.00, 0.0075, 0.0120, 0.0000, true
),

-- Gold (Custodial)
(
    'Premium',
    'Gold',
    'Gold',
    'https://images.unsplash.com/photo-1544441893-675973e31985?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    300.00, 300.00, 'Rare', 750, true, true, true, true, 'Forever',
    0.0130, 0.0020, 1500.00, 0.0100, 0.0130, 0.0000, true
),

-- Black (Custodial)
(
    'Elite',
    'Black',
    'Black',
    'https://images.unsplash.com/photo-1555274175-6cbf6f3b137b?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    500.00, 500.00, 'Very Rare', 250, true, true, true, true, 'Forever',
    0.0140, 0.0030, 2500.00, 0.0125, 0.0140, 0.0000, true
),

-- Non-Custodial NFT Types (For users with external wallets)
-- Pearl White (Non-Custodial)
(
    'Classic',
    'Pearl White (Non-Custodial)',
    'Pearl White (Non-Custodial)',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400',
    100.00, 100.00, 'Common', 10000, false, true, true, false, 'Forever',
    0.0100, 0.0000, 500.00, 0.0050, 0.0100, 0.0000, true
),

-- Lava Orange (Non-Custodial)
(
    'Classic',
    'Lava Orange (Non-Custodial)',
    'Lava Orange (Non-Custodial)',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    500.00, 500.00, 'Less Common', 3000, false, true, true, false, 'Forever',
    0.0110, 0.0000, 2500.00, 0.0125, 0.0110, 0.0000, true
),

-- Pink (Non-Custodial)
(
    'Classic',
    'Pink (Non-Custodial)',
    'Pink (Non-Custodial)',
    'https://images.unsplash.com/photo-1580894736036-1d3b4b9d3ad4?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    500.00, 500.00, 'Less Common', 3000, false, true, true, false, 'Forever',
    0.0110, 0.0000, 2500.00, 0.0125, 0.0110, 0.0000, true
),

-- Silver (Non-Custodial)
(
    'Premium',
    'Silver (Non-Custodial)',
    'Silver (Non-Custodial)',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    1000.00, 1000.00, 'Rare', 750, false, true, true, false, 'Forever',
    0.0120, 0.0000, 5000.00, 0.0015, 0.0120, 0.0000, true
),

-- Gold (Non-Custodial)
(
    'Premium',
    'Gold (Non-Custodial)',
    'Gold (Non-Custodial)',
    'https://images.unsplash.com/photo-1544441893-675973e31985?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    1000.00, 1000.00, 'Rare', 750, false, true, true, false, 'Forever',
    0.0130, 0.0000, 5000.00, 0.0020, 0.0130, 0.0000, true
),

-- Black (Non-Custodial)
(
    'Elite',
    'Black (Non-Custodial)',
    'Black (Non-Custodial)',
    'https://images.unsplash.com/photo-1555274175-6cbf6f3b137b?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    2500.00, 2500.00, 'Very Rare', 250, false, true, true, false, 'Forever',
    0.0140, 0.0000, 13500.00, 0.0030, 0.0140, 0.0000, true
);

-- Step 4: Create Indexes for Performance
-- =====================================================

-- Create indexes on merchant_subscription_plans
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_plan_number ON public.merchant_subscription_plans(plan_number);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_is_active ON public.merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_is_popular ON public.merchant_subscription_plans(is_popular);

-- Create indexes on nft_types
CREATE INDEX IF NOT EXISTS idx_nft_types_collection ON public.nft_types(collection);
CREATE INDEX IF NOT EXISTS idx_nft_types_rarity ON public.nft_types(rarity);
CREATE INDEX IF NOT EXISTS idx_nft_types_is_custodial ON public.nft_types(is_custodial);
CREATE INDEX IF NOT EXISTS idx_nft_types_is_active ON public.nft_types(is_active);
CREATE INDEX IF NOT EXISTS idx_nft_types_is_upgradeable ON public.nft_types(is_upgradeable);
CREATE INDEX IF NOT EXISTS idx_nft_types_is_evolvable ON public.nft_types(is_evolvable);

-- Step 5: Verification Queries
-- =====================================================

-- Verify merchant subscription plans
SELECT 
    'Merchant Subscription Plans' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
    COUNT(CASE WHEN is_popular = true THEN 1 END) as popular_plans
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
    plan_number,
    plan_name,
    monthly_price,
    yearly_price,
    monthly_points,
    monthly_transactions,
    trial_days,
    is_popular,
    is_active
FROM public.merchant_subscription_plans
ORDER BY plan_number;

-- Show all NFT types by collection and custodial status
SELECT 
    collection,
    nft_name,
    rarity,
    buy_price_usdt,
    mint_quantity,
    is_custodial,
    is_upgradeable,
    is_evolvable,
    earn_on_spend_ratio,
    evolution_min_investment
FROM public.nft_types
ORDER BY collection, is_custodial DESC, buy_price_usdt;

-- =====================================================
-- Script completed successfully!
-- =====================================================
