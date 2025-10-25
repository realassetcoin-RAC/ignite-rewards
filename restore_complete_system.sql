-- Complete System Restoration Script
-- This script restores ALL missing features and tables for the RAC Rewards application
-- Run this in Supabase SQL Editor to restore your complete system

-- =============================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. CREATE ADVANCED WALLET SYSTEM TABLES
-- =============================================================================

-- User Solana Wallets (with seed phrase backup)
CREATE TABLE IF NOT EXISTS public.user_solana_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    solana_address TEXT NOT NULL UNIQUE,
    seed_phrase_encrypted TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    is_custodial BOOLEAN NOT NULL DEFAULT TRUE,
    wallet_type TEXT NOT NULL DEFAULT 'custodial' CHECK (wallet_type IN ('custodial', 'non-custodial', 'hybrid')),
    backup_status TEXT NOT NULL DEFAULT 'pending' CHECK (backup_status IN ('pending', 'backed_up', 'verified', 'failed')),
    backup_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Wallet Backup Verification
CREATE TABLE IF NOT EXISTS public.wallet_backup_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.user_solana_wallets(id) ON DELETE CASCADE,
    verification_method TEXT NOT NULL CHECK (verification_method IN ('seed_phrase', 'private_key', 'hardware_wallet')),
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verification_code TEXT,
    verification_attempts INTEGER NOT NULL DEFAULT 0,
    last_verification_attempt TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. CREATE ADVANCED LOYALTY SYSTEM TABLES
-- =============================================================================

-- Loyalty Networks (Third-party integrations)
CREATE TABLE IF NOT EXISTS public.loyalty_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    integration_type TEXT NOT NULL CHECK (integration_type IN ('api', 'csv', 'manual')),
    sync_frequency INTEGER NOT NULL DEFAULT 3600, -- seconds
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User Loyalty Account Links
CREATE TABLE IF NOT EXISTS public.loyalty_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_network_id UUID NOT NULL REFERENCES public.loyalty_networks(id) ON DELETE CASCADE,
    external_account_id TEXT NOT NULL,
    external_account_name TEXT,
    points_balance INTEGER NOT NULL DEFAULT 0,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'disabled')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, loyalty_network_id, external_account_id)
);

-- Loyalty OTP Codes
CREATE TABLE IF NOT EXISTS public.loyalty_otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_link_id UUID NOT NULL REFERENCES public.loyalty_links(id) ON DELETE CASCADE,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. CREATE ADVANCED MARKETPLACE TABLES
-- =============================================================================

-- Marketplace Categories
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Marketplace Stats
CREATE TABLE IF NOT EXISTS public.marketplace_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_listings INTEGER NOT NULL DEFAULT 0,
    total_investments DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_users INTEGER NOT NULL DEFAULT 0,
    average_investment DECIMAL(10,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Passive Income Distributions
CREATE TABLE IF NOT EXISTS public.passive_income_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    distribution_amount DECIMAL(10,2) NOT NULL,
    distribution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    distribution_type TEXT NOT NULL CHECK (distribution_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'distributed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User Passive Earnings
CREATE TABLE IF NOT EXISTS public.user_passive_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    investment_id UUID NOT NULL REFERENCES public.marketplace_investments(id) ON DELETE CASCADE,
    distribution_id UUID NOT NULL REFERENCES public.passive_income_distributions(id) ON DELETE CASCADE,
    earning_amount DECIMAL(10,2) NOT NULL,
    earning_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. CREATE ADVANCED DAO SYSTEM TABLES
-- =============================================================================

-- DAO Vote Proposals (Advanced voting system)
CREATE TABLE IF NOT EXISTS public.dao_vote_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('yes', 'no', 'abstain')),
    voting_power INTEGER NOT NULL DEFAULT 1,
    vote_weight DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    vote_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(proposal_id, voter_id)
);

-- DAO Treasury
CREATE TABLE IF NOT EXISTS public.dao_treasury (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID NOT NULL REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
    token_address TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    balance DECIMAL(20,8) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- DAO Transactions
CREATE TABLE IF NOT EXISTS public.dao_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID NOT NULL REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES public.dao_proposals(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'expense')),
    amount DECIMAL(20,8) NOT NULL,
    token_address TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    recipient_address TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executed', 'failed')),
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 6. CREATE REWARDS CONFIGURATION SYSTEM
-- =============================================================================

-- Rewards Configuration
CREATE TABLE IF NOT EXISTS public.rewards_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id TEXT UNIQUE,
    admin_authority TEXT,
    reward_token_mint TEXT,
    distribution_interval INTEGER NOT NULL DEFAULT 86400, -- seconds
    max_rewards_per_user BIGINT NOT NULL DEFAULT 1000000,
    points_per_dollar DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    referral_bonus INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Config Proposals
CREATE TABLE IF NOT EXISTS public.config_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.rewards_config(id) ON DELETE CASCADE,
    proposed_distribution_interval INTEGER NOT NULL,
    proposed_max_rewards_per_user BIGINT NOT NULL,
    proposed_points_per_dollar DECIMAL(5,2) NOT NULL,
    proposed_referral_bonus INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
    proposer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    implemented_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- 7. CREATE VIRTUAL CARD SYSTEM
-- =============================================================================

-- Virtual Cards
CREATE TABLE IF NOT EXISTS public.virtual_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_card_id UUID NOT NULL REFERENCES public.user_loyalty_cards(id) ON DELETE CASCADE,
    card_number TEXT NOT NULL UNIQUE,
    card_holder_name TEXT NOT NULL,
    expiry_date DATE,
    cvv TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_physical BOOLEAN NOT NULL DEFAULT FALSE,
    card_design TEXT NOT NULL DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 8. CREATE MERCHANT DISCOUNT SYSTEM
-- =============================================================================

-- Merchant Discount Codes
CREATE TABLE IF NOT EXISTS public.merchant_discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'points')),
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_purchase DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 9. CREATE POINT RELEASE DELAY SYSTEM
-- =============================================================================

-- Point Release Delays
CREATE TABLE IF NOT EXISTS public.point_release_delays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.loyalty_transactions(id) ON DELETE CASCADE,
    points_amount INTEGER NOT NULL,
    release_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_released BOOLEAN NOT NULL DEFAULT FALSE,
    released_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 10. CREATE ANONYMOUS USER SYSTEM
-- =============================================================================

-- Anonymous Users
CREATE TABLE IF NOT EXISTS public.anonymous_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_id TEXT NOT NULL UNIQUE,
    solana_address TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('guest', 'anonymous', 'temporary')),
    total_transactions INTEGER NOT NULL DEFAULT 0,
    total_earned NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 11. CREATE ASSET INITIATIVE SYSTEM
-- =============================================================================

-- Asset Initiatives
CREATE TABLE IF NOT EXISTS public.asset_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('real_estate', 'crypto', 'stocks', 'commodities', 'other')),
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User Asset Selections
CREATE TABLE IF NOT EXISTS public.user_asset_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_initiative_id UUID NOT NULL REFERENCES public.asset_initiatives(id) ON DELETE CASCADE,
    investment_amount DECIMAL(10,2) NOT NULL,
    selection_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 12. INSERT DEFAULT DATA FOR NEW TABLES
-- =============================================================================

-- Insert default loyalty networks
INSERT INTO public.loyalty_networks (name, display_name, description, integration_type, is_active)
SELECT 'starbucks', 'Starbucks Rewards', 'Starbucks loyalty program integration', 'api', true
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_networks WHERE name = 'starbucks');

INSERT INTO public.loyalty_networks (name, display_name, description, integration_type, is_active)
SELECT 'airlines', 'Airlines Miles', 'Major airlines frequent flyer programs', 'api', true
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_networks WHERE name = 'airlines');

INSERT INTO public.loyalty_networks (name, display_name, description, integration_type, is_active)
SELECT 'hotels', 'Hotel Rewards', 'Major hotel chain loyalty programs', 'api', true
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_networks WHERE name = 'hotels');

-- Insert default marketplace categories
INSERT INTO public.marketplace_categories (name, display_name, description, sort_order, is_active)
SELECT 'real_estate', 'Real Estate', 'Real estate investment opportunities', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.marketplace_categories WHERE name = 'real_estate');

INSERT INTO public.marketplace_categories (name, display_name, description, sort_order, is_active)
SELECT 'crypto', 'Cryptocurrency', 'Cryptocurrency investment opportunities', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.marketplace_categories WHERE name = 'crypto');

INSERT INTO public.marketplace_categories (name, display_name, description, sort_order, is_active)
SELECT 'stocks', 'Stock Market', 'Stock market investment opportunities', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.marketplace_categories WHERE name = 'stocks');

-- Insert default rewards configuration
INSERT INTO public.rewards_config (program_id, points_per_dollar, referral_bonus, is_active)
SELECT 'rac_rewards_v1', 10.00, 100, true
WHERE NOT EXISTS (SELECT 1 FROM public.rewards_config WHERE program_id = 'rac_rewards_v1');

-- Insert default marketplace stats
INSERT INTO public.marketplace_stats (total_listings, total_investments, total_users, average_investment)
SELECT 0, 0.00, 0, 0.00
WHERE NOT EXISTS (SELECT 1 FROM public.marketplace_stats);

-- Insert default asset initiatives
INSERT INTO public.asset_initiatives (name, description, asset_type, target_amount, is_active)
SELECT 'Real Estate Fund', 'Diversified real estate investment fund', 'real_estate', 1000000.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Real Estate Fund');

INSERT INTO public.asset_initiatives (name, description, asset_type, target_amount, is_active)
SELECT 'Crypto Growth Fund', 'Cryptocurrency growth investment fund', 'crypto', 500000.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Crypto Growth Fund');

-- =============================================================================
-- 13. ENABLE ROW LEVEL SECURITY ON NEW TABLES
-- =============================================================================

ALTER TABLE public.user_solana_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_backup_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passive_income_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passive_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_vote_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_release_delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_asset_selections ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 14. CREATE RLS POLICIES FOR NEW TABLES
-- =============================================================================

-- User Solana Wallets policies
CREATE POLICY "Users can manage their own wallets" ON public.user_solana_wallets
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Wallet Backup Verification policies
CREATE POLICY "Users can manage their own wallet backups" ON public.wallet_backup_verification
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Loyalty Links policies
CREATE POLICY "Users can manage their own loyalty links" ON public.loyalty_links
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Virtual Cards policies
CREATE POLICY "Users can manage their own virtual cards" ON public.virtual_cards
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Public read access for some tables
CREATE POLICY "Anyone can view loyalty networks" ON public.loyalty_networks FOR SELECT USING (true);
CREATE POLICY "Anyone can view marketplace categories" ON public.marketplace_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view asset initiatives" ON public.asset_initiatives FOR SELECT USING (true);
CREATE POLICY "Anyone can view rewards config" ON public.rewards_config FOR SELECT USING (true);

-- =============================================================================
-- 15. GRANT PERMISSIONS ON NEW TABLES
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- 16. CREATE ADVANCED FUNCTIONS
-- =============================================================================

-- Function to generate wallet backup verification code
CREATE OR REPLACE FUNCTION public.generate_wallet_backup_code(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    verification_code TEXT;
    wallet_id UUID;
BEGIN
    -- Get user's wallet
    SELECT id INTO wallet_id FROM public.user_solana_wallets WHERE user_id = user_uuid LIMIT 1;
    
    IF wallet_id IS NULL THEN
        RAISE EXCEPTION 'No wallet found for user';
    END IF;
    
    -- Generate 6-digit verification code
    verification_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Insert verification record
    INSERT INTO public.wallet_backup_verification (user_id, wallet_id, verification_code, expires_at)
    VALUES (user_uuid, wallet_id, verification_code, NOW() + INTERVAL '10 minutes');
    
    RETURN verification_code;
END;
$$;

-- Function to verify wallet backup
CREATE OR REPLACE FUNCTION public.verify_wallet_backup(user_uuid UUID, verification_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    verification_record RECORD;
BEGIN
    -- Get verification record
    SELECT * INTO verification_record
    FROM public.wallet_backup_verification
    WHERE user_id = user_uuid
    AND verification_code = verification_code
    AND expires_at > NOW()
    AND verification_status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF verification_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update verification status
    UPDATE public.wallet_backup_verification
    SET verification_status = 'verified', verified_at = NOW()
    WHERE id = verification_record.id;
    
    -- Update wallet backup status
    UPDATE public.user_solana_wallets
    SET backup_status = 'verified', backup_verified_at = NOW()
    WHERE id = verification_record.wallet_id;
    
    RETURN TRUE;
END;
$$;

-- Function to sync loyalty points
CREATE OR REPLACE FUNCTION public.sync_loyalty_points(user_uuid UUID, network_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    network_id UUID;
    link_record RECORD;
    points_synced INTEGER := 0;
BEGIN
    -- Get network ID
    SELECT id INTO network_id FROM public.loyalty_networks WHERE name = network_name;
    
    IF network_id IS NULL THEN
        RAISE EXCEPTION 'Loyalty network not found: %', network_name;
    END IF;
    
    -- Get user's loyalty link
    SELECT * INTO link_record
    FROM public.loyalty_links
    WHERE user_id = user_uuid AND loyalty_network_id = network_id;
    
    IF link_record IS NULL THEN
        RAISE EXCEPTION 'No loyalty link found for user in network: %', network_name;
    END IF;
    
    -- Update sync status and timestamp
    UPDATE public.loyalty_links
    SET last_sync_at = NOW(), sync_status = 'synced'
    WHERE id = link_record.id;
    
    -- Return points balance
    RETURN link_record.points_balance;
END;
$$;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.generate_wallet_backup_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_wallet_backup(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_loyalty_points(UUID, TEXT) TO authenticated;

-- =============================================================================
-- 17. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Wallet system indexes
CREATE INDEX IF NOT EXISTS idx_user_solana_wallets_user_id ON public.user_solana_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_solana_wallets_address ON public.user_solana_wallets(solana_address);
CREATE INDEX IF NOT EXISTS idx_wallet_backup_verification_user_id ON public.wallet_backup_verification(user_id);

-- Loyalty system indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_links_user_id ON public.loyalty_links(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_links_network_id ON public.loyalty_links(loyalty_network_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_otp_codes_user_id ON public.loyalty_otp_codes(user_id);

-- Marketplace indexes
CREATE INDEX IF NOT EXISTS idx_passive_income_distributions_listing_id ON public.passive_income_distributions(listing_id);
CREATE INDEX IF NOT EXISTS idx_user_passive_earnings_user_id ON public.user_passive_earnings(user_id);

-- DAO system indexes
CREATE INDEX IF NOT EXISTS idx_dao_vote_proposals_proposal_id ON public.dao_vote_proposals(proposal_id);
CREATE INDEX IF NOT EXISTS idx_dao_treasury_dao_id ON public.dao_treasury(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_transactions_dao_id ON public.dao_transactions(dao_id);

-- Asset system indexes
CREATE INDEX IF NOT EXISTS idx_user_asset_selections_user_id ON public.user_asset_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_asset_selections_asset_id ON public.user_asset_selections(asset_initiative_id);

-- =============================================================================
-- 18. FINAL VERIFICATION
-- =============================================================================

DO $$
DECLARE
    total_tables INTEGER;
    new_tables INTEGER;
    loyalty_networks_count INTEGER;
    marketplace_categories_count INTEGER;
    asset_initiatives_count INTEGER;
BEGIN
    -- Count total tables
    SELECT COUNT(*) INTO total_tables 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    -- Count new tables (should be around 20+ new tables)
    SELECT COUNT(*) INTO new_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'user_solana_wallets', 'wallet_backup_verification', 'loyalty_networks', 
        'loyalty_links', 'loyalty_otp_codes', 'marketplace_categories', 
        'marketplace_stats', 'passive_income_distributions', 'user_passive_earnings',
        'dao_vote_proposals', 'dao_treasury', 'dao_transactions', 'rewards_config',
        'config_proposals', 'virtual_cards', 'merchant_discount_codes',
        'point_release_delays', 'anonymous_users', 'asset_initiatives', 'user_asset_selections'
    );
    
    -- Count default data
    SELECT COUNT(*) INTO loyalty_networks_count FROM public.loyalty_networks;
    SELECT COUNT(*) INTO marketplace_categories_count FROM public.marketplace_categories;
    SELECT COUNT(*) INTO asset_initiatives_count FROM public.asset_initiatives;
    
    RAISE NOTICE 'Complete system restoration completed successfully!';
    RAISE NOTICE 'Total tables: %', total_tables;
    RAISE NOTICE 'New advanced tables: %', new_tables;
    RAISE NOTICE 'Loyalty networks: %', loyalty_networks_count;
    RAISE NOTICE 'Marketplace categories: %', marketplace_categories_count;
    RAISE NOTICE 'Asset initiatives: %', asset_initiatives_count;
END $$;

-- Show final status
SELECT 
    'Complete system restoration completed successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
    (SELECT COUNT(*) FROM public.loyalty_networks) as loyalty_networks,
    (SELECT COUNT(*) FROM public.marketplace_categories) as marketplace_categories,
    (SELECT COUNT(*) FROM public.asset_initiatives) as asset_initiatives,
    (SELECT COUNT(*) FROM public.rewards_config) as rewards_configs;
