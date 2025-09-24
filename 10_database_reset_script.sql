-- ===========================================
-- DATABASE RESET SCRIPT
-- ===========================================
-- WARNING: This will clear all data and recreate the schema
-- Only use this if the database is completely corrupted

-- Step 1: Drop all tables (in correct order to avoid foreign key issues)
DROP TABLE IF EXISTS public.nft_minting_control CASCADE;
DROP TABLE IF EXISTS public.nft_evolution_history CASCADE;
DROP TABLE IF EXISTS public.nft_upgrade_history CASCADE;
DROP TABLE IF EXISTS public.nft_collections CASCADE;
DROP TABLE IF EXISTS public.user_loyalty_cards CASCADE;
DROP TABLE IF EXISTS public.nft_types CASCADE;
DROP TABLE IF EXISTS public.loyalty_transactions CASCADE;
DROP TABLE IF EXISTS public.user_points CASCADE;
DROP TABLE IF EXISTS public.user_referrals CASCADE;
DROP TABLE IF EXISTS public.referral_campaigns CASCADE;
DROP TABLE IF EXISTS public.merchant_subscription_plans CASCADE;
DROP TABLE IF EXISTS public.virtual_cards CASCADE;
DROP TABLE IF EXISTS public.merchants CASCADE;
DROP TABLE IF EXISTS public.marketplace_investments CASCADE;
DROP TABLE IF EXISTS public.marketplace_listings CASCADE;
DROP TABLE IF EXISTS public.dao_votes CASCADE;
DROP TABLE IF EXISTS public.dao_proposals CASCADE;
DROP TABLE IF EXISTS public.dao_members CASCADE;
DROP TABLE IF EXISTS public.dao_organizations CASCADE;
DROP TABLE IF EXISTS public.user_wallets CASCADE;
DROP TABLE IF EXISTS public.loyalty_networks CASCADE;
DROP TABLE IF EXISTS public.asset_initiatives CASCADE;
DROP TABLE IF EXISTS public.user_asset_selections CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Recreate the basic schema
-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'customer',
    phone TEXT,
    date_of_birth DATE,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    terms_accepted BOOLEAN DEFAULT FALSE,
    privacy_policy_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFT Types table (with all required fields)
CREATE TABLE public.nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    rarity TEXT DEFAULT 'Common',
    tier_level TEXT DEFAULT 'bronze',
    earn_on_spend_ratio DECIMAL(5,2) DEFAULT 1.00,
    buy_price_usdt DECIMAL(10,2) DEFAULT 0.00,
    is_custodial BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    benefits TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- New NFT fields
    mint_quantity INTEGER DEFAULT 1000,
    is_upgradeable BOOLEAN DEFAULT false,
    is_evolvable BOOLEAN DEFAULT true,
    is_fractional_eligible BOOLEAN DEFAULT true,
    auto_staking_duration VARCHAR(20) DEFAULT 'Forever',
    upgrade_bonus_ratio DECIMAL(5,4) DEFAULT 0.0000,
    evolution_min_investment DECIMAL(10,2) DEFAULT 0.00,
    evolution_earnings_ratio DECIMAL(5,4) DEFAULT 0.0000,
    passive_income_rate DECIMAL(5,4) DEFAULT 0.0100,
    custodial_income_rate DECIMAL(5,4) DEFAULT 0.0000,
    features JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    pricing_type VARCHAR(20) DEFAULT 'free',
    one_time_fee DECIMAL(10,2) DEFAULT 0.00,
    monthly_fee DECIMAL(10,2) DEFAULT 0.00,
    annual_fee DECIMAL(10,2) DEFAULT 0.00
);

-- NFT Collections table
CREATE TABLE public.nft_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    contract_address VARCHAR(42),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add collection_id to nft_types
ALTER TABLE public.nft_types ADD COLUMN collection_id UUID REFERENCES public.nft_collections(id) ON DELETE SET NULL;

-- NFT Minting Control table
CREATE TABLE public.nft_minting_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    minting_enabled BOOLEAN DEFAULT true,
    total_minted INTEGER DEFAULT 0,
    max_mintable INTEGER DEFAULT 1000,
    minting_paused_reason TEXT,
    paused_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    paused_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nft_type_id)
);

-- User Loyalty Cards table
CREATE TABLE public.user_loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    loyalty_number TEXT UNIQUE NOT NULL,
    card_number TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    points_balance INTEGER DEFAULT 0,
    tier_level TEXT DEFAULT 'bronze',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- New NFT fields
    token_id TEXT,
    is_upgraded BOOLEAN DEFAULT false,
    is_evolved BOOLEAN DEFAULT false,
    evolved_token_id TEXT,
    current_investment DECIMAL(10,2) DEFAULT 0.00,
    auto_staking_enabled BOOLEAN DEFAULT false,
    auto_staking_asset_id TEXT,
    wallet_address TEXT,
    contract_address TEXT,
    is_verified BOOLEAN DEFAULT false,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    upgraded_at TIMESTAMP WITH TIME ZONE,
    evolved_at TIMESTAMP WITH TIME ZONE
);

-- Step 3: Insert default data
INSERT INTO public.nft_collections (collection_name, display_name, description, is_active) 
VALUES ('Classic', 'Classic Collection', 'The original collection of loyalty NFT cards', true);

INSERT INTO public.nft_types (
    nft_name, display_name, description, image_url, rarity, tier_level, 
    earn_on_spend_ratio, buy_price_usdt, is_custodial, is_active, benefits,
    collection_id, mint_quantity, is_upgradeable, is_evolvable, is_fractional_eligible,
    auto_staking_duration, upgrade_bonus_ratio, evolution_min_investment, evolution_earnings_ratio
) VALUES 
('Pearl White', 'Pearl White Card', 'Free entry-level loyalty card with basic benefits', 
    'https://example.com/pearl-white.png', 'Common', 'bronze', 1.00, 0.00, true, true,
    ARRAY['Basic rewards', 'Standard customer support'],
    (SELECT id FROM public.nft_collections WHERE collection_name = 'Classic'),
    10000, false, true, true, 'Forever', 0.0000, 100.00, 0.0050),
    
('Silver Elite', 'Silver Elite Card', 'Premium loyalty card with enhanced benefits', 
    'https://example.com/silver-elite.png', 'Less Common', 'silver', 1.25, 25.00, true, true,
    ARRAY['Enhanced rewards', 'Priority support', 'Exclusive offers'],
    (SELECT id FROM public.nft_collections WHERE collection_name = 'Classic'),
    5000, true, true, true, 'Forever', 0.0025, 250.00, 0.0075),
    
('Gold Premium', 'Gold Premium Card', 'High-tier loyalty card with premium benefits', 
    'https://example.com/gold-premium.png', 'Rare', 'gold', 1.50, 50.00, true, true,
    ARRAY['Premium rewards', 'VIP support', 'Exclusive events', 'Early access'],
    (SELECT id FROM public.nft_collections WHERE collection_name = 'Classic'),
    2500, true, true, true, 'Forever', 0.0050, 500.00, 0.0100),
    
('Platinum VIP', 'Platinum VIP Card', 'Ultimate loyalty card with maximum benefits', 
    'https://example.com/platinum-vip.png', 'Very Rare', 'platinum', 2.00, 100.00, true, true,
    ARRAY['Maximum rewards', 'Concierge support', 'VIP events', 'Exclusive partnerships'],
    (SELECT id FROM public.nft_collections WHERE collection_name = 'Classic'),
    1000, true, true, true, 'Forever', 0.0100, 1000.00, 0.0150);

-- Step 4: Create minting control records
INSERT INTO public.nft_minting_control (nft_type_id, minting_enabled, total_minted, max_mintable)
SELECT id, true, 0, mint_quantity
FROM public.nft_types;

-- Step 5: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_minting_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;

-- Step 6: Create basic RLS policies
CREATE POLICY "Anyone can view active NFT types" ON public.nft_types FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active NFT collections" ON public.nft_collections FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view minting control" ON public.nft_minting_control FOR SELECT USING (true);

-- Step 7: Verification
SELECT 'Database reset completed successfully!' as status;
SELECT 'nft_types' as table_name, COUNT(*) as count FROM public.nft_types
UNION ALL
SELECT 'nft_collections' as table_name, COUNT(*) as count FROM public.nft_collections
UNION ALL
SELECT 'nft_minting_control' as table_name, COUNT(*) as count FROM public.nft_minting_control;

