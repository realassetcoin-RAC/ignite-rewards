-- Check the current structure of merchant_subscription_plans table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'merchant_subscription_plans' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check the current structure of nft_types table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'nft_types' 
AND table_schema = 'public'
ORDER BY ordinal_position;
