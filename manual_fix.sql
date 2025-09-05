-- ESSENTIAL DATABASE FIXES - Apply these in Supabase SQL Editor

-- 1. Create missing check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN COALESCE(public.is_admin(user_id), false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_admin_access(uuid) TO authenticated;

-- 2. Create missing get_current_user_profile function  
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
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
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

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;

-- 3. Create admin user if realassetcoin@gmail.com exists in auth.users
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
  END IF;
END;
$$;
