-- =============================================================================
-- STEP 8: SUPABASE DIAGNOSTIC - CHECK ACTUAL DATABASE STATE
-- =============================================================================
-- 
-- This will show us exactly what's in the database and why permissions are failing
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to the SQL Editor
-- 4. Copy and paste this entire script
-- 5. Click "RUN" to execute
--
-- =============================================================================

-- Show current user and roles
SELECT 
  'Current Database User' as info,
  current_user as database_user,
  session_user as session_user,
  current_role as current_role;

-- Check if table exists and its properties
SELECT 
  'Table Information' as info,
  schemaname,
  tablename,
  tableowner,
  rowsecurity as rls_enabled,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';

-- Check table permissions for all roles
SELECT 
  'Table Permissions' as info,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'api' 
AND table_name = 'merchant_subscription_plans'
ORDER BY grantee, privilege_type;

-- Check schema permissions
SELECT 
  'Schema Permissions' as info,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.usage_privileges 
WHERE object_schema = 'api'
ORDER BY grantee, privilege_type;

-- Check RLS policies (should be empty since we disabled RLS)
SELECT 
  'RLS Policies' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';

-- Test direct table access as current user
SELECT 'Direct Access Test' as info, COUNT(*) as plan_count FROM api.merchant_subscription_plans;

-- Check what roles the anon user has
SELECT 
  'Anon Role Memberships' as info,
  r.rolname as role_name,
  r.rolsuper as is_superuser,
  r.rolinherit as inherits_privileges,
  r.rolcreaterole as can_create_roles,
  r.rolcreatedb as can_create_db,
  r.rolcanlogin as can_login
FROM pg_roles r 
WHERE r.rolname IN ('anon', 'authenticated', 'service_role', 'postgres');

-- Check if there are any other tables in api schema
SELECT 
  'All API Schema Tables' as info,
  tablename,
  tableowner,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'api'
ORDER BY tablename;

-- Test access to profiles table for comparison
SELECT 'Profiles Table Test' as info, COUNT(*) as profile_count FROM api.profiles;

-- Check if there are any conflicting policies or rules
SELECT 
  'Database Rules' as info,
  schemaname,
  tablename,
  rulename
FROM pg_rules 
WHERE schemaname = 'api';

-- Final diagnostic
DO $$
DECLARE
  table_exists boolean := false;
  rls_enabled boolean := false;
  anon_permissions integer := 0;
  direct_access_works boolean := false;
  plan_count integer := 0;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans'
  ) INTO table_exists;
  
  -- Check RLS status
  SELECT COALESCE(rowsecurity, false) INTO rls_enabled
  FROM pg_tables 
  WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
  
  -- Check anon permissions
  SELECT COUNT(*) INTO anon_permissions
  FROM information_schema.table_privileges 
  WHERE table_schema = 'api' 
  AND table_name = 'merchant_subscription_plans'
  AND grantee = 'anon';
  
  -- Test direct access
  BEGIN
    SELECT COUNT(*) INTO plan_count FROM api.merchant_subscription_plans;
    direct_access_works := true;
  EXCEPTION WHEN OTHERS THEN
    direct_access_works := false;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 COMPREHENSIVE DIAGNOSTIC RESULTS:';
  RAISE NOTICE '=====================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Table Status:';
  RAISE NOTICE '   Table exists: %', table_exists;
  RAISE NOTICE '   RLS enabled: %', rls_enabled;
  RAISE NOTICE '   Plan count: %', plan_count;
  RAISE NOTICE '   Direct access works: %', direct_access_works;
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Permission Status:';
  RAISE NOTICE '   Anon permissions granted: %', anon_permissions;
  RAISE NOTICE '';
  
  IF table_exists AND NOT rls_enabled AND anon_permissions > 0 AND direct_access_works THEN
    RAISE NOTICE '✅ EVERYTHING LOOKS CORRECT IN DATABASE!';
    RAISE NOTICE '';
    RAISE NOTICE '🤔 If API still returns permission denied, the issue is likely:';
    RAISE NOTICE '   • Supabase API layer caching old permissions';
    RAISE NOTICE '   • API key restrictions';
    RAISE NOTICE '   • Supabase service restart needed';
    RAISE NOTICE '   • Client-side caching';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Try these solutions:';
    RAISE NOTICE '   1. Wait 5-10 minutes for Supabase to refresh';
    RAISE NOTICE '   2. Clear browser cache completely';
    RAISE NOTICE '   3. Try in incognito/private browser window';
    RAISE NOTICE '   4. Test the application directly';
  ELSE
    RAISE NOTICE '❌ DATABASE ISSUES FOUND:';
    IF NOT table_exists THEN
      RAISE NOTICE '   • Table does not exist';
    END IF;
    IF rls_enabled THEN
      RAISE NOTICE '   • RLS is still enabled (should be disabled)';
    END IF;
    IF anon_permissions = 0 THEN
      RAISE NOTICE '   • No permissions granted to anon role';
    END IF;
    IF NOT direct_access_works THEN
      RAISE NOTICE '   • Direct database access failed';
    END IF;
  END IF;
  
END $$;