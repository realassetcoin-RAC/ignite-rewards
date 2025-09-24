-- ===========================================
-- FIX TEST DATA ISSUES - CORRECTED FOR LOCAL DATABASE
-- ===========================================
-- This script fixes the actual issues in your local database
-- Your database uses public schema correctly - no api schema issues

-- ===========================================
-- 1. CREATE MISSING TABLES
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
-- 2. FIX SUBSCRIPTION PLAN ENUM
-- ===========================================

-- Update subscription plan enum to match test data
DROP TYPE IF EXISTS subscription_plan CASCADE;
CREATE TYPE subscription_plan AS ENUM (
    'startup-plan', 
    'momentum-plan', 
    'energizer-plan', 
    'cloud9-plan', 
    'super-plan'
);

-- Update merchants table to use correct enum
ALTER TABLE public.merchants 
DROP COLUMN IF EXISTS subscription_plan;

ALTER TABLE public.merchants 
ADD COLUMN subscription_plan subscription_plan DEFAULT 'startup-plan';

-- ===========================================
-- 3. UPDATE SUBSCRIPTION PLANS DATA
-- ===========================================

-- Update existing subscription plans to match test data
UPDATE public.merchant_subscription_plans 
SET id = 'startup-plan' 
WHERE name = 'StartUp' OR id = 'basic';

UPDATE public.merchant_subscription_plans 
SET id = 'momentum-plan' 
WHERE name = 'Momentum Plan' OR id = 'standard';

UPDATE public.merchant_subscription_plans 
SET id = 'energizer-plan' 
WHERE name = 'Energizer Plan' OR id = 'premium';

UPDATE public.merchant_subscription_plans 
SET id = 'cloud9-plan' 
WHERE name = 'Cloud9 Plan' OR id = 'enterprise';

-- Insert missing subscription plans
INSERT INTO public.merchant_subscription_plans (
    id, name, description, price_monthly, price_yearly, 
    monthly_points, monthly_transactions, features, 
    trial_days, is_active, popular, plan_number
) VALUES 
(
    'startup-plan', 
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
    'momentum-plan', 
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
    'energizer-plan', 
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
    'cloud9-plan', 
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
    'super-plan', 
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
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    monthly_points = EXCLUDED.monthly_points,
    monthly_transactions = EXCLUDED.monthly_transactions,
    features = EXCLUDED.features,
    trial_days = EXCLUDED.trial_days,
    is_active = EXCLUDED.is_active,
    popular = EXCLUDED.popular,
    plan_number = EXCLUDED.plan_number,
    updated_at = NOW();

-- ===========================================
-- 4. CREATE REQUIRED RPC FUNCTIONS
-- ===========================================

-- Create get_valid_subscription_plans function
DROP FUNCTION IF EXISTS get_valid_subscription_plans();
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
-- 5. CREATE USER CREATION TRIGGER
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
-- 6. ENABLE ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on new tables
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
-- NFT types - readable by all
CREATE POLICY "NFT types are viewable by everyone" ON public.nft_types
    FOR SELECT USING (true);

-- User loyalty cards - users can view their own
CREATE POLICY "Users can view their own loyalty cards" ON public.user_loyalty_cards
    FOR SELECT USING (user_id = auth.uid());

-- User points - users can view their own
CREATE POLICY "Users can view their own points" ON public.user_points
    FOR SELECT USING (user_id = auth.uid());

-- Loyalty transactions - users can view their own
CREATE POLICY "Users can view their own transactions" ON public.loyalty_transactions
    FOR SELECT USING (user_id = auth.uid());

-- ===========================================
-- 7. GRANT PERMISSIONS
-- ===========================================

-- Grant permissions on new tables
GRANT SELECT ON public.nft_types TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_loyalty_cards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_points TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.loyalty_transactions TO authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_valid_subscription_plans() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_profile() TO authenticated;

-- ===========================================
-- 8. VERIFICATION QUERIES
-- ===========================================

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
-- 9. SUCCESS MESSAGE
-- ===========================================

SELECT '✅ Database fixes completed successfully!' as message,
       'You can now run the corrected test data script.' as next_step;
