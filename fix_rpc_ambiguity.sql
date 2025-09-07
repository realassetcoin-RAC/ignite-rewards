-- Fix for RPC function ambiguity error
-- This script removes the conflicting function definitions and creates clean, unambiguous functions

-- First, drop dependent policies that use the old function signatures
DROP POLICY IF EXISTS "Admins can view all plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON api.merchant_subscription_plans;

-- Drop ALL existing is_admin functions to start clean
DROP FUNCTION IF EXISTS api.is_admin() CASCADE;
DROP FUNCTION IF EXISTS api.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS api.is_admin(user_id uuid) CASCADE;

-- Drop ALL existing check_admin_access functions
DROP FUNCTION IF EXISTS api.check_admin_access() CASCADE;
DROP FUNCTION IF EXISTS api.check_admin_access(uuid) CASCADE;
DROP FUNCTION IF EXISTS api.check_admin_access(user_id uuid) CASCADE;

-- Drop public schema versions too
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_admin_access() CASCADE;
DROP FUNCTION IF EXISTS public.check_admin_access(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_admin_access(user_id uuid) CASCADE;

-- Create ONLY the parameterless version in api schema
CREATE OR REPLACE FUNCTION api.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'api, public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM api.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Create ONLY the parameterless version of check_admin_access in api schema
CREATE OR REPLACE FUNCTION api.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'api, public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM api.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION api.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION api.check_admin_access() TO authenticated;

-- Create public schema wrappers (parameterless only)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT api.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT api.check_admin_access();
$$;

-- Grant execute permissions on public schema functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;

-- Recreate the policies using the new parameterless function
CREATE POLICY "Admins can view all plans" ON api.merchant_subscription_plans
  FOR SELECT USING (api.is_admin());

CREATE POLICY "Admins can insert plans" ON api.merchant_subscription_plans
  FOR INSERT WITH CHECK (api.is_admin());

CREATE POLICY "Admins can update plans" ON api.merchant_subscription_plans
  FOR UPDATE USING (api.is_admin());

CREATE POLICY "Admins can delete plans" ON api.merchant_subscription_plans
  FOR DELETE USING (api.is_admin());
