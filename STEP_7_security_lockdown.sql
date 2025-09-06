-- =============================================================================
-- STEP 7: SECURITY LOCKDOWN - ADMIN ONLY ACCESS
-- =============================================================================
-- 
-- ⚠️  ONLY RUN THIS AFTER CONFIRMING EVERYTHING WORKS!
-- 
-- This script locks down the subscription plans to admin-only access.
-- Run this only after you've confirmed the Plans tab works correctly.
--
-- INSTRUCTIONS:
-- 1. FIRST: Test that everything works in your application
-- 2. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 3. Select your project
-- 4. Go to the SQL Editor
-- 5. Copy and paste this entire script
-- 6. Click "RUN" to execute
--
-- =============================================================================

-- Drop the permissive policies
DROP POLICY IF EXISTS "Super permissive select" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Super permissive insert" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Super permissive update" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Super permissive delete" ON api.merchant_subscription_plans;

DROP POLICY IF EXISTS "Super permissive profiles select" ON api.profiles;
DROP POLICY IF EXISTS "Super permissive profiles insert" ON api.profiles;
DROP POLICY IF EXISTS "Super permissive profiles update" ON api.profiles;

-- Create proper admin-only policies for subscription plans
CREATE POLICY "Public can view active plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

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

-- Create proper policies for profiles table
CREATE POLICY "Users can view own profile" ON api.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON api.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON api.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage profiles" ON api.profiles
  FOR ALL TO authenticated
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

-- Remove admin role from non-admin users (optional - customize as needed)
-- Uncomment and modify this section if you want to restrict admin access to specific users

/*
-- Keep only specific users as admin (replace with actual emails)
UPDATE api.profiles 
SET role = 'user' 
WHERE role = 'admin' 
AND email NOT IN (
  'your-admin-email@example.com',
  'another-admin@example.com'
);
*/

-- Verification
SELECT 
  'Security Lockdown Complete' as status,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'api' 
AND tablename IN ('merchant_subscription_plans', 'profiles');

SELECT 
  'Current Admin Users' as info,
  email,
  role,
  created_at
FROM api.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SECURITY LOCKDOWN COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ What was secured:';
  RAISE NOTICE '   • Only admins can manage subscription plans';
  RAISE NOTICE '   • Public can only view active plans';
  RAISE NOTICE '   • Users can only view/edit their own profiles';
  RAISE NOTICE '   • Admins can manage all profiles';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Important: Test the application again after this change!';
  RAISE NOTICE '   If something breaks, you may need to adjust the admin user assignments.';
END $$;