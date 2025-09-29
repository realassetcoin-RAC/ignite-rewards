-- Create Missing Tables in Public Schema
-- This script creates all missing tables in the public schema instead of api schema
-- Date: 2025-01-28

-- 1. Create merchants table in public schema
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

-- 2. Create loyalty_transactions table in public schema
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

-- 3. Create user_loyalty_cards table in public schema
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

-- 4. Create nft_types table in public schema
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

-- 5. Create user_solana_wallets table in public schema
CREATE TABLE IF NOT EXISTS public.user_solana_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    solana_address TEXT NOT NULL UNIQUE,
    seed_phrase_encrypted TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Create terms_privacy_acceptance table in public schema
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

-- 7. Create user_notifications table in public schema
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

-- 8. Create user_asset_selections table in public schema
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

-- 9. Create asset_initiatives table in public schema
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

-- 10. Enable Row Level Security for all tables
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_solana_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_privacy_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_asset_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_initiatives ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS Policies

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

-- 12. Create indexes for better performance
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

-- 13. Create functions for common operations

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

-- 14. Insert default data

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

COMMIT;
