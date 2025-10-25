-- Check Database Triggers and Constraints
-- This script will check for any triggers or constraints that might be affecting price_monthly updates

-- =============================================================================
-- 1. CHECK FOR TRIGGERS ON MERCHANT_SUBSCRIPTION_PLANS TABLE
-- =============================================================================

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement,
  action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'merchant_subscription_plans'
  AND event_object_schema = 'public';

-- =============================================================================
-- 2. CHECK FOR CONSTRAINTS ON PRICE_MONTHLY COLUMN
-- =============================================================================

SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'merchant_subscription_plans'
  AND tc.table_schema = 'public'
  AND (kcu.column_name = 'price_monthly' OR tc.constraint_type = 'CHECK');

-- =============================================================================
-- 3. CHECK COLUMN DEFAULTS AND NULLABLE STATUS
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
  AND column_name IN ('price', 'price_monthly', 'price_yearly')
ORDER BY ordinal_position;

-- =============================================================================
-- 4. CHECK FOR ANY FUNCTIONS THAT MIGHT BE AFFECTING UPDATES
-- =============================================================================

SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%merchant_subscription_plans%' 
    OR routine_definition ILIKE '%price_monthly%'
  );

-- =============================================================================
-- 5. TEST DIRECT COLUMN UPDATE
-- =============================================================================

-- Test updating price_monthly directly
UPDATE public.merchant_subscription_plans 
SET price_monthly = 30
WHERE plan_name = 'StartUp';

-- Check if the update worked
SELECT 
  plan_name,
  price,
  price_monthly,
  price_yearly,
  updated_at
FROM public.merchant_subscription_plans 
WHERE plan_name = 'StartUp';

-- =============================================================================
-- 6. CHECK FOR ANY VIEWS THAT MIGHT BE INTERFERING
-- =============================================================================

SELECT 
  table_name,
  table_type,
  view_definition
FROM information_schema.tables t
LEFT JOIN information_schema.views v ON t.table_name = v.table_name
WHERE t.table_schema = 'public'
  AND (
    t.table_name ILIKE '%merchant%subscription%' 
    OR v.view_definition ILIKE '%merchant_subscription_plans%'
  );

-- =============================================================================
-- 7. CHECK FOR ANY RLS POLICIES THAT MIGHT BE BLOCKING UPDATES
-- =============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'merchant_subscription_plans'
  AND cmd IN ('UPDATE', 'ALL');

-- =============================================================================
-- 8. TEST UPDATE WITH DIFFERENT VALUES
-- =============================================================================

-- Test with a very different value to see if it's a range issue
UPDATE public.merchant_subscription_plans 
SET price_monthly = 999.99
WHERE plan_name = 'StartUp';

-- Check the result
SELECT 
  plan_name,
  price,
  price_monthly,
  updated_at
FROM public.merchant_subscription_plans 
WHERE plan_name = 'StartUp';

-- =============================================================================
-- 9. SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 DATABASE TRIGGERS AND CONSTRAINTS CHECK COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 What was checked:';
  RAISE NOTICE '   - Triggers on merchant_subscription_plans table';
  RAISE NOTICE '   - Constraints on price_monthly column';
  RAISE NOTICE '   - Column defaults and nullable status';
  RAISE NOTICE '   - Functions that might affect updates';
  RAISE NOTICE '   - Direct column update test';
  RAISE NOTICE '   - Views that might interfere';
  RAISE NOTICE '   - RLS policies for updates';
  RAISE NOTICE '   - Update test with different values';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 This will help identify why price_monthly updates are not working';
  RAISE NOTICE '';
END $$;
