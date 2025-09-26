-- Check the actual structure of the nft_types table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'nft_types' 
AND table_schema = 'public'
ORDER BY ordinal_position;
