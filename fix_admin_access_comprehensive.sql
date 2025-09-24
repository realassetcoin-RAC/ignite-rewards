-- COMPREHENSIVE ADMIN ACCESS FIX
-- This script fixes the admin access issue for realassetcoin@gmail.com
-- Run this script in your Supabase SQL editor

-- ==============================================
-- STEP 1: CHECK CURRENT STATE
-- ==============================================

-- Check if profiles table exists and its structure
SELECT 
  'profiles table structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check current admin users
SELECT 
  'Current admin users:' as info,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin'::app_role OR role = 'admin'
ORDER BY created_at DESC;

-- Check if realassetcoin@gmail.com exists in profiles
SELECT 
  'realassetcoin@gmail.com profile check:' as info,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE email = 'realassetcoin@gmail.com';

-- ==============================================
-- STEP 2: ENSURE ADMIN FUNCTIONS EXIST
-- ==============================================

-- Drop and recreate admin functions to ensure they work
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.check_admin_access() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_profile() CASCADE;

-- Create is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = COALESCE(user_id, auth.uid()) 
    AND (role = 'admin'::app_role OR role = 'admin')
  );
$$;

-- Create check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin'::app_role OR role = 'admin')
  );
$$;

-- Create get_current_user_profile function
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role::text,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- ==============================================
-- STEP 3: CREATE/UPDATE ADMIN USER
-- ==============================================

-- First, try to get the user ID from auth.users (this might not work in all contexts)
-- We'll create a profile that can be linked later

-- Create or update admin profile for realassetcoin@gmail.com
DO $$
DECLARE
    user_uuid uuid;
    profile_exists boolean;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE email = 'realassetcoin@gmail.com'
    ) INTO profile_exists;
    
    IF profile_exists THEN
        -- Update existing profile to admin
        UPDATE public.profiles 
        SET 
            role = 'admin'::app_role,
            full_name = 'System Administrator',
            updated_at = now()
        WHERE email = 'realassetcoin@gmail.com';
        
        RAISE NOTICE 'Updated existing profile to admin role';
    ELSE
        -- Create new admin profile
        -- Note: This will create a profile with a random UUID
        -- The actual user must be created in Supabase Auth first
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'realassetcoin@gmail.com',
            'System Administrator',
            'admin'::app_role,
            now(),
            now()
        );
        
        RAISE NOTICE 'Created new admin profile';
    END IF;
END $$;

-- ==============================================
-- STEP 4: ALTERNATIVE METHOD - DIRECT INSERT/UPDATE
-- ==============================================

-- If the above doesn't work, try this direct approach
-- This will work regardless of the user's UUID in auth.users

-- Insert or update admin profile (this should work even if user doesn't exist in auth yet)
-- First check if profile exists, then either insert or update
DO $$
BEGIN
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE email = 'realassetcoin@gmail.com') THEN
        -- Update existing profile
        UPDATE public.profiles 
        SET 
            role = 'admin'::app_role,
            full_name = 'System Administrator',
            updated_at = now()
        WHERE email = 'realassetcoin@gmail.com';
        RAISE NOTICE 'Updated existing profile to admin role';
    ELSE
        -- Insert new profile
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(), -- Temporary UUID, will be updated when user logs in
            'realassetcoin@gmail.com',
            'System Administrator',
            'admin'::app_role,
            now(),
            now()
        );
        RAISE NOTICE 'Created new admin profile';
    END IF;
END $$;

-- ==============================================
-- STEP 5: VERIFICATION
-- ==============================================

-- Show all admin users
SELECT 
  'Admin users after fix:' as info,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin'::app_role OR role = 'admin'
ORDER BY created_at DESC;

-- Show the specific user we're fixing
SELECT 
  'realassetcoin@gmail.com profile:' as info,
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
FROM public.profiles 
WHERE email = 'realassetcoin@gmail.com';

-- Test admin functions (these might not work without authentication context)
SELECT 'Testing admin functions...' as test;

-- Show function existence
SELECT 
  'Available admin functions:' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_admin', 'check_admin_access', 'get_current_user_profile')
ORDER BY routine_name;

-- ==============================================
-- STEP 6: ADDITIONAL FIXES
-- ==============================================

-- Ensure RLS is properly configured for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policy for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (role = 'admin'::app_role OR role = 'admin')
        )
    );

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (role = 'admin'::app_role OR role = 'admin')
        )
    );

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

SELECT '✅ Comprehensive admin access fix completed!' as status;
SELECT 'Next steps:' as info;
SELECT '1. Sign out and sign back in with realassetcoin@gmail.com' as step1;
SELECT '2. Try accessing the admin dashboard again' as step2;
SELECT '3. If still having issues, check the browser console for errors' as step3;
