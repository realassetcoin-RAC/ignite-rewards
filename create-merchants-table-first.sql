-- First, let's create the merchants table with the correct structure
-- This will ensure the table exists with the right columns

-- Drop the table if it exists (be careful with this in production!)
DROP TABLE IF EXISTS public.merchants CASCADE;

-- Create the merchants table with the structure we need
CREATE TABLE public.merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create RLS Policies
CREATE POLICY "Merchants can view their own data" ON public.merchants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Merchants can update their own data" ON public.merchants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all merchants" ON public.merchants
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Now insert the test data
INSERT INTO merchants (
    id, user_id, business_name, business_type, contact_email, phone, 
    city, country, subscription_plan, status, subscription_start_date, 
    subscription_end_date
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
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
    '44444444-4444-4444-4444-444444444444',
    'Tech Solutions Inc',
    'Technology',
    'ceo@techsolutions.com',
    '+1-555-234-5678',
    'San Francisco',
    'USA',
    'standard',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year'
),
(
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    'Fashion Boutique',
    'Retail',
    'manager@fashionboutique.com',
    '+1-555-345-6789',
    'Los Angeles',
    'USA',
    'premium',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year'
),
(
    '77777777-7777-7777-7777-777777777777',
    '88888888-8888-8888-8888-888888888888',
    'Restaurant Chain',
    'Food & Beverage',
    'admin@restaurantchain.com',
    '+1-555-456-7890',
    'Chicago',
    'USA',
    'enterprise',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year'
),
(
    '99999999-9999-9999-9999-999999999999',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
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

-- Verify the data was inserted
SELECT 'Merchants created:' as status, COUNT(*) as count FROM merchants;
