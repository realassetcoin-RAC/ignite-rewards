-- Ultimate Fix - Address All Schema Conflicts
-- This script completely fixes all database schema issues

-- Drop ALL existing tables that might have wrong schemas
DROP TABLE IF EXISTS public.user_nfts CASCADE;
DROP TABLE IF EXISTS public.asset_investments CASCADE;
DROP TABLE IF EXISTS public.referral_campaigns CASCADE;
DROP TABLE IF EXISTS public.user_loyalty_cards CASCADE;

-- Also drop any tables that might exist in other schemas
DROP TABLE IF EXISTS api.user_nfts CASCADE;
DROP TABLE IF EXISTS api.asset_investments CASCADE;
DROP TABLE IF EXISTS api.referral_campaigns CASCADE;
DROP TABLE IF EXISTS api.user_loyalty_cards CASCADE;

-- Recreate User NFTs Table with correct schema
CREATE TABLE public.user_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.nft_collections(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate Asset Investments Table with correct schema
CREATE TABLE public.asset_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset_initiative_id UUID NOT NULL REFERENCES public.asset_initiatives(id) ON DELETE CASCADE,
    investment_amount DECIMAL(15,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    wallet_address TEXT NOT NULL,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate Referral Campaigns Table with correct schema
CREATE TABLE public.referral_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    reward_amount DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate User Loyalty Cards Table with correct schema
CREATE TABLE public.user_loyalty_cards (
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

-- Create Indexes
CREATE INDEX idx_user_nfts_user_id ON public.user_nfts(user_id);
CREATE INDEX idx_asset_investments_user_id ON public.asset_investments(user_id);
CREATE INDEX idx_user_loyalty_cards_user_id ON public.user_loyalty_cards(user_id);
CREATE INDEX idx_user_loyalty_cards_loyalty_number ON public.user_loyalty_cards(loyalty_number);

-- Create Triggers
CREATE TRIGGER update_user_nfts_updated_at BEFORE UPDATE ON public.user_nfts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_asset_investments_updated_at BEFORE UPDATE ON public.asset_investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_referral_campaigns_updated_at BEFORE UPDATE ON public.referral_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_loyalty_cards_updated_at BEFORE UPDATE ON public.user_loyalty_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.user_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Allow all operations on user_nfts" ON public.user_nfts FOR ALL USING (true);
CREATE POLICY "Allow all operations on asset_investments" ON public.asset_investments FOR ALL USING (true);
CREATE POLICY "Allow all operations on referral_campaigns" ON public.referral_campaigns FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_loyalty_cards" ON public.user_loyalty_cards FOR ALL USING (true);

-- Insert sample data
INSERT INTO public.referral_campaigns (name, description, reward_amount) VALUES
('New User Referral', 'Reward for referring new users', 10.00),
('Premium Referral', 'Reward for referring premium users', 25.00),
('Merchant Referral', 'Reward for referring merchants', 50.00)
ON CONFLICT DO NOTHING;

