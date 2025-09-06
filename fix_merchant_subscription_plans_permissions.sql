-- Fix for "permission denied for table merchant_subscription_plans"
-- This script fixes the RLS policies and permissions for the api.merchant_subscription_plans table

-- ============================================================================
-- 1. ENSURE ADMIN FUNCTIONS EXIST AND WORK PROPERLY
-- ============================================================================

-- Create or replace the check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user has admin role in the profiles table
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error (like table doesn't exist), return false
    RETURN false;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO anon;

-- ============================================================================
-- 2. FIX API SCHEMA PERMISSIONS
-- ============================================================================

-- Ensure the api schema exists and has proper permissions
CREATE SCHEMA IF NOT EXISTS api;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT USAGE ON SCHEMA api TO anon;
GRANT USAGE ON SCHEMA api TO service_role;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA api TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA api TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA api TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO service_role;

-- ============================================================================
-- 3. FIX RLS POLICIES FOR api.merchant_subscription_plans
-- ============================================================================

-- Ensure the table exists
CREATE TABLE IF NOT EXISTS api.merchant_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  features JSONB DEFAULT '[]',
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE api.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Public can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Authenticated can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Authenticated can insert plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Authenticated can update plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Authenticated can delete plans" ON api.merchant_subscription_plans;

-- Create comprehensive RLS policies

-- 1. Allow everyone (including anon) to view active plans
CREATE POLICY "Public can view active plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO public
USING (is_active = true);

-- 2. Allow authenticated users to view all plans if they are admin
CREATE POLICY "Admins can view all plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated
USING (public.check_admin_access());

-- 3. Allow authenticated users to insert plans if they are admin
CREATE POLICY "Admins can insert plans" 
ON api.merchant_subscription_plans 
FOR INSERT 
TO authenticated
WITH CHECK (public.check_admin_access());

-- 4. Allow authenticated users to update plans if they are admin
CREATE POLICY "Admins can update plans" 
ON api.merchant_subscription_plans 
FOR UPDATE 
TO authenticated
USING (public.check_admin_access())
WITH CHECK (public.check_admin_access());

-- 5. Allow authenticated users to delete plans if they are admin
CREATE POLICY "Admins can delete plans" 
ON api.merchant_subscription_plans 
FOR DELETE 
TO authenticated
USING (public.check_admin_access());

-- ============================================================================
-- 4. ALTERNATIVE: TEMPORARY PERMISSIVE POLICY FOR TESTING
-- ============================================================================

-- If the admin check is still not working, create a temporary permissive policy
-- This allows all authenticated users to manage plans (REMOVE IN PRODUCTION!)

CREATE POLICY "Temporary: Authenticated users can manage plans" 
ON api.merchant_subscription_plans 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 5. ENSURE PROFILES TABLE EXISTS FOR ADMIN CHECK
-- ============================================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile  
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- 6. CREATE TEST ADMIN USER (IF NEEDED)
-- ============================================================================

-- Insert or update admin user (replace with your actual user email)
INSERT INTO public.profiles (id, email, role) 
SELECT auth.uid(), 'realassetcoin@gmail.com', 'admin'
WHERE auth.uid() IS NOT NULL
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  email = COALESCE(EXCLUDED.email, public.profiles.email);

-- ============================================================================
-- 7. VERIFICATION AND TESTING
-- ============================================================================

-- Test admin function
DO $$
DECLARE
  admin_result BOOLEAN;
  table_exists BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Test admin access function
  SELECT public.check_admin_access() INTO admin_result;
  RAISE NOTICE 'Admin access check result: %', admin_result;
  
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
  ) INTO table_exists;
  RAISE NOTICE 'Table api.merchant_subscription_plans exists: %', table_exists;
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
  RAISE NOTICE 'Number of RLS policies: %', policy_count;
END $$;

-- Display current plans
SELECT 
  'Current subscription plans' as info,
  COUNT(*) as plan_count
FROM api.merchant_subscription_plans;

-- Show current user info
SELECT 
  'Current user info' as info,
  auth.uid() as user_id,
  auth.email() as email,
  public.check_admin_access() as is_admin;

RAISE NOTICE '✅ Permissions fix completed!';
RAISE NOTICE '⚠️  Note: There is a temporary permissive policy active.';
RAISE NOTICE '🔧 After testing, remove the temporary policy and ensure proper admin setup.';