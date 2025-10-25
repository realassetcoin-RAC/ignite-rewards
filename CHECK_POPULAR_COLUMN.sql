-- Check if the popular column exists in merchant_subscription_plans table
-- and verify its current values

-- =============================================================================
-- 1. CHECK TABLE SCHEMA
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

-- =============================================================================
-- 2. CHECK CURRENT DATA
-- =============================================================================

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
-- 3. CHECK ALL COLUMNS IN THE TABLE
-- =============================================================================

-- Get all columns in the table to see the complete schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'merchant_subscription_plans'
ORDER BY ordinal_position;
