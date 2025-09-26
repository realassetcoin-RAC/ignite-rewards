-- =====================================================
-- RAC Rewards - Flexible Supabase Database Update Script
-- This script will work with any existing table structure
-- =====================================================

-- Step 1: Check if tables exist and create if needed
-- =====================================================

-- Create merchant_subscription_plans table with all possible columns
CREATE TABLE IF NOT EXISTS public.merchant_subscription_plans (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(100),
    name VARCHAR(100),
    description TEXT,
    price_monthly DECIMAL(10,2),
    monthly_price DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    yearly_price DECIMAL(10,2),
    monthly_points INTEGER,
    monthly_transactions INTEGER,
    features JSONB DEFAULT '[]',
    trial_days INTEGER DEFAULT 14,
    is_active BOOLEAN DEFAULT TRUE,
    popular BOOLEAN DEFAULT FALSE,
    is_popular BOOLEAN DEFAULT FALSE,
    plan_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nft_types table
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

-- Step 2: Clear existing data
-- =====================================================

-- Delete existing merchant subscription plans
DELETE FROM public.merchant_subscription_plans WHERE true;

-- Delete existing NFT types
DELETE FROM public.nft_types WHERE true;

-- Step 3: Insert Merchant Subscription Plans (Flexible approach)
-- =====================================================

-- Insert all 5 merchant subscription plans with multiple column name options
INSERT INTO public.merchant_subscription_plans (
    plan_name, name, description, price_monthly, monthly_price, 
    price_yearly, yearly_price, monthly_points, monthly_transactions, 
    features, trial_days, is_active, popular, is_popular, plan_number
) VALUES 
-- 1. StartUp Plan - $20/month ($150/year)
(
    'StartUp Plan', 'StartUp Plan', 'Perfect for small businesses and startups looking to build customer loyalty with basic features and essential tools.',
    20.00, 20.00, 150.00, 150.00, 100, 100,
    '["Basic loyalty program setup", "Customer management", "Email support", "Basic analytics", "QR code generation", "Up to 100 monthly points", "Up to 100 monthly transactions"]'::jsonb,
    14, true, false, false, 1
),

-- 2. Momentum Plan - $50/month ($500/year) - Popular
(
    'Momentum Plan', 'Momentum Plan', 'Ideal for growing businesses that need advanced features, customer segmentation, and higher transaction limits.',
    50.00, 50.00, 500.00, 500.00, 300, 300,
    '["Advanced loyalty program features", "Customer segmentation", "Priority support", "Custom branding", "API access", "Advanced analytics", "Up to 300 monthly points", "Up to 300 monthly transactions"]'::jsonb,
    14, true, true, true, 2
),

-- 3. Energizer Plan - $100/month ($1000/year)
(
    'Energizer Plan', 'Energizer Plan', 'Premium solution for established businesses requiring dedicated support, real-time analytics, and custom integrations.',
    100.00, 100.00, 1000.00, 1000.00, 600, 600,
    '["Premium loyalty features", "Dedicated account manager", "Real-time analytics", "Custom integrations", "Advanced customer segmentation", "Priority support", "Up to 600 monthly points", "Up to 600 monthly transactions"]'::jsonb,
    21, true, false, false, 3
),

-- 4. Cloud Plan - $250/month ($2500/year)
(
    'Cloud Plan', 'Cloud Plan', 'Enterprise-grade solution with unlimited staff accounts, multi-location support, and 24/7 support.',
    250.00, 250.00, 2500.00, 2500.00, 1800, 1800,
    '["Enterprise features", "Unlimited staff accounts", "Multi-location support", "24/7 support", "Advanced integrations", "Custom reporting", "Up to 1800 monthly points", "Up to 1800 monthly transactions"]'::jsonb,
    30, true, false, false, 4
),

-- 5. Super Plan - $500/month ($5000/year)
(
    'Super Plan', 'Super Plan', 'Ultimate solution with white-label options, priority feature requests, and custom onboarding for large enterprises.',
    500.00, 500.00, 5000.00, 5000.00, 4000, 4000,
    '["Ultimate features", "White-label solutions", "Priority feature requests", "Custom onboarding", "Dedicated support team", "Advanced customization", "Up to 4000 monthly points", "Up to 4000 monthly transactions"]'::jsonb,
    30, true, false, false, 5
);

-- Step 4: Insert NFT Types
-- =====================================================

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
    'Classic', 'Pearl White', 'Pearl White',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400',
    0.00, 0.00, 'Common', 10000, true, true, true, true, 'Forever',
    0.0100, 0.0000, 100.00, 0.0025, 0.0100, 0.0000, true
),

-- Lava Orange (Custodial)
(
    'Classic', 'Lava Orange', 'Lava Orange',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    100.00, 100.00, 'Less Common', 3000, true, true, true, true, 'Forever',
    0.0110, 0.0010, 500.00, 0.0050, 0.0110, 0.0000, true
),

-- Pink (Custodial)
(
    'Classic', 'Pink', 'Pink',
    'https://images.unsplash.com/photo-1580894736036-1d3b4b9d3ad4?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    100.00, 100.00, 'Less Common', 3000, true, true, true, true, 'Forever',
    0.0110, 0.0010, 500.00, 0.0050, 0.0110, 0.0000, true
),

-- Silver (Custodial)
(
    'Premium', 'Silver', 'Silver',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    200.00, 200.00, 'Rare', 750, true, true, true, true, 'Forever',
    0.0120, 0.0015, 1000.00, 0.0075, 0.0120, 0.0000, true
),

-- Gold (Custodial)
(
    'Premium', 'Gold', 'Gold',
    'https://images.unsplash.com/photo-1544441893-675973e31985?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    300.00, 300.00, 'Rare', 750, true, true, true, true, 'Forever',
    0.0130, 0.0020, 1500.00, 0.0100, 0.0130, 0.0000, true
),

-- Black (Custodial)
(
    'Elite', 'Black', 'Black',
    'https://images.unsplash.com/photo-1555274175-6cbf6f3b137b?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    500.00, 500.00, 'Very Rare', 250, true, true, true, true, 'Forever',
    0.0140, 0.0030, 2500.00, 0.0125, 0.0140, 0.0000, true
),

-- Non-Custodial NFT Types (For users with external wallets)
-- Pearl White (Non-Custodial)
(
    'Classic', 'Pearl White (Non-Custodial)', 'Pearl White (Non-Custodial)',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400',
    100.00, 100.00, 'Common', 10000, false, true, true, false, 'Forever',
    0.0100, 0.0000, 500.00, 0.0050, 0.0100, 0.0000, true
),

-- Lava Orange (Non-Custodial)
(
    'Classic', 'Lava Orange (Non-Custodial)', 'Lava Orange (Non-Custodial)',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    500.00, 500.00, 'Less Common', 3000, false, true, true, false, 'Forever',
    0.0110, 0.0000, 2500.00, 0.0125, 0.0110, 0.0000, true
),

-- Pink (Non-Custodial)
(
    'Classic', 'Pink (Non-Custodial)', 'Pink (Non-Custodial)',
    'https://images.unsplash.com/photo-1580894736036-1d3b4b9d3ad4?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    500.00, 500.00, 'Less Common', 3000, false, true, true, false, 'Forever',
    0.0110, 0.0000, 2500.00, 0.0125, 0.0110, 0.0000, true
),

-- Silver (Non-Custodial)
(
    'Premium', 'Silver (Non-Custodial)', 'Silver (Non-Custodial)',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    1000.00, 1000.00, 'Rare', 750, false, true, true, false, 'Forever',
    0.0120, 0.0000, 5000.00, 0.0015, 0.0120, 0.0000, true
),

-- Gold (Non-Custodial)
(
    'Premium', 'Gold (Non-Custodial)', 'Gold (Non-Custodial)',
    'https://images.unsplash.com/photo-1544441893-675973e31985?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    1000.00, 1000.00, 'Rare', 750, false, true, true, false, 'Forever',
    0.0130, 0.0000, 5000.00, 0.0020, 0.0130, 0.0000, true
),

-- Black (Non-Custodial)
(
    'Elite', 'Black (Non-Custodial)', 'Black (Non-Custodial)',
    'https://images.unsplash.com/photo-1555274175-6cbf6f3b137b?w=400',
    'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
    2500.00, 2500.00, 'Very Rare', 250, false, true, true, false, 'Forever',
    0.0140, 0.0000, 13500.00, 0.0030, 0.0140, 0.0000, true
);

-- Step 5: Verification Queries
-- =====================================================

-- Verify merchant subscription plans
SELECT 
    'Merchant Subscription Plans' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
    COUNT(CASE WHEN popular = true OR is_popular = true THEN 1 END) as popular_plans
FROM public.merchant_subscription_plans;

-- Verify NFT types
SELECT 
    'NFT Types' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_custodial = true THEN 1 END) as custodial_nfts,
    COUNT(CASE WHEN is_custodial = false THEN 1 END) as non_custodial_nfts,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_nfts
FROM public.nft_types;

-- Show all merchant subscription plans (flexible column names)
SELECT 
    COALESCE(plan_number, id) as plan_id,
    COALESCE(name, plan_name) as plan_name,
    COALESCE(price_monthly, monthly_price) as monthly_price,
    COALESCE(price_yearly, yearly_price) as yearly_price,
    monthly_points,
    monthly_transactions,
    trial_days,
    COALESCE(popular, is_popular) as is_popular,
    is_active
FROM public.merchant_subscription_plans
ORDER BY COALESCE(plan_number, id);

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
