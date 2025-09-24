-- Complete fix for subscription plans admin access
-- This addresses the missing INSERT, UPDATE, DELETE policies

-- First, let's see what policies currently exist
SELECT 'Current policies:' as info;
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'merchant_subscription_plans';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Anyone can view active valid plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can manage all plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.merchant_subscription_plans;

-- Create comprehensive policies for admin access
-- Policy 1: Anyone can view active plans (for public display)
CREATE POLICY "Anyone can view active plans" 
ON public.merchant_subscription_plans 
FOR SELECT 
TO authenticated, anon
USING (is_active = true);

-- Policy 2: Authenticated users can view all plans (for admin dashboard)
CREATE POLICY "Authenticated users can view all plans" 
ON public.merchant_subscription_plans 
FOR SELECT 
TO authenticated
USING (true);

-- Policy 3: Admins can insert new plans
CREATE POLICY "Admins can insert plans" 
ON public.merchant_subscription_plans 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy 4: Admins can update plans
CREATE POLICY "Admins can update plans" 
ON public.merchant_subscription_plans 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy 5: Admins can delete plans
CREATE POLICY "Admins can delete plans" 
ON public.merchant_subscription_plans 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Alternative: If the admin check function exists, use it instead
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_admin_access') THEN
    -- Drop the role-based policies and recreate with function
    DROP POLICY IF EXISTS "Admins can insert plans" ON public.merchant_subscription_plans;
    DROP POLICY IF EXISTS "Admins can update plans" ON public.merchant_subscription_plans;
    DROP POLICY IF EXISTS "Admins can delete plans" ON public.merchant_subscription_plans;
    
    CREATE POLICY "Admins can insert plans" 
    ON public.merchant_subscription_plans 
    FOR INSERT 
    TO authenticated
    WITH CHECK (public.check_admin_access());
    
    CREATE POLICY "Admins can update plans" 
    ON public.merchant_subscription_plans 
    FOR UPDATE 
    TO authenticated
    USING (public.check_admin_access());
    
    CREATE POLICY "Admins can delete plans" 
    ON public.merchant_subscription_plans 
    FOR DELETE 
    TO authenticated
    USING (public.check_admin_access());
  END IF;
END $$;

-- Grant explicit table permissions
GRANT ALL ON public.merchant_subscription_plans TO authenticated;
GRANT SELECT ON public.merchant_subscription_plans TO anon;

-- Verify the policies were created
SELECT 'New policies created:' as info;
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'merchant_subscription_plans'
ORDER BY cmd, policyname;

-- Test that we can select from the table
SELECT 'Test select:' as info, count(*) as plan_count FROM public.merchant_subscription_plans;

-- Show the actual plans
SELECT 'Available plans:' as info;
SELECT plan_number, name, price_monthly, price_yearly, monthly_points, monthly_transactions, is_active, popular 
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Check if the current user has admin role
SELECT 'Current user admin check:' as info;
SELECT 
  auth.uid() as user_id,
  p.role as user_role,
  CASE 
    WHEN p.role = 'admin' THEN '✅ User is admin' 
    ELSE '❌ User is not admin' 
  END as admin_status
FROM public.profiles p 
WHERE p.id = auth.uid();

SELECT '✅ Subscription plans admin access fixed!' as status;


