-- FIX ADMIN DASHBOARD LOAD ERRORS
-- This script fixes all loading errors in the admin dashboard

-- ==============================================
-- 1. FIX ADMIN ACCESS FUNCTIONS
-- ==============================================

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.check_admin_access() CASCADE;

-- Create is_admin function that properly checks admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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
    
    -- Get user email from auth
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    
    -- Check if it's the known admin email
    IF user_email = 'realassetcoin@gmail.com' THEN
        RETURN true;
    END IF;
    
    -- Check role in profiles table
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
    
    RETURN user_role = 'admin';
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Create check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN public.is_admin();
END;
$$;

-- ==============================================
-- 2. FIX MERCHANT_SUBSCRIPTION_PLANS POLICIES
-- ==============================================

-- Enable RLS if not already enabled
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Enable all access for admins" ON public.merchant_subscription_plans;

-- Create new policies with proper admin access
CREATE POLICY "Enable read access for all users" 
ON public.merchant_subscription_plans 
FOR SELECT 
USING (true);  -- Everyone can read plans

CREATE POLICY "Enable insert for admins" 
ON public.merchant_subscription_plans 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Enable update for admins" 
ON public.merchant_subscription_plans 
FOR UPDATE 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Enable delete for admins" 
ON public.merchant_subscription_plans 
FOR DELETE 
USING (public.is_admin());

-- ==============================================
-- 3. FIX USER_REFERRALS POLICIES
-- ==============================================

-- Enable RLS if not already enabled
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for admins" ON public.user_referrals;
DROP POLICY IF EXISTS "Enable all access for admins" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can view own referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.user_referrals;

-- Create new policies
CREATE POLICY "Users can view own referrals" 
ON public.user_referrals 
FOR SELECT 
USING (
    auth.uid() = referrer_id 
    OR auth.uid() = referred_user_id
    OR public.is_admin()
);

CREATE POLICY "Enable insert for admins" 
ON public.user_referrals 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Enable update for admins" 
ON public.user_referrals 
FOR UPDATE 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Enable delete for admins" 
ON public.user_referrals 
FOR DELETE 
USING (public.is_admin());

-- ==============================================
-- 4. FIX REFERRAL_CAMPAIGNS POLICIES
-- ==============================================

-- Check if referral_campaigns table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'referral_campaigns') THEN
        -- Enable RLS
        ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.referral_campaigns;
        DROP POLICY IF EXISTS "Enable all access for admins" ON public.referral_campaigns;
        
        -- Create new policies
        CREATE POLICY "Enable read access for all users" 
        ON public.referral_campaigns 
        FOR SELECT 
        USING (true);
        
        CREATE POLICY "Enable insert for admins" 
        ON public.referral_campaigns 
        FOR INSERT 
        WITH CHECK (public.is_admin());
        
        CREATE POLICY "Enable update for admins" 
        ON public.referral_campaigns 
        FOR UPDATE 
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
        
        CREATE POLICY "Enable delete for admins" 
        ON public.referral_campaigns 
        FOR DELETE 
        USING (public.is_admin());
    END IF;
END $$;

-- ==============================================
-- 5. ENSURE ADMIN PROFILE EXISTS
-- ==============================================

-- Insert or update admin profile
INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
    id,
    email,
    'admin',
    'Admin User',
    now(),
    now()
FROM auth.users
WHERE email = 'realassetcoin@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
    role = 'admin',
    updated_at = now();

-- ==============================================
-- 6. GRANT NECESSARY PERMISSIONS
-- ==============================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant specific table permissions
GRANT SELECT ON public.merchant_subscription_plans TO authenticated;
GRANT SELECT ON public.user_referrals TO authenticated;
GRANT SELECT ON public.virtual_cards TO authenticated;
GRANT SELECT ON public.merchants TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- Grant admin functions permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;

-- ==============================================
-- 7. REFRESH SCHEMA CACHE
-- ==============================================

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- ==============================================
-- 8. VERIFY SETUP
-- ==============================================

-- Check if tables exist and have proper RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('merchant_subscription_plans', 'user_referrals', 'referral_campaigns', 'virtual_cards', 'merchants', 'profiles')
AND schemaname = 'public'
ORDER BY tablename;

-- Check if admin functions exist
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('is_admin', 'check_admin_access')
AND n.nspname = 'public';

-- Check admin user
SELECT id, email, role, full_name 
FROM public.profiles 
WHERE email = 'realassetcoin@gmail.com' OR role = 'admin';

-- Test admin access function
SELECT public.is_admin() as is_admin, public.check_admin_access() as has_admin_access;