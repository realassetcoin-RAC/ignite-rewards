-- Comprehensive Fix for Popular Plan Checkbox Issue
-- This script addresses all potential causes of the popular plan not persisting

-- =============================================================================
-- 1. CHECK CURRENT TABLE STRUCTURE
-- =============================================================================

-- Check if the popular column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'merchant_subscription_plans'
  AND column_name = 'popular';

-- Check all columns in the table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'merchant_subscription_plans'
ORDER BY ordinal_position;

-- =============================================================================
-- 2. ENSURE TABLE EXISTS WITH ALL REQUIRED COLUMNS
-- =============================================================================

-- Create the table if it doesn't exist with all required columns
CREATE TABLE IF NOT EXISTS public.merchant_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  monthly_transactions INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  popular BOOLEAN DEFAULT false,
  plan_number INTEGER,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================================================
-- 3. ADD MISSING COLUMNS IF THEY DON'T EXIST
-- =============================================================================

-- Add missing columns one by one
DO $$ 
BEGIN
    -- Add popular column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'popular'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN popular BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added popular column';
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'price_yearly'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN price_yearly DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added price_yearly column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'monthly_points'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN monthly_points INTEGER DEFAULT 0;
        RAISE NOTICE 'Added monthly_points column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'monthly_transactions'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN monthly_transactions INTEGER DEFAULT 0;
        RAISE NOTICE 'Added monthly_transactions column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'valid_from'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN valid_from TIMESTAMP WITH TIME ZONE DEFAULT now();
        RAISE NOTICE 'Added valid_from column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'valid_until'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN valid_until TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added valid_until column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'plan_number'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN plan_number INTEGER;
        RAISE NOTICE 'Added plan_number column';
    END IF;
END $$;

-- =============================================================================
-- 4. UPDATE EXISTING RECORDS
-- =============================================================================

-- Set popular to false for all existing records that have NULL values
UPDATE public.merchant_subscription_plans 
SET popular = false 
WHERE popular IS NULL;

-- =============================================================================
-- 5. FIX RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
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

-- Create comprehensive RLS policies
-- Policy 1: Allow everyone to read subscription plans
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

-- =============================================================================
-- 6. GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_subscription_plans TO authenticated;
GRANT SELECT ON public.merchant_subscription_plans TO anon;
GRANT ALL ON public.merchant_subscription_plans TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================================================
-- 7. CREATE UPDATE TRIGGER
-- =============================================================================

-- Create or replace the update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS update_merchant_subscription_plans_updated_at ON public.merchant_subscription_plans;
CREATE TRIGGER update_merchant_subscription_plans_updated_at
    BEFORE UPDATE ON public.merchant_subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 8. VERIFY THE FIX
-- =============================================================================

-- Check the updated table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'merchant_subscription_plans'
ORDER BY ordinal_position;

-- Check current popular values in the table
SELECT 
  id,
  name,
  popular,
  is_active,
  plan_number
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- =============================================================================
-- 9. TEST UPDATE FUNCTIONALITY
-- =============================================================================

-- Test updating a plan to be popular (uncomment and modify as needed)
-- UPDATE public.merchant_subscription_plans 
-- SET popular = true 
-- WHERE name = 'StartUp' 
-- LIMIT 1;

-- Verify the update worked
-- SELECT id, name, popular FROM public.merchant_subscription_plans WHERE name = 'StartUp';
