-- COMPLETE DATABASE FIX SCRIPT
-- This script creates all missing functions and fixes database issues
-- Apply this script in Supabase Dashboard → SQL Editor
-- Version: 2025-01-15 (Updated)

-- ============================================================================
-- PART 1: CREATE MISSING RPC FUNCTIONS THAT THE APPLICATION EXPECTS
-- ============================================================================

-- 1. Create check_admin_access function (CRITICAL - Application expects this)
CREATE OR REPLACE FUNCTION public.check_admin_access(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public, api'
AS $$
DECLARE
  is_admin_user boolean := false;
  user_role text;
BEGIN
  -- Return false if no user_id provided
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Method 1: Use existing is_admin function if it exists
  BEGIN
    SELECT public.is_admin(user_id) INTO is_admin_user;
    IF is_admin_user THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to direct check if is_admin fails
    NULL;
  END;

  -- Method 2: Direct profile check in api schema
  BEGIN
    SELECT role::text INTO user_role
    FROM api.profiles
    WHERE id = user_id
    LIMIT 1;
    
    IF FOUND AND user_role = 'admin' THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to public schema check
    NULL;
  END;

  -- Method 3: Direct profile check in public schema
  BEGIN
    SELECT role::text INTO user_role
    FROM public.profiles
    WHERE id = user_id OR user_id = user_id
    LIMIT 1;
    
    IF FOUND AND user_role = 'admin' THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Method 4: Known admin email fallback
  BEGIN
    SELECT email INTO user_role
    FROM auth.users
    WHERE id = user_id
    AND email = 'realassetcoin@gmail.com'
    LIMIT 1;
    
    IF FOUND THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN false;
END;
$$;

-- Grant permissions for check_admin_access
GRANT EXECUTE ON FUNCTION public.check_admin_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access(uuid) TO anon;

-- 2. Create get_current_user_profile function (CRITICAL - Application expects this)
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
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public, api'
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Method 1: Try api.profiles first
  BEGIN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.role::text,
      p.created_at,
      p.updated_at,
      p.totp_secret,
      COALESCE(p.mfa_enabled, false) as mfa_enabled,
      COALESCE(p.backup_codes, ARRAY[]::text[]) as backup_codes,
      p.mfa_setup_completed_at
    FROM api.profiles p
    WHERE p.id = current_user_id
    LIMIT 1;
    
    -- If we found a record, return
    IF FOUND THEN
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to public schema
    NULL;
  END;

  -- Method 2: Try public.profiles
  BEGIN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.role::text,
      p.created_at,
      p.updated_at,
      NULL::text as totp_secret,
      false as mfa_enabled,
      ARRAY[]::text[] as backup_codes,
      NULL::timestamp with time zone as mfa_setup_completed_at
    FROM public.profiles p
    WHERE p.id = current_user_id OR p.user_id = current_user_id
    LIMIT 1;
    
    -- If we found a record, return
    IF FOUND THEN
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to fallback
    NULL;
  END;

  -- Method 3: Create fallback profile from auth.users
  BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
    
    IF user_email IS NOT NULL THEN
      RETURN QUERY
      SELECT 
        current_user_id as id,
        user_email as email,
        COALESCE(split_part(user_email, '@', 1), 'User') as full_name,
        'user'::text as role,
        now() as created_at,
        now() as updated_at,
        NULL::text as totp_secret,
        false as mfa_enabled,
        ARRAY[]::text[] as backup_codes,
        NULL::timestamp with time zone as mfa_setup_completed_at;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Return empty if all methods fail
    RETURN;
  END;
END;
$$;

-- Grant permissions for get_current_user_profile
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO anon;

-- ============================================================================
-- PART 2: ENSURE ADMIN USER PROFILE EXISTS
-- ============================================================================

-- Create or update admin user profile
DO $$
DECLARE
  admin_user_id uuid;
  profile_exists boolean := false;
  admin_email text := 'realassetcoin@gmail.com';
BEGIN
  -- Find admin user in auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email 
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found admin user: % with ID: %', admin_email, admin_user_id;
    
    -- Check if profile exists in api.profiles
    BEGIN
      SELECT EXISTS(
        SELECT 1 FROM api.profiles 
        WHERE id = admin_user_id
      ) INTO profile_exists;
      
      IF profile_exists THEN
        -- Update existing profile to ensure admin role
        UPDATE api.profiles 
        SET role = 'admin'::api.app_role, updated_at = now()
        WHERE id = admin_user_id;
        RAISE NOTICE 'Updated existing api.profiles record to admin role';
      ELSE
        -- Create new profile in api.profiles
        INSERT INTO api.profiles (id, email, full_name, role, created_at, updated_at)
        VALUES (admin_user_id, admin_email, 'Admin User', 'admin'::api.app_role, now(), now())
        ON CONFLICT (id) DO UPDATE SET 
          role = 'admin'::api.app_role, 
          updated_at = now();
        RAISE NOTICE 'Created new api.profiles record for admin user';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'api.profiles update failed: %', SQLERRM;
    END;

    -- Also ensure profile exists in public.profiles (fallback)
    BEGIN
      SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE id = admin_user_id OR user_id = admin_user_id
      ) INTO profile_exists;
      
      IF NOT profile_exists THEN
        -- Try inserting with id first
        BEGIN
          INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
          VALUES (admin_user_id, admin_email, 'Admin User', 'admin', now(), now())
          ON CONFLICT DO NOTHING;
          RAISE NOTICE 'Created public.profiles record with id';
        EXCEPTION WHEN OTHERS THEN
          -- Try with user_id if id fails
          BEGIN
            INSERT INTO public.profiles (user_id, email, full_name, role, created_at, updated_at)
            VALUES (admin_user_id, admin_email, 'Admin User', 'admin', now(), now())
            ON CONFLICT DO NOTHING;
            RAISE NOTICE 'Created public.profiles record with user_id';
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create public.profiles record: %', SQLERRM;
          END;
        END;
      ELSE
        -- Update existing public profile
        UPDATE public.profiles 
        SET role = 'admin', updated_at = now()
        WHERE (id = admin_user_id OR user_id = admin_user_id)
        AND role != 'admin';
        RAISE NOTICE 'Updated existing public.profiles record to admin role';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'public.profiles update failed: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Admin user % not found in auth.users. Please create the user first.', admin_email;
  END IF;
END;
$$;

-- ============================================================================
-- PART 3: CREATE COMPREHENSIVE DIAGNOSTIC FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_database_fix()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, api'
AS $$
DECLARE
  result_text text := '';
  function_count integer;
  profile_count integer;
  admin_count integer;
  test_result boolean;
  admin_user_id uuid;
BEGIN
  result_text := '=== DATABASE FIX VERIFICATION ===' || E'\n\n';
  
  -- 1. Check if required functions exist
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p 
  JOIN pg_namespace n ON p.pronamespace = n.oid 
  WHERE n.nspname = 'public' 
  AND p.proname IN ('check_admin_access', 'get_current_user_profile', 'is_admin');
  
  result_text := result_text || '1. Required Functions:' || E'\n';
  result_text := result_text || '   - Functions found: ' || function_count || '/3' || E'\n';
  
  -- Test each function individually
  BEGIN
    SELECT public.is_admin() INTO test_result;
    result_text := result_text || '   - is_admin(): ✅ Working' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || '   - is_admin(): ❌ Error - ' || SQLERRM || E'\n';
  END;
  
  BEGIN
    SELECT public.check_admin_access() INTO test_result;
    result_text := result_text || '   - check_admin_access(): ✅ Working' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || '   - check_admin_access(): ❌ Error - ' || SQLERRM || E'\n';
  END;
  
  BEGIN
    SELECT COUNT(*) INTO function_count FROM public.get_current_user_profile();
    result_text := result_text || '   - get_current_user_profile(): ✅ Working' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || '   - get_current_user_profile(): ❌ Error - ' || SQLERRM || E'\n';
  END;
  
  result_text := result_text || E'\n';
  
  -- 2. Check profiles data
  result_text := result_text || '2. Database Data:' || E'\n';
  
  -- Check api.profiles
  BEGIN
    SELECT COUNT(*) INTO profile_count FROM api.profiles;
    SELECT COUNT(*) INTO admin_count FROM api.profiles WHERE role = 'admin';
    result_text := result_text || '   - api.profiles: ' || profile_count || ' total, ' || admin_count || ' admin' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || '   - api.profiles: ❌ Error accessing table' || E'\n';
  END;
  
  -- Check public.profiles
  BEGIN
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    result_text := result_text || '   - public.profiles: ' || profile_count || ' total, ' || admin_count || ' admin' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || '   - public.profiles: ❌ Error accessing table' || E'\n';
  END;
  
  result_text := result_text || E'\n';
  
  -- 3. Check admin user specifically
  result_text := result_text || '3. Admin User Status:' || E'\n';
  
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'realassetcoin@gmail.com' LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    result_text := result_text || '   - Admin user exists in auth.users: ✅' || E'\n';
    result_text := result_text || '   - Admin user ID: ' || admin_user_id || E'\n';
    
    -- Test admin access for this specific user
    BEGIN
      SELECT public.check_admin_access(admin_user_id) INTO test_result;
      IF test_result THEN
        result_text := result_text || '   - Admin access check: ✅ PASS' || E'\n';
      ELSE
        result_text := result_text || '   - Admin access check: ❌ FAIL (returns false)' || E'\n';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      result_text := result_text || '   - Admin access check: ❌ ERROR - ' || SQLERRM || E'\n';
    END;
  ELSE
    result_text := result_text || '   - Admin user exists: ❌ NOT FOUND' || E'\n';
    result_text := result_text || '   - Please create user realassetcoin@gmail.com first' || E'\n';
  END IF;
  
  result_text := result_text || E'\n';
  
  -- 4. Overall status
  result_text := result_text || '4. Fix Status:' || E'\n';
  
  IF function_count >= 3 AND admin_count > 0 THEN
    result_text := result_text || '   - Status: ✅ DATABASE FIX SUCCESSFUL' || E'\n';
    result_text := result_text || '   - Next: Test admin login in the application' || E'\n';
  ELSE
    result_text := result_text || '   - Status: ❌ PARTIAL FIX - Some issues remain' || E'\n';
    result_text := result_text || '   - Action: Check the errors above and retry' || E'\n';
  END IF;
  
  result_text := result_text || E'\n=== END VERIFICATION ===' || E'\n';
  
  RETURN result_text;
END;
$$;

-- Grant permission for verification function
GRANT EXECUTE ON FUNCTION public.verify_database_fix() TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_database_fix() TO anon;

-- ============================================================================
-- PART 4: RUN VERIFICATION
-- ============================================================================

-- Execute the verification to see results immediately
SELECT public.verify_database_fix();

-- ============================================================================
-- FINAL MESSAGE
-- ============================================================================

SELECT 
  '🎉 DATABASE FIX COMPLETED! 🎉' as status,
  'Check the verification results above. If successful, test admin login at your application.' as next_step;