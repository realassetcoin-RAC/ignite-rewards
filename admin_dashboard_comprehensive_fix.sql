-- COMPREHENSIVE ADMIN DASHBOARD FIX
-- This script fixes all admin dashboard loading errors for virtual cards, merchants, and referrals

-- ============================================================================
-- PART 1: ENSURE ALL REQUIRED RPC FUNCTIONS EXIST
-- ============================================================================

-- 1. Create or replace check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin_user boolean := false;
BEGIN
  -- Check in public.profiles first
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'
  ) INTO is_admin_user;
  
  -- If not found in public, check in api.profiles
  IF NOT is_admin_user THEN
    SELECT EXISTS(
      SELECT 1 FROM api.profiles 
      WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'
    ) INTO is_admin_user;
  END IF;
  
  RETURN COALESCE(is_admin_user, false);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- 2. Create or replace is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin_user boolean := false;
BEGIN
  -- Check in public.profiles first
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'
  ) INTO is_admin_user;
  
  -- If not found in public, check in api.profiles
  IF NOT is_admin_user THEN
    SELECT EXISTS(
      SELECT 1 FROM api.profiles 
      WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'
    ) INTO is_admin_user;
  END IF;
  
  RETURN COALESCE(is_admin_user, false);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- 3. Create get_current_user_profile function
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
  
  -- Try to get profile from public.profiles first
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role::text,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = current_user_id;
  
  -- If no profile found in public, try api.profiles
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.role::text,
      p.created_at,
      p.updated_at
    FROM api.profiles p
    WHERE p.id = current_user_id;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_admin_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;

-- ============================================================================
-- PART 2: FIX RLS POLICIES FOR VIRTUAL CARDS
-- ============================================================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admin full access to virtual_cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Users can view active virtual_cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Admin full access virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Public view active virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Admins have full access to virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Public can view active virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Admins can manage all virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Everyone can view active virtual cards" ON public.virtual_cards;

-- Create comprehensive virtual_cards policies
CREATE POLICY "Admin full access to virtual_cards" ON public.virtual_cards
  FOR ALL TO authenticated
  USING (public.check_admin_access());

CREATE POLICY "Users can view active virtual_cards" ON public.virtual_cards
  FOR SELECT TO authenticated
  USING (is_active = true OR public.check_admin_access());

-- ============================================================================
-- PART 3: FIX RLS POLICIES FOR MERCHANTS
-- ============================================================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admin full access to merchants" ON public.merchants;
DROP POLICY IF EXISTS "Users can view merchants" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can manage their own data" ON public.merchants;

-- Create comprehensive merchants policies
CREATE POLICY "Admin full access to merchants" ON public.merchants
  FOR ALL TO authenticated
  USING (public.check_admin_access());

CREATE POLICY "Merchants can view their own data" ON public.merchants
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.check_admin_access());

CREATE POLICY "Merchants can update their own data" ON public.merchants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.check_admin_access())
  WITH CHECK (auth.uid() = user_id OR public.check_admin_access());

-- ============================================================================
-- PART 4: FIX RLS POLICIES FOR REFERRAL CAMPAIGNS
-- ============================================================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.referral_campaigns;
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.referral_campaigns;

-- Create comprehensive referral_campaigns policies
CREATE POLICY "Anyone can view active campaigns" ON public.referral_campaigns
  FOR SELECT TO authenticated
  USING (is_active = true OR public.check_admin_access());

CREATE POLICY "Admins can manage campaigns" ON public.referral_campaigns
  FOR ALL TO authenticated
  USING (public.check_admin_access());

-- ============================================================================
-- PART 5: FIX RLS POLICIES FOR USER REFERRALS
-- ============================================================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.user_referrals;

-- Create comprehensive user_referrals policies
CREATE POLICY "Users can view their own referrals" ON public.user_referrals
  FOR SELECT TO authenticated
  USING (
    auth.uid() = referrer_id 
    OR auth.uid() = referred_user_id
    OR public.check_admin_access()
  );

CREATE POLICY "Users can create referrals" ON public.user_referrals
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = referrer_id
    OR public.check_admin_access()
  );

CREATE POLICY "Users can update their own referrals" ON public.user_referrals
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = referrer_id
    OR public.check_admin_access()
  )
  WITH CHECK (
    auth.uid() = referrer_id
    OR public.check_admin_access()
  );

CREATE POLICY "Admins can manage all referrals" ON public.user_referrals
  FOR ALL TO authenticated
  USING (public.check_admin_access());

-- ============================================================================
-- PART 6: ENSURE ADMIN PROFILE EXISTS
-- ============================================================================

-- Create admin profile if it doesn't exist
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  auth.users.id,
  auth.users.email,
  COALESCE(auth.users.raw_user_meta_data->>'full_name', 'Admin User'),
  'admin'::app_role
FROM auth.users
WHERE auth.users.email = 'realassetcoin@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE email = 'realassetcoin@gmail.com'
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin'::app_role,
  updated_at = now();

-- Also ensure it exists in api.profiles if that schema exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'api') THEN
    INSERT INTO api.profiles (id, email, full_name, role)
    SELECT 
      auth.users.id,
      auth.users.email,
      COALESCE(auth.users.raw_user_meta_data->>'full_name', 'Admin User'),
      'admin'::app_role
    FROM auth.users
    WHERE auth.users.email = 'realassetcoin@gmail.com'
    AND NOT EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE email = 'realassetcoin@gmail.com'
    )
    ON CONFLICT (email) DO UPDATE SET
      role = 'admin'::app_role,
      updated_at = now();
  END IF;
END $$;

-- ============================================================================
-- PART 7: GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant permissions for virtual_cards
GRANT SELECT, INSERT, UPDATE, DELETE ON public.virtual_cards TO authenticated;
GRANT ALL ON public.virtual_cards TO service_role;

-- Grant permissions for merchants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchants TO authenticated;
GRANT ALL ON public.merchants TO service_role;

-- Grant permissions for referral_campaigns
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_campaigns TO authenticated;
GRANT ALL ON public.referral_campaigns TO service_role;

-- Grant permissions for user_referrals
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_referrals TO authenticated;
GRANT ALL ON public.user_referrals TO service_role;

-- Grant permissions for profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ============================================================================
-- PART 8: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_virtual_cards_active ON public.virtual_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON public.merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON public.merchants(status);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_active ON public.referral_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON public.user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================================================
-- PART 9: VERIFICATION QUERIES
-- ============================================================================

-- Test the functions
SELECT 'FUNCTION TESTS' as test_type, '===================' as details
UNION ALL
SELECT 'check_admin_access()' as test_type, 
       CASE 
           WHEN public.check_admin_access() THEN 'Returns TRUE (user is admin)'
           ELSE 'Returns FALSE (user is not admin)'
       END as details
UNION ALL
SELECT 'is_admin()' as test_type, 
       CASE 
           WHEN public.is_admin() THEN 'Returns TRUE (user is admin)'
           ELSE 'Returns FALSE (user is not admin)'
       END as details;

-- Check if admin profile exists
SELECT 'ADMIN PROFILE CHECK' as test_type, '===================' as details
UNION ALL
SELECT 'realassetcoin@gmail.com profile' as test_type,
       CASE 
           WHEN EXISTS(SELECT 1 FROM public.profiles WHERE email = 'realassetcoin@gmail.com' AND role = 'admin') 
           THEN 'EXISTS in public.profiles'
           ELSE 'MISSING from public.profiles'
       END as details;

-- Check table access
SELECT 'TABLE ACCESS CHECK' as test_type, '===================' as details
UNION ALL
SELECT 'virtual_cards count' as test_type, COUNT(*)::text as details FROM public.virtual_cards
UNION ALL
SELECT 'merchants count' as test_type, COUNT(*)::text as details FROM public.merchants
UNION ALL
SELECT 'referral_campaigns count' as test_type, COUNT(*)::text as details FROM public.referral_campaigns
UNION ALL
SELECT 'user_referrals count' as test_type, COUNT(*)::text as details FROM public.user_referrals;

-- Add helpful comments
COMMENT ON FUNCTION public.check_admin_access(uuid) IS 'Checks if user has admin role in either public or api profiles schema';
COMMENT ON FUNCTION public.is_admin(uuid) IS 'Checks if user has admin role in either public or api profiles schema';
COMMENT ON FUNCTION public.get_current_user_profile() IS 'Returns current user profile from public or api profiles schema';