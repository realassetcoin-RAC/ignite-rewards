-- Complete Database Fix - Create All Missing Tables and Functions
-- This script creates all missing tables and functions for full compliance
-- Date: 2025-01-30

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create NFT Types Table
CREATE TABLE IF NOT EXISTS public.nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    rarity TEXT NOT NULL DEFAULT 'common',
    earn_on_spend_ratio DECIMAL(5,2) DEFAULT 1.00,
    price_usd DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create NFT Collections Table
CREATE TABLE IF NOT EXISTS public.nft_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_name TEXT NOT NULL,
    description TEXT,
    total_supply INTEGER DEFAULT 1000,
    minted_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create User NFTs Table
CREATE TABLE IF NOT EXISTS public.user_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.nft_collections(id) ON DELETE SET NULL,
    token_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Loyalty Networks Table
CREATE TABLE IF NOT EXISTS public.loyalty_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create User Loyalty Cards Table
CREATE TABLE IF NOT EXISTS public.user_loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    loyalty_number TEXT NOT NULL UNIQUE,
    card_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    points_balance INTEGER DEFAULT 0,
    tier_level TEXT DEFAULT 'bronze',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Loyalty OTP Codes Table
CREATE TABLE IF NOT EXISTS public.loyalty_otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    network_id UUID NOT NULL REFERENCES public.loyalty_networks(id) ON DELETE CASCADE,
    mobile_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create User Solana Wallets Table
CREATE TABLE IF NOT EXISTS public.user_solana_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL UNIQUE,
    seed_phrase_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Asset Initiatives Table
CREATE TABLE IF NOT EXISTS public.asset_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_name TEXT NOT NULL,
    description TEXT,
    asset_type TEXT NOT NULL,
    target_amount DECIMAL(15,2),
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create Asset Investments Table
CREATE TABLE IF NOT EXISTS public.asset_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset_initiative_id UUID NOT NULL REFERENCES public.asset_initiatives(id) ON DELETE CASCADE,
    investment_amount DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USDT',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    wallet_address TEXT NOT NULL,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create Terms Privacy Acceptance Table
CREATE TABLE IF NOT EXISTS public.terms_privacy_acceptance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    privacy_accepted BOOLEAN NOT NULL DEFAULT false,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    privacy_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create Merchants Table
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Create Referral Campaigns Table
CREATE TABLE IF NOT EXISTS public.referral_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name TEXT NOT NULL,
    description TEXT,
    reward_amount DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_user_id ON public.user_loyalty_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_loyalty_number ON public.user_loyalty_cards(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_loyalty_otp_codes_user_id ON public.loyalty_otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_otp_codes_expires_at ON public.loyalty_otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_solana_wallets_user_id ON public.user_solana_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_solana_wallets_public_key ON public.user_solana_wallets(public_key);
CREATE INDEX IF NOT EXISTS idx_asset_investments_user_id ON public.asset_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_investments_initiative_id ON public.asset_investments(asset_initiative_id);
CREATE INDEX IF NOT EXISTS idx_user_nfts_user_id ON public.user_nfts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nfts_nft_type_id ON public.user_nfts(nft_type_id);

-- Create Updated At Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_nft_types_updated_at BEFORE UPDATE ON public.nft_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nft_collections_updated_at BEFORE UPDATE ON public.nft_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_nfts_updated_at BEFORE UPDATE ON public.user_nfts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loyalty_networks_updated_at BEFORE UPDATE ON public.loyalty_networks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_loyalty_cards_updated_at BEFORE UPDATE ON public.user_loyalty_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_solana_wallets_updated_at BEFORE UPDATE ON public.user_solana_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_asset_initiatives_updated_at BEFORE UPDATE ON public.asset_initiatives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_asset_investments_updated_at BEFORE UPDATE ON public.asset_investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_terms_privacy_acceptance_updated_at BEFORE UPDATE ON public.terms_privacy_acceptance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_referral_campaigns_updated_at BEFORE UPDATE ON public.referral_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create Essential RPC Functions

-- Generate Loyalty Number Function
CREATE OR REPLACE FUNCTION public.generate_loyalty_number(email_input TEXT)
RETURNS TEXT AS $$
DECLARE
    first_char TEXT;
    random_suffix TEXT;
    loyalty_num TEXT;
    counter INTEGER := 0;
BEGIN
    -- Get first character of email
    first_char := UPPER(SUBSTRING(email_input, 1, 1));
    
    -- Generate random 6-digit suffix
    random_suffix := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Create loyalty number
    loyalty_num := first_char || random_suffix;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.user_loyalty_cards WHERE loyalty_number = loyalty_num) LOOP
        counter := counter + 1;
        random_suffix := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        loyalty_num := first_char || random_suffix;
        
        -- Prevent infinite loop
        IF counter > 100 THEN
            loyalty_num := first_char || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 6, '0');
            EXIT;
        END IF;
    END LOOP;
    
    RETURN loyalty_num;
END;
$$ LANGUAGE plpgsql;

-- Get Valid Subscription Plans Function
CREATE OR REPLACE FUNCTION public.get_valid_subscription_plans()
RETURNS TABLE (
    id UUID,
    name TEXT,
    price_monthly DECIMAL(10,2),
    monthly_points INTEGER,
    monthly_transactions INTEGER,
    features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        msp.id,
        msp.name,
        msp.price_monthly,
        msp.monthly_points,
        msp.monthly_transactions,
        msp.features
    FROM public.merchant_subscription_plans msp
    WHERE msp.is_active = true
    ORDER BY msp.price_monthly;
END;
$$ LANGUAGE plpgsql;

-- Insert Sample Data

-- Insert NFT Types
INSERT INTO public.nft_types (nft_name, display_name, description, rarity, earn_on_spend_ratio, price_usd) VALUES
('Bronze Card', 'Bronze Loyalty Card', 'Basic loyalty card with standard rewards', 'common', 1.00, 0.00),
('Silver Card', 'Silver Loyalty Card', 'Enhanced loyalty card with better rewards', 'uncommon', 1.50, 10.00),
('Gold Card', 'Gold Loyalty Card', 'Premium loyalty card with excellent rewards', 'rare', 2.00, 25.00),
('Platinum Card', 'Platinum Loyalty Card', 'Elite loyalty card with maximum rewards', 'epic', 3.00, 50.00),
('Diamond Card', 'Diamond Loyalty Card', 'Ultimate loyalty card with exclusive rewards', 'legendary', 5.00, 100.00)
ON CONFLICT DO NOTHING;

-- Insert NFT Collections
INSERT INTO public.nft_collections (collection_name, description, total_supply) VALUES
('Loyalty Cards Collection', 'Collection of all loyalty card NFTs', 10000),
('Reward Cards Collection', 'Special reward card collection', 5000),
('Premium Cards Collection', 'Premium tier card collection', 1000)
ON CONFLICT DO NOTHING;

-- Insert Loyalty Networks
INSERT INTO public.loyalty_networks (network_name, description) VALUES
('Main Network', 'Primary loyalty network'),
('Partner Network', 'Partner merchant network'),
('Premium Network', 'Premium merchant network')
ON CONFLICT DO NOTHING;

-- Insert Asset Initiatives
INSERT INTO public.asset_initiatives (initiative_name, description, asset_type, target_amount) VALUES
('Real Estate Fund', 'Investment in commercial real estate', 'REIT', 1000000.00),
('Tech Startup Fund', 'Investment in technology startups', 'Equity', 500000.00),
('Crypto Fund', 'Investment in cryptocurrency projects', 'Crypto', 250000.00)
ON CONFLICT DO NOTHING;

-- Insert Referral Campaigns
INSERT INTO public.referral_campaigns (campaign_name, description, reward_amount) VALUES
('New User Referral', 'Reward for referring new users', 10.00),
('Premium Referral', 'Reward for referring premium users', 25.00),
('Merchant Referral', 'Reward for referring merchants', 50.00)
ON CONFLICT DO NOTHING;

-- Create RLS Policies (Basic Security)
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_solana_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_privacy_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for now - can be tightened later)
CREATE POLICY "Allow all operations on nft_types" ON public.nft_types FOR ALL USING (true);
CREATE POLICY "Allow all operations on nft_collections" ON public.nft_collections FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_nfts" ON public.user_nfts FOR ALL USING (true);
CREATE POLICY "Allow all operations on loyalty_networks" ON public.loyalty_networks FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_loyalty_cards" ON public.user_loyalty_cards FOR ALL USING (true);
CREATE POLICY "Allow all operations on loyalty_otp_codes" ON public.loyalty_otp_codes FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_solana_wallets" ON public.user_solana_wallets FOR ALL USING (true);
CREATE POLICY "Allow all operations on asset_initiatives" ON public.asset_initiatives FOR ALL USING (true);
CREATE POLICY "Allow all operations on asset_investments" ON public.asset_investments FOR ALL USING (true);
CREATE POLICY "Allow all operations on terms_privacy_acceptance" ON public.terms_privacy_acceptance FOR ALL USING (true);
CREATE POLICY "Allow all operations on merchants" ON public.merchants FOR ALL USING (true);
CREATE POLICY "Allow all operations on referral_campaigns" ON public.referral_campaigns FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;