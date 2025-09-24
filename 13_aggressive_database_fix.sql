-- Aggressive Database Fix Script
-- This script completely rebuilds the database schema to fix persistent cache issues

-- 1. Drop and recreate all problematic tables
DROP TABLE IF EXISTS public.nft_types CASCADE;
DROP TABLE IF EXISTS public.nft_collections CASCADE;
DROP TABLE IF EXISTS public.issue_categories CASCADE;
DROP TABLE IF EXISTS public.merchants CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Recreate tables with proper schema
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    business_address TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    subscription_plan VARCHAR(50) DEFAULT 'Free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.nft_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    buy_price_usdt DECIMAL(10,2) DEFAULT 0,
    rarity VARCHAR(50) DEFAULT 'Common',
    mint_quantity INTEGER DEFAULT 1000,
    is_upgradeable BOOLEAN DEFAULT false,
    is_evolvable BOOLEAN DEFAULT true,
    is_fractional_eligible BOOLEAN DEFAULT true,
    auto_staking_duration VARCHAR(50) DEFAULT 'Forever',
    earn_on_spend_ratio DECIMAL(5,4) DEFAULT 0.01,
    upgrade_bonus_ratio DECIMAL(5,4) DEFAULT 0,
    evolution_min_investment DECIMAL(10,2) DEFAULT 0,
    evolution_earnings_ratio DECIMAL(5,4) DEFAULT 0,
    passive_income_rate DECIMAL(5,4) DEFAULT 0,
    custodial_income_rate DECIMAL(5,4) DEFAULT 0,
    subscription_plan VARCHAR(50) DEFAULT 'Free',
    pricing_type VARCHAR(50) DEFAULT 'One-time',
    one_time_fee DECIMAL(10,2) DEFAULT 0,
    monthly_fee DECIMAL(10,2) DEFAULT 0,
    annual_fee DECIMAL(10,2) DEFAULT 0,
    is_custodial BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.issue_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_categories ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive RLS policies for anonymous access
DROP POLICY IF EXISTS "Allow anonymous read access to profiles" ON public.profiles;
CREATE POLICY "Allow anonymous read access to profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read access to merchants" ON public.merchants;
CREATE POLICY "Allow anonymous read access to merchants" ON public.merchants
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read access to nft_collections" ON public.nft_collections;
CREATE POLICY "Allow anonymous read access to nft_collections" ON public.nft_collections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read access to nft_types" ON public.nft_types;
CREATE POLICY "Allow anonymous read access to nft_types" ON public.nft_types
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read access to issue_categories" ON public.issue_categories;
CREATE POLICY "Allow anonymous read access to issue_categories" ON public.issue_categories
    FOR SELECT USING (true);

-- 5. Insert default data
INSERT INTO public.nft_collections (collection_name, display_name, description, is_active)
VALUES ('Classic', 'Classic Collection', 'Classic loyalty NFT collection', true);

INSERT INTO public.nft_types (nft_name, display_name, buy_price_usdt, rarity, mint_quantity, is_upgradeable, is_evolvable, is_fractional_eligible, auto_staking_duration, earn_on_spend_ratio, upgrade_bonus_ratio, evolution_min_investment, evolution_earnings_ratio, passive_income_rate, custodial_income_rate, subscription_plan, pricing_type, one_time_fee, monthly_fee, annual_fee, is_custodial, is_active)
VALUES 
    ('Classic Loyalty Card', 'Classic Loyalty Card', 0, 'Common', 1000, true, true, true, 'Forever', 0.01, 0, 0, 0, 0, 0, 'Free', 'One-time', 0, 0, 0, true, true),
    ('Premium Loyalty Card', 'Premium Loyalty Card', 50, 'Rare', 500, true, true, true, 'Forever', 0.02, 0.01, 100, 0.005, 0.001, 0.002, 'Premium', 'One-time', 50, 0, 0, true, true),
    ('Elite Loyalty Card', 'Elite Loyalty Card', 100, 'Epic', 100, true, true, true, 'Forever', 0.03, 0.02, 500, 0.01, 0.002, 0.005, 'Elite', 'One-time', 100, 0, 0, true, true);

INSERT INTO public.issue_categories (category_name, description, is_active)
VALUES 
    ('Technical Support', 'Technical issues and support requests', true),
    ('Account Issues', 'Account-related problems and questions', true),
    ('Payment Issues', 'Payment and billing related issues', true),
    ('General Inquiry', 'General questions and inquiries', true);

INSERT INTO public.profiles (email, full_name, role)
VALUES ('admin@igniterewards.com', 'Admin User', 'admin');

-- 6. Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- 7. Verify tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('nft_types', 'nft_collections', 'issue_categories', 'merchants', 'profiles');
    
    RAISE NOTICE 'Tables recreated: %', table_count;
    
    IF table_count = 5 THEN
        RAISE NOTICE '✅ All tables successfully recreated';
    ELSE
        RAISE NOTICE '❌ Some tables missing. Count: %', table_count;
    END IF;
END $$;

