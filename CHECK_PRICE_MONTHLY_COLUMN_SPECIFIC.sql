-- Check Price Monthly Column Specific Issues
-- This script will specifically investigate why price_monthly column updates are not working

-- =============================================================================
-- 1. CHECK COLUMN DEFINITION AND CONSTRAINTS
-- =============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  numeric_scale
FROM information_schema.columns 
WHERE table_name = 'merchant_subscription_plans'
  AND table_schema = 'public'
  AND column_name = 'price_monthly';

-- =============================================================================
-- 2. CHECK FOR CHECK CONSTRAINTS ON PRICE_MONTHLY
-- =============================================================================

SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'merchant_subscription_plans'
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK';

-- =============================================================================
-- 3. CHECK FOR ANY TRIGGERS THAT MIGHT AFFECT PRICE_MONTHLY
-- =============================================================================

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'merchant_subscription_plans'
  AND event_object_schema = 'public'
  AND (
    action_statement ILIKE '%price_monthly%' 
    OR action_statement ILIKE '%price%'
  );

-- =============================================================================
-- 4. TEST DIFFERENT UPDATE APPROACHES
-- =============================================================================

-- Test 1: Update with explicit column specification
UPDATE public.merchant_subscription_plans 
SET price_monthly = 35.75
WHERE plan_name = 'StartUp';

-- Check result
SELECT 
  plan_name,
  price,
  price_monthly,
  updated_at
FROM public.merchant_subscription_plans 
WHERE plan_name = 'StartUp';

-- Test 2: Update with NULL first, then value
UPDATE public.merchant_subscription_plans 
SET price_monthly = NULL
WHERE plan_name = 'StartUp';

UPDATE public.merchant_subscription_plans 
SET price_monthly = 40.00
WHERE plan_name = 'StartUp';

-- Check result
SELECT 
  plan_name,
  price,
  price_monthly,
  updated_at
FROM public.merchant_subscription_plans 
WHERE plan_name = 'StartUp';

-- =============================================================================
-- 5. CHECK FOR ANY VIEWS OR RULES
-- =============================================================================

SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public'
  AND definition ILIKE '%merchant_subscription_plans%';

-- =============================================================================
-- 6. CHECK FOR ANY RULES ON THE TABLE
-- =============================================================================

SELECT 
  schemaname,
  tablename,
  rulename,
  definition
FROM pg_rules 
WHERE schemaname = 'public'
  AND tablename = 'merchant_subscription_plans';

-- =============================================================================
-- 7. CHECK FOR ANY FUNCTIONS THAT MIGHT BE INTERFERING
-- =============================================================================

SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%merchant_subscription_plans%' 
    AND routine_definition ILIKE '%price_monthly%'
  );

-- =============================================================================
-- 8. TRY TO DROP AND RECREATE THE COLUMN
-- =============================================================================

-- First, check if we can alter the column
ALTER TABLE public.merchant_subscription_plans 
ALTER COLUMN price_monthly SET DEFAULT 0;

-- Test update after setting default
UPDATE public.merchant_subscription_plans 
SET price_monthly = 50.00
WHERE plan_name = 'StartUp';

-- Check result
SELECT 
  plan_name,
  price,
  price_monthly,
  updated_at
FROM public.merchant_subscription_plans 
WHERE plan_name = 'StartUp';

-- =============================================================================
-- 9. CHECK FOR ANY FOREIGN KEY CONSTRAINTS
-- =============================================================================

SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'merchant_subscription_plans'
  AND tc.table_schema = 'public'
  AND kcu.column_name = 'price_monthly';

-- =============================================================================
-- 10. FINAL DIAGNOSTIC
-- =============================================================================

-- Check if the column is actually writable by trying to insert a new record
INSERT INTO public.merchant_subscription_plans (
  plan_name,
  description,
  price,
  price_monthly,
  price_yearly,
  is_active
) VALUES (
  'TEST_PLAN_' || extract(epoch from now()),
  'Test plan for price_monthly column',
  100,
  200,
  300,
  false
);

-- Check if the insert worked
SELECT 
  plan_name,
  price,
  price_monthly,
  price_yearly
FROM public.merchant_subscription_plans 
WHERE plan_name LIKE 'TEST_PLAN_%'
ORDER BY created_at DESC
LIMIT 1;

-- Clean up test record
DELETE FROM public.merchant_subscription_plans 
WHERE plan_name LIKE 'TEST_PLAN_%';

-- =============================================================================
-- 11. SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 PRICE_MONTHLY COLUMN DIAGNOSTIC COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 What was checked:';
  RAISE NOTICE '   - Column definition and constraints';
  RAISE NOTICE '   - Check constraints on price_monthly';
  RAISE NOTICE '   - Triggers affecting price_monthly';
  RAISE NOTICE '   - Different update approaches';
  RAISE NOTICE '   - Views and rules';
  RAISE NOTICE '   - Functions that might interfere';
  RAISE NOTICE '   - Column default settings';
  RAISE NOTICE '   - Foreign key constraints';
  RAISE NOTICE '   - Insert test to verify column writability';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 This will help identify the exact cause of price_monthly update issues';
  RAISE NOTICE '';
END $$;
