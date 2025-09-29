-- Fix Missing Database Functions and Tables (Safe Version)
-- This migration creates the missing functions and tables causing console errors
-- Date: 2025-01-28
-- Safe version that handles existing policies gracefully

-- 1. Create the missing get_user_loyalty_card function
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

-- 2. Create the missing user_notifications table
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

-- 3. Create the missing user_asset_selections table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_asset_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_initiative_id UUID NOT NULL REFERENCES public.asset_initiatives(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, is_active) -- One active selection per user
);

-- 4. Create the missing asset_initiatives table (if it doesn't exist)
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

-- 5. Create the missing nft_types table (if it doesn't exist)
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

-- 6. Create the missing user_loyalty_cards table (if it doesn't exist)
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

-- 7. Create the missing user_solana_wallets table
CREATE TABLE IF NOT EXISTS public.user_solana_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    solana_address TEXT NOT NULL UNIQUE,
    seed_phrase_encrypted TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Enable Row Level Security
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_asset_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_solana_wallets ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies (with IF NOT EXISTS equivalent using DO blocks)
-- User notifications policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_notifications' 
        AND policyname = 'Users can view their own notifications'
    ) THEN
        CREATE POLICY "Users can view their own notifications" ON public.user_notifications
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_notifications' 
        AND policyname = 'Users can update their own notifications'
    ) THEN
        CREATE POLICY "Users can update their own notifications" ON public.user_notifications
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- User asset selections policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_asset_selections' 
        AND policyname = 'Users can view their own asset selections'
    ) THEN
        CREATE POLICY "Users can view their own asset selections" ON public.user_asset_selections
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_asset_selections' 
        AND policyname = 'Users can insert their own asset selections'
    ) THEN
        CREATE POLICY "Users can insert their own asset selections" ON public.user_asset_selections
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_asset_selections' 
        AND policyname = 'Users can update their own asset selections'
    ) THEN
        CREATE POLICY "Users can update their own asset selections" ON public.user_asset_selections
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Asset initiatives policy (public read)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'asset_initiatives' 
        AND policyname = 'Anyone can view active asset initiatives'
    ) THEN
        CREATE POLICY "Anyone can view active asset initiatives" ON public.asset_initiatives
            FOR SELECT USING (is_active = TRUE);
    END IF;
END $$;

-- NFT types policy (public read)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'nft_types' 
        AND policyname = 'Anyone can view active NFT types'
    ) THEN
        CREATE POLICY "Anyone can view active NFT types" ON public.nft_types
            FOR SELECT USING (is_active = TRUE);
    END IF;
END $$;

-- User loyalty cards policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_loyalty_cards' 
        AND policyname = 'Users can view their own loyalty cards'
    ) THEN
        CREATE POLICY "Users can view their own loyalty cards" ON public.user_loyalty_cards
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_loyalty_cards' 
        AND policyname = 'Users can insert their own loyalty cards'
    ) THEN
        CREATE POLICY "Users can insert their own loyalty cards" ON public.user_loyalty_cards
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_loyalty_cards' 
        AND policyname = 'Users can update their own loyalty cards'
    ) THEN
        CREATE POLICY "Users can update their own loyalty cards" ON public.user_loyalty_cards
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- User Solana wallets policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_solana_wallets' 
        AND policyname = 'Users can view their own solana wallets'
    ) THEN
        CREATE POLICY "Users can view their own solana wallets" ON public.user_solana_wallets
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_solana_wallets' 
        AND policyname = 'Users can insert their own solana wallets'
    ) THEN
        CREATE POLICY "Users can insert their own solana wallets" ON public.user_solana_wallets
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_solana_wallets' 
        AND policyname = 'Users can update their own solana wallets'
    ) THEN
        CREATE POLICY "Users can update their own solana wallets" ON public.user_solana_wallets
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_asset_selections_user_id ON public.user_asset_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_user_id ON public.user_loyalty_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_loyalty_number ON public.user_loyalty_cards(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_user_solana_wallets_user_id ON public.user_solana_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_solana_wallets_solana_address ON public.user_solana_wallets(solana_address);

-- 11. Insert some default data
-- First, check if icon column exists and add it if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'asset_initiatives' 
        AND column_name = 'icon'
    ) THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN icon VARCHAR(100);
    END IF;
END $$;

-- Insert default data (with all required fields)
INSERT INTO public.asset_initiatives (
    name, 
    description, 
    category, 
    impact_score, 
    risk_level, 
    expected_return, 
    min_investment, 
    max_investment, 
    current_funding, 
    target_funding, 
    is_active, 
    image_url, 
    website_url, 
    multi_sig_threshold, 
    blockchain_network, 
    supported_currencies, 
    is_web3_enabled, 
    total_investments, 
    total_investors,
    icon
) VALUES
    ('Environmental Technology', 'Support environmental protection through technology solutions', 'technology', 9, 'low', 8.5, 100, 100000, 0, 100000, true, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', 'https://environmental-tech.org', 2, 'ethereum', '["USDT", "SOL", "ETH", "BTC"]', true, 0, 0, '🌱'),
    ('Social Impact Technology', 'Fund social programs through technology and community development', 'technology', 8, 'medium', 7.0, 50, 50000, 0, 50000, true, 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400', 'https://social-impact-tech.org', 2, 'ethereum', '["USDT", "SOL", "ETH", "BTC"]', true, 0, 0, '🤝'),
    ('Financial Technology', 'Invest in fintech solutions for economic growth and job creation', 'technology', 7, 'medium', 9.0, 200, 200000, 0, 200000, true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'https://fintech-development.org', 2, 'ethereum', '["USDT", "SOL", "ETH", "BTC"]', true, 0, 0, '💼'),
    ('Health Technology', 'Support healthcare and wellness through technology initiatives', 'technology', 9, 'low', 6.5, 75, 75000, 0, 75000, true, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400', 'https://health-tech.org', 2, 'ethereum', '["USDT", "SOL", "ETH", "BTC"]', true, 0, 0, '🏥')
ON CONFLICT DO NOTHING;

-- Insert default NFT types data
INSERT INTO public.nft_types (nft_name, display_name, rarity, earn_on_spend_ratio, buy_price_usdt, upgrade_bonus_ratio, evolution_min_investment, evolution_earnings_ratio) VALUES
    ('Pearl White', 'Pearl White NFT', 'Common', 0.0100, 0, 0.0000, 100, 0.0025),
    ('Lava Orange', 'Lava Orange NFT', 'Less Common', 0.0110, 100, 0.0010, 500, 0.0050),
    ('Pink', 'Pink NFT', 'Less Common', 0.0110, 100, 0.0010, 500, 0.0050),
    ('Silver', 'Silver NFT', 'Rare', 0.0120, 200, 0.0015, 1000, 0.0075),
    ('Gold', 'Gold NFT', 'Rare', 0.0130, 300, 0.0020, 1500, 0.0100),
    ('Black', 'Black NFT', 'Very Rare', 0.0140, 500, 0.0030, 2500, 0.0125)
ON CONFLICT DO NOTHING;

-- 12. Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_user_notifications_updated_at ON public.user_notifications;
CREATE TRIGGER update_user_notifications_updated_at
    BEFORE UPDATE ON public.user_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_asset_selections_updated_at ON public.user_asset_selections;
CREATE TRIGGER update_user_asset_selections_updated_at
    BEFORE UPDATE ON public.user_asset_selections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_asset_initiatives_updated_at ON public.asset_initiatives;
CREATE TRIGGER update_asset_initiatives_updated_at
    BEFORE UPDATE ON public.asset_initiatives
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_nft_types_updated_at ON public.nft_types;
CREATE TRIGGER update_nft_types_updated_at
    BEFORE UPDATE ON public.nft_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_loyalty_cards_updated_at ON public.user_loyalty_cards;
CREATE TRIGGER update_user_loyalty_cards_updated_at
    BEFORE UPDATE ON public.user_loyalty_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_solana_wallets_updated_at ON public.user_solana_wallets;
CREATE TRIGGER update_user_solana_wallets_updated_at
    BEFORE UPDATE ON public.user_solana_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
