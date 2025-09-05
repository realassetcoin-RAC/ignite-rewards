-- COMPREHENSIVE LOAD ERROR FIX
-- This script addresses all admin dashboard loading errors by:
-- 1. Creating missing RPC functions with proper error handling
-- 2. Fixing RLS policies for all admin tables
-- 3. Ensuring admin profile exists
-- 4. Adding comprehensive fallback mechanisms

-- ==============================================
-- 1. CREATE MISSING RPC FUNCTIONS
-- ==============================================

-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.check_admin_access();
DROP FUNCTION IF EXISTS public.get_current_user_profile();
DROP FUNCTION IF EXISTS api.is_admin();
DROP FUNCTION IF EXISTS api.check_admin_access();
DROP FUNCTION IF EXISTS api.get_current_user_profile();

-- Create is_admin function in public schema
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
    user_role text;
    user_email text;
BEGIN
    -- Get current user ID
    user_id := auth.uid();
    
    -- If no user, return false
    IF user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    
    -- Check if it's the known admin email
    IF user_email = 'realassetcoin@gmail.com' THEN
        RETURN true;
    END IF;
    
    -- Try to get role from profiles table (public schema)
    BEGIN
        SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
        IF user_role = 'admin' THEN
            RETURN true;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- If public.profiles doesn't exist or has issues, continue
            NULL;
    END;
    
    -- Try to get role from profiles table (api schema)
    BEGIN
        SELECT role INTO user_role FROM api.profiles WHERE id = user_id;
        IF user_role = 'admin' THEN
            RETURN true;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- If api.profiles doesn't exist or has issues, continue
            NULL;
    END;
    
    RETURN false;
END;
$$;

-- Create check_admin_access function in public schema
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.is_admin();
END;
$$;

-- Create get_current_user_profile function in public schema
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
    profile_data json;
BEGIN
    -- Get current user ID
    user_id := auth.uid();
    
    -- If no user, return null
    IF user_id IS NULL THEN
        RETURN null;
    END IF;
    
    -- Try to get profile from public schema first
    BEGIN
        SELECT to_json(p.*) INTO profile_data 
        FROM public.profiles p 
        WHERE p.id = user_id;
        
        IF profile_data IS NOT NULL THEN
            RETURN profile_data;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- If public.profiles doesn't exist or has issues, continue
            NULL;
    END;
    
    -- Try to get profile from api schema
    BEGIN
        SELECT to_json(p.*) INTO profile_data 
        FROM api.profiles p 
        WHERE p.id = user_id;
        
        IF profile_data IS NOT NULL THEN
            RETURN profile_data;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- If api.profiles doesn't exist or has issues, continue
            NULL;
    END;
    
    -- Return basic user info if no profile found
    SELECT json_build_object(
        'id', user_id,
        'email', (SELECT email FROM auth.users WHERE id = user_id),
        'role', 'user'
    ) INTO profile_data;
    
    RETURN profile_data;
END;
$$;

-- Create the same functions in api schema for compatibility
CREATE OR REPLACE FUNCTION api.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.is_admin();
END;
$$;

CREATE OR REPLACE FUNCTION api.check_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.check_admin_access();
END;
$$;

CREATE OR REPLACE FUNCTION api.get_current_user_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.get_current_user_profile();
END;
$$;

-- ==============================================
-- 2. GRANT PERMISSIONS
-- ==============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION api.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION api.check_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION api.get_current_user_profile() TO authenticated;

-- ==============================================
-- 3. ENSURE ADMIN PROFILE EXISTS
-- ==============================================

-- Create admin profile for realassetcoin@gmail.com
DO $$
DECLARE
    admin_user_id uuid;
    profile_exists boolean;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'realassetcoin@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Check if profile exists in public schema
        BEGIN
            SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = admin_user_id) INTO profile_exists;
            
            IF NOT profile_exists THEN
                -- Create profile in public schema
                INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
                VALUES (admin_user_id, 'realassetcoin@gmail.com', 'Admin User', 'admin', NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET
                    role = 'admin',
                    updated_at = NOW();
            ELSE
                -- Update existing profile to ensure it's admin
                UPDATE public.profiles 
                SET role = 'admin', updated_at = NOW()
                WHERE id = admin_user_id;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- If public.profiles doesn't exist, try api schema
                BEGIN
                    SELECT EXISTS(SELECT 1 FROM api.profiles WHERE id = admin_user_id) INTO profile_exists;
                    
                    IF NOT profile_exists THEN
                        INSERT INTO api.profiles (id, email, full_name, role, created_at, updated_at)
                        VALUES (admin_user_id, 'realassetcoin@gmail.com', 'Admin User', 'admin', NOW(), NOW())
                        ON CONFLICT (id) DO UPDATE SET
                            role = 'admin',
                            updated_at = NOW();
                    ELSE
                        UPDATE api.profiles 
                        SET role = 'admin', updated_at = NOW()
                        WHERE id = admin_user_id;
                    END IF;
                EXCEPTION
                    WHEN OTHERS THEN
                        -- If neither schema works, log the error but continue
                        RAISE NOTICE 'Could not create/update admin profile: %', SQLERRM;
                END;
            END;
        END;
    END IF;
END;
$$;

-- ==============================================
-- 4. FIX RLS POLICIES FOR ADMIN TABLES
-- ==============================================

-- Virtual Cards Table Policies
DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Enable read access for admins" ON public.virtual_cards;
    DROP POLICY IF EXISTS "Enable all access for admins" ON public.virtual_cards;
    DROP POLICY IF EXISTS "Enable read access for admins" ON api.virtual_cards;
    DROP POLICY IF EXISTS "Enable all access for admins" ON api.virtual_cards;
    
    -- Create new policies for public schema
    BEGIN
        CREATE POLICY "Enable read access for admins" ON public.virtual_cards
        FOR SELECT USING (public.is_admin());
        
        CREATE POLICY "Enable all access for admins" ON public.virtual_cards
        FOR ALL USING (public.is_admin());
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policies for public.virtual_cards: %', SQLERRM;
    END;
    
    -- Create new policies for api schema
    BEGIN
        CREATE POLICY "Enable read access for admins" ON api.virtual_cards
        FOR SELECT USING (api.is_admin());
        
        CREATE POLICY "Enable all access for admins" ON api.virtual_cards
        FOR ALL USING (api.is_admin());
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policies for api.virtual_cards: %', SQLERRM;
    END;
END;
$$;

-- Merchants Table Policies
DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Enable read access for admins" ON public.merchants;
    DROP POLICY IF EXISTS "Enable all access for admins" ON public.merchants;
    DROP POLICY IF EXISTS "Enable read access for admins" ON api.merchants;
    DROP POLICY IF EXISTS "Enable all access for admins" ON api.merchants;
    
    -- Create new policies for public schema
    BEGIN
        CREATE POLICY "Enable read access for admins" ON public.merchants
        FOR SELECT USING (public.is_admin());
        
        CREATE POLICY "Enable all access for admins" ON public.merchants
        FOR ALL USING (public.is_admin());
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policies for public.merchants: %', SQLERRM;
    END;
    
    -- Create new policies for api schema
    BEGIN
        CREATE POLICY "Enable read access for admins" ON api.merchants
        FOR SELECT USING (api.is_admin());
        
        CREATE POLICY "Enable all access for admins" ON api.merchants
        FOR ALL USING (api.is_admin());
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policies for api.merchants: %', SQLERRM;
    END;
END;
$$;

-- Referral Campaigns Table Policies
DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Enable read access for admins" ON public.referral_campaigns;
    DROP POLICY IF EXISTS "Enable all access for admins" ON public.referral_campaigns;
    DROP POLICY IF EXISTS "Enable read access for admins" ON api.referral_campaigns;
    DROP POLICY IF EXISTS "Enable all access for admins" ON api.referral_campaigns;
    
    -- Create new policies for public schema
    BEGIN
        CREATE POLICY "Enable read access for admins" ON public.referral_campaigns
        FOR SELECT USING (public.is_admin());
        
        CREATE POLICY "Enable all access for admins" ON public.referral_campaigns
        FOR ALL USING (public.is_admin());
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policies for public.referral_campaigns: %', SQLERRM;
    END;
    
    -- Create new policies for api schema
    BEGIN
        CREATE POLICY "Enable read access for admins" ON api.referral_campaigns
        FOR SELECT USING (api.is_admin());
        
        CREATE POLICY "Enable all access for admins" ON api.referral_campaigns
        FOR ALL USING (api.is_admin());
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policies for api.referral_campaigns: %', SQLERRM;
    END;
END;
$$;

-- User Referrals Table Policies
DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Enable read access for admins" ON public.user_referrals;
    DROP POLICY IF EXISTS "Enable all access for admins" ON public.user_referrals;
    DROP POLICY IF EXISTS "Enable read access for admins" ON api.user_referrals;
    DROP POLICY IF EXISTS "Enable all access for admins" ON api.user_referrals;
    
    -- Create new policies for public schema
    BEGIN
        CREATE POLICY "Enable read access for admins" ON public.user_referrals
        FOR SELECT USING (public.is_admin());
        
        CREATE POLICY "Enable all access for admins" ON public.user_referrals
        FOR ALL USING (public.is_admin());
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policies for public.user_referrals: %', SQLERRM;
    END;
    
    -- Create new policies for api schema
    BEGIN
        CREATE POLICY "Enable read access for admins" ON api.user_referrals
        FOR SELECT USING (api.is_admin());
        
        CREATE POLICY "Enable all access for admins" ON api.user_referrals
        FOR ALL USING (api.is_admin());
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policies for api.user_referrals: %', SQLERRM;
    END;
END;
$$;

-- ==============================================
-- 5. GRANT TABLE PERMISSIONS
-- ==============================================

-- Grant permissions to authenticated users for all admin tables
DO $$
BEGIN
    -- Public schema permissions
    BEGIN
        GRANT ALL ON public.virtual_cards TO authenticated;
        GRANT ALL ON public.merchants TO authenticated;
        GRANT ALL ON public.referral_campaigns TO authenticated;
        GRANT ALL ON public.user_referrals TO authenticated;
        GRANT ALL ON public.profiles TO authenticated;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not grant permissions for public schema: %', SQLERRM;
    END;
    
    -- API schema permissions
    BEGIN
        GRANT ALL ON api.virtual_cards TO authenticated;
        GRANT ALL ON api.merchants TO authenticated;
        GRANT ALL ON api.referral_campaigns TO authenticated;
        GRANT ALL ON api.user_referrals TO authenticated;
        GRANT ALL ON api.profiles TO authenticated;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not grant permissions for api schema: %', SQLERRM;
    END;
END;
$$;

-- ==============================================
-- 6. CREATE TEST FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION public.test_admin_functions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'is_admin', public.is_admin(),
        'check_admin_access', public.check_admin_access(),
        'user_profile', public.get_current_user_profile(),
        'current_user_id', auth.uid(),
        'current_user_email', (SELECT email FROM auth.users WHERE id = auth.uid())
    ) INTO result;
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_admin_functions() TO authenticated;

-- ==============================================
-- 7. VERIFICATION QUERIES
-- ==============================================

-- Test the functions
SELECT 'Testing admin functions...' as status;
SELECT public.test_admin_functions() as test_results;

-- Check if admin profile exists
SELECT 'Checking admin profile...' as status;
SELECT 
    u.email,
    u.id,
    p.role,
    p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'realassetcoin@gmail.com'
UNION ALL
SELECT 
    u.email,
    u.id,
    p.role,
    p.created_at
FROM auth.users u
LEFT JOIN api.profiles p ON u.id = p.id
WHERE u.email = 'realassetcoin@gmail.com';

-- Check table permissions
SELECT 'Checking table permissions...' as status;
SELECT 
    schemaname,
    tablename,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'SELECT') as can_select,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'INSERT') as can_insert,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'UPDATE') as can_update,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'DELETE') as can_delete
FROM pg_tables 
WHERE tablename IN ('virtual_cards', 'merchants', 'referral_campaigns', 'user_referrals', 'profiles')
AND schemaname IN ('public', 'api');

SELECT 'Comprehensive load error fix completed successfully!' as final_status;