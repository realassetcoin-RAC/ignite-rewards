-- ===========================================
-- EMERGENCY DATABASE FIX
-- ===========================================
-- This script fixes the database step by step with error handling

-- Step 1: Check if nft_types table exists and add missing columns
DO $$
BEGIN
    -- Add missing columns to nft_types if they don't exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nft_types' AND table_schema = 'public') THEN
        RAISE NOTICE 'nft_types table exists, adding missing columns...';
        
        -- Add columns one by one with error handling
        BEGIN
            ALTER TABLE public.nft_types ADD COLUMN IF NOT EXISTS mint_quantity INTEGER DEFAULT 1000;
            RAISE NOTICE 'Added mint_quantity column';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'mint_quantity column already exists or error: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TABLE public.nft_types ADD COLUMN IF NOT EXISTS is_upgradeable BOOLEAN DEFAULT false;
            RAISE NOTICE 'Added is_upgradeable column';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'is_upgradeable column already exists or error: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TABLE public.nft_types ADD COLUMN IF NOT EXISTS is_evolvable BOOLEAN DEFAULT true;
            RAISE NOTICE 'Added is_evolvable column';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'is_evolvable column already exists or error: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TABLE public.nft_types ADD COLUMN IF NOT EXISTS is_fractional_eligible BOOLEAN DEFAULT true;
            RAISE NOTICE 'Added is_fractional_eligible column';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'is_fractional_eligible column already exists or error: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TABLE public.nft_types ADD COLUMN IF NOT EXISTS auto_staking_duration VARCHAR(20) DEFAULT 'Forever';
            RAISE NOTICE 'Added auto_staking_duration column';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'auto_staking_duration column already exists or error: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TABLE public.nft_types ADD COLUMN IF NOT EXISTS upgrade_bonus_ratio DECIMAL(5,4) DEFAULT 0.0000;
            RAISE NOTICE 'Added upgrade_bonus_ratio column';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'upgrade_bonus_ratio column already exists or error: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TABLE public.nft_types ADD COLUMN IF NOT EXISTS evolution_min_investment DECIMAL(10,2) DEFAULT 0.00;
            RAISE NOTICE 'Added evolution_min_investment column';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'evolution_min_investment column already exists or error: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TABLE public.nft_types ADD COLUMN IF NOT EXISTS evolution_earnings_ratio DECIMAL(5,4) DEFAULT 0.0000;
            RAISE NOTICE 'Added evolution_earnings_ratio column';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'evolution_earnings_ratio column already exists or error: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE 'nft_types table does not exist - this is a critical issue';
    END IF;
END $$;

-- Step 2: Create nft_collections table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nft_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Insert default collection if it doesn't exist
INSERT INTO public.nft_collections (collection_name, display_name, description) 
SELECT 'Classic', 'Classic Collection', 'The original collection of loyalty NFT cards'
WHERE NOT EXISTS (SELECT 1 FROM public.nft_collections WHERE collection_name = 'Classic');

-- Step 4: Add collection_id to nft_types if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'nft_types' 
        AND column_name = 'collection_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.nft_types ADD COLUMN collection_id UUID REFERENCES public.nft_collections(id);
        RAISE NOTICE 'Added collection_id column to nft_types';
    ELSE
        RAISE NOTICE 'collection_id column already exists in nft_types';
    END IF;
END $$;

-- Step 5: Update existing NFT types with collection
UPDATE public.nft_types 
SET collection_id = (SELECT id FROM public.nft_collections WHERE collection_name = 'Classic' LIMIT 1)
WHERE collection_id IS NULL;

-- Step 6: Create nft_minting_control table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nft_minting_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id),
    minting_enabled BOOLEAN DEFAULT true,
    total_minted INTEGER DEFAULT 0,
    max_mintable INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create minting control records for existing NFT types
INSERT INTO public.nft_minting_control (nft_type_id, minting_enabled, total_minted, max_mintable)
SELECT id, true, 0, 1000
FROM public.nft_types
WHERE NOT EXISTS (SELECT 1 FROM public.nft_minting_control WHERE nft_type_id = nft_types.id);

-- Step 8: Update NFT types with proper values
UPDATE public.nft_types 
SET 
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
    END;

-- Step 9: Enable RLS on new tables
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_minting_control ENABLE ROW LEVEL SECURITY;

-- Step 10: Create basic RLS policies
DROP POLICY IF EXISTS "Anyone can view active NFT collections" ON public.nft_collections;
CREATE POLICY "Anyone can view active NFT collections" ON public.nft_collections FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view minting control" ON public.nft_minting_control;
CREATE POLICY "Anyone can view minting control" ON public.nft_minting_control FOR SELECT USING (true);

-- Step 11: Final verification
SELECT 'Emergency database fix completed!' as status;
SELECT 'nft_types' as table_name, COUNT(*) as count FROM public.nft_types
UNION ALL
SELECT 'nft_collections' as table_name, COUNT(*) as count FROM public.nft_collections
UNION ALL
SELECT 'nft_minting_control' as table_name, COUNT(*) as count FROM public.nft_minting_control;

