-- =============================================================================
-- SECURITY RESTORATION - PROPER ADMIN-ONLY ACCESS
-- =============================================================================
-- 
-- Now that your application is working, we need to restore proper security.
-- This will keep the functionality working but restrict access to admin users only.
--
-- ⚠️  ONLY RUN THIS AFTER CONFIRMING THE SHOPS TAB WORKS!
--
-- INSTRUCTIONS:
-- 1. FIRST: Make sure the Shops tab is working perfectly
-- 2. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 3. Select your project
-- 4. Go to the SQL Editor
-- 5. Copy and paste this entire script
-- 6. Click "RUN" to execute
--
-- =============================================================================

-- Step 1: Show current insecure state
SELECT 
  'BEFORE SECURITY - Current State' as status,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'api' AND tablename IN ('merchant_subscription_plans', 'profiles')
ORDER BY tablename;

-- Step 2: Enable RLS on both tables
ALTER TABLE api.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Remove the overly permissive PUBLIC grants
REVOKE ALL PRIVILEGES ON api.merchant_subscription_plans FROM PUBLIC;
REVOKE ALL PRIVILEGES ON api.profiles FROM PUBLIC;

-- Step 4: Keep necessary permissions for authenticated users and service roles
GRANT SELECT, INSERT, UPDATE, DELETE ON api.merchant_subscription_plans TO authenticated, service_role;
GRANT SELECT ON api.merchant_subscription_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.profiles TO authenticated, service_role;
GRANT SELECT ON api.profiles TO anon;

-- Step 5: Create secure RLS policies for subscription plans

-- Allow anyone to view active subscription plans (public catalog)
CREATE POLICY "Public can view active plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- Allow admin users to view all plans (active and inactive)
CREATE POLICY "Admins can view all plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admin users to insert new plans
CREATE POLICY "Admins can insert plans" 
ON api.merchant_subscription_plans 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admin users to update plans
CREATE POLICY "Admins can update plans" 
ON api.merchant_subscription_plans 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admin users to delete plans
CREATE POLICY "Admins can delete plans" 
ON api.merchant_subscription_plans 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Step 6: Create secure RLS policies for profiles

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON api.profiles
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON api.profiles
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admin users to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON api.profiles
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api.profiles p2
    WHERE p2.id = auth.uid()
    AND p2.role = 'admin'
  )
);

-- Allow admin users to manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON api.profiles
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api.profiles p2
    WHERE p2.id = auth.uid()
    AND p2.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api.profiles p2
    WHERE p2.id = auth.uid()
    AND p2.role = 'admin'
  )
);

-- Step 7: Restrict admin role to specific users (CUSTOMIZE THIS!)
-- Uncomment and modify this section to limit admin access to specific users

/*
-- Option A: Keep only specific users as admin (replace with your actual email)
UPDATE api.profiles 
SET role = 'user' 
WHERE role = 'admin' 
AND email NOT IN (
  'your-admin-email@example.com',
  'another-admin@example.com'
);

-- Option B: Keep only the first admin user and demote others
UPDATE api.profiles 
SET role = 'user' 
WHERE role = 'admin' 
AND id NOT IN (
  SELECT id FROM api.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1
);
*/

-- Step 8: Verify the security restoration
SELECT 
  'AFTER SECURITY - Table Status' as status,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'api' AND tablename IN ('merchant_subscription_plans', 'profiles')
ORDER BY tablename;

-- Show RLS policies
SELECT 
  'AFTER SECURITY - RLS Policies' as status,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'api' 
AND tablename IN ('merchant_subscription_plans', 'profiles')
ORDER BY tablename, policyname;

-- Show current admin users
SELECT 
  'AFTER SECURITY - Admin Users' as status,
  email,
  role,
  created_at
FROM api.profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- Final verification
DO $$
DECLARE
  plans_rls_enabled boolean;
  profiles_rls_enabled boolean;
  plans_policies_count integer;
  profiles_policies_count integer;
  admin_count integer;
BEGIN
  -- Check RLS status
  SELECT COALESCE(rowsecurity, false) INTO plans_rls_enabled
  FROM pg_tables WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
  
  SELECT COALESCE(rowsecurity, false) INTO profiles_rls_enabled
  FROM pg_tables WHERE schemaname = 'api' AND tablename = 'profiles';
  
  -- Check policies
  SELECT COUNT(*) INTO plans_policies_count
  FROM pg_policies WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
  
  SELECT COUNT(*) INTO profiles_policies_count
  FROM pg_policies WHERE schemaname = 'api' AND tablename = 'profiles';
  
  -- Check admin count
  SELECT COUNT(*) INTO admin_count FROM api.profiles WHERE role = 'admin';
  
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SECURITY RESTORATION COMPLETED!';
  RAISE NOTICE '==================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Security Status:';
  RAISE NOTICE '   Plans RLS enabled: %', plans_rls_enabled;
  RAISE NOTICE '   Profiles RLS enabled: %', profiles_rls_enabled;
  RAISE NOTICE '   Plans policies: %', plans_policies_count;
  RAISE NOTICE '   Profiles policies: %', profiles_policies_count;
  RAISE NOTICE '   Admin users: %', admin_count;
  RAISE NOTICE '';
  
  IF plans_rls_enabled AND profiles_rls_enabled AND plans_policies_count >= 5 AND profiles_policies_count >= 4 THEN
    RAISE NOTICE '✅ SECURITY SUCCESSFULLY RESTORED!';
    RAISE NOTICE '';
    RAISE NOTICE '🛡️ What is now secure:';
    RAISE NOTICE '   • Only admins can manage subscription plans';
    RAISE NOTICE '   • Public can only view active plans';
    RAISE NOTICE '   • Users can only access their own profiles';
    RAISE NOTICE '   • Admins can manage all profiles';
    RAISE NOTICE '   • RLS is properly enabled';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 IMPORTANT: Test your application again!';
    RAISE NOTICE '   1. Clear browser cache';
    RAISE NOTICE '   2. Log out and back in';
    RAISE NOTICE '   3. Verify Shops tab still works';
    RAISE NOTICE '   4. Confirm only admin users can manage plans';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  If you want to restrict admin access to specific users,';
    RAISE NOTICE '   uncomment and modify Step 7 in this script.';
  ELSE
    RAISE NOTICE '❌ Security restoration incomplete:';
    IF NOT plans_rls_enabled THEN
      RAISE NOTICE '   • Plans RLS not enabled';
    END IF;
    IF NOT profiles_rls_enabled THEN
      RAISE NOTICE '   • Profiles RLS not enabled';
    END IF;
    IF plans_policies_count < 5 THEN
      RAISE NOTICE '   • Insufficient plans policies (need 5, have %)' , plans_policies_count;
    END IF;
    IF profiles_policies_count < 4 THEN
      RAISE NOTICE '   • Insufficient profiles policies (need 4, have %)', profiles_policies_count;
    END IF;
  END IF;
  
  RAISE NOTICE '';
END $$;