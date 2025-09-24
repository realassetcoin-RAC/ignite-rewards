-- Check the actual structure of dao_votes table
SELECT 
  'dao_votes table structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_votes'
ORDER BY ordinal_position;







