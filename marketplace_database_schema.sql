-- Tokenized Asset and Initiative Marketplace Database Schema
-- This schema supports the marketplace where users can invest loyalty rewards in tokenized assets

-- Create enum types for marketplace
CREATE TYPE public.marketplace_listing_type AS ENUM ('asset', 'initiative');
CREATE TYPE public.marketplace_listing_status AS ENUM ('draft', 'active', 'funded', 'cancelled', 'completed');
CREATE TYPE public.investment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded');
CREATE TYPE public.campaign_type AS ENUM ('time_bound', 'open_ended');

-- Table for marketplace listings (assets and initiatives)
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    image_url VARCHAR(500),
    listing_type marketplace_listing_type NOT NULL,
    status marketplace_listing_status DEFAULT 'draft',
    
    -- Funding configuration
    total_funding_goal DECIMAL(15,2) NOT NULL,
    current_funding_amount DECIMAL(15,2) DEFAULT 0,
    investment_cap INTEGER, -- Optional limit on number of investors
    current_investor_count INTEGER DEFAULT 0,
    
    -- Campaign settings
    campaign_type campaign_type DEFAULT 'open_ended',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Tokenization details
    token_symbol VARCHAR(10),
    total_token_supply BIGINT,
    token_price DECIMAL(15,8), -- Price per token in loyalty rewards
    
    -- Asset/Initiative specific details
    asset_type VARCHAR(100), -- e.g., 'real_estate', 'startup_equity', 'commodity'
    expected_return_rate DECIMAL(5,2), -- Annual return percentage
    risk_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    minimum_investment DECIMAL(10,2) DEFAULT 100,
    maximum_investment DECIMAL(15,2),
    
    -- Metadata
    tags TEXT[], -- Array of tags for categorization
    is_featured BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id)
);

-- Table for user investments in marketplace listings
CREATE TABLE IF NOT EXISTS public.marketplace_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    
    -- Investment details
    investment_amount DECIMAL(15,2) NOT NULL,
    token_amount BIGINT NOT NULL, -- Number of tokens received
    effective_investment_amount DECIMAL(15,2) NOT NULL, -- Amount after NFT multiplier
    nft_multiplier DECIMAL(3,2) DEFAULT 1.00, -- 1.5x for NFT holders
    
    -- Status tracking
    status investment_status DEFAULT 'pending',
    transaction_hash VARCHAR(255), -- Blockchain transaction hash if applicable
    
    -- Timestamps
    invested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, listing_id) -- One investment per user per listing
);

-- Table for passive income distributions
CREATE TABLE IF NOT EXISTS public.passive_income_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    distribution_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    distribution_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Distribution details
    total_distribution_amount DECIMAL(15,2) NOT NULL,
    distribution_per_token DECIMAL(15,8) NOT NULL,
    
    -- Status
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for user passive income earnings
CREATE TABLE IF NOT EXISTS public.user_passive_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    investment_id UUID NOT NULL REFERENCES public.marketplace_investments(id) ON DELETE CASCADE,
    distribution_id UUID NOT NULL REFERENCES public.passive_income_distributions(id) ON DELETE CASCADE,
    
    -- Earnings details
    token_amount BIGINT NOT NULL, -- User's token balance at time of distribution
    earnings_amount DECIMAL(15,2) NOT NULL,
    is_claimed BOOLEAN DEFAULT false,
    claimed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for NFT card tier configurations
CREATE TABLE IF NOT EXISTS public.nft_card_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Investment benefits
    investment_multiplier DECIMAL(3,2) DEFAULT 1.00,
    minimum_balance_required DECIMAL(15,2) DEFAULT 0,
    
    -- Access permissions
    can_access_premium_listings BOOLEAN DEFAULT false,
    can_access_early_listings BOOLEAN DEFAULT false,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for marketplace analytics and statistics
CREATE TABLE IF NOT EXISTS public.marketplace_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    
    -- View and interaction tracking
    total_views INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    total_investments INTEGER DEFAULT 0,
    total_investment_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Time-based metrics
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(listing_id, date_recorded)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_type ON public.marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_featured ON public.marketplace_listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_end_date ON public.marketplace_listings(end_date);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_user_id ON public.marketplace_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_listing_id ON public.marketplace_investments(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_status ON public.marketplace_investments(status);
CREATE INDEX IF NOT EXISTS idx_passive_earnings_user_id ON public.user_passive_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_passive_earnings_claimed ON public.user_passive_earnings(is_claimed);

-- Enable Row Level Security (RLS)
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passive_income_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passive_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_card_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_listings
CREATE POLICY "Public can view active listings" ON public.marketplace_listings
    FOR SELECT USING (status = 'active' OR status = 'funded');

CREATE POLICY "Admins can manage all listings" ON public.marketplace_listings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view their own created listings" ON public.marketplace_listings
    FOR SELECT USING (created_by = auth.uid());

-- RLS Policies for marketplace_investments
CREATE POLICY "Users can view their own investments" ON public.marketplace_investments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create investments" ON public.marketplace_investments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all investments" ON public.marketplace_investments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for passive income distributions
CREATE POLICY "Admins can manage distributions" ON public.passive_income_distributions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for user passive earnings
CREATE POLICY "Users can view their own earnings" ON public.user_passive_earnings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their earnings (claim)" ON public.user_passive_earnings
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for NFT card tiers
CREATE POLICY "Public can view active NFT tiers" ON public.nft_card_tiers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage NFT tiers" ON public.nft_card_tiers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for marketplace analytics
CREATE POLICY "Admins can view all analytics" ON public.marketplace_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Note: NFT card tiers are managed by the loyalty platform
-- This table stores the mapping between loyalty NFT cards and marketplace benefits
-- The actual NFT ownership is checked from the loyalty platform's NFT system

-- Insert marketplace benefit mappings for existing loyalty NFT tiers
-- These map to the card types in your existing loyalty system
INSERT INTO public.nft_card_tiers (tier_name, display_name, description, investment_multiplier, can_access_premium_listings, can_access_early_listings) VALUES
('basic', 'Basic', 'Basic loyalty card with standard investment access', 1.00, false, false),
('standard', 'Standard', 'Standard loyalty card with enhanced features', 1.10, false, false),
('premium', 'Premium', 'Premium loyalty card with investment benefits', 1.25, true, false),
('premium_plus', 'Premium+', 'Premium Plus loyalty card with enhanced benefits', 1.35, true, false),
('vip', 'VIP', 'VIP loyalty card with maximum investment benefits', 1.50, true, true),
('vip_plus', 'VIP+', 'VIP Plus loyalty card with exclusive access', 1.75, true, true);

-- Create function to update listing funding status
CREATE OR REPLACE FUNCTION update_listing_funding_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the listing's current funding amount and investor count
    UPDATE public.marketplace_listings 
    SET 
        current_funding_amount = (
            SELECT COALESCE(SUM(investment_amount), 0)
            FROM public.marketplace_investments 
            WHERE listing_id = NEW.listing_id AND status = 'confirmed'
        ),
        current_investor_count = (
            SELECT COUNT(*)
            FROM public.marketplace_investments 
            WHERE listing_id = NEW.listing_id AND status = 'confirmed'
        ),
        updated_at = NOW()
    WHERE id = NEW.listing_id;
    
    -- Check if funding goal is reached
    UPDATE public.marketplace_listings 
    SET status = 'funded'
    WHERE id = NEW.listing_id 
    AND current_funding_amount >= total_funding_goal
    AND status = 'active';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update funding status
CREATE TRIGGER trigger_update_listing_funding_status
    AFTER INSERT OR UPDATE ON public.marketplace_investments
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_funding_status();

-- Create function to check if time-bound campaigns have expired
CREATE OR REPLACE FUNCTION check_expired_campaigns()
RETURNS void AS $$
BEGIN
    UPDATE public.marketplace_listings 
    SET status = 'cancelled'
    WHERE campaign_type = 'time_bound' 
    AND end_date < NOW() 
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's NFT multiplier
CREATE OR REPLACE FUNCTION get_user_nft_multiplier(user_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    multiplier DECIMAL(3,2) := 1.00;
BEGIN
    -- This would integrate with the existing NFT card system
    -- For now, return default multiplier
    -- TODO: Integrate with actual NFT card checking logic
    RETURN multiplier;
END;
$$ LANGUAGE plpgsql;
