-- Cleanup API Schema and Create Tables in Public Schema
-- This script removes all tables from the api schema and creates them in public schema
-- Date: 2025-01-28

-- 1. Drop all tables from api schema (if they exist)
DROP TABLE IF EXISTS api.loyalty_transactions CASCADE;
DROP TABLE IF EXISTS api.merchants CASCADE;
DROP TABLE IF EXISTS api.user_loyalty_cards CASCADE;
DROP TABLE IF EXISTS api.nft_types CASCADE;
DROP TABLE IF EXISTS api.user_solana_wallets CASCADE;
DROP TABLE IF EXISTS api.terms_privacy_acceptance CASCADE;
DROP TABLE IF EXISTS api.user_notifications CASCADE;
DROP TABLE IF EXISTS api.user_asset_selections CASCADE;
DROP TABLE IF EXISTS api.asset_initiatives CASCADE;
DROP TABLE IF EXISTS api.marketplace_listings CASCADE;
DROP TABLE IF EXISTS api.marketplace_investments CASCADE;
DROP TABLE IF EXISTS api.marketplace_categories CASCADE;
DROP TABLE IF EXISTS api.marketplace_stats CASCADE;

-- 2. Drop the api schema entirely (if it exists)
DROP SCHEMA IF EXISTS api CASCADE;

-- 3. Create merchants table in public schema
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT,
    contact_email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    subscription_plan TEXT CHECK (subscription_plan IN ('startup', 'momentum', 'energizer', 'cloud9', 'super')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Create loyalty_transactions table in public schema
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    loyalty_number TEXT NOT NULL,
    transaction_amount DECIMAL(10,2) NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    transaction_reference TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Create nft_types table in public schema
CREATE TABLE IF NOT EXISTS public.nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Less Common', 'Rare', 'Very Rare')),
    earn_on_spend_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.0100,
    buy_price_usdt DECIMAL(10,2) NOT NULL DEFAULT 0,
    upgrade_bonus_ratio DECIMAL(5,4) NOT NULL DEFAULT 0,
    evolution_min_investment DECIMAL(10,2) NOT NULL DEFAULT 0,
    evolution_earnings_ratio DECIMAL(5,4) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Create user_loyalty_cards table in public schema
CREATE TABLE IF NOT EXISTS public.user_loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nft_type_id UUID REFERENCES public.nft_types(id),
    loyalty_number TEXT NOT NULL UNIQUE,
    card_number TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    points_balance INTEGER NOT NULL DEFAULT 0,
    tier_level TEXT NOT NULL DEFAULT 'Common',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Create user_solana_wallets table in public schema
CREATE TABLE IF NOT EXISTS public.user_solana_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    solana_address TEXT NOT NULL UNIQUE,
    seed_phrase_encrypted TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Create terms_privacy_acceptance table in public schema
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

-- 9. Create user_notifications table in public schema
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'earning', 'asset_link', 'new_feature', 'system', 'alert')),
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'earnings', 'asset_linking', 'new_features')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. Create user_asset_selections table in public schema
CREATE TABLE IF NOT EXISTS public.user_asset_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_initiative_id UUID NOT NULL REFERENCES public.asset_initiatives(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, is_active)
);

-- 11. Create asset_initiatives table in public schema
CREATE TABLE IF NOT EXISTS public.asset_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('environmental', 'social', 'economic', 'health')),
    icon VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 12. Create marketplace tables in public schema
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
    expected_return_period INTEGER,
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

-- 13. Enable Row Level Security for all tables
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_solana_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_privacy_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_asset_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_stats ENABLE ROW LEVEL SECURITY;

-- 14. Create RLS Policies

-- Merchants policies
CREATE POLICY "Users can view active merchants" ON public.merchants
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view their own merchant" ON public.merchants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own merchant" ON public.merchants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchant" ON public.merchants
    FOR UPDATE USING (auth.uid() = user_id);

-- Loyalty transactions policies
CREATE POLICY "Users can view their own transactions" ON public.loyalty_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Merchants can view their transactions" ON public.loyalty_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.merchants 
            WHERE id = merchant_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create transactions" ON public.loyalty_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User loyalty cards policies
CREATE POLICY "Users can view their own loyalty cards" ON public.user_loyalty_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loyalty cards" ON public.user_loyalty_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty cards" ON public.user_loyalty_cards
    FOR UPDATE USING (auth.uid() = user_id);

-- NFT types policies
CREATE POLICY "Anyone can view active NFT types" ON public.nft_types
    FOR SELECT USING (is_active = true);

-- User Solana wallets policies
CREATE POLICY "Users can view their own wallets" ON public.user_solana_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallets" ON public.user_solana_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets" ON public.user_solana_wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Terms privacy acceptance policies
CREATE POLICY "Users can view their own terms acceptance" ON public.terms_privacy_acceptance
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own terms acceptance" ON public.terms_privacy_acceptance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own terms acceptance" ON public.terms_privacy_acceptance
    FOR UPDATE USING (auth.uid() = user_id);

-- User notifications policies
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- User asset selections policies
CREATE POLICY "Users can view their own asset selections" ON public.user_asset_selections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own asset selections" ON public.user_asset_selections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own asset selections" ON public.user_asset_selections
    FOR UPDATE USING (auth.uid() = user_id);

-- Asset initiatives policies
CREATE POLICY "Anyone can view active asset initiatives" ON public.asset_initiatives
    FOR SELECT USING (is_active = true);

-- Marketplace policies
CREATE POLICY "Anyone can view active marketplace listings" ON public.marketplace_listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view their own listings" ON public.marketplace_listings
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create listings" ON public.marketplace_listings
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own listings" ON public.marketplace_listings
    FOR UPDATE USING (auth.uid() = created_by);

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

CREATE POLICY "Anyone can view active categories" ON public.marketplace_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view marketplace stats" ON public.marketplace_stats
    FOR SELECT USING (true);

-- 15. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON public.merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON public.merchants(status);
CREATE INDEX IF NOT EXISTS idx_merchants_country ON public.merchants(country);
CREATE INDEX IF NOT EXISTS idx_merchants_business_type ON public.merchants(business_type);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_merchant_id ON public.loyalty_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_date ON public.loyalty_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_amount ON public.loyalty_transactions(transaction_amount);

CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_user_id ON public.user_loyalty_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_loyalty_number ON public.user_loyalty_cards(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_active ON public.user_loyalty_cards(is_active);

CREATE INDEX IF NOT EXISTS idx_nft_types_active ON public.nft_types(is_active);
CREATE INDEX IF NOT EXISTS idx_nft_types_rarity ON public.nft_types(rarity);

CREATE INDEX IF NOT EXISTS idx_user_solana_wallets_user_id ON public.user_solana_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_solana_wallets_address ON public.user_solana_wallets(solana_address);

CREATE INDEX IF NOT EXISTS idx_terms_privacy_acceptance_user_id ON public.terms_privacy_acceptance(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_user_asset_selections_user_id ON public.user_asset_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_asset_selections_active ON public.user_asset_selections(is_active);

CREATE INDEX IF NOT EXISTS idx_asset_initiatives_active ON public.asset_initiatives(is_active);
CREATE INDEX IF NOT EXISTS idx_asset_initiatives_category ON public.asset_initiatives(category);

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

-- 16. Create functions for common operations

-- Function to get user loyalty card
CREATE OR REPLACE FUNCTION public.get_user_loyalty_card(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    nft_type_id UUID,
    loyalty_number TEXT,
    card_number TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    points_balance INTEGER,
    tier_level TEXT,
    is_active BOOLEAN,
    nft_name TEXT,
    nft_display_name TEXT,
    nft_rarity TEXT,
    nft_earn_ratio DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
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
        ulc.full_name,
        ulc.email,
        ulc.phone,
        ulc.points_balance,
        ulc.tier_level,
        ulc.is_active,
        nt.nft_name,
        nt.display_name as nft_display_name,
        nt.rarity as nft_rarity,
        nt.earn_on_spend_ratio as nft_earn_ratio,
        ulc.created_at
    FROM public.user_loyalty_cards ulc
    LEFT JOIN public.nft_types nt ON ulc.nft_type_id = nt.id
    WHERE ulc.user_id = user_uuid
    AND ulc.is_active = TRUE
    ORDER BY ulc.created_at DESC
    LIMIT 1;
END;
$$;

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

-- Function to get user's NFT multiplier for marketplace
CREATE OR REPLACE FUNCTION public.get_user_nft_multiplier(user_uuid UUID)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    multiplier DECIMAL(5,2) := 1.0;
BEGIN
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

-- 17. Insert default data

-- Insert default NFT types
INSERT INTO public.nft_types (nft_name, display_name, rarity, earn_on_spend_ratio, buy_price_usdt, upgrade_bonus_ratio, evolution_min_investment, evolution_earnings_ratio) VALUES
('common_card', 'Common Card', 'Common', 0.0100, 0.00, 0.0000, 0.00, 0.0000),
('less_common_card', 'Less Common Card', 'Less Common', 0.0110, 10.00, 0.1000, 100.00, 0.0010),
('rare_card', 'Rare Card', 'Rare', 0.0130, 50.00, 0.3000, 500.00, 0.0030),
('very_rare_card', 'Very Rare Card', 'Very Rare', 0.0150, 100.00, 0.5000, 1000.00, 0.0050)
ON CONFLICT (nft_name) DO NOTHING;

-- Insert default asset initiatives
INSERT INTO public.asset_initiatives (name, description, category, icon) VALUES
('Renewable Energy', 'Invest in clean energy solutions', 'environmental', 'solar-panel'),
('Education Access', 'Support educational programs worldwide', 'social', 'book'),
('Economic Development', 'Foster economic growth in communities', 'economic', 'trending-up'),
('Healthcare Innovation', 'Advance medical research and care', 'health', 'heart')
ON CONFLICT (name) DO NOTHING;

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

-- 18. Create triggers to automatically update stats
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
