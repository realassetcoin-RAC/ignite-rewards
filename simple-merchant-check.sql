-- Simple check of merchant tables
SELECT 'Tables:' as info, table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%merchant%';

SELECT 'Merchants columns:' as info, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchants' ORDER BY ordinal_position;

SELECT 'Subscription plans columns:' as info, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' ORDER BY ordinal_position;
