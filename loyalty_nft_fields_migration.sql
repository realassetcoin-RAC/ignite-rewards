-- Migration to add new fields to existing NFT tables
-- This ensures all the new fields from the spreadsheet are properly added

-- 1. Update nft_types table to include all new fields
ALTER TABLE public.nft_types 
ADD COLUMN IF NOT EXISTS collection_name VARCHAR(100) DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS display_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS buy_price_usdt DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mint_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_upgradeable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_evolvable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_fractional_eligible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_staking_duration VARCHAR(20) DEFAULT 'Forever',
ADD COLUMN IF NOT EXISTS earn_on_spend_ratio DECIMAL(5,4) DEFAULT 0.0100,
ADD COLUMN IF NOT EXISTS upgrade_bonus_ratio DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS evolution_min_investment DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS evolution_earnings_ratio DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS is_custodial BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Update existing records to have proper display_name if it's null
UPDATE public.nft_types 
SET display_name = nft_name 
WHERE display_name IS NULL;

-- 3. Update existing records to have proper collection_name
UPDATE public.nft_types 
SET collection_name = 'classic' 
WHERE collection_name IS NULL;

-- 4. Add constraints and indexes for new fields
CREATE INDEX IF NOT EXISTS idx_nft_types_collection_name ON public.nft_types(collection_name);
CREATE INDEX IF NOT EXISTS idx_nft_types_buy_price ON public.nft_types(buy_price_usdt);
CREATE INDEX IF NOT EXISTS idx_nft_types_mint_quantity ON public.nft_types(mint_quantity);
CREATE INDEX IF NOT EXISTS idx_nft_types_is_upgradeable ON public.nft_types(is_upgradeable);
CREATE INDEX IF NOT EXISTS idx_nft_types_is_evolvable ON public.nft_types(is_evolvable);
CREATE INDEX IF NOT EXISTS idx_nft_types_is_fractional_eligible ON public.nft_types(is_fractional_eligible);
CREATE INDEX IF NOT EXISTS idx_nft_types_auto_staking_duration ON public.nft_types(auto_staking_duration);
CREATE INDEX IF NOT EXISTS idx_nft_types_earn_on_spend_ratio ON public.nft_types(earn_on_spend_ratio);
CREATE INDEX IF NOT EXISTS idx_nft_types_upgrade_bonus_ratio ON public.nft_types(upgrade_bonus_ratio);
CREATE INDEX IF NOT EXISTS idx_nft_types_evolution_min_investment ON public.nft_types(evolution_min_investment);
CREATE INDEX IF NOT EXISTS idx_nft_types_evolution_earnings_ratio ON public.nft_types(evolution_earnings_ratio);
CREATE INDEX IF NOT EXISTS idx_nft_types_is_custodial ON public.nft_types(is_custodial);
CREATE INDEX IF NOT EXISTS idx_nft_types_is_active ON public.nft_types(is_active);

-- 5. Update user_loyalty_cards table to include new fields if they don't exist
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

-- 6. Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_loyalty_cards_nft_type'
    ) THEN
        ALTER TABLE public.user_loyalty_cards 
        ADD CONSTRAINT fk_user_loyalty_cards_nft_type 
        FOREIGN KEY (nft_type_id) REFERENCES public.nft_types(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 7. Create or update the nft_collections table
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

-- 8. Insert default collection if it doesn't exist
INSERT INTO public.nft_collections (collection_name, display_name, description) 
VALUES ('classic', 'Classic Collection', 'The original loyalty NFT collection featuring various rarity levels and benefits')
ON CONFLICT (collection_name) DO NOTHING;

-- 9. Update nft_types to reference the collection
UPDATE public.nft_types 
SET collection_id = (SELECT id FROM public.nft_collections WHERE collection_name = 'classic')
WHERE collection_id IS NULL;

-- 10. Add foreign key constraint for collection_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_nft_types_collection'
    ) THEN
        ALTER TABLE public.nft_types 
        ADD CONSTRAINT fk_nft_types_collection 
        FOREIGN KEY (collection_id) REFERENCES public.nft_collections(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 11. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_nft_types_updated_at') THEN
        CREATE TRIGGER update_nft_types_updated_at 
            BEFORE UPDATE ON public.nft_types 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_nft_collections_updated_at') THEN
        CREATE TRIGGER update_nft_collections_updated_at 
            BEFORE UPDATE ON public.nft_collections 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 12. Update RLS policies for new tables
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for nft_collections
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'nft_collections' AND policyname = 'Anyone can view active collections'
    ) THEN
        CREATE POLICY "Anyone can view active collections" ON public.nft_collections
            FOR SELECT USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'nft_collections' AND policyname = 'Authenticated users can manage collections'
    ) THEN
        CREATE POLICY "Authenticated users can manage collections" ON public.nft_collections
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 14. Insert sample data for testing (optional - remove in production)
INSERT INTO public.nft_types (
    collection_id, nft_name, display_name, buy_price_usdt, rarity, mint_quantity,
    is_upgradeable, is_evolvable, is_fractional_eligible, auto_staking_duration,
    earn_on_spend_ratio, upgrade_bonus_ratio, evolution_min_investment, evolution_earnings_ratio,
    is_custodial, is_active
) VALUES
-- Custodial NFTs
((SELECT id FROM public.nft_collections WHERE collection_name = 'classic'), 'Pearl White', 'Pearl White', 0, 'Common', 10000, true, true, true, 'Forever', 0.0100, 0.0000, 100, 0.0025, true, true),
((SELECT id FROM public.nft_collections WHERE collection_name = 'classic'), 'Lava Orange', 'Lava Orange', 100, 'Less Common', 3000, true, true, true, 'Forever', 0.0110, 0.0010, 500, 0.0050, true, true),
((SELECT id FROM public.nft_collections WHERE collection_name = 'classic'), 'Pink', 'Pink', 100, 'Less Common', 3000, true, true, true, 'Forever', 0.0110, 0.0010, 500, 0.0050, true, true),
((SELECT id FROM public.nft_collections WHERE collection_name = 'classic'), 'Silver', 'Silver', 200, 'Rare', 750, true, true, true, 'Forever', 0.0120, 0.0015, 1000, 0.0075, true, true),
((SELECT id FROM public.nft_collections WHERE collection_name = 'classic'), 'Gold', 'Gold', 300, 'Rare', 750, true, true, true, 'Forever', 0.0130, 0.0020, 1500, 0.0100, true, true),
((SELECT id FROM public.nft_collections WHERE collection_name = 'classic'), 'Black', 'Black', 500, 'Very Rare', 250, true, true, true, 'Forever', 0.0140, 0.0030, 2500, 0.0125, true, true),

-- Non-Custodial NFTs
((SELECT id FROM public.nft_collections WHERE collection_name = 'classic'), 'Pearl White', 'Pearl White', 100, 'Common', 10000, false, true, true, 'Forever', 0.0100, 0.0000, 500, 0.0050, false, true),
((SELECT id FROM public.nft_collections WHERE collection_name = 'classic'), 'Lava Orange', 'Lava Orange', 500, 'Less Common', 3000, false, true, true, 'Forever', 0.0110, 0.0000, 2500, 0.0125, false, true),
((SELECT id FROM public.nft_collections WHERE collection_name = 'classic'), 'Pink', 'Pink', 500, 'Less Common', 3000, false, true, true, 'Forever', 0.0110, 0.0000, 2500, 0.0125, false, true),
((SELECT id FROM public.nft_collections WHERE collection_name = 'classic'), 'Silver', 'Silver', 1000, 'Rare', 750, false, true, true, 'Forever', 0.0120, 0.0000, 5000, 0.0015, false, true),
((SELECT id FROM public.nft_collections WHERE collection_name = 'classic'), 'Gold', 'Gold', 1000, 'Rare', 750, false, true, true, 'Forever', 0.0130, 0.0000, 5000, 0.0020, false, true),
((SELECT id FROM public.nft_collections WHERE collection_name = 'classic'), 'Black', 'Black', 2500, 'Very Rare', 250, false, true, true, 'Forever', 0.0140, 0.0000, 12500, 0.0030, false, true)
ON CONFLICT (collection_id, nft_name, is_custodial) DO NOTHING;

-- 15. Create minting control table if it doesn't exist
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

-- Insert minting control for each NFT type
INSERT INTO public.nft_minting_control (nft_type_id, max_mintable, minting_enabled)
SELECT id, mint_quantity, true FROM public.nft_types
ON CONFLICT (nft_type_id) DO NOTHING;

-- 16. Enable RLS for minting control
ALTER TABLE public.nft_minting_control ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for minting control
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'nft_minting_control' AND policyname = 'Anyone can view minting control'
    ) THEN
        CREATE POLICY "Anyone can view minting control" ON public.nft_minting_control
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'nft_minting_control' AND policyname = 'Authenticated users can manage minting control'
    ) THEN
        CREATE POLICY "Authenticated users can manage minting control" ON public.nft_minting_control
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- 17. Create trigger for minting control updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_nft_minting_control_updated_at') THEN
        CREATE TRIGGER update_nft_minting_control_updated_at 
            BEFORE UPDATE ON public.nft_minting_control 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Migration completed successfully
SELECT 'Loyalty NFT fields migration completed successfully!' as status;







