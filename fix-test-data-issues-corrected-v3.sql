-- ===========================================
-- FIX TEST DATA ISSUES - CORRECTED V3 FOR LOCAL DATABASE
-- ===========================================
-- This script fixes the actual issues in your local database
-- Works with existing table structures (UUID IDs)

-- ===========================================
-- 1. CREATE MISSING ENUMS
-- ===========================================

-- Create app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('customer', 'admin', 'merchant');
    END IF;
END $$;

-- Create merchant_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'merchant_status') THEN
        CREATE TYPE merchant_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
    END IF;
END $$;

-- Create subscription_plan enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        CREATE TYPE subscription_plan AS ENUM (
            'startup-plan', 
            'momentum-plan', 
            'energizer-plan', 
            'cloud9-plan', 
            'super-plan'
        );
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

-- Create merchants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    subscription_plan subscription_plan DEFAULT 'startup-plan'::subscription_plan,
    status merchant_status DEFAULT 'pending'::merchant_status,
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    monthly_fee NUMERIC,
    annual_fee NUMERIC,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 5. INSERT SUBSCRIPTION PLANS DATA (WITH UUID IDs)
-- ===========================================

-- Insert subscription plans with UUID IDs
INSERT INTO public.merchant_subscription_plans (
    id, name, description, price_monthly, price_yearly, 
    monthly_points, monthly_transactions, features, 
    trial_days, is_active, popular, plan_number
) VALUES 
(
    gen_random_uuid(), 
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
    gen_random_uuid(), 
    'Momentum Plan', 
    'Ideal for growing businesses that need more advanced features',
    50.00, 
    500.00, 
    300, 
    300, 
    '["Advanced loyalty program", "Up to 300 monthly points", "300 transactions per month", "Priority support", "Advanced analytics"]'::jsonb,
    14, 
    true, 
    false, 
    2
),
(
    gen_random_uuid(), 
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
),
(
    gen_random_uuid(), 
    'Cloud9 Plan', 
    'For large businesses requiring advanced enterprise features',
    250.00, 
    2500.00, 
    1800, 
    1800, 
    '["Enterprise loyalty program", "Up to 1800 monthly points", "1800 transactions per month", "Dedicated support", "Advanced analytics"]'::jsonb,
    30, 
    true, 
    false, 
    4
),
(
    gen_random_uuid(), 
    'Super Plan', 
    'For large enterprises requiring unlimited features and dedicated support',
    500.00, 
    5000.00, 
    4000, 
    4000, 
    '["Ultimate loyalty program", "Up to 4000 monthly points", "4000 transactions per month", "VIP support", "Enterprise analytics"]'::jsonb,
    30, 
    true, 
    false, 
    5
)
ON CONFLICT (id) DO NOTHING;

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

-- Create is_admin function
DROP FUNCTION IF EXISTS is_admin();
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create get_current_user_profile function
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
    RETURN QUERY
    SELECT 
        p.id, 
        p.email, 
        p.full_name, 
        p.role::text, 
        p.created_at, 
        p.updated_at
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 7. CREATE USER CREATION TRIGGER
-- ===========================================

-- Create handle_new_user function
DROP FUNCTION IF EXISTS handle_new_user();
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- 8. ENABLE ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Enable read access for users" ON public.profiles;
CREATE POLICY "Enable read access for users" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Enable insert access for users" ON public.profiles;
CREATE POLICY "Enable insert access for users" ON public.profiles  
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Enable update access for users" ON public.profiles;
CREATE POLICY "Enable update access for users" ON public.profiles
    FOR UPDATE TO authenticated  
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create RLS policies for other tables
-- NFT types - readable by all
DROP POLICY IF EXISTS "NFT types are viewable by everyone" ON public.nft_types;
CREATE POLICY "NFT types are viewable by everyone" ON public.nft_types
    FOR SELECT USING (true);

-- User loyalty cards - users can view their own
DROP POLICY IF EXISTS "Users can view their own loyalty cards" ON public.user_loyalty_cards;
CREATE POLICY "Users can view their own loyalty cards" ON public.user_loyalty_cards
    FOR SELECT USING (user_id = auth.uid());

-- User points - users can view their own
DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
CREATE POLICY "Users can view their own points" ON public.user_points
    FOR SELECT USING (user_id = auth.uid());

-- Loyalty transactions - users can view their own
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view their own transactions" ON public.loyalty_transactions
    FOR SELECT USING (user_id = auth.uid());

-- Subscription plans - readable by all
DROP POLICY IF EXISTS "Subscription plans are viewable by everyone" ON public.merchant_subscription_plans;
CREATE POLICY "Subscription plans are viewable by everyone" ON public.merchant_subscription_plans
    FOR SELECT USING (true);

-- ===========================================
-- 9. GRANT PERMISSIONS
-- ===========================================

-- Grant permissions on tables
GRANT ALL ON public.profiles TO authenticated, service_role;
GRANT ALL ON public.merchants TO authenticated, service_role;
GRANT SELECT ON public.nft_types TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_loyalty_cards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_points TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.loyalty_transactions TO authenticated;
GRANT SELECT ON public.merchant_subscription_plans TO anon, authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_valid_subscription_plans() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_profile() TO authenticated;

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

SELECT '✅ Database fixes completed successfully!' as message,
       'You can now run the corrected test data script.' as next_step;
