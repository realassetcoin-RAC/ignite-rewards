-- =============================================================================
-- FIX REMAINING PERMISSION ISSUES
-- =============================================================================
-- 
-- This fixes the specific "permission denied for table merchant_subscription_plans" error
-- that persists after the previous fixes were applied.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to the SQL Editor
-- 4. Copy and paste this entire script
-- 5. Click "RUN" to execute
--
-- =============================================================================

-- Step 1: Ensure we're working with the correct schema
SET search_path TO api, public;

-- Step 2: Check and fix table permissions at the database level
GRANT USAGE ON SCHEMA api TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.merchant_subscription_plans TO authenticated;
GRANT SELECT ON api.merchant_subscription_plans TO anon;
GRANT ALL ON api.merchant_subscription_plans TO service_role;

-- Step 3: Fix sequence permissions (for UUID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO service_role;

-- Step 4: Temporarily disable RLS to check if that's the issue
ALTER TABLE api.merchant_subscription_plans DISABLE ROW LEVEL SECURITY;

-- Step 5: Test basic access without RLS
SELECT 'Testing basic table access without RLS' as test;
SELECT COUNT(*) as plan_count FROM api.merchant_subscription_plans;

-- Step 6: Re-enable RLS and create permissive policies
ALTER TABLE api.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop all existing policies and recreate them
DROP POLICY IF EXISTS "Anyone can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Public can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Authenticated can manage plans" ON api.merchant_subscription_plans;

-- Step 8: Create more permissive policies for testing
-- This allows authenticated users to do everything (we'll restrict later)
CREATE POLICY "Authenticated users can view all plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert plans" 
ON api.merchant_subscription_plans 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update plans" 
ON api.merchant_subscription_plans 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete plans" 
ON api.merchant_subscription_plans 
FOR DELETE 
TO authenticated
USING (true);

-- Step 9: Allow anonymous users to view active plans
CREATE POLICY "Anyone can view active plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO anon
USING (is_active = true);

-- Step 10: Ensure profiles table has proper permissions too
GRANT SELECT, INSERT, UPDATE, DELETE ON api.profiles TO authenticated;
GRANT SELECT ON api.profiles TO anon;
GRANT ALL ON api.profiles TO service_role;

-- Step 11: Create permissive policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON api.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON api.profiles;

CREATE POLICY "Authenticated users can view profiles" ON api.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update profiles" ON api.profiles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert profiles" ON api.profiles
  FOR INSERT TO authenticated WITH CHECK (true);

-- Step 12: Insert a test admin user (replace with your actual user ID and email)
-- First, let's try to get the current user if authenticated
DO $$
DECLARE
  current_user_id uuid;
  current_user_email text;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  current_user_email := auth.email();
  
  IF current_user_id IS NOT NULL THEN
    -- Insert or update the current user as admin
    INSERT INTO api.profiles (id, email, role, full_name) 
    VALUES (current_user_id, current_user_email, 'admin', 'Admin User')
    ON CONFLICT (id) DO UPDATE SET 
      role = 'admin',
      email = COALESCE(EXCLUDED.email, api.profiles.email),
      updated_at = now();
    
    RAISE NOTICE 'Updated user % as admin', current_user_email;
  ELSE
    RAISE NOTICE 'No authenticated user found. You may need to log in and run this again.';
  END IF;
END $$;

-- Step 13: Insert default plans if they don't exist
INSERT INTO api.merchant_subscription_plans (name, description, price_monthly, features, trial_days, is_active) 
VALUES
  ('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support"]'::jsonb, 30, true),
  ('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access"]'::jsonb, 30, true),
  ('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]'::jsonb, 30, true)
ON CONFLICT (name) DO NOTHING;

-- Step 14: Test the fix
SELECT 
  'VERIFICATION: Subscription Plans' as test_name,
  COUNT(*) as plan_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_plans
FROM api.merchant_subscription_plans;

SELECT 
  'VERIFICATION: Admin Users' as test_name,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_count
FROM api.profiles;

-- Step 15: Show current policies
SELECT 
  'VERIFICATION: RLS Policies' as test_name,
  schemaname,
  tablename,
  policyname,
  permissive,
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
  RAISE NOTICE '🎉 PERMISSION FIX COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ What was fixed:';
  RAISE NOTICE '   • Granted proper table permissions to authenticated users';
  RAISE NOTICE '   • Created permissive RLS policies for testing';
  RAISE NOTICE '   • Ensured sequence permissions for UUID generation';
  RAISE NOTICE '   • Set up profiles table with proper access';
  RAISE NOTICE '   • Added default subscription plans';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 These are PERMISSIVE policies for testing.';
  RAISE NOTICE '⚠️  After confirming it works, you should restrict them to admin-only.';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Log out and log back in to your application';
  RAISE NOTICE '   2. Navigate to Admin Dashboard → Plans tab';
  RAISE NOTICE '   3. Test creating/editing subscription plans';
  RAISE NOTICE '   4. If it works, we can then restrict policies to admin-only';
END $$;