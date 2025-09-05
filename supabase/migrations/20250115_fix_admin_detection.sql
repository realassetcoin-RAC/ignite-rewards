-- Fix the is_admin function to properly detect admin users
-- This migration ensures the is_admin function correctly identifies admin users
-- by checking both the public and api schemas and handling different role formats

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Create a more robust is_admin function that checks multiple conditions
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin_user boolean := false;
  user_role text;
BEGIN
  -- First check if user exists in api.profiles with admin role
  SELECT role::text INTO user_role
  FROM api.profiles
  WHERE id = COALESCE(user_id, auth.uid())
  LIMIT 1;
  
  IF user_role IS NOT NULL AND (user_role = 'admin' OR user_role = 'administrator') THEN
    is_admin_user := true;
  END IF;
  
  -- If not found in api schema, check public schema as fallback
  IF NOT is_admin_user THEN
    SELECT 
      CASE 
        WHEN role::text = 'admin' THEN true
        WHEN role::text = 'administrator' THEN true
        ELSE false
      END INTO is_admin_user
    FROM public.profiles
    WHERE id = COALESCE(user_id, auth.uid())
    LIMIT 1;
  END IF;
  
  -- Log the result for debugging
  RAISE NOTICE 'is_admin check for user %: role=%, result=%', COALESCE(user_id, auth.uid()), user_role, is_admin_user;
  
  RETURN COALESCE(is_admin_user, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Add a helper function to debug user profile data
CREATE OR REPLACE FUNCTION public.debug_user_profile(user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  schema_name text,
  user_id uuid,
  email text,
  role text,
  full_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 'api'::text as schema_name, p.id, p.email, p.role::text, p.full_name
  FROM api.profiles p
  WHERE p.id = COALESCE(user_id, auth.uid())
  UNION ALL
  SELECT 'public'::text as schema_name, p.id, p.email, p.role::text, p.full_name
  FROM public.profiles p
  WHERE p.id = COALESCE(user_id, auth.uid());
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.debug_user_profile(uuid) TO authenticated;

-- Update any existing admin users with 'administrator' role to 'admin'
UPDATE api.profiles 
SET role = 'admin'::api.app_role 
WHERE role::text = 'administrator';

UPDATE public.profiles 
SET role = 'admin'::public.app_role 
WHERE role::text = 'administrator';

-- Create an index to improve performance of role lookups
CREATE INDEX IF NOT EXISTS idx_api_profiles_role ON api.profiles(role);
CREATE INDEX IF NOT EXISTS idx_public_profiles_role ON public.profiles(role);