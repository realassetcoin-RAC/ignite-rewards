-- Prevent Future Duplicate Loyalty Cards
-- Adds a unique constraint on nft_name to ensure no duplicates

-- Add unique constraint on nft_name
DO $$ 
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'nft_types_nft_name_key'
    ) THEN
        -- Add the constraint
        ALTER TABLE public.nft_types 
        ADD CONSTRAINT nft_types_nft_name_key 
        UNIQUE (nft_name);
        
        RAISE NOTICE '✅ Added unique constraint on nft_name';
        RAISE NOTICE 'Future attempts to create duplicate card names will be prevented';
    ELSE
        RAISE NOTICE 'ℹ️  Unique constraint already exists';
    END IF;
EXCEPTION
    WHEN duplicate_key THEN
        RAISE WARNING '⚠️  Cannot add constraint: duplicate values exist';
    WHEN OTHERS THEN
        RAISE WARNING '⚠️  Error: %', SQLERRM;
END $$;

-- Verify current cards
SELECT 
    COUNT(*) as total_cards,
    COUNT(DISTINCT nft_name) as unique_names
FROM public.nft_types;

-- Show all current cards
SELECT 
    nft_name,
    rarity,
    buy_price_usdt,
    is_active,
    created_at
FROM public.nft_types
ORDER BY 
    CASE rarity
        WHEN 'Common' THEN 1
        WHEN 'Less Common' THEN 2
        WHEN 'Rare' THEN 3
        WHEN 'Very Rare' THEN 4
    END,
    nft_name;

