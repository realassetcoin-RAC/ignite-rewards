-- =====================================================
-- COMPREHENSIVE DATABASE FIXES
-- Addresses all recurring database issues
-- =====================================================

-- 1. FIX MISSING COLUMNS IN MERCHANTS TABLE
-- =====================================================

-- Add missing country column to merchants table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'merchants' 
        AND column_name = 'country'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.merchants ADD COLUMN country VARCHAR(100) DEFAULT 'United States';
        COMMENT ON COLUMN public.merchants.country IS 'Country where the merchant operates';
    END IF;
END $$;

-- Add missing business_type column to merchants table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'merchants' 
        AND column_name = 'business_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.merchants ADD COLUMN business_type VARCHAR(100);
        COMMENT ON COLUMN public.merchants.business_type IS 'Type of business (retail, service, restaurant, etc.)';
        
        -- Set default business_type based on business_name patterns
        UPDATE public.merchants 
        SET business_type = CASE 
            WHEN LOWER(business_name) LIKE '%cafe%' OR LOWER(business_name) LIKE '%restaurant%' OR LOWER(business_name) LIKE '%food%' THEN 'restaurant'
            WHEN LOWER(business_name) LIKE '%spa%' OR LOWER(business_name) LIKE '%wellness%' OR LOWER(business_name) LIKE '%fitness%' THEN 'service'
            WHEN LOWER(business_name) LIKE '%tech%' OR LOWER(business_name) LIKE '%electronics%' THEN 'retail'
            WHEN LOWER(business_name) LIKE '%fashion%' OR LOWER(business_name) LIKE '%clothing%' THEN 'retail'
            WHEN LOWER(business_name) LIKE '%book%' THEN 'retail'
            ELSE 'service'
        END
        WHERE business_type IS NULL;
    END IF;
END $$;

-- Add missing industry column to merchants table (mapped to business_name)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'merchants' 
        AND column_name = 'industry'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.merchants ADD COLUMN industry VARCHAR(100);
        COMMENT ON COLUMN public.merchants.industry IS 'Industry category for the merchant';
        
        -- Populate industry from business_name
        UPDATE public.merchants 
        SET industry = business_name 
        WHERE industry IS NULL AND business_name IS NOT NULL;
    END IF;
END $$;

-- 2. FIX MISSING COLUMNS IN LOYALTY_TRANSACTIONS TABLE
-- =====================================================

-- Add missing columns to loyalty_transactions table
DO $$ 
BEGIN
    -- Add transaction_amount column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loyalty_transactions' 
        AND column_name = 'transaction_amount'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.loyalty_transactions ADD COLUMN transaction_amount DECIMAL(10,2) DEFAULT 0.00;
        COMMENT ON COLUMN public.loyalty_transactions.transaction_amount IS 'Amount of the transaction';
    END IF;
    
    -- Add transaction_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loyalty_transactions' 
        AND column_name = 'transaction_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.loyalty_transactions ADD COLUMN transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        COMMENT ON COLUMN public.loyalty_transactions.transaction_date IS 'Date and time of the transaction';
    END IF;
END $$;

-- 3. CREATE MISSING TERMS_PRIVACY_ACCEPTANCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.terms_privacy_acceptance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    terms_accepted BOOLEAN DEFAULT FALSE,
    privacy_accepted BOOLEAN DEFAULT FALSE,
    terms_version VARCHAR(20) DEFAULT '1.0',
    privacy_version VARCHAR(20) DEFAULT '1.0',
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for terms_privacy_acceptance
ALTER TABLE public.terms_privacy_acceptance ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own terms acceptance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'terms_privacy_acceptance' 
        AND policyname = 'Users can view own terms acceptance'
    ) THEN
        CREATE POLICY "Users can view own terms acceptance" ON public.terms_privacy_acceptance
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Policy: Users can insert their own terms acceptance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'terms_privacy_acceptance' 
        AND policyname = 'Users can insert own terms acceptance'
    ) THEN
        CREATE POLICY "Users can insert own terms acceptance" ON public.terms_privacy_acceptance
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Policy: Users can update their own terms acceptance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'terms_privacy_acceptance' 
        AND policyname = 'Users can update own terms acceptance'
    ) THEN
        CREATE POLICY "Users can update own terms acceptance" ON public.terms_privacy_acceptance
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. FIX LOYALTY CARD RPC FUNCTION TYPE MISMATCH
-- =====================================================

-- Drop and recreate the get_user_loyalty_card function with proper types
DROP FUNCTION IF EXISTS public.get_user_loyalty_card(UUID);

CREATE OR REPLACE FUNCTION public.get_user_loyalty_card(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    nft_type_id UUID,
    loyalty_number VARCHAR(8),
    card_number VARCHAR(8),
    is_custodial BOOLEAN,
    is_upgraded BOOLEAN,
    is_evolved BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    image_url TEXT,
    card_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ulc.id,
        ulc.user_id,
        ulc.nft_type_id,
        ulc.loyalty_number,
        ulc.card_number,
        ulc.is_custodial,
        ulc.is_upgraded,
        ulc.is_evolved,
        ulc.created_at,
        ulc.updated_at,
        COALESCE(ulc.image_url, '/images/loyalty-cards/pearl-white.png')::TEXT as image_url,
        COALESCE(nt.tier_level, 'Basic')::TEXT as card_type
    FROM public.user_loyalty_cards ulc
    LEFT JOIN public.nft_types nt ON ulc.nft_type_id = nt.id
    WHERE ulc.user_id = user_uuid
    ORDER BY ulc.created_at DESC
    LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_loyalty_card(UUID) TO authenticated;

-- 5. CREATE MISSING MARKETPLACE TABLES
-- =====================================================

-- Create enum types if they don't exist
DO $$ 
BEGIN
    -- Create marketplace_listing_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace_listing_type') THEN
        CREATE TYPE marketplace_listing_type AS ENUM ('asset', 'initiative');
    END IF;
    
    -- Create marketplace_listing_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace_listing_status') THEN
        CREATE TYPE marketplace_listing_status AS ENUM ('draft', 'active', 'funded', 'cancelled', 'completed');
    END IF;
    
    -- Create campaign_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_type') THEN
        CREATE TYPE campaign_type AS ENUM ('time_bound', 'open_ended');
    END IF;
    
    -- Create risk_level enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_level') THEN
        CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
    END IF;
END $$;

-- Create marketplace_listings table if it doesn't exist (using actual schema)
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add all missing columns to existing marketplace_listings table if they don't exist
DO $$ 
BEGIN
    -- Add e-commerce columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'price'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN price NUMERIC;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN category TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'condition'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN condition TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'seller_id'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN seller_id UUID;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'images'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN images TEXT[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add image_url column (single image URL)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN image_url TEXT;
    END IF;
    
    -- Add funding_goal column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'funding_goal'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN funding_goal NUMERIC;
    END IF;
    
    -- Add min_investment column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'min_investment'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN min_investment NUMERIC DEFAULT 0;
    END IF;
    
    -- Add max_investment column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'max_investment'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN max_investment NUMERIC;
    END IF;
    
    -- Add start_time column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'start_time'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add end_time column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add token_ticker column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'token_ticker'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN token_ticker TEXT;
    END IF;
    
    -- Add token_supply column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'token_supply'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN token_supply NUMERIC;
    END IF;
    
    -- Add status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN status marketplace_listing_status DEFAULT 'active';
    END IF;
    
    -- Add listing_type column (appears to be NOT NULL in actual table)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'listing_type'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN listing_type marketplace_listing_type DEFAULT 'asset';
    END IF;
    
    -- Add other potentially missing columns that might have NOT NULL constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'campaign_type'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN campaign_type campaign_type DEFAULT 'open_ended';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'risk_level'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN risk_level risk_level DEFAULT 'medium';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'expected_return_rate'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN expected_return_rate NUMERIC DEFAULT 10.0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'expected_return_period'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN expected_return_period INTEGER DEFAULT 24;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN is_verified BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN tags TEXT[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'documents'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN documents TEXT[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create marketplace_investments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    nft_multiplier NUMERIC NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create marketplace_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for marketplace tables
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

-- Marketplace listings policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'marketplace_listings' 
        AND policyname = 'Anyone can view active marketplace listings'
    ) THEN
        CREATE POLICY "Anyone can view active marketplace listings" ON public.marketplace_listings
            FOR SELECT USING (status = 'active');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'marketplace_listings' 
        AND policyname = 'Authenticated users can create listings'
    ) THEN
        CREATE POLICY "Authenticated users can create listings" ON public.marketplace_listings
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Marketplace investments policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'marketplace_investments' 
        AND policyname = 'Users can view own investments'
    ) THEN
        CREATE POLICY "Users can view own investments" ON public.marketplace_investments
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'marketplace_investments' 
        AND policyname = 'Authenticated users can create investments'
    ) THEN
        CREATE POLICY "Authenticated users can create investments" ON public.marketplace_investments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Marketplace categories policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'marketplace_categories' 
        AND policyname = 'Anyone can view active categories'
    ) THEN
        CREATE POLICY "Anyone can view active categories" ON public.marketplace_categories
            FOR SELECT USING (is_active = TRUE);
    END IF;
END $$;

-- 6. INSERT DEFAULT DATA
-- =====================================================

-- Insert default marketplace categories (only if they don't exist)
INSERT INTO public.marketplace_categories (name, description, icon, color, sort_order) 
SELECT * FROM (VALUES
('Technology', 'Tech startups and innovative solutions', 'laptop', '#3B82F6', 1),
('Real Estate', 'Property investments and development', 'home', '#10B981', 2),
('Healthcare', 'Medical and wellness investments', 'heart', '#EF4444', 3),
('Education', 'Educational technology and services', 'book', '#8B5CF6', 4),
('Environment', 'Green energy and sustainability', 'leaf', '#059669', 5),
('Finance', 'Financial services and fintech', 'dollar-sign', '#F59E0B', 6),
('Entertainment', 'Media, gaming, and entertainment', 'play', '#EC4899', 7),
('Other', 'Other investment opportunities', 'more-horizontal', '#6B7280', 8)
) AS v(name, description, icon, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.marketplace_categories WHERE marketplace_categories.name = v.name);

-- Insert sample marketplace listings (only if they don't exist)
-- Insert with all required NOT NULL columns to avoid constraint violations
INSERT INTO public.marketplace_listings (
    title, 
    description,
    listing_type,
    campaign_type,
    risk_level,
    expected_return_rate,
    expected_return_period,
    is_featured,
    is_verified,
    status,
    total_funding_goal
) 
SELECT * FROM (VALUES
(
    'Green Energy Solar Farm',
    'Invest in a large-scale solar energy project that will power 10,000 homes. This project offers stable returns and contributes to environmental sustainability.',
    'asset'::marketplace_listing_type,
    'open_ended'::campaign_type,
    'low'::risk_level,
    8.5,
    24,
    true,
    true,
    'active'::marketplace_listing_status,
    5000000.00
),
(
    'AI Healthcare Platform',
    'Revolutionary AI-powered healthcare platform that helps doctors diagnose diseases faster and more accurately. Join the future of medical technology.',
    'asset'::marketplace_listing_type,
    'open_ended'::campaign_type,
    'medium'::risk_level,
    12.0,
    36,
    false,
    true,
    'active'::marketplace_listing_status,
    2000000.00
),
(
    'Luxury Real Estate Development',
    'Premium residential complex in downtown with modern amenities, smart home features, and sustainable design. High-end investment opportunity.',
    'asset'::marketplace_listing_type,
    'open_ended'::campaign_type,
    'medium'::risk_level,
    10.0,
    48,
    true,
    true,
    'active'::marketplace_listing_status,
    8000000.00
),
(
    'Sustainable Agriculture Fund',
    'Support innovative farming technologies and sustainable agriculture practices that reduce environmental impact while increasing crop yields.',
    'asset'::marketplace_listing_type,
    'open_ended'::campaign_type,
    'low'::risk_level,
    7.5,
    18,
    false,
    true,
    'active'::marketplace_listing_status,
    3000000.00
),
(
    'Clean Water Initiative',
    'Invest in water purification and distribution systems for underserved communities. Make a positive impact while earning returns.',
    'asset'::marketplace_listing_type,
    'open_ended'::campaign_type,
    'low'::risk_level,
    9.0,
    30,
    false,
    true,
    'active'::marketplace_listing_status,
    1500000.00
)
) AS v(title, description, listing_type, campaign_type, risk_level, expected_return_rate, expected_return_period, is_featured, is_verified, status, total_funding_goal)
WHERE NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE marketplace_listings.title = v.title);

-- Update the inserted records with all data (e-commerce and investment)
UPDATE public.marketplace_listings 
SET 
    -- E-commerce data
    category = CASE 
        WHEN title = 'Green Energy Solar Farm' THEN 'Environment'
        WHEN title = 'AI Healthcare Platform' THEN 'Technology'
        WHEN title = 'Luxury Real Estate Development' THEN 'Real Estate'
        WHEN title = 'Sustainable Agriculture Fund' THEN 'Agriculture'
        WHEN title = 'Clean Water Initiative' THEN 'Infrastructure'
    END,
    condition = 'excellent',
    currency = 'USD',
    is_active = true,
    images = CASE 
        WHEN title = 'Green Energy Solar Farm' THEN ARRAY['https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400']
        WHEN title = 'AI Healthcare Platform' THEN ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400']
        WHEN title = 'Luxury Real Estate Development' THEN ARRAY['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400']
        WHEN title = 'Sustainable Agriculture Fund' THEN ARRAY['https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400']
        WHEN title = 'Clean Water Initiative' THEN ARRAY['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400']
    END,
    -- Investment data
    image_url = CASE 
        WHEN title = 'Green Energy Solar Farm' THEN 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400'
        WHEN title = 'AI Healthcare Platform' THEN 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'
        WHEN title = 'Luxury Real Estate Development' THEN 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'
        WHEN title = 'Sustainable Agriculture Fund' THEN 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400'
        WHEN title = 'Clean Water Initiative' THEN 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'
    END,
    funding_goal = CASE 
        WHEN title = 'Green Energy Solar Farm' THEN 5000000.00
        WHEN title = 'AI Healthcare Platform' THEN 2000000.00
        WHEN title = 'Luxury Real Estate Development' THEN 8000000.00
        WHEN title = 'Sustainable Agriculture Fund' THEN 3000000.00
        WHEN title = 'Clean Water Initiative' THEN 1500000.00
    END,
    min_investment = CASE 
        WHEN title = 'Green Energy Solar Farm' THEN 1000.00
        WHEN title = 'AI Healthcare Platform' THEN 500.00
        WHEN title = 'Luxury Real Estate Development' THEN 2500.00
        WHEN title = 'Sustainable Agriculture Fund' THEN 750.00
        WHEN title = 'Clean Water Initiative' THEN 250.00
    END,
    max_investment = CASE 
        WHEN title = 'Green Energy Solar Farm' THEN 100000.00
        WHEN title = 'AI Healthcare Platform' THEN 50000.00
        WHEN title = 'Luxury Real Estate Development' THEN 200000.00
        WHEN title = 'Sustainable Agriculture Fund' THEN 75000.00
        WHEN title = 'Clean Water Initiative' THEN 25000.00
    END,
    start_time = NOW(),
    end_time = CASE 
        WHEN title = 'Green Energy Solar Farm' THEN NOW() + INTERVAL '30 days'
        WHEN title = 'AI Healthcare Platform' THEN NOW() + INTERVAL '45 days'
        WHEN title = 'Luxury Real Estate Development' THEN NOW() + INTERVAL '60 days'
        WHEN title = 'Sustainable Agriculture Fund' THEN NOW() + INTERVAL '40 days'
        WHEN title = 'Clean Water Initiative' THEN NOW() + INTERVAL '35 days'
    END,
    token_ticker = CASE 
        WHEN title = 'Green Energy Solar Farm' THEN 'SOLAR'
        WHEN title = 'AI Healthcare Platform' THEN 'AIHC'
        WHEN title = 'Luxury Real Estate Development' THEN 'REAL'
        WHEN title = 'Sustainable Agriculture Fund' THEN 'AGRI'
        WHEN title = 'Clean Water Initiative' THEN 'WATER'
    END,
    token_supply = CASE 
        WHEN title = 'Green Energy Solar Farm' THEN 1000000
        WHEN title = 'AI Healthcare Platform' THEN 500000
        WHEN title = 'Luxury Real Estate Development' THEN 2000000
        WHEN title = 'Sustainable Agriculture Fund' THEN 750000
        WHEN title = 'Clean Water Initiative' THEN 300000
    END,
    -- Additional optional data (NOT NULL columns already set in INSERT)
    tags = CASE 
        WHEN title = 'Green Energy Solar Farm' THEN ARRAY['renewable', 'solar', 'green-energy', 'sustainable']
        WHEN title = 'AI Healthcare Platform' THEN ARRAY['ai', 'healthcare', 'technology', 'medical']
        WHEN title = 'Luxury Real Estate Development' THEN ARRAY['real-estate', 'luxury', 'residential', 'downtown']
        WHEN title = 'Sustainable Agriculture Fund' THEN ARRAY['agriculture', 'farming', 'sustainable', 'food']
        WHEN title = 'Clean Water Initiative' THEN ARRAY['water', 'infrastructure', 'clean', 'community']
    END,
    documents = ARRAY['/docs/prospectus.pdf'],
    updated_at = NOW(),
    expires_at = CASE 
        WHEN title = 'Green Energy Solar Farm' THEN NOW() + INTERVAL '30 days'
        WHEN title = 'AI Healthcare Platform' THEN NOW() + INTERVAL '45 days'
        WHEN title = 'Luxury Real Estate Development' THEN NOW() + INTERVAL '60 days'
        WHEN title = 'Sustainable Agriculture Fund' THEN NOW() + INTERVAL '40 days'
        WHEN title = 'Clean Water Initiative' THEN NOW() + INTERVAL '35 days'
    END
WHERE title IN (
    'Green Energy Solar Farm',
    'AI Healthcare Platform', 
    'Luxury Real Estate Development',
    'Sustainable Agriculture Fund',
    'Clean Water Initiative'
);

-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for merchants table
CREATE INDEX IF NOT EXISTS idx_merchants_country ON public.merchants(country);
CREATE INDEX IF NOT EXISTS idx_merchants_industry ON public.merchants(industry);
CREATE INDEX IF NOT EXISTS idx_merchants_business_type ON public.merchants(business_type);
CREATE INDEX IF NOT EXISTS idx_merchants_business_name ON public.merchants(business_name);

-- Indexes for loyalty_transactions table
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_amount ON public.loyalty_transactions(transaction_amount);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_date ON public.loyalty_transactions(transaction_date);

-- Indexes for marketplace tables
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON public.marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_user ON public.marketplace_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_listing ON public.marketplace_investments(listing_id);

-- 8. UPDATE EXISTING DATA
-- =====================================================

-- Update existing merchants with default country if null
UPDATE public.merchants 
SET country = 'United States' 
WHERE country IS NULL;

-- Update existing merchants with business_type if null
UPDATE public.merchants 
SET business_type = CASE 
    WHEN LOWER(business_name) LIKE '%cafe%' OR LOWER(business_name) LIKE '%restaurant%' OR LOWER(business_name) LIKE '%food%' THEN 'restaurant'
    WHEN LOWER(business_name) LIKE '%spa%' OR LOWER(business_name) LIKE '%wellness%' OR LOWER(business_name) LIKE '%fitness%' THEN 'service'
    WHEN LOWER(business_name) LIKE '%tech%' OR LOWER(business_name) LIKE '%electronics%' THEN 'retail'
    WHEN LOWER(business_name) LIKE '%fashion%' OR LOWER(business_name) LIKE '%clothing%' THEN 'retail'
    WHEN LOWER(business_name) LIKE '%book%' THEN 'retail'
    ELSE 'service'
END
WHERE business_type IS NULL;

-- Update existing merchants with industry from business_name if null
UPDATE public.merchants 
SET industry = business_name 
WHERE industry IS NULL AND business_name IS NOT NULL;

-- Update existing loyalty_transactions with default amount if null
UPDATE public.loyalty_transactions 
SET transaction_amount = 0.00 
WHERE transaction_amount IS NULL;

-- 9. VERIFICATION QUERIES
-- =====================================================

-- Verify all tables and columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('merchants', 'loyalty_transactions', 'terms_privacy_acceptance', 'marketplace_listings', 'marketplace_investments', 'marketplace_categories')
ORDER BY table_name, ordinal_position;

-- Verify RPC function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_loyalty_card';

-- Count records in each table
SELECT 
    'merchants' as table_name, COUNT(*) as record_count FROM public.merchants
UNION ALL
SELECT 
    'loyalty_transactions' as table_name, COUNT(*) as record_count FROM public.loyalty_transactions
UNION ALL
SELECT 
    'terms_privacy_acceptance' as table_name, COUNT(*) as record_count FROM public.terms_privacy_acceptance
UNION ALL
SELECT 
    'marketplace_listings' as table_name, COUNT(*) as record_count FROM public.marketplace_listings
UNION ALL
SELECT 
    'marketplace_investments' as table_name, COUNT(*) as record_count FROM public.marketplace_investments
UNION ALL
SELECT 
    'marketplace_categories' as table_name, COUNT(*) as record_count FROM public.marketplace_categories;

-- =====================================================
-- END OF COMPREHENSIVE DATABASE FIXES
-- =====================================================
