-- Remove Duplicate Loyalty Cards from nft_types table
-- Date: 2025-09-30

-- 1. IDENTIFY DUPLICATES
-- =====================================================
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) - COUNT(DISTINCT nft_name) INTO duplicate_count
    FROM public.nft_types;
    
    RAISE NOTICE 'Found % duplicate cards', duplicate_count;
END $$;

-- 2. SHOW DUPLICATES
-- =====================================================
SELECT nft_name, display_name, COUNT(*) as count, 
       STRING_AGG(id::text, ', ') as duplicate_ids
FROM public.nft_types
GROUP BY nft_name, display_name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 3. REMOVE DUPLICATES (Keep oldest record, remove newer ones)
-- =====================================================
DELETE FROM public.nft_types
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY nft_name, display_name 
                   ORDER BY created_at ASC
               ) AS rn
        FROM public.nft_types
    ) t
    WHERE t.rn > 1
);

-- 4. VERIFY REMOVAL
-- =====================================================
DO $$
DECLARE
    total_cards INTEGER;
    unique_cards INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_cards FROM public.nft_types;
    SELECT COUNT(DISTINCT nft_name) INTO unique_cards FROM public.nft_types;
    
    RAISE NOTICE '=== DUPLICATE REMOVAL COMPLETE ===';
    RAISE NOTICE 'Total cards in database: %', total_cards;
    RAISE NOTICE 'Unique card names: %', unique_cards;
    
    IF total_cards = unique_cards THEN
        RAISE NOTICE '✅ SUCCESS: No duplicates remaining!';
    ELSE
        RAISE WARNING '⚠️  WARNING: Still % duplicates', (total_cards - unique_cards);
    END IF;
END $$;

-- 5. ADD UNIQUE CONSTRAINT TO PREVENT FUTURE DUPLICATES
-- =====================================================
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE public.nft_types 
    DROP CONSTRAINT IF EXISTS nft_types_nft_name_unique;
    
    -- Add unique constraint on nft_name
    ALTER TABLE public.nft_types 
    ADD CONSTRAINT nft_types_nft_name_unique 
    UNIQUE (nft_name);
    
    RAISE NOTICE '✅ Added unique constraint on nft_name to prevent future duplicates';
EXCEPTION
    WHEN duplicate_key THEN
        RAISE WARNING 'Unique constraint already exists';
    WHEN OTHERS THEN
        RAISE WARNING 'Could not add unique constraint: %', SQLERRM;
END $$;

-- 6. SHOW FINAL LIST OF CARDS
-- =====================================================
SELECT id, nft_name, display_name, rarity, buy_price_usdt, is_active, created_at
FROM public.nft_types
ORDER BY created_at DESC;

