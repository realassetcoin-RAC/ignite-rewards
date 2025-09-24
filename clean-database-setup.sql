-- Clean Database Setup - Avoids conflicts with existing functions
-- Copy and paste this entire script into your Supabase SQL Editor

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active ON merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_plan_number ON merchant_subscription_plans(plan_number);

-- ===========================================
-- 2. INSERT SUBSCRIPTION PLANS DATA
-- ===========================================

INSERT INTO merchant_subscription_plans (
    id, name, description, price_monthly, price_yearly, 
    monthly_points, monthly_transactions, features, 
    trial_days, is_active, popular, plan_number
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001', 
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
    '550e8400-e29b-41d4-a716-446655440002', 
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
    '550e8400-e29b-41d4-a716-446655440003', 
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
    '550e8400-e29b-41d4-a716-446655440004', 
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
    '550e8400-e29b-41d4-a716-446655440005', 
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
-- 3. CREATE RPC FUNCTION
-- ===========================================

-- Drop existing function if it exists
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
-- 4. CREATE MERCHANTS TABLE (WITHOUT FOREIGN KEY)
-- ===========================================

-- Drop the table if it exists
DROP TABLE IF EXISTS public.merchants CASCADE;

-- Create the merchants table WITHOUT the foreign key constraint to avoid user creation issues
CREATE TABLE public.merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT, -- Changed to TEXT to avoid foreign key issues
  business_name TEXT NOT NULL,
  business_type TEXT,
  contact_email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  subscription_plan subscription_plan,
  status merchant_status DEFAULT 'pending',
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  monthly_fee NUMERIC,
  annual_fee NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (simplified to avoid user_id issues)
CREATE POLICY "Everyone can view merchants" ON public.merchants
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage all merchants" ON public.merchants
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- 5. INSERT TEST MERCHANTS (WITHOUT USER REFERENCES)
-- ===========================================

INSERT INTO merchants (
    id, user_id, business_name, business_type, contact_email, phone, 
    city, country, subscription_plan, status, subscription_start_date, 
    subscription_end_date
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'user-1',
    'Sample Coffee Shop',
    'Food & Beverage',
    'owner@samplecoffee.com',
    '+1-555-123-4567',
    'New York',
    'USA',
    'basic',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year'
),
(
    '33333333-3333-3333-3333-333333333333',
    'user-2',
    'Tech Solutions Inc',
    'Technology',
    'ceo@techsolutions.com',
    '+1-555-234-5678',
    'San Francisco',
    'USA',
    'basic',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year'
),
(
    '55555555-5555-5555-5555-555555555555',
    'user-3',
    'Fashion Boutique',
    'Retail',
    'manager@fashionboutique.com',
    '+1-555-345-6789',
    'Los Angeles',
    'USA',
    'basic',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year'
),
(
    '77777777-7777-7777-7777-777777777777',
    'user-4',
    'Restaurant Chain',
    'Food & Beverage',
    'admin@restaurantchain.com',
    '+1-555-456-7890',
    'Chicago',
    'USA',
    'basic',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year'
),
(
    '99999999-9999-9999-9999-999999999999',
    'user-5',
    'Fitness Center',
    'Health & Fitness',
    'owner@fitnesscenter.com',
    '+1-555-567-8901',
    'Miami',
    'USA',
    'basic',
    'pending',
    NOW(),
    NOW() + INTERVAL '1 year'
);

-- ===========================================
-- 6. GRANT PERMISSIONS
-- ===========================================

GRANT SELECT ON merchant_subscription_plans TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_valid_subscription_plans() TO anon, authenticated;

-- ===========================================
-- 7. VERIFY SETUP
-- ===========================================

-- Check subscription plans
SELECT 'Subscription Plans' as table_name, COUNT(*) as record_count FROM merchant_subscription_plans;

-- Check merchants
SELECT 'Merchants' as table_name, COUNT(*) as record_count FROM merchants;

-- Test RPC function
SELECT 'RPC Function Test' as test_name, COUNT(*) as plan_count FROM get_valid_subscription_plans();
