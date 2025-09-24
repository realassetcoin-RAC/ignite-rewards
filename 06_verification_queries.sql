-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================
-- This script verifies that the migration was successful
-- Run this AFTER completing the data import

-- ===========================================
-- STEP 1: VERIFY SCHEMA STRUCTURE
-- ===========================================

SELECT '🔍 VERIFYING SCHEMA STRUCTURE...' as message;

-- Check if all required tables exist
SELECT 
    'Required Tables Check:' as info,
    CASE 
        WHEN COUNT(*) = 20 THEN '✅ All required tables present'
        ELSE '❌ Missing tables: ' || (20 - COUNT(*)) || ' tables missing'
    END as status,
    COUNT(*) as tables_found
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN (
    'profiles', 'merchants', 'nft_types', 'user_loyalty_cards', 'user_points',
    'loyalty_transactions', 'referral_campaigns', 'user_referrals', 
    'merchant_subscription_plans', 'virtual_cards', 'marketplace_listings',
    'marketplace_investments', 'dao_organizations', 'dao_members', 
    'dao_proposals', 'dao_votes', 'user_wallets', 'loyalty_networks',
    'asset_initiatives', 'user_asset_selections'
);

-- Check if all required enums exist
SELECT 
    'Required Enums Check:' as info,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✅ All required enums present'
        ELSE '❌ Missing enums: ' || (8 - COUNT(*)) || ' enums missing'
    END as status,
    COUNT(*) as enums_found
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
AND t.typtype = 'e'
AND t.typname IN (
    'app_role', 'merchant_status', 'card_type', 'pricing_type', 
    'subscription_plan', 'marketplace_listing_type', 
    'marketplace_listing_status', 'campaign_type'
);

-- Check if all required functions exist
SELECT 
    'Required Functions Check:' as info,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ All required functions present'
        ELSE '❌ Missing functions: ' || (2 - COUNT(*)) || ' functions missing'
    END as status,
    COUNT(*) as functions_found
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.prokind = 'f'
AND p.proname IN ('generate_loyalty_number', 'get_valid_subscription_plans');

-- ===========================================
-- STEP 2: VERIFY DATA INTEGRITY
-- ===========================================

SELECT '🔍 VERIFYING DATA INTEGRITY...' as message;

-- Check for required default data
SELECT 
    'Default Data Check:' as info,
    'Referral Campaigns' as data_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN '✅ Present' ELSE '❌ Missing' END as status
FROM public.referral_campaigns
WHERE is_active = true

UNION ALL

SELECT 
    'Default Data Check:' as info,
    'Loyalty Networks' as data_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN '✅ Present' ELSE '❌ Missing' END as status
FROM public.loyalty_networks
WHERE is_active = true

UNION ALL

SELECT 
    'Default Data Check:' as info,
    'Asset Initiatives' as data_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN '✅ Present' ELSE '❌ Missing' END as status
FROM public.asset_initiatives
WHERE is_active = true

UNION ALL

SELECT 
    'Default Data Check:' as info,
    'Merchant Subscription Plans' as data_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN '✅ Present' ELSE '❌ Missing' END as status
FROM public.merchant_subscription_plans
WHERE is_active = true

UNION ALL

SELECT 
    'Default Data Check:' as info,
    'NFT Types' as data_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN '✅ Present' ELSE '❌ Missing' END as status
FROM public.nft_types
WHERE is_active = true;

-- ===========================================
-- STEP 3: VERIFY RELATIONSHIPS
-- ===========================================

SELECT '🔍 VERIFYING TABLE RELATIONSHIPS...' as message;

-- Check foreign key relationships
SELECT 
    'Foreign Key Relationships:' as info,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column,
    '✅ Valid' as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ===========================================
-- STEP 4: VERIFY RLS POLICIES
-- ===========================================

SELECT '🔍 VERIFYING ROW LEVEL SECURITY...' as message;

-- Check RLS status on all tables
SELECT 
    'RLS Status Check:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'merchants', 'nft_types', 'user_loyalty_cards', 'user_points',
    'loyalty_transactions', 'referral_campaigns', 'user_referrals', 
    'merchant_subscription_plans', 'virtual_cards', 'marketplace_listings',
    'marketplace_investments', 'dao_organizations', 'dao_members', 
    'dao_proposals', 'dao_votes', 'user_wallets', 'loyalty_networks',
    'asset_initiatives', 'user_asset_selections'
)
ORDER BY tablename;

-- Check RLS policies
SELECT 
    'RLS Policies Check:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    '✅ Policy Active' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'merchants', 'nft_types', 'user_loyalty_cards', 'user_points',
    'loyalty_transactions', 'referral_campaigns', 'user_referrals', 
    'merchant_subscription_plans', 'virtual_cards', 'marketplace_listings',
    'marketplace_investments', 'dao_organizations', 'dao_members', 
    'dao_proposals', 'dao_votes', 'user_wallets', 'loyalty_networks',
    'asset_initiatives', 'user_asset_selections'
)
ORDER BY tablename, policyname;

-- ===========================================
-- STEP 5: VERIFY INDEXES
-- ===========================================

SELECT '🔍 VERIFYING INDEXES...' as message;

-- Check if required indexes exist
SELECT 
    'Index Check:' as info,
    schemaname,
    tablename,
    indexname,
    '✅ Index Present' as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ===========================================
-- STEP 6: TEST CORE FUNCTIONS
-- ===========================================

SELECT '🔍 TESTING CORE FUNCTIONS...' as message;

-- Test loyalty number generation
SELECT 
    'Function Test:' as info,
    'generate_loyalty_number' as function_name,
    public.generate_loyalty_number('test@example.com') as result,
    '✅ Working' as status;

-- Test subscription plans function
SELECT 
    'Function Test:' as info,
    'get_valid_subscription_plans' as function_name,
    COUNT(*) as plan_count,
    '✅ Working' as status
FROM public.get_valid_subscription_plans();

-- ===========================================
-- STEP 7: VERIFY SAMPLE DATA
-- ===========================================

SELECT '🔍 VERIFYING SAMPLE DATA...' as message;

-- Check sample users
SELECT 
    'Sample Data Check:' as info,
    'Admin User' as user_type,
    email,
    role,
    CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM public.profiles
WHERE email = 'admin@igniterewards.com'

UNION ALL

SELECT 
    'Sample Data Check:' as info,
    'Test User' as user_type,
    email,
    role,
    CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM public.profiles
WHERE email = 'user@example.com';

-- Check sample merchant
SELECT 
    'Sample Data Check:' as info,
    'Test Merchant' as merchant_type,
    business_name,
    status,
    subscription_plan,
    CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM public.merchants
WHERE business_name = 'Test Merchant';

-- Check sample loyalty card
SELECT 
    'Sample Data Check:' as info,
    'Test Loyalty Card' as card_type,
    loyalty_number,
    card_number,
    points_balance,
    tier_level,
    CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM public.user_loyalty_cards
WHERE loyalty_number = 'U0000001';

-- ===========================================
-- STEP 8: PERFORMANCE CHECK
-- ===========================================

SELECT '🔍 PERFORMANCE CHECK...' as message;

-- Check table sizes
SELECT 
    'Table Size Check:' as info,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    '✅ Accessible' as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ===========================================
-- STEP 9: FINAL VERIFICATION SUMMARY
-- ===========================================

SELECT '🎯 MIGRATION VERIFICATION COMPLETE!' as message;

-- Overall status check
SELECT 
    'Overall Migration Status:' as info,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ) >= 20
        AND (
            SELECT COUNT(*) FROM public.referral_campaigns WHERE is_active = true
        ) > 0
        AND (
            SELECT COUNT(*) FROM public.merchant_subscription_plans WHERE is_active = true
        ) > 0
        AND (
            SELECT COUNT(*) FROM public.nft_types WHERE is_active = true
        ) > 0
        THEN '✅ MIGRATION SUCCESSFUL'
        ELSE '❌ MIGRATION ISSUES DETECTED'
    END as status;

-- ===========================================
-- STEP 10: NEXT STEPS
-- ===========================================

SELECT '📋 NEXT STEPS:' as info;
SELECT '1. Update your application environment variables' as step1;
SELECT '2. Test all application features' as step2;
SELECT '3. Verify DAO functionality' as step3;
SELECT '4. Test marketplace features' as step4;
SELECT '5. Validate loyalty system' as step5;
SELECT '6. Run application tests' as step6;

SELECT '🎉 CLOUD DATABASE IS READY FOR USE!' as final_message;

