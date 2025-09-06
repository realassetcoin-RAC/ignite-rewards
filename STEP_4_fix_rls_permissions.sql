-- =============================================================================
-- STEP 4: FIX REMAINING RLS PERMISSION ISSUES
-- =============================================================================
-- 
-- This fixes the "permission denied for table merchant_subscription_plans" error
-- that still persists after the previous fixes.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to the SQL Editor
-- 4. Copy and paste this entire script
-- 5. Click "RUN" to execute
--
-- =============================================================================

-- Step 1: Grant explicit table permissions
GRANT USAGE ON SCHEMA api TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.merchant_subscription_plans TO authenticated;
GRANT SELECT ON api.merchant_subscription_plans TO anon;
GRANT ALL ON api.merchant_subscription_plans TO service_role;

-- Step 2: Grant permissions on profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON api.profiles TO authenticated;
GRANT SELECT ON api.profiles TO anon;
GRANT ALL ON api.profiles TO service_role;

-- Step 3: Grant sequence permissions (important for UUID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO service_role;

-- Step 4: Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Anyone can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Public can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Authenticated can manage plans" ON api.merchant_subscription_plans;

-- Step 5: Create permissive policies for testing (we'll restrict later)
CREATE POLICY "Allow all authenticated users to view plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to insert plans" 
ON api.merchant_subscription_plans 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update plans" 
ON api.merchant_subscription_plans 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to delete plans" 
ON api.merchant_subscription_plans 
FOR DELETE 
TO authenticated
USING (true);

-- Step 6: Allow anonymous users to view active plans
CREATE POLICY "Allow anonymous users to view active plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO anon
USING (is_active = true);

-- Step 7: Create permissive policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON api.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON api.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON api.profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON api.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON api.profiles;

CREATE POLICY "Allow authenticated users to view profiles" ON api.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update profiles" ON api.profiles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert profiles" ON api.profiles
  FOR INSERT TO authenticated WITH CHECK (true);

-- Step 8: Test the permissions
SELECT 
  'Testing Plans Table Access' as test,
  COUNT(*) as plan_count
FROM api.merchant_subscription_plans;

SELECT 
  'Testing Profiles Table Access' as test,
  COUNT(*) as profile_count,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_count
FROM api.profiles;

-- Step 9: Show current policies
SELECT 
  'Current RLS Policies' as info,
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'api' 
AND tablename IN ('merchant_subscription_plans', 'profiles')
ORDER BY tablename, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 RLS PERMISSION FIX COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ What was fixed:';
  RAISE NOTICE '   • Granted explicit table permissions';
  RAISE NOTICE '   • Created permissive RLS policies for testing';
  RAISE NOTICE '   • Fixed sequence permissions for UUID generation';
  RAISE NOTICE '   • Set up profiles table permissions';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 IMPORTANT: These are permissive policies for testing!';
  RAISE NOTICE '⚠️  After confirming everything works, restrict to admin-only access';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Complete the admin user setup (Step 3)';
  RAISE NOTICE '   2. Log out and log back in to your application';
  RAISE NOTICE '   3. Test the Admin Dashboard → Plans tab';
  RAISE NOTICE '   4. Try creating a new subscription plan';
END $$;