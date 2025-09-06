-- =============================================================================
-- STEP 9: FIX AUTHENTICATED USER ACCESS TO SUBSCRIPTION PLANS
-- =============================================================================
-- 
-- The Shops tab loads but shows permission error when loading data.
-- This means admin authentication works, but the authenticated user 
-- can't access the merchant_subscription_plans table.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to the SQL Editor
-- 4. Copy and paste this entire script
-- 5. Click "RUN" to execute
--
-- =============================================================================

-- First, let's check what's happening with the current user
SELECT 
  'Current Session Info' as info,
  auth.uid() as user_id,
  auth.email() as user_email,
  current_user as database_user;

-- Check if the current user has a profile
SELECT 
  'User Profile Check' as info,
  id,
  email,
  role,
  created_at
FROM api.profiles 
WHERE id = auth.uid();

-- Ensure the current user has admin role
INSERT INTO api.profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
  auth.uid(),
  auth.email(),
  'admin',
  'Admin User',
  now(),
  now()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  email = COALESCE(EXCLUDED.email, api.profiles.email),
  updated_at = now();

-- Grant maximum permissions to authenticated role specifically
GRANT ALL PRIVILEGES ON api.merchant_subscription_plans TO authenticated;
GRANT ALL PRIVILEGES ON api.profiles TO authenticated;
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA api TO authenticated;

-- Completely disable RLS (again, to be sure)
ALTER TABLE api.merchant_subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE api.profiles DISABLE ROW LEVEL SECURITY;

-- Drop any remaining policies that might interfere
DROP POLICY IF EXISTS "Super permissive select" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Super permissive insert" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Super permissive update" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Super permissive delete" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Super permissive profiles select" ON api.profiles;
DROP POLICY IF EXISTS "Super permissive profiles insert" ON api.profiles;
DROP POLICY IF EXISTS "Super permissive profiles update" ON api.profiles;

-- Test authenticated user access
DO $$
DECLARE
  current_user_id uuid;
  user_profile record;
  plan_count integer;
  access_test boolean := false;
BEGIN
  current_user_id := auth.uid();
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 AUTHENTICATED USER ACCESS TEST';
  RAISE NOTICE '================================';
  RAISE NOTICE '';
  
  IF current_user_id IS NOT NULL THEN
    RAISE NOTICE '✅ User is authenticated: %', current_user_id;
    
    -- Check user profile
    SELECT * INTO user_profile FROM api.profiles WHERE id = current_user_id;
    
    IF user_profile.id IS NOT NULL THEN
      RAISE NOTICE '✅ User profile exists: % (role: %)', user_profile.email, user_profile.role;
    ELSE
      RAISE NOTICE '❌ No user profile found';
    END IF;
    
    -- Test table access
    BEGIN
      SELECT COUNT(*) INTO plan_count FROM api.merchant_subscription_plans;
      access_test := true;
      RAISE NOTICE '✅ Table access works: % plans found', plan_count;
    EXCEPTION WHEN OTHERS THEN
      access_test := false;
      RAISE NOTICE '❌ Table access failed: %', SQLERRM;
    END;
    
  ELSE
    RAISE NOTICE '❌ No authenticated user (running as service role)';
    RAISE NOTICE 'ℹ️  This is normal when running in SQL Editor';
    RAISE NOTICE 'ℹ️  The fix should work when you access via your app';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 WHAT THIS FIX DOES:';
  RAISE NOTICE '   • Ensures current user has admin profile';
  RAISE NOTICE '   • Grants maximum permissions to authenticated role';
  RAISE NOTICE '   • Completely disables RLS on both tables';
  RAISE NOTICE '   • Removes any conflicting policies';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 NEXT STEPS:';
  RAISE NOTICE '   1. Clear browser cache completely';
  RAISE NOTICE '   2. Log out and log back in';
  RAISE NOTICE '   3. Try the Shops tab again';
  RAISE NOTICE '   4. The permission error should be gone';
  
END $$;

-- Show table status
SELECT 
  'Table Status' as info,
  schemaname,
  tablename,
  tableowner,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'api' 
AND tablename IN ('merchant_subscription_plans', 'profiles')
ORDER BY tablename;

-- Show current permissions
SELECT 
  'Current Permissions' as info,
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'api' 
AND table_name = 'merchant_subscription_plans'
AND grantee = 'authenticated'
ORDER BY privilege_type;

-- Verify plans exist
SELECT 'Available Plans' as info, name, price_monthly, is_active FROM api.merchant_subscription_plans ORDER BY price_monthly;

RAISE NOTICE '';
RAISE NOTICE '🎉 AUTHENTICATED ACCESS FIX COMPLETED!';
RAISE NOTICE '';
RAISE NOTICE '⚠️  SECURITY WARNING: Tables are now completely public!';
RAISE NOTICE '   This is temporary for testing only.';
RAISE NOTICE '   After confirming it works, run the security lockdown script.';
RAISE NOTICE '';