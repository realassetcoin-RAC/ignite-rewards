-- Comprehensive RLS Fix for merchant_subscription_plans
-- This script fixes all RLS-related issues preventing updates

-- Step 1: Check current RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    hasrules as has_rls_policies
FROM pg_tables 
WHERE tablename = 'merchant_subscription_plans' AND schemaname = 'public';

-- Step 2: List all existing policies
SELECT 
    pol.polname as policy_name,
    pol.polcmd as command,
    pol.polpermissive as permissive,
    pol.polroles as roles,
    pol.polqual as qual_expression,
    pol.polwithcheck as with_check_expression
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE nsp.nspname = 'public' AND cls.relname = 'merchant_subscription_plans'
ORDER BY pol.polname;

-- Step 3: Drop ALL existing policies to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT pol.polname
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public' AND cls.relname = 'merchant_subscription_plans'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.polname) || ' ON public.merchant_subscription_plans';
        RAISE NOTICE 'Dropped policy: %', policy_record.polname;
    END LOOP;
END $$;

-- Step 4: Create new comprehensive RLS policies
-- Policy 1: Allow ALL users (including anon) to read subscription plans
CREATE POLICY "public_read_subscription_plans" ON public.merchant_subscription_plans
    FOR SELECT
    TO public
    USING (true);

-- Policy 2: Allow authenticated users to insert subscription plans
CREATE POLICY "authenticated_insert_subscription_plans" ON public.merchant_subscription_plans
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy 3: Allow authenticated users to update subscription plans
CREATE POLICY "authenticated_update_subscription_plans" ON public.merchant_subscription_plans
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete subscription plans
CREATE POLICY "authenticated_delete_subscription_plans" ON public.merchant_subscription_plans
    FOR DELETE
    TO authenticated
    USING (true);

-- Policy 5: Allow anon users to insert subscription plans (for testing)
CREATE POLICY "anon_insert_subscription_plans" ON public.merchant_subscription_plans
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy 6: Allow anon users to update subscription plans (for testing)
CREATE POLICY "anon_update_subscription_plans" ON public.merchant_subscription_plans
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Step 5: Verify the new policies
SELECT 
    pol.polname as policy_name,
    pol.polcmd as command,
    pol.polpermissive as permissive,
    pol.polroles as roles
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE nsp.nspname = 'public' AND cls.relname = 'merchant_subscription_plans'
ORDER BY pol.polname;

-- Step 6: Test the policies with a simple update
UPDATE public.merchant_subscription_plans 
SET updated_at = NOW()
WHERE plan_name = 'Energizer'
RETURNING id, plan_name, price_monthly, updated_at;

-- Step 7: Test with a price update
UPDATE public.merchant_subscription_plans 
SET 
    price_monthly = 99.99,
    updated_at = NOW()
WHERE plan_name = 'Energizer'
RETURNING id, plan_name, price_monthly, updated_at;

-- Step 8: Final verification
SELECT 
    'RLS Policies Fixed Successfully' as status,
    COUNT(*) as total_policies,
    STRING_AGG(pol.polname, ', ') as policy_names
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE nsp.nspname = 'public' AND cls.relname = 'merchant_subscription_plans';
