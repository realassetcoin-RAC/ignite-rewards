-- Diagnostic script to check the current status of Health Tab components
-- This will help identify which tables and RPCs are missing or causing warnings

-- 1. Check which tables exist in the api schema
SELECT 
  'Table Check' as check_type,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (
  SELECT unnest(ARRAY[
    'profiles', 'merchants', 'virtual_cards', 'loyalty_transactions', 
    'user_loyalty_cards', 'user_points', 'user_referrals', 'user_wallets',
    'merchant_cards', 'merchant_subscriptions', 'merchant_subscription_plans',
    'referral_campaigns', 'transaction_qr_codes', 'subscribers'
  ]) as table_name
) t
LEFT JOIN information_schema.tables it 
  ON it.table_schema = 'api' AND it.table_name = t.table_name
ORDER BY table_name;

-- 2. Check which RPC functions exist
SELECT 
  'RPC Check' as check_type,
  routine_name,
  CASE 
    WHEN routine_name IS NOT NULL THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (
  SELECT unnest(ARRAY['is_admin', 'check_admin_access']) as routine_name
) r
LEFT JOIN information_schema.routines ir 
  ON ir.routine_schema = 'api' AND ir.routine_name = r.routine_name
ORDER BY routine_name;

-- 3. Test table accessibility (this will show which ones cause warnings)
DO $$
DECLARE
  table_name TEXT;
  error_message TEXT;
BEGIN
  RAISE NOTICE '=== TABLE ACCESSIBILITY TEST ===';
  
  FOR table_name IN SELECT unnest(ARRAY[
    'profiles', 'merchants', 'virtual_cards', 'loyalty_transactions', 
    'user_loyalty_cards', 'user_points', 'user_referrals', 'user_wallets',
    'merchant_cards', 'merchant_subscriptions', 'merchant_subscription_plans',
    'referral_campaigns', 'transaction_qr_codes', 'subscribers'
  ])
  LOOP
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM api.%I LIMIT 1', table_name);
      RAISE NOTICE '✅ Table %: ACCESSIBLE', table_name;
    EXCEPTION WHEN OTHERS THEN
      error_message := SQLERRM;
      IF error_message LIKE '%does not exist%' THEN
        RAISE NOTICE '⚠️  Table %: MISSING (will show as WARNING)', table_name;
      ELSIF error_message LIKE '%permission denied%' THEN
        RAISE NOTICE '⚠️  Table %: PERMISSION DENIED (will show as WARNING)', table_name;
      ELSE
        RAISE NOTICE '❌ Table %: ERROR - %', table_name, error_message;
      END IF;
    END;
  END LOOP;
END $$;

-- 4. Test RPC accessibility
DO $$
DECLARE
  rpc_name TEXT;
  result_value BOOLEAN;
  error_message TEXT;
BEGIN
  RAISE NOTICE '=== RPC ACCESSIBILITY TEST ===';
  
  -- Test is_admin RPC
  BEGIN
    SELECT api.is_admin() INTO result_value;
    RAISE NOTICE '✅ RPC is_admin: ACCESSIBLE (result: %)', result_value;
  EXCEPTION WHEN OTHERS THEN
    error_message := SQLERRM;
    IF error_message LIKE '%does not exist%' THEN
      RAISE NOTICE '⚠️  RPC is_admin: MISSING (will show as WARNING)';
    ELSE
      RAISE NOTICE '❌ RPC is_admin: ERROR - %', error_message;
    END IF;
  END;
  
  -- Test check_admin_access RPC
  BEGIN
    SELECT api.check_admin_access() INTO result_value;
    RAISE NOTICE '✅ RPC check_admin_access: ACCESSIBLE (result: %)', result_value;
  EXCEPTION WHEN OTHERS THEN
    error_message := SQLERRM;
    IF error_message LIKE '%does not exist%' THEN
      RAISE NOTICE '⚠️  RPC check_admin_access: MISSING (will show as WARNING)';
    ELSE
      RAISE NOTICE '❌ RPC check_admin_access: ERROR - %', error_message;
    END IF;
  END;
END $$;

-- 5. Check current user permissions
DO $$
DECLARE
  current_user_id UUID;
  is_admin_user BOOLEAN;
BEGIN
  RAISE NOTICE '=== USER PERMISSIONS CHECK ===';
  
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE NOTICE '⚠️  No authenticated user (this is normal for SQL scripts)';
  ELSE
    RAISE NOTICE 'Current user ID: %', current_user_id;
    
    -- Check if user has admin role
    SELECT EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = current_user_id AND role = 'admin'
    ) INTO is_admin_user;
    
    RAISE NOTICE 'Is admin user: %', is_admin_user;
  END IF;
END $$;

-- 6. Summary of what needs to be fixed
SELECT 
  'SUMMARY' as section,
  'Run HEALTH_TAB_FIX.sql to resolve all warnings' as recommendation,
  'This will create missing tables and RPC functions' as action;
