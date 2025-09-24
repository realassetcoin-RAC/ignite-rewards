-- Check the actual columns in the user_loyalty_cards table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_loyalty_cards'
ORDER BY ordinal_position;
