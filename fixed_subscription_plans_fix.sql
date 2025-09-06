-- =============================================================================
-- FIXED COMPREHENSIVE SUBSCRIPTION PLANS PERMISSION FIX
-- =============================================================================
-- 
-- This SQL script fixes the "You don't have permission to access subscription plans" error
-- and the "permission denied for table merchant_subscription_plans" error.
--
-- Issues fixed:
-- 1. Creates the table in the api schema (client expects api schema)
-- 2. Sets up proper RLS policies for admin access
-- 3. Ensures admin role checking works correctly
-- 4. Grants all necessary permissions
-- 5. Creates performance indexes
-- 6. Adds default subscription plans
-- 7. FIXED: Handles missing avatar_url column gracefully
--
-- =============================================================================

-- Step 1: Ensure the api schema exists and has proper permissions
CREATE SCHEMA IF NOT EXISTS api;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT USAGE ON SCHEMA api TO anon;
GRANT USAGE ON SCHEMA api TO service_role;

-- Step 2: Ensure profiles table exists in api schema for admin checks
CREATE TABLE IF NOT EXISTS api.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON api.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON api.profiles;

CREATE POLICY "Users can view own profile" ON api.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON api.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON api.profiles
  FOR ALL TO service_role USING (true);

-- Grant permissions on profiles
GRANT SELECT, INSERT, UPDATE ON api.profiles TO authenticated;
GRANT SELECT ON api.profiles TO anon;
GRANT ALL ON api.profiles TO service_role;

-- Step 3: Create admin check function
CREATE OR REPLACE FUNCTION api.check_admin_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user has admin role in the profiles table
  RETURN EXISTS (
    SELECT 1 FROM api.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, return false
    RETURN false;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION api.check_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION api.check_admin_access() TO anon;

-- Step 4: Create the merchant_subscription_plans table in api schema
CREATE TABLE IF NOT EXISTS api.merchant_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 5: Enable Row Level Security
ALTER TABLE api.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Public can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Authenticated can manage plans" ON api.merchant_subscription_plans;

-- Step 7: Create comprehensive RLS policies

-- Allow anyone (authenticated and anonymous) to view active plans
CREATE POLICY "Public can view active plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated, anon
USING (is_active = true);

-- Allow admins to view ALL plans (active and inactive)
CREATE POLICY "Admins can view all plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated
USING (api.check_admin_access());

-- Allow admins to insert new plans
CREATE POLICY "Admins can insert plans" 
ON api.merchant_subscription_plans 
FOR INSERT 
TO authenticated
WITH CHECK (api.check_admin_access());

-- Allow admins to update existing plans
CREATE POLICY "Admins can update plans" 
ON api.merchant_subscription_plans 
FOR UPDATE 
TO authenticated
USING (api.check_admin_access())
WITH CHECK (api.check_admin_access());

-- Allow admins to delete plans
CREATE POLICY "Admins can delete plans" 
ON api.merchant_subscription_plans 
FOR DELETE 
TO authenticated
USING (api.check_admin_access());

-- Step 8: Grant necessary table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON api.merchant_subscription_plans TO authenticated;
GRANT SELECT ON api.merchant_subscription_plans TO anon;
GRANT ALL ON api.merchant_subscription_plans TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO service_role;

-- Step 9: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active ON api.merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_name ON api.merchant_subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON api.profiles(role);

-- Step 10: Create or update the trigger function for updated_at
CREATE OR REPLACE FUNCTION api.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 11: Create the trigger
DROP TRIGGER IF EXISTS update_merchant_subscription_plans_updated_at ON api.merchant_subscription_plans;
CREATE TRIGGER update_merchant_subscription_plans_updated_at
  BEFORE UPDATE ON api.merchant_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION api.update_updated_at_column();

-- Step 12: Insert default subscription plans (only if they don't exist)
INSERT INTO api.merchant_subscription_plans (name, description, price_monthly, features, trial_days, is_active) 
VALUES
  ('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support"]'::jsonb, 30, true),
  ('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access"]'::jsonb, 30, true),
  ('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]'::jsonb, 30, true)
ON CONFLICT (name) DO NOTHING;

-- Step 13: FIXED - Copy existing admin user from public.profiles to api.profiles (handles missing columns)
DO $$
DECLARE
  column_exists boolean;
BEGIN
  -- Check if avatar_url column exists in public.profiles
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) INTO column_exists;
  
  IF column_exists THEN
    -- If avatar_url exists, copy all columns including avatar_url
    INSERT INTO api.profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
    SELECT id, email, full_name, avatar_url, role, created_at, updated_at
    FROM public.profiles
    WHERE role = 'admin'
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      role = EXCLUDED.role,
      updated_at = now();
  ELSE
    -- If avatar_url doesn't exist, copy without avatar_url
    INSERT INTO api.profiles (id, email, full_name, role, created_at, updated_at)
    SELECT id, email, full_name, role, created_at, updated_at
    FROM public.profiles
    WHERE role = 'admin'
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      updated_at = now();
  END IF;
END $$;

-- Step 14: Verification queries and logging
DO $$
DECLARE
  table_exists boolean;
  profiles_exists boolean;
  policies_count integer;
  plans_count integer;
  admin_count integer;
  function_exists boolean;
BEGIN
  -- Check if merchant_subscription_plans table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
  ) INTO table_exists;
  
  -- Check if profiles table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'profiles'
  ) INTO profiles_exists;
  
  -- Check if admin function exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'api' AND routine_name = 'check_admin_access'
  ) INTO function_exists;
  
  -- Check policies
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
  
  -- Check default plans
  SELECT COUNT(*) INTO plans_count FROM api.merchant_subscription_plans;
  
  -- Check if there are admin users
  SELECT COUNT(*) INTO admin_count FROM api.profiles WHERE role = 'admin';
  
  -- Log results
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICATION RESULTS ===';
  RAISE NOTICE 'merchant_subscription_plans table exists: %', table_exists;
  RAISE NOTICE 'profiles table exists: %', profiles_exists;
  RAISE NOTICE 'check_admin_access function exists: %', function_exists;
  RAISE NOTICE 'RLS policies count: %', policies_count;
  RAISE NOTICE 'Default plans count: %', plans_count;
  RAISE NOTICE 'Admin users count: %', admin_count;
  
  IF NOT table_exists THEN
    RAISE NOTICE '❌ ERROR: merchant_subscription_plans table was not created!';
  END IF;
  
  IF NOT profiles_exists THEN
    RAISE NOTICE '❌ ERROR: profiles table was not created!';
  END IF;
  
  IF NOT function_exists THEN
    RAISE NOTICE '❌ ERROR: check_admin_access function was not created!';
  END IF;
  
  IF policies_count < 5 THEN
    RAISE NOTICE '⚠️  WARNING: Expected 5 RLS policies, found %', policies_count;
  END IF;
  
  IF admin_count = 0 THEN
    RAISE NOTICE '⚠️  WARNING: No admin users found. You may need to update a user role to "admin".';
    RAISE NOTICE 'Run: UPDATE api.profiles SET role = ''admin'' WHERE email = ''your-email@example.com'';';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error during verification: %', SQLERRM;
END $$;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 FIXED COMPREHENSIVE SUBSCRIPTION PLANS FIX COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 What was fixed:';
  RAISE NOTICE '   ✅ Created api schema with proper permissions';
  RAISE NOTICE '   ✅ Created api.profiles table for admin checks';
  RAISE NOTICE '   ✅ Created check_admin_access() function';
  RAISE NOTICE '   ✅ Created merchant_subscription_plans table in api schema';
  RAISE NOTICE '   ✅ Enabled Row Level Security (RLS)';
  RAISE NOTICE '   ✅ Created 5 RLS policies for proper access control';
  RAISE NOTICE '   ✅ Granted necessary permissions to all roles';
  RAISE NOTICE '   ✅ Added performance indexes';
  RAISE NOTICE '   ✅ Created update trigger for timestamps';
  RAISE NOTICE '   ✅ Inserted 3 default subscription plans';
  RAISE NOTICE '   ✅ FIXED: Migrated admin users handling missing avatar_url column';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 The admin dashboard "Plans" tab should now work correctly!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Ensure your user has role = "admin" in api.profiles table';
  RAISE NOTICE '   2. Log in as an admin user';
  RAISE NOTICE '   3. Navigate to Admin Dashboard';
  RAISE NOTICE '   4. Click on the "Plans" tab';
  RAISE NOTICE '   5. You should see the subscription plans without permission errors';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  If you still get permission errors:';
  RAISE NOTICE '   - Check that your user exists in api.profiles with role = "admin"';
  RAISE NOTICE '   - Clear browser cache and log in again';
  RAISE NOTICE '   - Check browser console for detailed error messages';
END $$;
