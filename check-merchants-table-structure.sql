-- ===========================================
-- CHECK MERCHANTS TABLE STRUCTURE
-- ===========================================
-- This script shows what columns actually exist in the merchants table

-- Check if merchants table exists
SELECT 'Merchants Table Exists' as info, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants' AND table_schema = 'public') 
            THEN 'YES' 
            ELSE 'NO' 
       END as status;

-- Show all columns in merchants table
SELECT 'Merchants Table Columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'merchants'
ORDER BY ordinal_position;

-- Show sample data from merchants table (if any exists)
SELECT 'Sample Merchants Data:' as info;
SELECT * FROM public.merchants LIMIT 5;
