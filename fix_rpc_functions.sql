-- Fix for is_admin RPC error in health tab
-- This script creates the missing RPC functions in the api schema

-- Ensure api schema exists and is accessible
CREATE SCHEMA IF NOT EXISTS api;
GRANT USAGE ON SCHEMA api TO anon, authenticated;

-- Drop existing conflicting functions to avoid ambiguity
DROP FUNCTION IF EXISTS api.is_admin();
DROP FUNCTION IF EXISTS api.is_admin(uuid);
DROP FUNCTION IF EXISTS api.check_admin_access();
DROP FUNCTION IF EXISTS api.check_admin_access(uuid);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.check_admin_access();
DROP FUNCTION IF EXISTS public.check_admin_access(uuid);

-- Create is_admin RPC function in api schema (no parameters)
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

-- Create check_admin_access RPC function in api schema (no parameters)
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

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION api.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION api.check_admin_access() TO authenticated;

-- Also create in public schema for backward compatibility (no parameters)
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
