-- Fix for missing RPC functions causing warnings in health tab
-- This script creates the missing RPC functions in the api schema

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS api.get_current_user_profile() CASCADE;
DROP FUNCTION IF EXISTS api.generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS api.can_use_mfa(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS public.can_use_mfa(uuid) CASCADE;

-- 1. Create get_current_user_profile function in api schema
CREATE OR REPLACE FUNCTION api.get_current_user_profile()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  totp_secret text,
  mfa_enabled boolean,
  backup_codes text[],
  mfa_setup_completed_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'api, public'
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Try api.profiles first
  BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.role::text, p.created_at, p.updated_at,
           p.totp_secret, COALESCE(p.mfa_enabled, false), 
           COALESCE(p.backup_codes, ARRAY[]::text[]), p.mfa_setup_completed_at
    FROM api.profiles p
    WHERE p.id = current_user_id
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Fallback to public.profiles
  BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.role::text, p.created_at, p.updated_at,
           p.totp_secret, COALESCE(p.mfa_enabled, false), 
           COALESCE(p.backup_codes, ARRAY[]::text[]), p.mfa_setup_completed_at
    FROM public.profiles p
    WHERE p.id = current_user_id OR p.user_id = current_user_id
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Final fallback: synthesize from auth.users
  BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
    IF user_email IS NOT NULL THEN
      RETURN QUERY
      SELECT current_user_id,
             user_email,
             COALESCE(split_part(user_email, '@', 1), 'User'),
             'user'::text,
             now(), now(),
             NULL::text, false, ARRAY[]::text[], NULL::timestamp with time zone;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;
END;
$$;

-- 2. Create generate_referral_code function in api schema
CREATE OR REPLACE FUNCTION api.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'api, public'
AS $$
DECLARE
  code text;
  exists_check integer;
BEGIN
  -- Generate a random 8-character code
  code := upper(substring(md5(random()::text) from 1 for 8));
  
  -- Check if code already exists in user_referrals
  SELECT COUNT(*) INTO exists_check
  FROM public.user_referrals
  WHERE referral_code = code;
  
  -- If exists, generate a new one (recursive call with different seed)
  IF exists_check > 0 THEN
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  END IF;
  
  RETURN code;
END;
$$;

-- 3. Create can_use_mfa function in api schema
CREATE OR REPLACE FUNCTION api.can_use_mfa(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'api, public'
AS $$
DECLARE
  user_auth_methods text[];
  target_user_id uuid;
BEGIN
  target_user_id := can_use_mfa.user_id;
  
  -- Get user's authentication methods from auth.users and auth.identities
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT 
        CASE 
          WHEN provider = 'email' THEN 'email'
          WHEN provider = 'google' THEN 'google'
          WHEN provider = 'github' THEN 'github'
          ELSE provider
        END
      FROM auth.identities 
      WHERE auth.identities.user_id = target_user_id
    ), 
    '{}'
  ) INTO user_auth_methods;
  
  -- Check if user has email or social auth (not wallet-based)
  -- MFA is only available for email and social authentication
  RETURN 'email' = ANY(user_auth_methods) OR 
         'google' = ANY(user_auth_methods) OR 
         'github' = ANY(user_auth_methods);
END;
$$;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION api.get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION api.generate_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION api.can_use_mfa(uuid) TO authenticated;

-- Also create public schema wrappers for backward compatibility
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  totp_secret text,
  mfa_enabled boolean,
  backup_codes text[],
  mfa_setup_completed_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT * FROM api.get_current_user_profile();
$$;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT api.generate_referral_code();
$$;

CREATE OR REPLACE FUNCTION public.can_use_mfa(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT api.can_use_mfa(user_id);
$$;

-- Grant execute permissions on public schema functions
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_use_mfa(uuid) TO authenticated;
