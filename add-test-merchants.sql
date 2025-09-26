-- Add test merchants to verify analytics are working
-- The database already has the correct enum values: 'startup-plan', 'momentum-plan', 'energizer-plan', 'cloud9-plan', 'super-plan'

-- First, let's check what columns actually exist in the merchants table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'merchants'
ORDER BY ordinal_position;

-- Insert test merchants with different subscription plans (without user_id if it doesn't exist)
INSERT INTO public.merchants (
    business_name,
    business_type,
    contact_email,
    phone,
    city,
    country,
    subscription_plan,
    status,
    subscription_start_date,
    created_at
) VALUES 
-- StartUp Plan merchants
('Test Coffee Shop', 'Food & Beverage', 'coffee@test.com', '+1234567890', 'New York', 'US', 'startup-plan', 'active', NOW(), NOW()),
('Test Bookstore', 'Retail', 'books@test.com', '+1234567891', 'Los Angeles', 'US', 'startup-plan', 'active', NOW(), NOW()),
('Test Bakery', 'Food & Beverage', 'bakery@test.com', '+1234567892', 'Chicago', 'US', 'startup-plan', 'active', NOW(), NOW()),

-- Momentum Plan merchants
('Test Restaurant', 'Food & Beverage', 'restaurant@test.com', '+1234567893', 'Miami', 'US', 'momentum-plan', 'active', NOW(), NOW()),
('Test Clothing Store', 'Retail', 'clothing@test.com', '+1234567894', 'Seattle', 'US', 'momentum-plan', 'active', NOW(), NOW()),

-- Energizer Plan merchants
('Test Electronics Store', 'Retail', 'electronics@test.com', '+1234567895', 'Boston', 'US', 'energizer-plan', 'active', NOW(), NOW()),

-- Cloud9 Plan merchants
('Test Supermarket', 'Retail', 'supermarket@test.com', '+1234567896', 'Denver', 'US', 'cloud9-plan', 'active', NOW(), NOW()),

-- Super Plan merchants
('Test Department Store', 'Retail', 'department@test.com', '+1234567897', 'Phoenix', 'US', 'super-plan', 'active', NOW(), NOW())

ON CONFLICT DO NOTHING;

-- Verify the data was inserted
SELECT 
    subscription_plan,
    COUNT(*) as merchant_count
FROM public.merchants 
WHERE status = 'active'
GROUP BY subscription_plan
ORDER BY subscription_plan;
