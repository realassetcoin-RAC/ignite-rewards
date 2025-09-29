-- Create Missing Marketplace Tables
-- This script creates the marketplace tables that are missing from the database
-- Date: 2025-01-28

-- 1. Create marketplace_listings table
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    listing_type VARCHAR(50) NOT NULL DEFAULT 'asset' CHECK (listing_type IN ('asset', 'service', 'investment', 'nft')),
    campaign_type VARCHAR(50) NOT NULL DEFAULT 'open_ended' CHECK (campaign_type IN ('open_ended', 'time_limited', 'goal_based')),
    target_funding_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_funding_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_investor_count INTEGER NOT NULL DEFAULT 0,
    minimum_investment DECIMAL(10,2) NOT NULL DEFAULT 100,
    maximum_investment DECIMAL(15,2),
    risk_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    expected_return_rate DECIMAL(5,2),
    expected_return_period INTEGER, -- in days
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    documents TEXT[] DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create marketplace_investments table
CREATE TABLE IF NOT EXISTS public.marketplace_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    investment_amount DECIMAL(15,2) NOT NULL,
    investment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
    transaction_hash TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Create marketplace_stats table (for caching stats)
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

-- 4. Create marketplace_categories table
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

-- 5. Enable Row Level Security
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Marketplace listings policies
CREATE POLICY "Anyone can view active marketplace listings" ON public.marketplace_listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view their own listings" ON public.marketplace_listings
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create listings" ON public.marketplace_listings
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own listings" ON public.marketplace_listings
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own listings" ON public.marketplace_listings
    FOR DELETE USING (auth.uid() = created_by);

-- Marketplace investments policies
CREATE POLICY "Users can view their own investments" ON public.marketplace_investments
    FOR SELECT USING (auth.uid() = investor_id);

CREATE POLICY "Listing creators can view investments in their listings" ON public.marketplace_investments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.marketplace_listings 
            WHERE id = listing_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create investments" ON public.marketplace_investments
    FOR INSERT WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Users can update their own investments" ON public.marketplace_investments
    FOR UPDATE USING (auth.uid() = investor_id);

-- Marketplace stats policies
CREATE POLICY "Anyone can view marketplace stats" ON public.marketplace_stats
    FOR SELECT USING (true);

-- Marketplace categories policies
CREATE POLICY "Anyone can view active categories" ON public.marketplace_categories
    FOR SELECT USING (is_active = true);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON public.marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_by ON public.marketplace_listings(created_by);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON public.marketplace_listings(created_at);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_featured ON public.marketplace_listings(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_marketplace_investments_listing_id ON public.marketplace_investments(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_investor_id ON public.marketplace_investments(investor_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_status ON public.marketplace_investments(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_date ON public.marketplace_investments(investment_date);

CREATE INDEX IF NOT EXISTS idx_marketplace_categories_active ON public.marketplace_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_sort ON public.marketplace_categories(sort_order);

-- 8. Create functions for marketplace operations

-- Function to update marketplace stats
CREATE OR REPLACE FUNCTION public.update_marketplace_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.marketplace_stats (
        total_listings,
        active_listings,
        total_funding_raised,
        total_investments,
        total_users_invested,
        average_investment_amount,
        last_updated
    )
    SELECT 
        COUNT(*) as total_listings,
        COUNT(*) FILTER (WHERE status = 'active') as active_listings,
        COALESCE(SUM(current_funding_amount), 0) as total_funding_raised,
        COALESCE(SUM(current_investor_count), 0) as total_investments,
        COUNT(DISTINCT mi.investor_id) as total_users_invested,
        CASE 
            WHEN COUNT(mi.id) > 0 THEN AVG(mi.investment_amount)
            ELSE 0
        END as average_investment_amount,
        NOW() as last_updated
    FROM public.marketplace_listings ml
    LEFT JOIN public.marketplace_investments mi ON ml.id = mi.listing_id
    ON CONFLICT (id) DO UPDATE SET
        total_listings = EXCLUDED.total_listings,
        active_listings = EXCLUDED.active_listings,
        total_funding_raised = EXCLUDED.total_funding_raised,
        total_investments = EXCLUDED.total_investments,
        total_users_invested = EXCLUDED.total_users_invested,
        average_investment_amount = EXCLUDED.average_investment_amount,
        last_updated = EXCLUDED.last_updated;
END;
$$;

-- Function to get user's NFT multiplier for marketplace
CREATE OR REPLACE FUNCTION public.get_user_nft_multiplier(user_uuid UUID)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    multiplier DECIMAL(5,2) := 1.0;
BEGIN
    -- Get the user's loyalty card tier and apply multiplier
    SELECT 
        CASE 
            WHEN ulc.tier_level = 'Very Rare' THEN 1.5
            WHEN ulc.tier_level = 'Rare' THEN 1.3
            WHEN ulc.tier_level = 'Less Common' THEN 1.1
            ELSE 1.0
        END
    INTO multiplier
    FROM public.user_loyalty_cards ulc
    WHERE ulc.user_id = user_uuid 
    AND ulc.is_active = true
    ORDER BY ulc.created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(multiplier, 1.0);
END;
$$;

-- 9. Insert default categories
INSERT INTO public.marketplace_categories (name, description, icon, color, sort_order) VALUES
('Technology', 'Tech startups and innovative solutions', 'laptop', '#3B82F6', 1),
('Real Estate', 'Property investments and development', 'home', '#10B981', 2),
('Healthcare', 'Medical and wellness investments', 'heart', '#EF4444', 3),
('Education', 'Educational technology and services', 'book', '#8B5CF6', 4),
('Environment', 'Green energy and sustainability', 'leaf', '#059669', 5),
('Finance', 'Financial services and fintech', 'dollar-sign', '#F59E0B', 6),
('Entertainment', 'Media, gaming, and entertainment', 'play', '#EC4899', 7),
('Other', 'Other investment opportunities', 'more-horizontal', '#6B7280', 8)
ON CONFLICT (name) DO NOTHING;

-- 10. Insert initial marketplace stats
INSERT INTO public.marketplace_stats (
    total_listings,
    active_listings,
    total_funding_raised,
    total_investments,
    total_users_invested,
    average_investment_amount,
    last_updated
) VALUES (0, 0, 0, 0, 0, 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- 11. Create triggers to automatically update stats
CREATE OR REPLACE FUNCTION public.trigger_update_marketplace_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM public.update_marketplace_stats();
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_marketplace_listings_stats ON public.marketplace_listings;
CREATE TRIGGER trigger_marketplace_listings_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_listings
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_update_marketplace_stats();

DROP TRIGGER IF EXISTS trigger_marketplace_investments_stats ON public.marketplace_investments;
CREATE TRIGGER trigger_marketplace_investments_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_investments
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_update_marketplace_stats();

COMMIT;
