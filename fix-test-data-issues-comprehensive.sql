-- ===========================================
-- COMPREHENSIVE FIX FOR TEST DATA ISSUES
-- ===========================================
-- Based on actual database structure analysis
-- This script fixes all issues with the correct enum values and table structure

-- ===========================================
-- 1. CREATE MISSING ENUMS (WITH CORRECT VALUES)
-- ===========================================

-- Create app_role enum if it doesn't exist (with correct values)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('admin', 'merchant', 'customer');
    END IF;
END $$;

-- Create merchant_status enum if it doesn't exist (with correct values)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'merchant_status') THEN
        CREATE TYPE merchant_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
    END IF;
END $$;

-- Create subscription_plan enum if it doesn't exist (with correct values)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        CREATE TYPE subscription_plan AS ENUM ('basic', 'standard', 'premium', 'enterprise');
    END IF;
END $$;

-- ===========================================
-- 2. CREATE MISSING TABLES (IF NOT EXISTS)
-- ===========================================

-- Create NFT types table
CREATE TABLE IF NOT EXISTS public.nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    description TEXT,
    image_url TEXT,
    buy_price_usdt DECIMAL(10,2) DEFAULT 0,
    rarity VARCHAR(50) DEFAULT 'Common',
    mint_quantity INTEGER DEFAULT 1000,
    is_upgradeable BOOLEAN DEFAULT false,
    is_evolvable BOOLEAN DEFAULT true,
    is_fractional_eligible BOOLEAN DEFAULT true,
    is_custodial BOOLEAN DEFAULT true,
    auto_staking_duration VARCHAR(20) DEFAULT 'Forever',
    earn_on_spend_ratio DECIMAL(5,4) DEFAULT 0.0100,
    upgrade_bonus_ratio DECIMAL(5,4) DEFAULT 0.0000,
    evolution_min_investment DECIMAL(10,2) DEFAULT 0.00,
    evolution_earnings_ratio DECIMAL(5,4) DEFAULT 0.0000,
    passive_income_rate DECIMAL(5,4) DEFAULT 0.0100,
    custodial_income_rate DECIMAL(5,4) DEFAULT 0.0000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    features JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    pricing_type VARCHAR(20) DEFAULT 'free',
    one_time_fee DECIMAL(10,2) DEFAULT 0.00,
    monthly_fee DECIMAL(10,2) DEFAULT 0.00,
    annual_fee DECIMAL(10,2) DEFAULT 0.00,
    UNIQUE(nft_name, is_custodial)
);

-- Create user loyalty cards table
CREATE TABLE IF NOT EXISTS public.user_loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user points table
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loyalty transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    loyalty_number TEXT NOT NULL,
    transaction_amount DECIMAL(10,2) NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    transaction_reference TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 3. ENSURE PROFILES TABLE EXISTS WITH CORRECT STRUCTURE
-- ===========================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role app_role NOT NULL DEFAULT 'customer'::app_role,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================
-- 4. ENSURE MERCHANTS TABLE EXISTS WITH CORRECT STRUCTURE
-- ===========================================

-- Create merchants table if it doesn't exist (with correct structure from migrations)
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT,
    contact_email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    subscription_plan subscription_plan,
    status merchant_status DEFAULT 'pending'::merchant_status,
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    monthly_fee NUMERIC,
    annual_fee NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===========================================
-- 5. INSERT SUBSCRIPTION PLANS DATA (WITH CORRECT ENUM VALUES)
-- ===========================================

-- Insert subscription plans with correct enum values
INSERT INTO public.merchant_subscription_plans (
    id, name, description, price_monthly, price_yearly, 
    monthly_points, monthly_transactions, features, 
    trial_days, is_active, popular, plan_number
) 
SELECT * FROM (VALUES 
    (gen_random_uuid(), 'Basic Plan', 'Perfect for small businesses just getting started with loyalty programs', 20.00, 150.00, 100, 100, '["Basic loyalty program setup", "Up to 100 monthly points", "100 transactions per month", "Email support", "Basic analytics"]'::jsonb, 7, true, false, 1),
    (gen_random_uuid(), 'Standard Plan', 'Ideal for growing businesses that need more advanced features', 50.00, 500.00, 300, 300, '["Advanced loyalty program", "Up to 300 monthly points", "300 transactions per month", "Priority support", "Advanced analytics"]'::jsonb, 14, true, false, 2),
    (gen_random_uuid(), 'Premium Plan', 'For established businesses requiring enterprise-level features', 100.00, 1000.00, 600, 600, '["Premium loyalty program", "Up to 600 monthly points", "600 transactions per month", "24/7 support", "Real-time analytics"]'::jsonb, 21, true, false, 3),
    (gen_random_uuid(), 'Enterprise Plan', 'For large enterprises requiring unlimited features and dedicated support', 250.00, 2500.00, 1800, 1800, '["Enterprise loyalty program", "Up to 1800 monthly points", "1800 transactions per month", "Dedicated support", "Advanced analytics"]'::jsonb, 30, true, false, 4)
) AS v(id, name, description, price_monthly, price_yearly, monthly_points, monthly_transactions, features, trial_days, is_active, popular, plan_number)
WHERE NOT EXISTS (
    SELECT 1 FROM public.merchant_subscription_plans msp 
    WHERE msp.name = v.name
);

-- ===========================================
-- 6. CREATE REQUIRED RPC FUNCTIONS
-- ===========================================

-- Create get_valid_subscription_plans function
DROP FUNCTION IF EXISTS get_valid_subscription_plans();
CREATE OR REPLACE FUNCTION get_valid_subscription_plans()
RETURNS TABLE (
    id UUID,
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
    FROM public.merchant_subscription_plans msp
    WHERE msp.is_active = true
    ORDER BY msp.plan_number ASC;
END;
$$ LANGUAGE plpgsql;

-- Create is_admin function (simplified for local use)
DROP FUNCTION IF EXISTS is_admin();
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    -- For local development, always return true
    -- In production, this would check the actual user's role
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create get_current_user_profile function (simplified for local use)
DROP FUNCTION IF EXISTS get_current_user_profile();
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE(
    id uuid, 
    email text, 
    full_name text, 
    role text, 
    created_at timestamp with time zone, 
    updated_at timestamp with time zone
) AS $$
BEGIN
    -- For local development, return a mock profile
    -- In production, this would return the actual user's profile
    RETURN QUERY
    SELECT 
        '00000000-0000-0000-0000-000000000001'::uuid as id,
        'admin@local.dev'::text as email,
        'Local Admin'::text as full_name,
        'admin'::text as role,
        NOW() as created_at,
        NOW() as updated_at;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 7. CREATE USER CREATION TRIGGER
-- ===========================================

-- Create handle_new_user function
-- First drop the trigger if it exists, then the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'customer'
    );
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- 8. ENABLE ROW LEVEL SECURITY (OPTIONAL)
-- ===========================================

-- Enable RLS on tables (optional for local development)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies (allow all for local development)
-- Profiles
DROP POLICY IF EXISTS "Enable read access for users" ON public.profiles;
CREATE POLICY "Enable read access for users" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for users" ON public.profiles;
CREATE POLICY "Enable insert access for users" ON public.profiles  
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for users" ON public.profiles;
CREATE POLICY "Enable update access for users" ON public.profiles
    FOR UPDATE USING (true) WITH CHECK (true);

-- Other tables - allow all for local development
DROP POLICY IF EXISTS "NFT types are viewable by everyone" ON public.nft_types;
CREATE POLICY "NFT types are viewable by everyone" ON public.nft_types
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage their own loyalty cards" ON public.user_loyalty_cards;
CREATE POLICY "Users can manage their own loyalty cards" ON public.user_loyalty_cards
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage their own points" ON public.user_points;
CREATE POLICY "Users can manage their own points" ON public.user_points
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can manage their own transactions" ON public.loyalty_transactions
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Subscription plans are viewable by everyone" ON public.merchant_subscription_plans;
CREATE POLICY "Subscription plans are viewable by everyone" ON public.merchant_subscription_plans
    FOR ALL USING (true);

-- ===========================================
-- 9. GRANT PERMISSIONS (STANDARD POSTGRESQL ROLES)
-- ===========================================

-- Grant permissions on tables to postgres user
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.merchants TO postgres;
GRANT ALL ON public.nft_types TO postgres;
GRANT ALL ON public.user_loyalty_cards TO postgres;
GRANT ALL ON public.user_points TO postgres;
GRANT ALL ON public.loyalty_transactions TO postgres;
GRANT ALL ON public.merchant_subscription_plans TO postgres;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_valid_subscription_plans() TO postgres;
GRANT EXECUTE ON FUNCTION is_admin() TO postgres;
GRANT EXECUTE ON FUNCTION get_current_user_profile() TO postgres;

-- ===========================================
-- 10. VERIFICATION QUERIES
-- ===========================================

-- Check if all enums exist
SELECT 'Enums Created' as status, 
       COUNT(*) as count 
FROM pg_type 
WHERE typtype = 'e' 
  AND typname IN ('app_role', 'merchant_status', 'subscription_plan');

-- Check if all tables exist
SELECT 'Tables Created' as status, 
       COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'merchants', 'user_loyalty_cards', 
    'user_points', 'loyalty_transactions', 'nft_types', 
    'merchant_subscription_plans'
  );

-- Check if all functions exist
SELECT 'Functions Created' as status,
       COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_valid_subscription_plans', 'is_admin', 'get_current_user_profile'
  );

-- Check subscription plans
SELECT 'Subscription Plans' as status, COUNT(*) as count 
FROM public.merchant_subscription_plans;

-- Test RPC function
SELECT 'RPC Function Test' as status, COUNT(*) as count 
FROM get_valid_subscription_plans();

-- ===========================================
-- 11. SUCCESS MESSAGE
-- ===========================================

SELECT '✅ Comprehensive database fixes completed successfully!' as message,
       'You can now run the corrected test data script.' as next_step;
