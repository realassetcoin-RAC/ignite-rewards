-- Sync Wallet and Loyalty Changes to Cloud Database
-- This script implements the wallet and loyalty system changes made today
-- Date: 2025-01-28

-- 1. Create user_solana_wallets table for Solana custodial wallet system
CREATE TABLE IF NOT EXISTS public.user_solana_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL UNIQUE,
    seed_phrase_encrypted TEXT NOT NULL,
    public_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Create user_notifications table for notification system
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

-- 3. Create get_user_loyalty_card function
CREATE OR REPLACE FUNCTION public.get_user_loyalty_card(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    nft_type_id UUID,
    loyalty_number TEXT,
    card_number TEXT,
    full_name TEXT,
    email TEXT,
    points_balance INTEGER,
    tier_level TEXT,
    is_active BOOLEAN,
    nft_name TEXT,
    display_name TEXT,
    rarity TEXT,
    earn_on_spend_ratio DECIMAL,
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
        ulc.points_balance,
        ulc.tier_level,
        ulc.is_active,
        nt.nft_name,
        nt.display_name,
        nt.rarity,
        nt.earn_on_spend_ratio,
        ulc.created_at
    FROM public.user_loyalty_cards ulc
    LEFT JOIN public.nft_types nt ON ulc.nft_type_id = nt.id
    WHERE ulc.user_id = user_uuid
    AND ulc.is_active = TRUE
    ORDER BY ulc.created_at DESC
    LIMIT 1;
END;
$$;

-- 4. Create authenticate_with_seed_phrase function for seed phrase login
CREATE OR REPLACE FUNCTION public.authenticate_with_seed_phrase(p_seed_phrase TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    auth_provider TEXT,
    has_solana_wallet BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_user_id UUID;
    user_profile RECORD;
BEGIN
    -- Find user by seed phrase in user_solana_wallets table
    SELECT usw.user_id INTO found_user_id
    FROM public.user_solana_wallets usw
    WHERE usw.seed_phrase_encrypted = p_seed_phrase
    LIMIT 1;
    
    -- If not found in user_solana_wallets, try user_wallets table
    IF found_user_id IS NULL THEN
        SELECT uw.user_id INTO found_user_id
        FROM public.user_wallets uw
        WHERE uw.encrypted_seed_phrase = p_seed_phrase
        LIMIT 1;
    END IF;
    
    -- If still not found, return empty result
    IF found_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Get user profile information
    SELECT p.id, p.email, p.full_name, p.role, p.auth_provider, p.has_solana_wallet
    INTO user_profile
    FROM public.profiles p
    WHERE p.id = found_user_id;
    
    -- Return user information
    RETURN QUERY SELECT 
        user_profile.id,
        user_profile.email,
        user_profile.full_name,
        user_profile.role,
        user_profile.auth_provider,
        user_profile.has_solana_wallet;
END;
$$;

-- 5. Enable Row Level Security
ALTER TABLE public.user_solana_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for user_solana_wallets
CREATE POLICY "Users can view their own wallets" ON public.user_solana_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets" ON public.user_solana_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets" ON public.user_solana_wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets" ON public.user_solana_wallets
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create RLS policies for user_notifications
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.user_notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.user_notifications
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_solana_wallets_user_id ON public.user_solana_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_solana_wallets_wallet_address ON public.user_solana_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);

-- 9. Insert test notification data
INSERT INTO public.user_notifications (user_id, title, message, type, is_read)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'Welcome!', 'Welcome to Ignite Rewards! Explore our new features.', 'new_feature', FALSE)
ON CONFLICT DO NOTHING;

-- 10. Add missing columns to existing tables if they don't exist
DO $$
BEGIN
    -- Add google_auth_enabled and email_auth_enabled to profiles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'google_auth_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN google_auth_enabled BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email_auth_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN email_auth_enabled BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add has_solana_wallet to profiles table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'has_solana_wallet') THEN
        ALTER TABLE public.profiles ADD COLUMN has_solana_wallet BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add auth_provider to profiles table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'auth_provider') THEN
        ALTER TABLE public.profiles ADD COLUMN auth_provider TEXT DEFAULT 'email';
    END IF;
END $$;

-- 11. Create update trigger for user_solana_wallets
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_solana_wallets_updated_at ON public.user_solana_wallets;
CREATE TRIGGER update_user_solana_wallets_updated_at
    BEFORE UPDATE ON public.user_solana_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_notifications_updated_at ON public.user_notifications;
CREATE TRIGGER update_user_notifications_updated_at
    BEFORE UPDATE ON public.user_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Add comments for documentation
COMMENT ON TABLE public.user_solana_wallets IS 'Stores Solana custodial wallet information for users';
COMMENT ON TABLE public.user_notifications IS 'Stores user notifications for earnings, asset linking, and new features';
COMMENT ON FUNCTION public.get_user_loyalty_card(UUID) IS 'Retrieves user loyalty card information with NFT details';
COMMENT ON FUNCTION public.authenticate_with_seed_phrase(TEXT) IS 'Authenticates users using their seed phrase';


