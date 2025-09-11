-- Aggressive fix for loyalty_transactions infinite recursion
-- This script will completely reset all RLS policies and recreate them from scratch

-- Step 1: Completely disable RLS temporarily
ALTER TABLE public.loyalty_transactions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (comprehensive cleanup)
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    -- Get all policy names for loyalty_transactions
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'loyalty_transactions' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.loyalty_transactions', policy_name);
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies
-- These policies are designed to avoid any potential recursion

-- Basic policy for SELECT - users can see their own transactions
CREATE POLICY "simple_select_policy" ON public.loyalty_transactions
    FOR SELECT 
    USING (auth.uid()::text = user_id::text);

-- Basic policy for INSERT - authenticated users can insert
CREATE POLICY "simple_insert_policy" ON public.loyalty_transactions
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Basic policy for UPDATE - users can update their own transactions
CREATE POLICY "simple_update_policy" ON public.loyalty_transactions
    FOR UPDATE 
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

-- Basic policy for DELETE - users can delete their own transactions
CREATE POLICY "simple_delete_policy" ON public.loyalty_transactions
    FOR DELETE 
    USING (auth.uid()::text = user_id::text);

-- Step 5: Test the table access
-- This will verify that the policies work without recursion
DO $$
BEGIN
    -- Try to access the table to ensure no recursion
    PERFORM 1 FROM public.loyalty_transactions LIMIT 1;
    RAISE NOTICE 'Table access test successful - no infinite recursion detected';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Table access test failed: %', SQLERRM;
END $$;

-- Verify the policies were created
SELECT 
    policyname, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'loyalty_transactions' 
AND schemaname = 'public';

SELECT 'loyalty_transactions RLS policies completely reset and recreated' as status;
