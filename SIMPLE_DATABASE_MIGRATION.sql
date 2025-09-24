-- Simple Database Migration for NFT Types
-- Copy and paste this entire script into your Supabase SQL Editor

-- Step 1: Create the nft_types table if it doesn't exist
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
    annual_fee DECIMAL(10,2) DEFAULT 0.00
);

-- Step 2: Add missing fields if they don't exist
ALTER TABLE public.nft_types 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS passive_income_rate DECIMAL(5,4) DEFAULT 0.0100,
ADD COLUMN IF NOT EXISTS custodial_income_rate DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS one_time_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS annual_fee DECIMAL(10,2) DEFAULT 0.00;

-- Step 3: Update existing records with default values
UPDATE public.nft_types 
SET display_name = nft_name 
WHERE display_name IS NULL OR display_name = '';

UPDATE public.nft_types 
SET description = 'NFT Loyalty Card'
WHERE description IS NULL;

UPDATE public.nft_types 
SET features = '{}'
WHERE features IS NULL;

-- Step 4: Enable Row Level Security
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;

-- Step 5: Create basic RLS policies
DROP POLICY IF EXISTS "Everyone can view active NFT types" ON public.nft_types;
CREATE POLICY "Everyone can view active NFT types" 
ON public.nft_types
FOR SELECT 
TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage NFT types" ON public.nft_types;
CREATE POLICY "Admins can manage NFT types" 
ON public.nft_types
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Step 6: Insert sample data for testing
INSERT INTO public.nft_types (
    nft_name, 
    display_name, 
    description, 
    buy_price_usdt, 
    rarity, 
    mint_quantity, 
    is_upgradeable, 
    is_evolvable, 
    is_fractional_eligible, 
    is_custodial, 
    auto_staking_duration, 
    earn_on_spend_ratio, 
    upgrade_bonus_ratio, 
    evolution_min_investment, 
    evolution_earnings_ratio, 
    passive_income_rate, 
    custodial_income_rate,
    pricing_type,
    one_time_fee,
    features
) VALUES 
(
    'Premium Rewards Card',
    'Premium Rewards Card',
    'Premium loyalty card with enhanced earning rates',
    99.99,
    'Rare',
    1000,
    true,
    true,
    true,
    true,
    'Forever',
    0.0150,
    0.0050,
    100.00,
    0.0025,
    0.0125,
    0.0025,
    'one_time',
    99.99,
    '["Premium Support", "Higher Earning Rates", "Exclusive Benefits"]'
),
(
    'Basic Loyalty Card',
    'Basic Loyalty Card',
    'Basic loyalty card for everyday users',
    0.00,
    'Common',
    10000,
    false,
    true,
    true,
    true,
    'Forever',
    0.0100,
    0.0000,
    0.00,
    0.0000,
    0.0100,
    0.0000,
    'free',
    0.00,
    '["Basic Support", "Standard Earning Rates"]'
)
ON CONFLICT (nft_name, is_custodial) DO NOTHING;

-- Step 7: Verify the migration
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as total_nft_types
FROM public.nft_types;

-- Step 8: Show table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'nft_types' 
AND table_schema = 'public'
ORDER BY ordinal_position;






