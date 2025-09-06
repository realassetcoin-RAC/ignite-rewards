-- =============================================================================
-- SUBSCRIPTION PLANS DIAGNOSTIC SCRIPT
-- =============================================================================
-- 
-- This script diagnoses the current state of subscription plans and permissions
-- Run this in Supabase Dashboard → SQL Editor to understand what needs to be fixed
--
-- =============================================================================

DO $$
DECLARE
  api_schema_exists boolean := false;
  public_schema_exists boolean := false;
  api_table_exists boolean := false;
  public_table_exists boolean := false;
  api_profiles_exists boolean := false;
  public_profiles_exists boolean := false;
  admin_function_exists boolean := false;
  api_policies_count integer := 0;
  public_policies_count integer := 0;
  api_plans_count integer := 0;
  public_plans_count integer := 0;
  api_admin_count integer := 0;
  public_admin_count integer := 0;
  current_user_id uuid;
  current_user_email text;
  current_user_role text;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 SUBSCRIPTION PLANS DIAGNOSTIC REPORT';
  RAISE NOTICE '=====================================';
  RAISE NOTICE '';
  
  -- Get current user info
  current_user_id := auth.uid();
  current_user_email := auth.email();
  
  RAISE NOTICE '👤 CURRENT USER INFO:';
  RAISE NOTICE '   User ID: %', COALESCE(current_user_id::text, 'Not authenticated');
  RAISE NOTICE '   Email: %', COALESCE(current_user_email, 'Not available');
  
  -- Check schemas
  RAISE NOTICE '';
  RAISE NOTICE '📊 SCHEMA CHECK:';
  
  SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'api') INTO api_schema_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'public') INTO public_schema_exists;
  
  RAISE NOTICE '   API schema exists: %', api_schema_exists;
  RAISE NOTICE '   Public schema exists: %', public_schema_exists;
  
  -- Check tables
  RAISE NOTICE '';
  RAISE NOTICE '🗃️ TABLE CHECK:';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
  ) INTO api_table_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans'
  ) INTO public_table_exists;
  
  RAISE NOTICE '   api.merchant_subscription_plans exists: %', api_table_exists;
  RAISE NOTICE '   public.merchant_subscription_plans exists: %', public_table_exists;
  
  -- Check profiles tables
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'profiles'
  ) INTO api_profiles_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) INTO public_profiles_exists;
  
  RAISE NOTICE '   api.profiles exists: %', api_profiles_exists;
  RAISE NOTICE '   public.profiles exists: %', public_profiles_exists;
  
  -- Check admin function
  RAISE NOTICE '';
  RAISE NOTICE '⚙️ FUNCTION CHECK:';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'api' AND routine_name = 'check_admin_access'
  ) INTO admin_function_exists;
  
  RAISE NOTICE '   api.check_admin_access() exists: %', admin_function_exists;
  
  -- Check RLS policies
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS POLICIES CHECK:';
  
  SELECT COUNT(*) INTO api_policies_count
  FROM pg_policies 
  WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
  
  SELECT COUNT(*) INTO public_policies_count
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'merchant_subscription_plans';
  
  RAISE NOTICE '   API schema policies: %', api_policies_count;
  RAISE NOTICE '   Public schema policies: %', public_policies_count;
  
  -- Check data counts
  RAISE NOTICE '';
  RAISE NOTICE '📈 DATA CHECK:';
  
  IF api_table_exists THEN
    SELECT COUNT(*) INTO api_plans_count FROM api.merchant_subscription_plans;
    RAISE NOTICE '   Plans in API schema: %', api_plans_count;
  ELSE
    RAISE NOTICE '   Plans in API schema: N/A (table does not exist)';
  END IF;
  
  IF public_table_exists THEN
    SELECT COUNT(*) INTO public_plans_count FROM public.merchant_subscription_plans;
    RAISE NOTICE '   Plans in Public schema: %', public_plans_count;
  ELSE
    RAISE NOTICE '   Plans in Public schema: N/A (table does not exist)';
  END IF;
  
  -- Check admin users
  RAISE NOTICE '';
  RAISE NOTICE '👑 ADMIN USERS CHECK:';
  
  IF api_profiles_exists THEN
    SELECT COUNT(*) INTO api_admin_count FROM api.profiles WHERE role = 'admin';
    RAISE NOTICE '   Admin users in API schema: %', api_admin_count;
    
    -- Check current user role in API schema
    IF current_user_id IS NOT NULL THEN
      SELECT role INTO current_user_role FROM api.profiles WHERE id = current_user_id;
      RAISE NOTICE '   Current user role (API): %', COALESCE(current_user_role, 'Not found');
    END IF;
  ELSE
    RAISE NOTICE '   Admin users in API schema: N/A (profiles table does not exist)';
  END IF;
  
  IF public_profiles_exists THEN
    SELECT COUNT(*) INTO public_admin_count FROM public.profiles WHERE role = 'admin';
    RAISE NOTICE '   Admin users in Public schema: %', public_admin_count;
    
    -- Check current user role in Public schema
    IF current_user_id IS NOT NULL THEN
      SELECT role INTO current_user_role FROM public.profiles WHERE id = current_user_id;
      RAISE NOTICE '   Current user role (Public): %', COALESCE(current_user_role, 'Not found');
    END IF;
  ELSE
    RAISE NOTICE '   Admin users in Public schema: N/A (profiles table does not exist)';
  END IF;
  
  -- Diagnosis and recommendations
  RAISE NOTICE '';
  RAISE NOTICE '🎯 DIAGNOSIS & RECOMMENDATIONS:';
  RAISE NOTICE '';
  
  -- Schema mismatch check
  IF NOT api_table_exists AND public_table_exists THEN
    RAISE NOTICE '❌ SCHEMA MISMATCH DETECTED:';
    RAISE NOTICE '   • Your Supabase client expects API schema';
    RAISE NOTICE '   • But the table exists in Public schema';
    RAISE NOTICE '   • RECOMMENDATION: Run the comprehensive fix to create table in API schema';
  ELSIF api_table_exists AND NOT public_table_exists THEN
    RAISE NOTICE '✅ SCHEMA ALIGNMENT: Table exists in API schema (correct)';
  ELSIF NOT api_table_exists AND NOT public_table_exists THEN
    RAISE NOTICE '❌ MISSING TABLE: No merchant_subscription_plans table found';
    RAISE NOTICE '   • RECOMMENDATION: Run the comprehensive fix to create the table';
  ELSE
    RAISE NOTICE '⚠️ DUPLICATE TABLES: Table exists in both schemas';
    RAISE NOTICE '   • RECOMMENDATION: Use API schema version and remove public version';
  END IF;
  
  -- RLS policies check
  IF api_table_exists AND api_policies_count < 5 THEN
    RAISE NOTICE '❌ INSUFFICIENT RLS POLICIES:';
    RAISE NOTICE '   • Found % policies, need 5 for proper security', api_policies_count;
    RAISE NOTICE '   • RECOMMENDATION: Run the comprehensive fix to create proper policies';
  ELSIF api_table_exists AND api_policies_count >= 5 THEN
    RAISE NOTICE '✅ RLS POLICIES: Sufficient policies found (%)' , api_policies_count;
  END IF;
  
  -- Admin function check
  IF NOT admin_function_exists THEN
    RAISE NOTICE '❌ MISSING ADMIN FUNCTION:';
    RAISE NOTICE '   • check_admin_access() function not found';
    RAISE NOTICE '   • RECOMMENDATION: Run the comprehensive fix to create the function';
  ELSE
    RAISE NOTICE '✅ ADMIN FUNCTION: check_admin_access() exists';
  END IF;
  
  -- Admin users check
  IF api_profiles_exists AND api_admin_count = 0 THEN
    RAISE NOTICE '❌ NO ADMIN USERS:';
    RAISE NOTICE '   • No users with admin role found in API schema';
    RAISE NOTICE '   • RECOMMENDATION: Set your user role to admin';
  ELSIF api_profiles_exists AND api_admin_count > 0 THEN
    RAISE NOTICE '✅ ADMIN USERS: Found % admin users', api_admin_count;
  END IF;
  
  -- Current user status
  IF current_user_id IS NULL THEN
    RAISE NOTICE '⚠️ NOT AUTHENTICATED: You are not logged in';
  ELSIF current_user_role != 'admin' THEN
    RAISE NOTICE '❌ NOT ADMIN: Your user role is "%" (need "admin")', COALESCE(current_user_role, 'unknown');
    RAISE NOTICE '   • RECOMMENDATION: UPDATE api.profiles SET role = ''admin'' WHERE id = ''%'';', current_user_id;
  ELSE
    RAISE NOTICE '✅ ADMIN ACCESS: You have admin privileges';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 NEXT STEPS:';
  RAISE NOTICE '';
  
  IF NOT api_table_exists OR api_policies_count < 5 OR NOT admin_function_exists THEN
    RAISE NOTICE '1. Apply the comprehensive fix:';
    RAISE NOTICE '   • Copy /workspace/comprehensive_subscription_plans_fix.sql';
    RAISE NOTICE '   • Paste and run in Supabase Dashboard → SQL Editor';
    RAISE NOTICE '';
  END IF;
  
  IF current_user_id IS NOT NULL AND (current_user_role IS NULL OR current_user_role != 'admin') THEN
    RAISE NOTICE '2. Set your user as admin:';
    RAISE NOTICE '   UPDATE api.profiles SET role = ''admin'' WHERE id = ''%'';', current_user_id;
    RAISE NOTICE '';
  END IF;
  
  RAISE NOTICE '3. Test the fix:';
  RAISE NOTICE '   • Clear browser cache';
  RAISE NOTICE '   • Log out and log back in';
  RAISE NOTICE '   • Try accessing the Plans tab in admin dashboard';
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 DIAGNOSTIC COMPLETE';
  RAISE NOTICE '';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error during diagnosis: %', SQLERRM;
  RAISE NOTICE 'This may indicate missing permissions or tables.';
END $$;