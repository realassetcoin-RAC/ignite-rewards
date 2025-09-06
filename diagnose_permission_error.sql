-- =============================================================================
-- DIAGNOSTIC SCRIPT FOR SUBSCRIPTION PLANS PERMISSION ERROR
-- =============================================================================
-- 
-- This script helps diagnose why you're still getting permission errors
-- after applying the fix.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to the SQL Editor
-- 4. Copy and paste this entire script
-- 5. Click "RUN" to execute
-- 6. Review the output to identify the issue
--
-- =============================================================================

-- Check 1: Verify table exists in api schema
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
    ) THEN
        RAISE NOTICE '✅ Table api.merchant_subscription_plans EXISTS';
    ELSE
        RAISE NOTICE '❌ Table api.merchant_subscription_plans DOES NOT EXIST';
    END IF;
END $$;

-- Check 2: Count RLS policies
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
WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans'
ORDER BY policyname;

-- Check 3: List all admin users
SELECT 
    id,
    email,
    role,
    created_at,
    updated_at
FROM api.profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- Check 4: Count total users by role
SELECT 
    role,
    COUNT(*) as user_count
FROM api.profiles 
GROUP BY role
ORDER BY user_count DESC;

-- Check 5: Test table permissions by trying to select
DO $$
DECLARE
    plan_count integer;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO plan_count FROM api.merchant_subscription_plans;
        RAISE NOTICE '✅ Can query table - Found % subscription plans', plan_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Cannot query table: %', SQLERRM;
    END;
END $$;

-- Check 6: List all subscription plans
SELECT 
    id,
    name,
    description,
    price_monthly,
    features,
    trial_days,
    is_active,
    created_at
FROM api.merchant_subscription_plans
ORDER BY created_at;

-- Check 7: Verify schema permissions
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata 
WHERE schema_name = 'api';

-- Check 8: Check table ownership and permissions
SELECT 
    table_schema,
    table_name,
    table_type,
    is_insertable_into,
    is_typed
FROM information_schema.tables 
WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans';

-- Check 9: Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';

-- Check 10: Check if profiles table exists and has proper structure
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'api' AND table_name = 'profiles'
    ) THEN
        RAISE NOTICE '✅ Table api.profiles EXISTS';
    ELSE
        RAISE NOTICE '❌ Table api.profiles DOES NOT EXIST';
    END IF;
END $$;

-- =============================================================================
-- SUMMARY
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DIAGNOSTIC COMPLETE';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Please review the output above to identify issues:';
    RAISE NOTICE '   • Table existence';
    RAISE NOTICE '   • RLS policies count (should be 5)';
    RAISE NOTICE '   • Admin users (should show your user with role = admin)';
    RAISE NOTICE '   • Subscription plans count';
    RAISE NOTICE '   • Table permissions';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Common issues:';
    RAISE NOTICE '   1. Your user does not have role = "admin" in api.profiles';
    RAISE NOTICE '   2. RLS policies are not created correctly';
    RAISE NOTICE '   3. Table permissions are missing';
    RAISE NOTICE '   4. Browser cache needs clearing';
    RAISE NOTICE '';
END $$;