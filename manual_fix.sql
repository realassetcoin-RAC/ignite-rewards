-- ESSENTIAL DATABASE FIXES - Apply these in Supabase SQL Editor

-- 0) Ensure api schema exists and is exposed
CREATE SCHEMA IF NOT EXISTS api;
GRANT USAGE ON SCHEMA api TO anon, authenticated;

-- 1) Public RPCs (backward/compat)
--   Define zero-arg functions so PostgREST can call them without params
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.is_admin(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role::text,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = current_user_id OR p.id = current_user_id
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;

-- 2) API schema wrappers so /rest/v1/rpc resolves functions under api.*
CREATE OR REPLACE VIEW api.profiles AS
  SELECT * FROM public.profiles;

GRANT SELECT ON api.profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION api.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.is_admin(auth.uid());
$$;

CREATE OR REPLACE FUNCTION api.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.check_admin_access();
$$;

CREATE OR REPLACE FUNCTION api.get_current_user_profile()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT * FROM public.get_current_user_profile();
$$;

-- Optional: diagnostic wrapper used by local verify script
CREATE OR REPLACE FUNCTION api.verify_database_fix()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_text text := '';
BEGIN
  BEGIN
    result_text := public.diagnose_database_health();
  EXCEPTION WHEN undefined_function THEN
    -- Fallback minimal report
    result_text := 'diagnostic not available';
  END;
  RETURN result_text;
END;
$$;

GRANT EXECUTE ON FUNCTION api.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.check_admin_access() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.get_current_user_profile() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.verify_database_fix() TO anon, authenticated;

-- 3) Ensure admin profile exists if the user is present in auth.users
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'realassetcoin@gmail.com' 
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, email, full_name, role, created_at, updated_at)
    VALUES (admin_user_id, 'realassetcoin@gmail.com', 'Admin User', 'admin', now(), now())
    ON CONFLICT (user_id) DO UPDATE SET 
      role = 'admin',
      updated_at = now();

    RAISE NOTICE 'Admin profile created/updated for realassetcoin@gmail.com';
  ELSE
    RAISE NOTICE 'User realassetcoin@gmail.com not found in auth.users';
  END IF;
END;
$$;
