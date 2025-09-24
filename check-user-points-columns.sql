-- Check the actual columns in the user_points table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_points'
ORDER BY ordinal_position;
