-- Complete Local PostgreSQL Setup Script for Ignite Rewards
-- Run this after creating the ignite_rewards database

-- Connect to the ignite_rewards database first
\c ignite_rewards;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- 1. CREATE AUTH SCHEMA
-- ===========================================

CREATE SCHEMA IF NOT EXISTS auth;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.merchants CASCADE;
DROP TABLE IF EXISTS public.merchant_subscription_plans CASCADE;
DROP TABLE IF EXISTS public.virtual_cards CASCADE;
DROP TABLE IF EXISTS public.user_referrals CASCADE;
DROP TABLE IF EXISTS public.referral_campaigns CASCADE;
DROP TABLE IF EXISTS public.dao_organizations CASCADE;
DROP TABLE IF EXISTS public.dao_members CASCADE;
DROP TABLE IF EXISTS public.dao_proposals CASCADE;
DROP TABLE IF EXISTS public.dao_votes CASCADE;
DROP TABLE IF EXISTS public.marketplace_listings CASCADE;
DROP TABLE IF EXISTS auth.users CASCADE;

-- Create auth.users table
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_app_meta_data JSONB DEFAULT '{}',
    raw_user_meta_data JSONB DEFAULT '{}',
    is_super_admin BOOLEAN DEFAULT FALSE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    role TEXT DEFAULT 'user',
    aud TEXT DEFAULT 'authenticated'
);

-- Create auth helper functions
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT '00000000-0000-0000-0000-000000000001'::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT 'admin';
$$;

-- ===========================================
-- 2. CREATE CUSTOM TYPES
-- ===========================================

DROP TYPE IF EXISTS subscription_plan CASCADE;
CREATE TYPE subscription_plan AS ENUM ('basic', 'premium', 'enterprise');

DROP TYPE IF EXISTS merchant_status CASCADE;
CREATE TYPE merchant_status AS ENUM ('pending', 'active', 'suspended', 'inactive');

DROP TYPE IF EXISTS app_role CASCADE;
CREATE TYPE app_role AS ENUM ('user', 'merchant', 'admin');

-- ===========================================
-- 3. CREATE PUBLIC SCHEMA TABLES
-- ===========================================

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create merchants table
CREATE TABLE public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT,
    contact_email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'US',
    website TEXT,
    description TEXT,
    logo_url TEXT,
    subscription_plan subscription_plan DEFAULT 'basic',
    status merchant_status DEFAULT 'pending',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    monthly_fee NUMERIC,
    annual_fee NUMERIC,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create merchant_subscription_plans table
CREATE TABLE public.merchant_subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    monthly_points INTEGER,
    monthly_transactions INTEGER,
    features JSONB,
    trial_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    popular BOOLEAN DEFAULT false,
    plan_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create virtual_cards table
CREATE TABLE public.virtual_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    card_number TEXT UNIQUE NOT NULL,
    card_holder_name TEXT NOT NULL,
    expiry_month INTEGER NOT NULL,
    expiry_year INTEGER NOT NULL,
    cvv TEXT NOT NULL,
    card_type TEXT DEFAULT 'loyalty',
    is_active BOOLEAN DEFAULT TRUE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_referrals table
CREATE TABLE public.user_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    reward_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_campaigns table
CREATE TABLE public.referral_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name TEXT NOT NULL,
    description TEXT,
    reward_amount DECIMAL(10,2) NOT NULL,
    max_referrals INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create DAO tables
CREATE TABLE public.dao_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    token_symbol TEXT,
    total_supply BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.dao_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    dao_id UUID REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
    tokens_held BIGINT DEFAULT 0,
    voting_power DECIMAL(5,2) DEFAULT 0.00,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    user_avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.dao_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
    proposer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposal_type TEXT DEFAULT 'general',
    voting_starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    voting_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    status TEXT DEFAULT 'active',
    votes_for BIGINT DEFAULT 0,
    votes_against BIGINT DEFAULT 0,
    total_votes BIGINT DEFAULT 0,
    quorum_required DECIMAL(5,2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.dao_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_choice TEXT NOT NULL CHECK (vote_choice IN ('for', 'against', 'abstain')),
    voting_power DECIMAL(10,2) DEFAULT 0.00,
    tokens_used BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proposal_id, voter_id)
);

-- Create marketplace tables
CREATE TABLE public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    category TEXT,
    condition TEXT DEFAULT 'new',
    is_active BOOLEAN DEFAULT TRUE,
    images JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 4. CREATE FUNCTIONS
-- ===========================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name app_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN true; -- For local development, always return true
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for subscription plans
CREATE OR REPLACE FUNCTION get_valid_subscription_plans()
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    monthly_points INTEGER,
    monthly_transactions INTEGER,
    features JSONB,
    trial_days INTEGER,
    is_active BOOLEAN,
    popular BOOLEAN,
    plan_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        msp.id,
        msp.name,
        msp.description,
        msp.price_monthly,
        msp.price_yearly,
        msp.monthly_points,
        msp.monthly_transactions,
        msp.features,
        msp.trial_days,
        msp.is_active,
        msp.popular,
        msp.plan_number,
        msp.created_at,
        msp.updated_at
    FROM merchant_subscription_plans msp
    WHERE msp.is_active = true
    ORDER BY msp.plan_number ASC;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 5. INSERT SAMPLE DATA
-- ===========================================

-- Insert admin user
INSERT INTO auth.users (id, email, role, is_super_admin, email_confirmed_at) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@igniterewards.com', 'admin', true, NOW());

INSERT INTO public.profiles (id, email, full_name, role) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@igniterewards.com', 'System Administrator', 'admin');

-- Insert subscription plans
INSERT INTO public.merchant_subscription_plans (
    id, name, description, price_monthly, price_yearly, 
    monthly_points, monthly_transactions, features, 
    trial_days, is_active, popular, plan_number
) VALUES 
(
    'basic', 
    'StartUp', 
    'Perfect for small businesses just getting started with loyalty programs',
    20.00, 
    150.00, 
    100, 
    100, 
    '["Basic loyalty program setup", "Up to 100 monthly points", "100 transactions per month", "Email support", "Basic analytics"]'::jsonb,
    7, 
    true, 
    false, 
    1
),
(
    'premium', 
    'Momentum Plan', 
    'Ideal for growing businesses that need more advanced features',
    50.00, 
    500.00, 
    300, 
    300, 
    '["Advanced loyalty program", "Up to 300 monthly points", "300 transactions per month", "Priority support", "Advanced analytics"]'::jsonb,
    14, 
    true, 
    true, 
    2
),
(
    'enterprise', 
    'Energizer Plan', 
    'For established businesses requiring enterprise-level features',
    100.00, 
    1000.00, 
    600, 
    600, 
    '["Premium loyalty program", "Up to 600 monthly points", "600 transactions per month", "24/7 support", "Real-time analytics"]'::jsonb,
    21, 
    true, 
    false, 
    3
);

-- Insert sample DAO organization
INSERT INTO public.dao_organizations (id, name, description, token_symbol, total_supply) VALUES
('22222222-2222-2222-2222-222222222222', 'Ignite Rewards DAO', 'Decentralized governance for the Ignite Rewards platform', 'IGNITE', 1000000);

-- Insert DAO member for admin
INSERT INTO public.dao_members (id, user_id, dao_id, tokens_held, voting_power) VALUES
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 10000, 1.00);

-- Insert sample referral campaign
INSERT INTO public.referral_campaigns (id, campaign_name, description, reward_amount, max_referrals) VALUES
('44444444-4444-4444-4444-444444444444', 'Launch Campaign', 'Get $10 for each friend you refer!', 10.00, 100);

-- ===========================================
-- 6. SUCCESS MESSAGE
-- ===========================================

SELECT 'Complete local PostgreSQL database setup completed successfully!' as status;
SELECT 'Database: ignite_rewards' as database_name;
SELECT 'Admin user: admin@igniterewards.com' as admin_email;
SELECT 'Total tables created: ' || COUNT(*) as tables_count FROM information_schema.tables WHERE table_schema = 'public';
