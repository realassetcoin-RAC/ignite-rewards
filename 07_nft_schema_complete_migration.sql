-- ===========================================
-- COMPLETE NFT SCHEMA MIGRATION
-- ===========================================
-- This script adds all missing fields and tables for NFT loyalty cards
-- Run this to fix the schema mismatch between database and service

-- ===========================================
-- STEP 1: ADD MISSING FIELDS TO NFT_TYPES TABLE
-- ===========================================

-- Add missing fields to nft_types table
ALTER TABLE public.nft_types 
ADD COLUMN IF NOT EXISTS mint_quantity INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS is_upgradeable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_evolvable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_fractional_eligible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_staking_duration VARCHAR(20) DEFAULT 'Forever',
ADD COLUMN IF NOT EXISTS upgrade_bonus_ratio DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS evolution_min_investment DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS evolution_earnings_ratio DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS passive_income_rate DECIMAL(5,4) DEFAULT 0.0100,
ADD COLUMN IF NOT EXISTS custodial_income_rate DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS one_time_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS annual_fee DECIMAL(10,2) DEFAULT 0.00;

-- Update rarity to use proper enum values
UPDATE public.nft_types 
SET rarity = CASE 
    WHEN rarity = 'common' THEN 'Common'
    WHEN rarity = 'uncommon' THEN 'Less Common'
    WHEN rarity = 'rare' THEN 'Rare'
    WHEN rarity = 'epic' THEN 'Very Rare'
    ELSE 'Common'
END;

-- ===========================================
-- STEP 2: CREATE NFT COLLECTIONS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.nft_collections (
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
ALTER TABLE public.nft_types 
ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES public.nft_collections(id) ON DELETE SET NULL;

-- ===========================================
-- STEP 3: CREATE NFT MINTING CONTROL TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.nft_minting_control (
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

-- ===========================================
-- STEP 4: CREATE NFT EVOLUTION HISTORY TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.nft_evolution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    original_token_id TEXT,
    evolved_token_id TEXT,
    investment_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    evolution_triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- STEP 5: CREATE NFT UPGRADE HISTORY TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.nft_upgrade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    original_earn_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    new_earn_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    upgrade_bonus_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    upgraded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- STEP 6: UPDATE USER_LOYALTY_CARDS TABLE
-- ===========================================

-- Add missing fields to user_loyalty_cards
ALTER TABLE public.user_loyalty_cards 
ADD COLUMN IF NOT EXISTS token_id TEXT,
ADD COLUMN IF NOT EXISTS is_upgraded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_evolved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS evolved_token_id TEXT,
ADD COLUMN IF NOT EXISTS current_investment DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS auto_staking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_staking_asset_id TEXT,
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS contract_address TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS evolved_at TIMESTAMP WITH TIME ZONE;

-- ===========================================
-- STEP 7: INSERT DEFAULT NFT COLLECTION
-- ===========================================

INSERT INTO public.nft_collections (collection_name, display_name, description, is_active) 
SELECT 'Classic', 'Classic Collection', 'The original collection of loyalty NFT cards', true
WHERE NOT EXISTS (SELECT 1 FROM public.nft_collections WHERE collection_name = 'Classic');

-- ===========================================
-- STEP 8: UPDATE EXISTING NFT TYPES
-- ===========================================

-- Update existing NFT types with proper values
UPDATE public.nft_types 
SET 
    collection_id = (SELECT id FROM public.nft_collections WHERE collection_name = 'Classic' LIMIT 1),
    mint_quantity = CASE 
        WHEN nft_name = 'Pearl White' THEN 10000
        WHEN nft_name = 'Silver Elite' THEN 5000
        WHEN nft_name = 'Gold Premium' THEN 2500
        WHEN nft_name = 'Platinum VIP' THEN 1000
        ELSE 1000
    END,
    is_upgradeable = CASE 
        WHEN nft_name IN ('Silver Elite', 'Gold Premium', 'Platinum VIP') THEN true
        ELSE false
    END,
    is_evolvable = true,
    is_fractional_eligible = true,
    auto_staking_duration = 'Forever',
    upgrade_bonus_ratio = CASE 
        WHEN nft_name = 'Silver Elite' THEN 0.0025
        WHEN nft_name = 'Gold Premium' THEN 0.0050
        WHEN nft_name = 'Platinum VIP' THEN 0.0100
        ELSE 0.0000
    END,
    evolution_min_investment = CASE 
        WHEN nft_name = 'Pearl White' THEN 100.00
        WHEN nft_name = 'Silver Elite' THEN 250.00
        WHEN nft_name = 'Gold Premium' THEN 500.00
        WHEN nft_name = 'Platinum VIP' THEN 1000.00
        ELSE 100.00
    END,
    evolution_earnings_ratio = CASE 
        WHEN nft_name = 'Pearl White' THEN 0.0050
        WHEN nft_name = 'Silver Elite' THEN 0.0075
        WHEN nft_name = 'Gold Premium' THEN 0.0100
        WHEN nft_name = 'Platinum VIP' THEN 0.0150
        ELSE 0.0050
    END,
    passive_income_rate = CASE 
        WHEN nft_name = 'Pearl White' THEN 0.0100
        WHEN nft_name = 'Silver Elite' THEN 0.0125
        WHEN nft_name = 'Gold Premium' THEN 0.0150
        WHEN nft_name = 'Platinum VIP' THEN 0.0200
        ELSE 0.0100
    END,
    custodial_income_rate = CASE 
        WHEN nft_name = 'Pearl White' THEN 0.0050
        WHEN nft_name = 'Silver Elite' THEN 0.0075
        WHEN nft_name = 'Gold Premium' THEN 0.0100
        WHEN nft_name = 'Platinum VIP' THEN 0.0150
        ELSE 0.0050
    END,
    features = CASE 
        WHEN nft_name = 'Pearl White' THEN '["basic_rewards", "standard_support"]'::jsonb
        WHEN nft_name = 'Silver Elite' THEN '["enhanced_rewards", "priority_support", "exclusive_offers"]'::jsonb
        WHEN nft_name = 'Gold Premium' THEN '["premium_rewards", "vip_support", "exclusive_events", "early_access"]'::jsonb
        WHEN nft_name = 'Platinum VIP' THEN '["maximum_rewards", "concierge_support", "vip_events", "exclusive_partnerships"]'::jsonb
        ELSE '["basic_rewards"]'::jsonb
    END,
    subscription_plan = 'basic',
    pricing_type = CASE 
        WHEN buy_price_usdt = 0 THEN 'free'
        ELSE 'one_time'
    END,
    one_time_fee = buy_price_usdt,
    monthly_fee = 0.00,
    annual_fee = 0.00;

-- ===========================================
-- STEP 9: CREATE MINTING CONTROL RECORDS
-- ===========================================

-- Create minting control records for all NFT types
INSERT INTO public.nft_minting_control (nft_type_id, minting_enabled, total_minted, max_mintable)
SELECT 
    id,
    true,
    0,
    mint_quantity
FROM public.nft_types
WHERE NOT EXISTS (SELECT 1 FROM public.nft_minting_control WHERE nft_type_id = nft_types.id);

-- ===========================================
-- STEP 10: CREATE INDEXES FOR PERFORMANCE
-- ===========================================

-- NFT Collections indexes
CREATE INDEX IF NOT EXISTS idx_nft_collections_name ON public.nft_collections(collection_name);
CREATE INDEX IF NOT EXISTS idx_nft_collections_active ON public.nft_collections(is_active);

-- NFT Types indexes
CREATE INDEX IF NOT EXISTS idx_nft_types_collection_id ON public.nft_types(collection_id);
CREATE INDEX IF NOT EXISTS idx_nft_types_custodial ON public.nft_types(is_custodial);
CREATE INDEX IF NOT EXISTS idx_nft_types_active ON public.nft_types(is_active);
CREATE INDEX IF NOT EXISTS idx_nft_types_price ON public.nft_types(buy_price_usdt);

-- NFT Minting Control indexes
CREATE INDEX IF NOT EXISTS idx_nft_minting_control_type_id ON public.nft_minting_control(nft_type_id);
CREATE INDEX IF NOT EXISTS idx_nft_minting_control_enabled ON public.nft_minting_control(minting_enabled);

-- NFT Evolution History indexes
CREATE INDEX IF NOT EXISTS idx_nft_evolution_history_user_id ON public.nft_evolution_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_evolution_history_type_id ON public.nft_evolution_history(nft_type_id);
CREATE INDEX IF NOT EXISTS idx_nft_evolution_history_active ON public.nft_evolution_history(is_active);

-- NFT Upgrade History indexes
CREATE INDEX IF NOT EXISTS idx_nft_upgrade_history_user_id ON public.nft_upgrade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_upgrade_history_type_id ON public.nft_upgrade_history(nft_type_id);
CREATE INDEX IF NOT EXISTS idx_nft_upgrade_history_active ON public.nft_upgrade_history(is_active);

-- User Loyalty Cards indexes
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_token_id ON public.user_loyalty_cards(token_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_upgraded ON public.user_loyalty_cards(is_upgraded);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_evolved ON public.user_loyalty_cards(is_evolved);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_verified ON public.user_loyalty_cards(is_verified);

-- ===========================================
-- STEP 11: ENABLE ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on new tables
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_minting_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_evolution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_upgrade_history ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- STEP 12: CREATE RLS POLICIES
-- ===========================================

-- NFT Collections policies
DROP POLICY IF EXISTS "Anyone can view active NFT collections" ON public.nft_collections;
CREATE POLICY "Anyone can view active NFT collections" ON public.nft_collections FOR SELECT USING (is_active = true);

-- NFT Minting Control policies
DROP POLICY IF EXISTS "Anyone can view minting control" ON public.nft_minting_control;
CREATE POLICY "Anyone can view minting control" ON public.nft_minting_control FOR SELECT USING (true);

-- NFT Evolution History policies
DROP POLICY IF EXISTS "Users can view their own evolution history" ON public.nft_evolution_history;
CREATE POLICY "Users can view their own evolution history" ON public.nft_evolution_history FOR SELECT USING (auth.uid() = user_id);

-- NFT Upgrade History policies
DROP POLICY IF EXISTS "Users can view their own upgrade history" ON public.nft_upgrade_history;
CREATE POLICY "Users can view their own upgrade history" ON public.nft_upgrade_history FOR SELECT USING (auth.uid() = user_id);

-- ===========================================
-- STEP 13: VERIFICATION QUERIES
-- ===========================================

-- Show updated NFT types
SELECT 
    'Updated NFT Types:' as info,
    nft_name,
    display_name,
    rarity,
    buy_price_usdt,
    mint_quantity,
    is_upgradeable,
    is_evolvable,
    is_fractional_eligible,
    collection_id
FROM public.nft_types
ORDER BY buy_price_usdt ASC;

-- Show NFT collections
SELECT 
    'NFT Collections:' as info,
    collection_name,
    display_name,
    is_active
FROM public.nft_collections;

-- Show minting control
SELECT 
    'Minting Control:' as info,
    nt.nft_name,
    mc.minting_enabled,
    mc.total_minted,
    mc.max_mintable
FROM public.nft_minting_control mc
JOIN public.nft_types nt ON mc.nft_type_id = nt.id;

-- ===========================================
-- STEP 14: COMPLETION MESSAGE
-- ===========================================

SELECT '✅ NFT SCHEMA MIGRATION COMPLETED!' as message;
SELECT 'All missing fields and tables have been added' as status;
SELECT 'NFT loyalty cards should now load properly' as next_step;

