-- Check the actual structure of merchant_subscription_plans table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'merchant_subscription_plans' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if the table exists at all
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'merchant_subscription_plans'
) as table_exists;
