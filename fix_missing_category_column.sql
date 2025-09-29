-- Quick Fix: Add Missing Category Column
-- This script adds the missing category column to marketplace_listings table
-- Date: 2025-01-28

-- Add category column (required field missing from database)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marketplace_listings' 
        AND column_name = 'category' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN category VARCHAR(100) DEFAULT 'Other';
        RAISE NOTICE 'Added category column to marketplace_listings';
    ELSE
        RAISE NOTICE 'Category column already exists in marketplace_listings';
    END IF;
END $$;

-- Create index for category column
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON public.marketplace_listings(category);

-- Verify the column was added
SELECT 'CATEGORY COLUMN ADDED:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'marketplace_listings' 
AND column_name = 'category'
AND table_schema = 'public';

SELECT '✅ Category column fix completed!' as status;


