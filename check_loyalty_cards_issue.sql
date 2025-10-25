-- Check Loyalty Cards Loading Issue
-- This script will help diagnose why loyalty cards are not loading

-- 1. Check if the user_loyalty_cards table exists in both schemas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'user_loyalty_cards'
ORDER BY schemaname;

-- 2. Check table structure in public schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_loyalty_cards'
ORDER BY ordinal_position;

-- 3. Check table structure in api schema (if exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'api' 
AND table_name = 'user_loyalty_cards'
ORDER BY ordinal_position;

-- 4. Check RLS policies on public.user_loyalty_cards
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_loyalty_cards'
ORDER BY schemaname, policyname;

-- 5. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_loyalty_cards'
ORDER BY schemaname;

-- 6. Check table permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'user_loyalty_cards'
ORDER BY grantee, privilege_type;

-- 7. Check if there are any loyalty cards in the database
SELECT 
    'public' as schema_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_loyalty_cards')
        THEN (SELECT COUNT(*) FROM public.user_loyalty_cards)::TEXT
        ELSE 'TABLE DOES NOT EXIST'
    END as card_count
UNION ALL
SELECT 
    'api' as schema_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'user_loyalty_cards')
        THEN (SELECT COUNT(*) FROM api.user_loyalty_cards)::TEXT
        ELSE 'TABLE DOES NOT EXIST'
    END as card_count;

-- 8. Check if the get_user_loyalty_card function exists
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_loyalty_card';

-- 9. Test the function with a sample user (replace with actual user ID)
-- SELECT * FROM public.get_user_loyalty_card('00000000-0000-0000-0000-000000000000');

-- 10. Check for any recent errors in the logs (if accessible)
-- This would typically be done through Supabase dashboard

-- 11. Check if nft_types table exists (required for the function)
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'nft_types'
ORDER BY schemaname;

-- 12. Check nft_types data
SELECT 
    id,
    nft_name,
    display_name,
    rarity,
    earn_on_spend_ratio,
    is_active
FROM public.nft_types
LIMIT 5;
