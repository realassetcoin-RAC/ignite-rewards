-- Check the actual columns in the merchants table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'merchants'
ORDER BY ordinal_position;
