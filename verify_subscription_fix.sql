-- =============================================================================
-- SUBSCRIPTION PLANS FIX VERIFICATION SCRIPT
-- =============================================================================
-- 
-- Run this script AFTER applying the main fix to verify everything is working
-- Copy and paste this into Supabase Dashboard → SQL Editor
--
-- =============================================================================

DO $$
DECLARE
  api_schema_exists boolean := false;
  api_table_exists boolean := false;
  api_profiles_exists boolean := false;
  api_policies_count integer := 0;
  profiles_policies_count integer := 0;
  api_plans_count integer := 0;
  api_admin_count integer := 0;
  current_user_id uuid;
  current_user_email text;
  current_user_role text;
  table_permissions text := '';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 SUBSCRIPTION PLANS FIX VERIFICATION';
  RAISE NOTICE '=====================================';
  RAISE NOTICE '';
  
  -- Get current user info
  current_user_id := auth.uid();
  current_user_email := auth.email();
  
  RAISE NOTICE '👤 CURRENT USER INFO:';
  RAISE NOTICE '   User ID: %', COALESCE(current_user_id::text, 'Not authenticated');
  RAISE NOTICE '   Email: %', COALESCE(current_user_email, 'Not available');
  
  -- Check API schema
  RAISE NOTICE '';
  RAISE NOTICE '📊 SCHEMA VERIFICATION:';
  
  SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'api') INTO api_schema_exists;
  RAISE NOTICE '   ✅ API schema exists: %', api_schema_exists;
  
  -- Check tables
  RAISE NOTICE '';
  RAISE NOTICE '🗃️ TABLE VERIFICATION:';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
  ) INTO api_table_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'profiles'
  ) INTO api_profiles_exists;
  
  IF api_table_exists THEN
    RAISE NOTICE '   ✅ api.merchant_subscription_plans exists';
  ELSE
    RAISE NOTICE '   ❌ api.merchant_subscription_plans MISSING';
  END IF;
  
  IF api_profiles_exists THEN
    RAISE NOTICE '   ✅ api.profiles exists';
  ELSE
    RAISE NOTICE '   ❌ api.profiles MISSING';
  END IF;
  
  -- Check RLS policies
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS POLICIES VERIFICATION:';
  
  SELECT COUNT(*) INTO api_policies_count
  FROM pg_policies 
  WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
  
  SELECT COUNT(*) INTO profiles_policies_count
  FROM pg_policies 
  WHERE schemaname = 'api' AND tablename = 'profiles';
  
  IF api_policies_count >= 5 THEN
    RAISE NOTICE '   ✅ Subscription plans policies: % (Expected: 5)', api_policies_count;
  ELSE
    RAISE NOTICE '   ❌ Subscription plans policies: % (Expected: 5)', api_policies_count;
  END IF;
  
  IF profiles_policies_count >= 3 THEN
    RAISE NOTICE '   ✅ Profiles policies: % (Expected: 3+)', profiles_policies_count;
  ELSE
    RAISE NOTICE '   ⚠️  Profiles policies: % (Expected: 3+)', profiles_policies_count;
  END IF;
  
  -- Check data
  RAISE NOTICE '';
  RAISE NOTICE '📈 DATA VERIFICATION:';
  
  IF api_table_exists THEN
    SELECT COUNT(*) INTO api_plans_count FROM api.merchant_subscription_plans;
    IF api_plans_count >= 3 THEN
      RAISE NOTICE '   ✅ Subscription plans: % (Default plans loaded)', api_plans_count;
    ELSE
      RAISE NOTICE '   ⚠️  Subscription plans: % (Expected: 3+ default plans)', api_plans_count;
    END IF;
  END IF;
  
  -- Check admin users
  RAISE NOTICE '';
  RAISE NOTICE '👑 ADMIN VERIFICATION:';
  
  IF api_profiles_exists THEN
    SELECT COUNT(*) INTO api_admin_count FROM api.profiles WHERE role = 'admin';
    IF api_admin_count > 0 THEN
      RAISE NOTICE '   ✅ Admin users found: %', api_admin_count;
    ELSE
      RAISE NOTICE '   ❌ No admin users found';
    END IF;
    
    -- Check current user role
    IF current_user_id IS NOT NULL THEN
      SELECT role INTO current_user_role FROM api.profiles WHERE id = current_user_id;
      IF current_user_role = 'admin' THEN
        RAISE NOTICE '   ✅ Current user is admin: %', COALESCE(current_user_email, 'Unknown email');
      ELSIF current_user_role IS NOT NULL THEN
        RAISE NOTICE '   ❌ Current user role: % (Need: admin)', current_user_role;
      ELSE
        RAISE NOTICE '   ❌ Current user not found in profiles table';
      END IF;
    END IF;
  END IF;
  
  -- Check table permissions
  RAISE NOTICE '';
  RAISE NOTICE '🔑 PERMISSIONS VERIFICATION:';
  
  SELECT string_agg(privilege_type, ', ') INTO table_permissions
  FROM information_schema.role_table_grants 
  WHERE table_schema = 'api' 
  AND table_name = 'merchant_subscription_plans' 
  AND grantee = 'authenticated';
  
  IF table_permissions IS NOT NULL THEN
    RAISE NOTICE '   ✅ Table permissions for authenticated: %', table_permissions;
  ELSE
    RAISE NOTICE '   ❌ No table permissions found for authenticated role';
  END IF;
  
  -- Overall status
  RAISE NOTICE '';
  RAISE NOTICE '📋 OVERALL STATUS:';
  RAISE NOTICE '';
  
  IF api_schema_exists AND api_table_exists AND api_profiles_exists AND api_policies_count >= 5 AND api_admin_count > 0 THEN
    RAISE NOTICE '🎉 SUCCESS: All components are properly configured!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Next steps:';
    RAISE NOTICE '   1. Clear browser cache and cookies';
    RAISE NOTICE '   2. Log out and log back in';
    RAISE NOTICE '   3. Test the Plans tab in admin dashboard';
    RAISE NOTICE '   4. Try creating a new subscription plan';
  ELSE
    RAISE NOTICE '⚠️  ISSUES FOUND: Some components need attention';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Required actions:';
    
    IF NOT api_schema_exists THEN
      RAISE NOTICE '   • Create API schema';
    END IF;
    
    IF NOT api_table_exists THEN
      RAISE NOTICE '   • Create api.merchant_subscription_plans table';
    END IF;
    
    IF NOT api_profiles_exists THEN
      RAISE NOTICE '   • Create api.profiles table';
    END IF;
    
    IF api_policies_count < 5 THEN
      RAISE NOTICE '   • Create RLS policies for subscription plans';
    END IF;
    
    IF api_admin_count = 0 THEN
      RAISE NOTICE '   • Set up admin user in profiles table';
    END IF;
    
    IF current_user_role != 'admin' AND current_user_id IS NOT NULL THEN
      RAISE NOTICE '   • Update your user role to admin:';
      RAISE NOTICE '     UPDATE api.profiles SET role = ''admin'' WHERE id = ''%'';', current_user_id;
    END IF;
  END IF;
  
  RAISE NOTICE '';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error during verification: %', SQLERRM;
  RAISE NOTICE 'This may indicate missing tables or permissions.';
END $$;

-- Show sample data if available
SELECT 
  '📊 SAMPLE SUBSCRIPTION PLANS' as info,
  name,
  price_monthly,
  is_active,
  trial_days
FROM api.merchant_subscription_plans 
ORDER BY created_at
LIMIT 5;

-- Show admin users if available  
SELECT 
  '👑 ADMIN USERS' as info,
  email,
  role,
  created_at
FROM api.profiles 
WHERE role = 'admin'
ORDER BY created_at
LIMIT 10;

-- Show current user info
SELECT 
  '👤 CURRENT USER STATUS' as info,
  auth.uid() as user_id,
  auth.email() as email,
  COALESCE(p.role, 'No profile found') as role
FROM api.profiles p 
WHERE p.id = auth.uid()
UNION ALL
SELECT 
  '👤 CURRENT USER STATUS' as info,
  auth.uid() as user_id,
  auth.email() as email,
  'No profile found' as role
WHERE NOT EXISTS (SELECT 1 FROM api.profiles WHERE id = auth.uid());

RAISE NOTICE '';
RAISE NOTICE '✅ VERIFICATION COMPLETE';
RAISE NOTICE '';