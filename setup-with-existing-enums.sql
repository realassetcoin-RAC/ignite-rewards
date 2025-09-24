-- Setup with Your Existing Enums and Table Structure
-- This script works with your current database schema

-- ===========================================
-- 1. CREATE MERCHANT_SUBSCRIPTION_PLANS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS merchant_subscription_plans (
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

-- ===========================================
-- 2. INSERT SUBSCRIPTION PLANS (MAPPED TO YOUR ENUMS)
-- ===========================================

INSERT INTO merchant_subscription_plans (
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
    false, 
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
-- 3. ADD SUBSCRIPTION PLAN COLUMN TO EXISTING MERCHANTS TABLE
-- ===========================================

-- Add subscription_plan column if it doesn't exist
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS subscription_plan subscription_plan DEFAULT 'basic';

-- Add other missing columns if needed
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year');

-- ===========================================
-- 4. CREATE RPC FUNCTION
-- ===========================================

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
    FROM merchant_subscription_plans msp
    WHERE msp.is_active = true
    ORDER BY msp.plan_number ASC;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 5. GRANT PERMISSIONS
-- ===========================================

GRANT SELECT ON merchant_subscription_plans TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_valid_subscription_plans() TO anon, authenticated;

-- ===========================================
-- 6. VERIFY SETUP
-- ===========================================

-- Check subscription plans
SELECT 'Subscription Plans' as table_name, COUNT(*) as record_count FROM merchant_subscription_plans;

-- Check merchants with subscription plans
SELECT 
    m.name,
    m.description,
    m.subscription_plan,
    msp.name as plan_name,
    msp.price_monthly
FROM merchants m
LEFT JOIN merchant_subscription_plans msp ON m.subscription_plan::text = msp.id
LIMIT 10;

-- Test RPC function
SELECT 'RPC Function Test' as test_name, COUNT(*) as plan_count FROM get_valid_subscription_plans();
