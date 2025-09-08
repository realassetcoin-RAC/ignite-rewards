-- Migration to extend existing tables for Custodial & Non-Custodial NFT support
-- This modifies existing tables instead of creating new ones

-- 1. Extend the existing user_loyalty_cards table to support NFT features
ALTER TABLE public.user_loyalty_cards 
ADD COLUMN IF NOT EXISTS nft_type_id UUID,
ADD COLUMN IF NOT EXISTS is_custodial BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS token_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_upgraded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_evolved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS evolved_token_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_investment DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_staking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_staking_asset_id UUID,
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS contract_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS evolved_at TIMESTAMP WITH TIME ZONE;

-- 2. Create NFT Types table (this is new but essential)
CREATE TABLE IF NOT EXISTS public.nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_name VARCHAR(100) NOT NULL, -- Pearl White, Lava Orange, etc.
    display_name VARCHAR(150) NOT NULL,
    buy_price_usdt DECIMAL(10,2) NOT NULL DEFAULT 0,
    rarity VARCHAR(50) NOT NULL, -- Common, Less Common, Rare, Very Rare
    mint_quantity INTEGER NOT NULL DEFAULT 0,
    is_upgradeable BOOLEAN DEFAULT false,
    is_evolvable BOOLEAN DEFAULT true,
    is_fractional_eligible BOOLEAN DEFAULT true,
    auto_staking_duration VARCHAR(20) DEFAULT 'Forever',
    earn_on_spend_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.0100, -- 1.00% = 0.0100
    upgrade_bonus_ratio DECIMAL(5,4) DEFAULT 0.0000, -- Only for custodial upgraded NFTs
    evolution_min_investment DECIMAL(10,2) DEFAULT 0,
    evolution_earnings_ratio DECIMAL(5,4) DEFAULT 0.0000,
    is_custodial BOOLEAN NOT NULL, -- true for custodial, false for non-custodial
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nft_name, is_custodial)
);

-- 3. Add foreign key constraint to user_loyalty_cards
ALTER TABLE public.user_loyalty_cards 
ADD CONSTRAINT fk_user_loyalty_cards_nft_type 
FOREIGN KEY (nft_type_id) REFERENCES public.nft_types(id) ON DELETE SET NULL;

-- 4. Extend the existing nft_card_tiers table to support new NFT types
ALTER TABLE public.nft_card_tiers
ADD COLUMN IF NOT EXISTS nft_type_id UUID,
ADD COLUMN IF NOT EXISTS rarity VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_custodial BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS buy_price_usdt DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mint_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_upgradeable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_evolvable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_fractional_eligible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_staking_duration VARCHAR(20) DEFAULT 'Forever',
ADD COLUMN IF NOT EXISTS earn_on_spend_ratio DECIMAL(5,4) DEFAULT 0.0100,
ADD COLUMN IF NOT EXISTS upgrade_bonus_ratio DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS evolution_min_investment DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS evolution_earnings_ratio DECIMAL(5,4) DEFAULT 0.0000;

-- 5. Add foreign key constraint to nft_card_tiers
ALTER TABLE public.nft_card_tiers
ADD CONSTRAINT fk_nft_card_tiers_nft_type 
FOREIGN KEY (nft_type_id) REFERENCES public.nft_types(id) ON DELETE SET NULL;

-- 6. Create NFT Evolution History table
CREATE TABLE IF NOT EXISTS public.nft_evolution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    original_token_id VARCHAR(100),
    evolved_token_id VARCHAR(100),
    investment_amount DECIMAL(15,2) NOT NULL,
    evolution_triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 7. Create NFT Upgrade History table
CREATE TABLE IF NOT EXISTS public.nft_upgrade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    original_earn_ratio DECIMAL(5,4) NOT NULL,
    new_earn_ratio DECIMAL(5,4) NOT NULL,
    upgrade_bonus_ratio DECIMAL(5,4) NOT NULL,
    upgraded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 8. Create NFT Minting Control table
CREATE TABLE IF NOT EXISTS public.nft_minting_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    minting_enabled BOOLEAN DEFAULT true,
    total_minted INTEGER DEFAULT 0,
    max_mintable INTEGER NOT NULL,
    minting_paused_reason TEXT,
    paused_by UUID REFERENCES auth.users(id),
    paused_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nft_type_id)
);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_nft_type ON public.user_loyalty_cards(nft_type_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_custodial ON public.user_loyalty_cards(is_custodial);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_wallet ON public.user_loyalty_cards(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nft_types_custodial ON public.nft_types(is_custodial);
CREATE INDEX IF NOT EXISTS idx_nft_types_rarity ON public.nft_types(rarity);
CREATE INDEX IF NOT EXISTS idx_nft_evolution_history_user ON public.nft_evolution_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_upgrade_history_user ON public.nft_upgrade_history(user_id);

-- 10. Enable RLS on new tables
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_evolution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_upgrade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_minting_control ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies for new tables
CREATE POLICY "Anyone can view active NFT types" ON public.nft_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage NFT types" ON public.nft_types
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own evolution history" ON public.nft_evolution_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own upgrade history" ON public.nft_upgrade_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can view minting control" ON public.nft_minting_control
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage minting control" ON public.nft_minting_control
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 12. Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nft_types_updated_at 
    BEFORE UPDATE ON public.nft_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nft_minting_control_updated_at 
    BEFORE UPDATE ON public.nft_minting_control 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Insert NFT Types based on spreadsheet data
INSERT INTO public.nft_types (
    nft_name, display_name, buy_price_usdt, rarity, mint_quantity,
    is_upgradeable, is_evolvable, is_fractional_eligible, auto_staking_duration,
    earn_on_spend_ratio, upgrade_bonus_ratio, evolution_min_investment, evolution_earnings_ratio,
    is_custodial
) VALUES
-- Custodial NFTs
('Pearl White', 'Pearl White', 0, 'Common', 10000, true, true, true, 'Forever', 0.0100, 0.0000, 100, 0.0025, true),
('Lava Orange', 'Lava Orange', 100, 'Less Common', 3000, true, true, true, 'Forever', 0.0110, 0.0010, 500, 0.0050, true),
('Pink', 'Pink', 100, 'Less Common', 3000, true, true, true, 'Forever', 0.0110, 0.0010, 500, 0.0050, true),
('Silver', 'Silver', 200, 'Rare', 750, true, true, true, 'Forever', 0.0120, 0.0015, 1000, 0.0075, true),
('Gold', 'Gold', 300, 'Rare', 750, true, true, true, 'Forever', 0.0130, 0.0020, 1500, 0.0100, true),
('Black', 'Black', 500, 'Very Rare', 250, true, true, true, 'Forever', 0.0140, 0.0030, 2500, 0.0125, true),

-- Non-Custodial NFTs
('Pearl White', 'Pearl White', 100, 'Common', 10000, false, true, true, 'Forever', 0.0100, 0.0000, 500, 0.0050, false),
('Lava Orange', 'Lava Orange', 500, 'Less Common', 3000, false, true, true, 'Forever', 0.0110, 0.0000, 2500, 0.0125, false),
('Pink', 'Pink', 500, 'Less Common', 3000, false, true, true, 'Forever', 0.0110, 0.0000, 2500, 0.0125, false),
('Silver', 'Silver', 1000, 'Rare', 750, false, true, true, 'Forever', 0.0120, 0.0000, 5000, 0.0015, false),
('Gold', 'Gold', 1000, 'Rare', 750, false, true, true, 'Forever', 0.0130, 0.0000, 5000, 0.0020, false),
('Black', 'Black', 2500, 'Very Rare', 250, false, true, true, 'Forever', 0.0140, 0.0000, 12500, 0.0030, false)
ON CONFLICT (nft_name, is_custodial) DO NOTHING;

-- 14. Insert minting control for each NFT type
INSERT INTO public.nft_minting_control (nft_type_id, max_mintable, minting_enabled)
SELECT id, mint_quantity, true FROM public.nft_types
ON CONFLICT (nft_type_id) DO NOTHING;

-- 15. Update existing nft_card_tiers to link with new NFT types
UPDATE public.nft_card_tiers 
SET nft_type_id = (
    SELECT id FROM public.nft_types 
    WHERE nft_name = CASE 
        WHEN tier_name = 'basic' THEN 'Pearl White'
        WHEN tier_name = 'standard' THEN 'Lava Orange'
        WHEN tier_name = 'premium' THEN 'Silver'
        WHEN tier_name = 'premium_plus' THEN 'Gold'
        WHEN tier_name = 'vip' THEN 'Black'
        ELSE 'Pearl White'
    END
    AND is_custodial = true
    LIMIT 1
)
WHERE nft_type_id IS NULL;

-- 16. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
