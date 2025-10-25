-- Link NFT Types to Collections
-- This script adds collection_id to nft_types and creates the relationship

-- =============================================================================
-- 1. ADD COLLECTION_ID COLUMN TO NFT_TYPES
-- =============================================================================

-- Add collection_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'nft_types' 
    AND column_name = 'collection_id'
  ) THEN
    ALTER TABLE public.nft_types 
    ADD COLUMN collection_id UUID;
    
    RAISE NOTICE 'Added collection_id column to nft_types table';
  ELSE
    RAISE NOTICE 'Collection_id column already exists in nft_types table';
  END IF;
END $$;

-- =============================================================================
-- 2. CREATE FOREIGN KEY RELATIONSHIP
-- =============================================================================

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'nft_types' 
    AND constraint_name = 'fk_nft_types_collection_id'
  ) THEN
    ALTER TABLE public.nft_types 
    ADD CONSTRAINT fk_nft_types_collection_id 
    FOREIGN KEY (collection_id) 
    REFERENCES public.nft_collections(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Added foreign key constraint for collection_id';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists for collection_id';
  END IF;
END $$;

-- =============================================================================
-- 3. POPULATE COLLECTION_ID BASED ON RARITY
-- =============================================================================

-- Update collection_id based on rarity (if not already set)
UPDATE public.nft_types 
SET collection_id = (
  SELECT id FROM public.nft_collections 
  WHERE collection_name = CASE 
    WHEN nft_types.rarity = 'Common' THEN 'Classic'
    WHEN nft_types.rarity = 'Less Common' THEN 'Premium'
    WHEN nft_types.rarity = 'Rare' THEN 'Elite'
    WHEN nft_types.rarity = 'Epic' THEN 'Exclusive'
    WHEN nft_types.rarity = 'Legendary' THEN 'Exclusive'
    ELSE 'Classic'
  END
  LIMIT 1
)
WHERE collection_id IS NULL;

-- =============================================================================
-- 4. CREATE ADDITIONAL COLLECTIONS IF NEEDED
-- =============================================================================

-- Insert additional collections if they don't exist
INSERT INTO public.nft_collections (collection_name, display_name, description, is_active) 
VALUES
  ('Premium', 'Premium Collection', 'Premium loyalty NFT collection with enhanced features', true),
  ('Elite', 'Elite Collection', 'Elite loyalty NFT collection for high-tier users', true),
  ('Exclusive', 'Exclusive Collection', 'Exclusive loyalty NFT collection for VIP users', true)
ON CONFLICT (collection_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- =============================================================================
-- 5. VERIFY THE RELATIONSHIP
-- =============================================================================

-- Check the relationship works
SELECT 
  nt.id,
  nt.nft_name,
  nt.rarity,
  nc.collection_name,
  nc.display_name
FROM public.nft_types nt
LEFT JOIN public.nft_collections nc ON nt.collection_id = nc.id
ORDER BY nt.nft_name;

-- Check available collections
SELECT 
  id,
  collection_name,
  display_name,
  description,
  is_active
FROM public.nft_collections
ORDER BY collection_name;

-- =============================================================================
-- 6. SUCCESS MESSAGE
-- =============================================================================

DO $$
DECLARE
  nft_types_count integer;
  collections_count integer;
  linked_count integer;
BEGIN
  -- Count records
  SELECT COUNT(*) INTO nft_types_count FROM public.nft_types;
  SELECT COUNT(*) INTO collections_count FROM public.nft_collections;
  SELECT COUNT(*) INTO linked_count FROM public.nft_types WHERE collection_id IS NOT NULL;
  
  -- Report results
  RAISE NOTICE '';
  RAISE NOTICE '🎉 NFT TYPES TO COLLECTIONS LINKING COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Results:';
  RAISE NOTICE '   NFT Types: %', nft_types_count;
  RAISE NOTICE '   Collections: %', collections_count;
  RAISE NOTICE '   Linked NFT Types: %', linked_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ What was done:';
  RAISE NOTICE '   - Added collection_id column to nft_types';
  RAISE NOTICE '   - Created foreign key relationship';
  RAISE NOTICE '   - Populated collection_id based on rarity';
  RAISE NOTICE '   - Created additional collections (Premium, Elite, Exclusive)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 The Collection dropdown should now work correctly!';
  RAISE NOTICE '';
END $$;
