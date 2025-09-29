-- Create Only Missing Tables in Public Schema
-- This script creates only the tables that are missing from the public schema
-- Date: 2025-01-28

-- 1. Create terms_privacy_acceptance table in public schema
CREATE TABLE IF NOT EXISTS public.terms_privacy_acceptance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    terms_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    privacy_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    terms_accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    privacy_accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Create marketplace_categories table in public schema
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(7),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Create marketplace_stats table in public schema
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

-- 4. Enable Row Level Security for the new tables
ALTER TABLE public.terms_privacy_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_stats ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for the new tables

-- Terms privacy acceptance policies
CREATE POLICY "Users can view their own terms acceptance" ON public.terms_privacy_acceptance
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own terms acceptance" ON public.terms_privacy_acceptance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own terms acceptance" ON public.terms_privacy_acceptance
    FOR UPDATE USING (auth.uid() = user_id);

-- Marketplace categories policies
CREATE POLICY "Anyone can view active categories" ON public.marketplace_categories
    FOR SELECT USING (is_active = true);

-- Marketplace stats policies
CREATE POLICY "Anyone can view marketplace stats" ON public.marketplace_stats
    FOR SELECT USING (true);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_terms_privacy_acceptance_user_id ON public.terms_privacy_acceptance(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_active ON public.marketplace_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_sort ON public.marketplace_categories(sort_order);

-- 7. Insert default data

-- Insert default marketplace categories
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

-- Insert initial marketplace stats
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

-- 8. Create functions for common operations

-- Function to get user terms privacy acceptance
CREATE OR REPLACE FUNCTION public.get_user_terms_privacy_acceptance(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    terms_version VARCHAR(50),
    privacy_version VARCHAR(50),
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    privacy_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tpa.id,
        tpa.user_id,
        tpa.terms_version,
        tpa.privacy_version,
        tpa.terms_accepted_at,
        tpa.privacy_accepted_at,
        tpa.created_at
    FROM public.terms_privacy_acceptance tpa
    WHERE tpa.user_id = user_uuid
    ORDER BY tpa.created_at DESC
    LIMIT 1;
END;
$$;

-- Function to accept terms and privacy
CREATE OR REPLACE FUNCTION public.accept_terms_privacy(
    user_uuid UUID,
    terms_ver VARCHAR(50) DEFAULT '1.0',
    privacy_ver VARCHAR(50) DEFAULT '1.0',
    user_ip INET DEFAULT NULL,
    user_agent_text TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    acceptance_id UUID;
BEGIN
    INSERT INTO public.terms_privacy_acceptance (
        user_id,
        terms_version,
        privacy_version,
        ip_address,
        user_agent
    ) VALUES (
        user_uuid,
        terms_ver,
        privacy_ver,
        user_ip,
        user_agent_text
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        terms_version = EXCLUDED.terms_version,
        privacy_version = EXCLUDED.privacy_version,
        terms_accepted_at = NOW(),
        privacy_accepted_at = NOW(),
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        updated_at = NOW()
    RETURNING id INTO acceptance_id;
    
    RETURN acceptance_id;
END;
$$;

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

COMMIT;
