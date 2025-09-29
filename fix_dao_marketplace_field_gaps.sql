-- Fix DAO and Marketplace Field Gaps
-- This script adds missing columns to align frontend forms with database schema
-- Date: 2025-01-28

-- ===========================================
-- 1. ADD MISSING COLUMNS TO MARKETPLACE_LISTINGS
-- ===========================================

-- Add short_description column (missing from database, present in frontend)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marketplace_listings' 
        AND column_name = 'short_description' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN short_description TEXT;
        RAISE NOTICE 'Added short_description column to marketplace_listings';
    END IF;
END $$;

-- Add asset_type column (missing from database, present in frontend)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marketplace_listings' 
        AND column_name = 'asset_type' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN asset_type VARCHAR(50) DEFAULT 'other';
        RAISE NOTICE 'Added asset_type column to marketplace_listings';
    END IF;
END $$;

-- Add image_url column (single image, frontend uses this)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marketplace_listings' 
        AND column_name = 'image_url' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN image_url TEXT;
        RAISE NOTICE 'Added image_url column to marketplace_listings';
    END IF;
END $$;

-- Add category column (required field missing from database)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marketplace_listings' 
        AND column_name = 'category' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN category VARCHAR(100) DEFAULT 'Other';
        RAISE NOTICE 'Added category column to marketplace_listings';
    END IF;
END $$;

-- ===========================================
-- 2. ADD MISSING COLUMNS TO DAO_ORGANIZATIONS
-- ===========================================

-- Add created_by column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dao_organizations' 
        AND column_name = 'created_by' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.dao_organizations ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added created_by column to dao_organizations';
    END IF;
END $$;

-- ===========================================
-- 3. ADD MISSING COLUMNS TO DAO_PROPOSALS
-- ===========================================

-- Add proposer_id column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dao_proposals' 
        AND column_name = 'proposer_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.dao_proposals ADD COLUMN proposer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added proposer_id column to dao_proposals';
    END IF;
END $$;

-- ===========================================
-- 4. CREATE MISSING TABLES IF THEY DON'T EXIST
-- ===========================================

-- Create marketplace_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(7), -- hex color code
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create marketplace_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_listings INTEGER NOT NULL DEFAULT 0,
    active_listings INTEGER NOT NULL DEFAULT 0,
    total_funding_raised DECIMAL(20,2) NOT NULL DEFAULT 0,
    total_investments INTEGER NOT NULL DEFAULT 0,
    total_users_invested INTEGER NOT NULL DEFAULT 0,
    average_investment_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ===========================================
-- 5. INSERT DEFAULT MARKETPLACE CATEGORIES
-- ===========================================

INSERT INTO public.marketplace_categories (name, description, icon, color, sort_order) VALUES
('Real Estate', 'Real estate investment opportunities', 'home', '#3B82F6', 1),
('Startup Equity', 'Early-stage startup investments', 'trending-up', '#10B981', 2),
('Commodities', 'Commodity trading and investments', 'package', '#F59E0B', 3),
('Cryptocurrency', 'Digital currency investments', 'bitcoin', '#8B5CF6', 4),
('Bonds', 'Fixed-income securities', 'shield', '#06B6D4', 5),
('REIT', 'Real Estate Investment Trusts', 'building', '#84CC16', 6),
('Energy', 'Energy sector investments', 'zap', '#EF4444', 7),
('Technology', 'Technology sector investments', 'cpu', '#6366F1', 8),
('Healthcare', 'Healthcare sector investments', 'heart', '#EC4899', 9),
('Other', 'Other investment opportunities', 'more-horizontal', '#6B7280', 10)
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on new tables
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_stats ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 7. CREATE RLS POLICIES
-- ===========================================

-- Marketplace categories policies
CREATE POLICY "Anyone can view active marketplace categories" ON public.marketplace_categories
    FOR SELECT USING (is_active = true);

-- Marketplace stats policies
CREATE POLICY "Anyone can view marketplace stats" ON public.marketplace_stats
    FOR SELECT USING (true);

-- ===========================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ===========================================

-- Marketplace categories indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_active ON public.marketplace_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_sort_order ON public.marketplace_categories(sort_order);

-- Marketplace listings indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON public.marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_asset_type ON public.marketplace_listings(asset_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_short_description ON public.marketplace_listings(short_description);

-- ===========================================
-- 9. VERIFICATION QUERIES
-- ===========================================

-- Verify all columns exist
SELECT 'MARKETPLACE_LISTINGS COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'marketplace_listings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'DAO_ORGANIZATIONS COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'dao_organizations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'DAO_PROPOSALS COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'dao_proposals' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify categories were inserted
SELECT 'MARKETPLACE CATEGORIES:' as info;
SELECT name, description, is_active FROM public.marketplace_categories ORDER BY sort_order;

-- ===========================================
-- 10. COMPLETION MESSAGE
-- ===========================================

SELECT '✅ DAO and Marketplace field gaps fixed successfully!' as status;
SELECT '📋 Next steps:' as info;
SELECT '1. Update frontend forms with new fields' as step;
SELECT '2. Test form submissions' as step;
SELECT '3. Verify data mapping works correctly' as step;
