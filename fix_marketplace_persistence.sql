-- Fix Marketplace Listings Persistence Issue
-- This script ensures the marketplace tables exist and are properly configured

-- First, check if the marketplace_listings table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    image_url VARCHAR(500),
    listing_type VARCHAR(20) NOT NULL DEFAULT 'asset',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    
    -- Funding configuration
    total_funding_goal DECIMAL(15,2) NOT NULL,
    current_funding_amount DECIMAL(15,2) DEFAULT 0,
    investment_cap INTEGER,
    current_investor_count INTEGER DEFAULT 0,
    
    -- Campaign settings
    campaign_type VARCHAR(20) DEFAULT 'open_ended',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Tokenization details
    token_symbol VARCHAR(10),
    total_token_supply BIGINT,
    token_price DECIMAL(15,8),
    
    -- Asset/Initiative specific details
    asset_type VARCHAR(100),
    expected_return_rate DECIMAL(5,2),
    risk_level VARCHAR(20) DEFAULT 'medium',
    minimum_investment DECIMAL(10,2) DEFAULT 100,
    maximum_investment DECIMAL(15,2),
    
    -- Metadata
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    
    -- Audit fields
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID
);

-- Create marketplace_investments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    
    -- Investment details
    investment_amount DECIMAL(15,2) NOT NULL,
    token_amount BIGINT NOT NULL,
    effective_investment_amount DECIMAL(15,2) NOT NULL,
    nft_multiplier DECIMAL(3,2) DEFAULT 1.00,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending',
    transaction_hash VARCHAR(255),
    
    -- Timestamps
    invested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_investments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Admins can manage all listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can view their own created listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can view their own investments" ON public.marketplace_investments;
DROP POLICY IF EXISTS "Users can create investments" ON public.marketplace_investments;
DROP POLICY IF EXISTS "Admins can view all investments" ON public.marketplace_investments;

-- Create RLS Policies for marketplace_listings
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

CREATE POLICY "Users can create listings" ON public.marketplace_listings
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own listings" ON public.marketplace_listings
    FOR UPDATE USING (created_by = auth.uid());

-- Create RLS Policies for marketplace_investments
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

-- Grant necessary permissions
GRANT ALL ON public.marketplace_listings TO authenticated;
GRANT ALL ON public.marketplace_listings TO service_role;
GRANT ALL ON public.marketplace_investments TO authenticated;
GRANT ALL ON public.marketplace_investments TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_type ON public.marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_featured ON public.marketplace_listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_by ON public.marketplace_listings(created_by);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_user_id ON public.marketplace_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_listing_id ON public.marketplace_investments(listing_id);

-- Insert some sample data to test persistence
INSERT INTO public.marketplace_listings (
    title, 
    description, 
    short_description,
    listing_type,
    status,
    total_funding_goal,
    asset_type,
    expected_return_rate,
    risk_level,
    minimum_investment,
    created_by
) VALUES 
(
    'Sample Real Estate Investment',
    'A premium downtown office building with excellent rental yields and appreciation potential.',
    'Premium downtown office building with excellent rental yields',
    'asset',
    'active',
    5000000.00,
    'real_estate',
    12.50,
    'medium',
    1000.00,
    (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT DO NOTHING;

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
DROP TRIGGER IF EXISTS trigger_update_listing_funding_status ON public.marketplace_investments;
CREATE TRIGGER trigger_update_listing_funding_status
    AFTER INSERT OR UPDATE ON public.marketplace_investments
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_funding_status();

-- Verify the setup
SELECT 'Marketplace tables created successfully' as status;
SELECT COUNT(*) as listing_count FROM public.marketplace_listings;
