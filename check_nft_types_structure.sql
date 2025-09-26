-- Check if nft_types table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'nft_types'
) as nft_types_table_exists;

-- If it exists, check its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'nft_types' 
AND table_schema = 'public'
ORDER BY ordinal_position;
