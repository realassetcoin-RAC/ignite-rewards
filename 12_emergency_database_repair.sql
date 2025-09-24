-- Emergency Database Repair Script
-- This script fixes schema cache issues and ensures all tables are accessible

-- 1. First, let's check if the tables exist and their structure
DO $$
BEGIN
    -- Check if nft_types table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'nft_types') THEN
        RAISE NOTICE 'nft_types table does not exist, creating...';
        
        -- Create nft_types table with complete schema
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
    END IF;

    -- Check if nft_collections table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'nft_collections') THEN
        RAISE NOTICE 'nft_collections table does not exist, creating...';
        
        CREATE TABLE public.nft_collections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            collection_name VARCHAR(255) NOT NULL UNIQUE,
            display_name VARCHAR(255) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Fix existing nft_collections table if it's missing display_name column
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'nft_collections') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'nft_collections' AND column_name = 'display_name') THEN
            RAISE NOTICE 'Adding display_name column to existing nft_collections table...';
            ALTER TABLE public.nft_collections ADD COLUMN display_name VARCHAR(255);
            UPDATE public.nft_collections SET display_name = collection_name WHERE display_name IS NULL;
            ALTER TABLE public.nft_collections ALTER COLUMN display_name SET NOT NULL;
        END IF;
    END IF;

    -- Check if issue_categories table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'issue_categories') THEN
        RAISE NOTICE 'issue_categories table does not exist, creating...';
        
        CREATE TABLE public.issue_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            category_name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Check if merchants table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'merchants') THEN
        RAISE NOTICE 'merchants table does not exist, creating...';
        
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
    END IF;

    -- Check if profiles table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE 'profiles table does not exist, creating...';
        
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL UNIQUE,
            full_name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

END $$;

-- 2. Enable RLS on all tables
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for anonymous access (for public data)
-- NFT Types - Allow anonymous read access
DROP POLICY IF EXISTS "Allow anonymous read access to nft_types" ON public.nft_types;
CREATE POLICY "Allow anonymous read access to nft_types" ON public.nft_types
    FOR SELECT USING (true);

-- NFT Collections - Allow anonymous read access
DROP POLICY IF EXISTS "Allow anonymous read access to nft_collections" ON public.nft_collections;
CREATE POLICY "Allow anonymous read access to nft_collections" ON public.nft_collections
    FOR SELECT USING (true);

-- Issue Categories - Allow anonymous read access
DROP POLICY IF EXISTS "Allow anonymous read access to issue_categories" ON public.issue_categories;
CREATE POLICY "Allow anonymous read access to issue_categories" ON public.issue_categories
    FOR SELECT USING (true);

-- Merchants - Allow anonymous read access
DROP POLICY IF EXISTS "Allow anonymous read access to merchants" ON public.merchants;
CREATE POLICY "Allow anonymous read access to merchants" ON public.merchants
    FOR SELECT USING (true);

-- Profiles - Allow anonymous read access
DROP POLICY IF EXISTS "Allow anonymous read access to profiles" ON public.profiles;
CREATE POLICY "Allow anonymous read access to profiles" ON public.profiles
    FOR SELECT USING (true);

-- 4. Insert default data if tables are empty
-- Insert default NFT collection
INSERT INTO public.nft_collections (collection_name, display_name, description, is_active)
VALUES ('Classic', 'Classic Collection', 'Classic loyalty NFT collection', true)
ON CONFLICT (collection_name) DO NOTHING;

-- Insert default NFT types
INSERT INTO public.nft_types (nft_name, display_name, buy_price_usdt, rarity, mint_quantity, is_upgradeable, is_evolvable, is_fractional_eligible, auto_staking_duration, earn_on_spend_ratio, upgrade_bonus_ratio, evolution_min_investment, evolution_earnings_ratio, passive_income_rate, custodial_income_rate, subscription_plan, pricing_type, one_time_fee, monthly_fee, annual_fee, is_custodial, is_active)
VALUES 
    ('Classic Loyalty Card', 'Classic Loyalty Card', 0, 'Common', 1000, true, true, true, 'Forever', 0.01, 0, 0, 0, 0, 0, 'Free', 'One-time', 0, 0, 0, true, true),
    ('Premium Loyalty Card', 'Premium Loyalty Card', 50, 'Rare', 500, true, true, true, 'Forever', 0.02, 0.01, 100, 0.005, 0.001, 0.002, 'Premium', 'One-time', 50, 0, 0, true, true),
    ('Elite Loyalty Card', 'Elite Loyalty Card', 100, 'Epic', 100, true, true, true, 'Forever', 0.03, 0.02, 500, 0.01, 0.002, 0.005, 'Elite', 'One-time', 100, 0, 0, true, true)
ON CONFLICT (nft_name) DO NOTHING;

-- Insert default issue categories
INSERT INTO public.issue_categories (category_name, description, is_active)
VALUES 
    ('Technical Support', 'Technical issues and support requests', true),
    ('Account Issues', 'Account-related problems and questions', true),
    ('Payment Issues', 'Payment and billing related issues', true),
    ('General Inquiry', 'General questions and inquiries', true)
ON CONFLICT (category_name) DO NOTHING;

-- 5. Create a test user profile for login testing
INSERT INTO public.profiles (email, full_name, role)
VALUES ('admin@igniterewards.com', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 6. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- 7. Verify the tables exist and are accessible
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('nft_types', 'nft_collections', 'issue_categories', 'merchants', 'profiles');
    
    RAISE NOTICE 'Tables created/verified: %', table_count;
    
    IF table_count = 5 THEN
        RAISE NOTICE '✅ All required tables are present and accessible';
    ELSE
        RAISE NOTICE '❌ Some tables are missing. Count: %', table_count;
    END IF;
END $$;
