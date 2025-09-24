-- Production Database Setup Script
-- Run this in your production Supabase SQL editor

-- 1. Create subscription plan enum
CREATE TYPE subscription_plan AS ENUM ('basic', 'standard', 'premium', 'enterprise');

-- 2. Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT,
    contact_email TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    country TEXT,
    status TEXT DEFAULT 'pending',
    subscription_plan subscription_plan,
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    payment_link_url TEXT,
    currency_symbol TEXT DEFAULT '$',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create merchant_subscription_plans table
CREATE TABLE IF NOT EXISTS merchant_subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    monthly_points INTEGER DEFAULT 0,
    monthly_transactions INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]',
    trial_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    popular BOOLEAN DEFAULT false,
    plan_number INTEGER DEFAULT 1,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insert default subscription plans
INSERT INTO merchant_subscription_plans (name, description, price_monthly, price_yearly, monthly_points, monthly_transactions, features, trial_days, is_active, popular, plan_number) VALUES
('StartUp', 'Perfect for small businesses just getting started with loyalty programs', 20.00, 150.00, 100, 100, '["Basic loyalty program setup", "Up to 100 monthly points", "100 transactions per month", "Email support", "Basic analytics"]', 7, true, false, 1),
('Momentum Plan', 'Ideal for growing businesses that need more advanced features', 50.00, 500.00, 300, 300, '["Advanced loyalty program", "Up to 300 monthly points", "300 transactions per month", "Priority support", "Advanced analytics"]', 14, true, false, 2),
('Energizer Plan', 'For established businesses requiring enterprise-level features', 100.00, 1000.00, 600, 600, '["Premium loyalty program", "Up to 600 monthly points", "600 transactions per month", "24/7 support", "Real-time analytics"]', 21, true, false, 3),
('Cloud9 Plan', 'For large businesses requiring advanced enterprise features', 250.00, 2500.00, 1800, 1800, '["Enterprise loyalty program", "Up to 1800 monthly points", "1800 transactions per month", "Dedicated support", "Advanced analytics"]', 30, true, false, 4),
('Super Plan', 'For large enterprises requiring unlimited features and dedicated support', 500.00, 5000.00, 4000, 4000, '["Ultimate loyalty program", "Up to 4000 monthly points", "4000 transactions per month", "VIP support", "Enterprise analytics"]', 30, true, false, 5);

-- 5. Create RPC function for getting valid subscription plans
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
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
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
        msp.valid_from,
        msp.valid_until,
        msp.created_at,
        msp.updated_at
    FROM merchant_subscription_plans msp
    WHERE msp.is_active = true
    ORDER BY msp.plan_number ASC;
END;
$$ LANGUAGE plpgsql;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for merchants table
CREATE POLICY "Users can view their own merchant data" ON merchants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own merchant data" ON merchants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchant data" ON merchants
    FOR UPDATE USING (auth.uid() = user_id);

-- 8. Create policies for subscription plans (public read access)
CREATE POLICY "Anyone can view active subscription plans" ON merchant_subscription_plans
    FOR SELECT USING (is_active = true);

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON merchant_subscription_plans TO anon, authenticated;
GRANT ALL ON merchants TO authenticated;
GRANT EXECUTE ON FUNCTION get_valid_subscription_plans() TO anon, authenticated;
