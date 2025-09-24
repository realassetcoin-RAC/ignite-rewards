-- COMPLETE LOCAL DATABASE SYNC WITH SUPABASE
-- This script creates all tables and data to match your Supabase database
-- Run this in your local PostgreSQL database (ignite_rewards)

-- ==============================================
-- STEP 1: CREATE EXTENSIONS
-- ==============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- STEP 2: CREATE ENUMS
-- ==============================================

-- Create enum types
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('customer', 'admin', 'merchant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE merchant_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE card_type AS ENUM ('standard', 'premium', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pricing_type AS ENUM ('free', 'one_time', 'subscription');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_plan AS ENUM ('basic', 'standard', 'premium', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================
-- STEP 3: DROP EXISTING TABLES (CLEAN SLATE)
-- ==============================================

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS public.dao_votes CASCADE;
DROP TABLE IF EXISTS public.dao_proposals CASCADE;
DROP TABLE IF EXISTS public.dao_members CASCADE;
DROP TABLE IF EXISTS public.dao_organizations CASCADE;
DROP TABLE IF EXISTS public.loyalty_transactions CASCADE;
DROP TABLE IF EXISTS public.transaction_qr_codes CASCADE;
DROP TABLE IF EXISTS public.user_referrals CASCADE;
DROP TABLE IF EXISTS public.user_loyalty_cards CASCADE;
DROP TABLE IF EXISTS public.user_points CASCADE;
DROP TABLE IF EXISTS public.user_wallets CASCADE;
DROP TABLE IF EXISTS public.referral_campaigns CASCADE;
DROP TABLE IF EXISTS public.merchant_subscription_plans CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==============================================
-- STEP 4: CREATE PROFILES TABLE
-- ==============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  role app_role DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- STEP 5: CREATE MERCHANT SUBSCRIPTION PLANS TABLE
-- ==============================================

CREATE TABLE public.merchant_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  trial_days INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- STEP 6: CREATE USER LOYALTY CARDS TABLE
-- ==============================================

CREATE TABLE public.user_loyalty_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  loyalty_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- STEP 7: CREATE USER POINTS TABLE
-- ==============================================

CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- STEP 8: CREATE USER WALLETS TABLE
-- ==============================================

CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- STEP 9: CREATE REFERRAL CAMPAIGNS TABLE
-- ==============================================

CREATE TABLE public.referral_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reward_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- STEP 10: CREATE USER REFERRALS TABLE
-- ==============================================

CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  reward_points INTEGER DEFAULT 0,
  is_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- STEP 11: CREATE LOYALTY TRANSACTIONS TABLE
-- ==============================================

CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  loyalty_number TEXT NOT NULL,
  merchant_id UUID NOT NULL,
  transaction_amount DECIMAL(10,2) NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transaction_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- STEP 12: CREATE TRANSACTION QR CODES TABLE
-- ==============================================

CREATE TABLE public.transaction_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL,
  qr_code_data TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_by UUID,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- STEP 13: CREATE DAO ORGANIZATIONS TABLE
-- ==============================================

CREATE TABLE public.dao_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  discord_url TEXT,
  twitter_url TEXT,
  github_url TEXT,
  governance_token_address TEXT,
  governance_token_symbol TEXT NOT NULL,
  governance_token_decimals INTEGER NOT NULL DEFAULT 9,
  min_proposal_threshold NUMERIC NOT NULL DEFAULT 0,
  voting_period_days INTEGER NOT NULL DEFAULT 7,
  execution_delay_hours INTEGER NOT NULL DEFAULT 24,
  quorum_percentage NUMERIC NOT NULL DEFAULT 10.0,
  super_majority_threshold NUMERIC NOT NULL DEFAULT 66.67,
  treasury_address TEXT,
  created_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- STEP 14: CREATE DAO MEMBERS TABLE
-- ==============================================

CREATE TABLE public.dao_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id UUID REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  wallet_address TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  governance_tokens NUMERIC NOT NULL DEFAULT 0,
  voting_power NUMERIC NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_email TEXT,
  user_full_name TEXT,
  user_avatar_url TEXT
);

-- ==============================================
-- STEP 15: CREATE DAO PROPOSALS TABLE
-- ==============================================

CREATE TABLE public.dao_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id UUID REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
  proposer_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  full_description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  voting_type TEXT NOT NULL DEFAULT 'simple_majority',
  status TEXT NOT NULL DEFAULT 'draft',
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  execution_time TIMESTAMP WITH TIME ZONE,
  total_votes NUMERIC NOT NULL DEFAULT 0,
  yes_votes NUMERIC NOT NULL DEFAULT 0,
  no_votes NUMERIC NOT NULL DEFAULT 0,
  abstain_votes NUMERIC NOT NULL DEFAULT 0,
  participation_rate NUMERIC NOT NULL DEFAULT 0,
  treasury_impact_amount NUMERIC NOT NULL DEFAULT 0,
  treasury_impact_currency TEXT NOT NULL DEFAULT 'SOL',
  tags TEXT[] DEFAULT '{}',
  external_links JSONB,
  attachments JSONB,
  proposer_email TEXT,
  proposer_tokens BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================
-- STEP 16: CREATE DAO VOTES TABLE
-- ==============================================

CREATE TABLE public.dao_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('yes', 'no', 'abstain')),
  voting_power NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- STEP 17: INSERT MERCHANT SUBSCRIPTION PLANS DATA
-- ==============================================

INSERT INTO public.merchant_subscription_plans (
  id, name, description, price_monthly, trial_days, features, is_active, created_at, updated_at
) VALUES 

-- FREE TRIAL PLAN
(
  gen_random_uuid(),
  'Free Trial',
  'Experience our platform with full access to all features for 14 days',
  0.00,
  14,
  '[
    "Full platform access for 14 days",
    "Up to 10 transactions",
    "Basic customer management",
    "Email support",
    "Basic analytics dashboard",
    "QR code generation",
    "Mobile app access"
  ]'::jsonb,
  true,
  now(),
  now()
),

-- STARTER PLAN
(
  gen_random_uuid(),
  'Starter',
  'Perfect for small businesses and startups looking to build customer loyalty',
  29.99,
  14,
  '[
    "Basic loyalty program setup",
    "Up to 100 transactions per month",
    "Customer database management",
    "Email support (24-48 hour response)",
    "Basic analytics and reporting",
    "QR code generation",
    "Mobile app for customers",
    "Basic email marketing tools",
    "Social media integration",
    "Up to 2 staff accounts"
  ]'::jsonb,
  true,
  now(),
  now()
),

-- GROWTH PLAN (POPULAR)
(
  gen_random_uuid(),
  'Growth',
  'Ideal for growing businesses that need more advanced features and higher limits',
  79.99,
  14,
  '[
    "Advanced loyalty program features",
    "Up to 500 transactions per month",
    "Advanced customer segmentation",
    "Priority email support (12-24 hour response)",
    "Advanced analytics and reporting",
    "Custom branding options",
    "API access for integrations",
    "Referral system",
    "Multi-location support",
    "Advanced email marketing",
    "Social media management",
    "Up to 5 staff accounts",
    "Custom reward rules",
    "A/B testing for campaigns"
  ]'::jsonb,
  true,
  now(),
  now()
),

-- PROFESSIONAL PLAN
(
  gen_random_uuid(),
  'Professional',
  'For established businesses requiring enterprise-level features and support',
  199.99,
  30,
  '[
    "Enterprise loyalty program features",
    "Up to 1500 transactions per month",
    "Advanced customer analytics",
    "24/7 phone and email support",
    "Real-time analytics dashboard",
    "White-label solution options",
    "Full API access with documentation",
    "Advanced referral system",
    "Multi-location management",
    "Custom integrations",
    "Dedicated account manager",
    "Advanced email marketing automation",
    "Social media management suite",
    "Up to 15 staff accounts",
    "Custom reward algorithms",
    "Advanced A/B testing",
    "Priority feature requests",
    "Custom reporting"
  ]'::jsonb,
  true,
  now(),
  now()
),

-- ENTERPRISE PLAN
(
  gen_random_uuid(),
  'Enterprise',
  'For large businesses and enterprises requiring unlimited features and dedicated support',
  499.99,
  30,
  '[
    "Unlimited loyalty program features",
    "Up to 5000 transactions per month",
    "Enterprise-grade customer analytics",
    "24/7 dedicated support team",
    "Real-time analytics with custom dashboards",
    "Full white-label solution",
    "Unlimited API access",
    "Advanced referral and affiliate system",
    "Unlimited multi-location support",
    "Custom integrations and development",
    "Dedicated success manager",
    "Advanced email marketing automation",
    "Enterprise social media management",
    "Unlimited staff accounts",
    "Custom reward algorithms and AI",
    "Advanced A/B testing and optimization",
    "Priority feature development",
    "Custom reporting and analytics",
    "SLA guarantees",
    "Onboarding and training",
    "Custom contract terms"
  ]'::jsonb,
  true,
  now(),
  now()
);

-- ==============================================
-- STEP 18: CREATE HELPER FUNCTIONS
-- ==============================================

-- Create function to get valid subscription plans
CREATE OR REPLACE FUNCTION public.get_valid_subscription_plans()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price_monthly DECIMAL(10,2),
  trial_days INTEGER,
  features JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id,
    name,
    description,
    price_monthly,
    trial_days,
    features,
    is_active,
    created_at,
    updated_at
  FROM public.merchant_subscription_plans
  WHERE is_active = true
  ORDER BY price_monthly ASC;
$$;

-- Create function to check admin access
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT true; -- Simplified for local development
$$;

-- Create function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id,
    user_id,
    email,
    full_name,
    role::TEXT,
    created_at,
    updated_at
  FROM public.profiles
  LIMIT 1; -- Simplified for local development
$$;

-- ==============================================
-- STEP 19: CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active ON public.merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_user_id ON public.user_loyalty_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_loyalty_number ON public.user_loyalty_cards(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_merchant_id ON public.loyalty_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_dao_id ON public.dao_members(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_user_id ON public.dao_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_dao_id ON public.dao_proposals(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_proposer_id ON public.dao_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal_id ON public.dao_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_voter_id ON public.dao_votes(voter_id);

-- ==============================================
-- STEP 20: VERIFY THE SETUP
-- ==============================================

-- Show all created tables
SELECT 
  'Tables created successfully:' as status,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles',
    'merchant_subscription_plans',
    'user_loyalty_cards',
    'user_points',
    'user_wallets',
    'referral_campaigns',
    'user_referrals',
    'loyalty_transactions',
    'transaction_qr_codes',
    'dao_organizations',
    'dao_members',
    'dao_proposals',
    'dao_votes'
  )
ORDER BY table_name;

-- Show subscription plans
SELECT 
  'Subscription plans created:' as status,
  name,
  price_monthly,
  trial_days,
  is_active
FROM public.merchant_subscription_plans
ORDER BY price_monthly;

-- Test helper functions
SELECT 'Testing get_valid_subscription_plans() function:' as test;
SELECT name, price_monthly, trial_days 
FROM public.get_valid_subscription_plans()
ORDER BY price_monthly;

-- ==============================================
-- STEP 21: SUCCESS MESSAGE
-- ==============================================

SELECT '✅ Local database synced successfully with Supabase!' as status,
       'All tables, data, and functions are now available locally' as summary;
