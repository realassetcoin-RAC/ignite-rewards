-- Comprehensive Health Tab Diagnostic
-- This script will identify any remaining errors and warnings

-- 1. Check all tables that the Health Tab monitors
DO $$
DECLARE
  tbl_name TEXT;
  table_count INTEGER;
  error_count INTEGER := 0;
  warning_count INTEGER := 0;
  success_count INTEGER := 0;
  total_tables INTEGER := 0;
BEGIN
  RAISE NOTICE '=== COMPREHENSIVE TABLE DIAGNOSTIC ===';
  
  -- List of all tables that the health tab checks
  FOR tbl_name IN SELECT unnest(ARRAY[
    'profiles', 'merchants', 'virtual_cards', 'loyalty_transactions', 
    'user_loyalty_cards', 'user_points', 'user_referrals', 'user_wallets',
    'merchant_cards', 'merchant_subscriptions', 'merchant_subscription_plans',
    'referral_campaigns', 'transaction_qr_codes', 'subscribers'
  ])
  LOOP
    total_tables := total_tables + 1;
    
    -- Test table accessibility with detailed error reporting
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM api.%I', tbl_name) INTO table_count;
      success_count := success_count + 1;
      RAISE NOTICE '✅ %: SUCCESS - % rows', tbl_name, table_count;
    EXCEPTION 
      WHEN insufficient_privilege THEN
        error_count := error_count + 1;
        RAISE NOTICE '❌ %: PERMISSION ERROR - insufficient_privilege', tbl_name;
      WHEN undefined_table THEN
        error_count := error_count + 1;
        RAISE NOTICE '❌ %: TABLE NOT FOUND - undefined_table', tbl_name;
      WHEN OTHERS THEN
        warning_count := warning_count + 1;
        RAISE NOTICE '⚠️ %: WARNING - %', tbl_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '=== TABLE DIAGNOSTIC SUMMARY ===';
  RAISE NOTICE 'Total tables: %', total_tables;
  RAISE NOTICE '✅ Success: %', success_count;
  RAISE NOTICE '❌ Errors: %', error_count;
  RAISE NOTICE '⚠️ Warnings: %', warning_count;
  RAISE NOTICE 'Success rate: %', ROUND((success_count::DECIMAL / total_tables) * 100, 2) || '%';
END $$;

-- 2. Check RPC functions with detailed error reporting
DO $$
DECLARE
  rpc_name TEXT;
  rpc_result BOOLEAN;
  rpc_error_count INTEGER := 0;
  rpc_success_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== RPC FUNCTION DIAGNOSTIC ===';
  
  -- Test is_admin RPC
  BEGIN
    SELECT api.is_admin() INTO rpc_result;
    rpc_success_count := rpc_success_count + 1;
    RAISE NOTICE '✅ is_admin(): SUCCESS - %', rpc_result;
  EXCEPTION 
    WHEN undefined_function THEN
      rpc_error_count := rpc_error_count + 1;
      RAISE NOTICE '❌ is_admin(): FUNCTION NOT FOUND - undefined_function';
    WHEN insufficient_privilege THEN
      rpc_error_count := rpc_error_count + 1;
      RAISE NOTICE '❌ is_admin(): PERMISSION ERROR - insufficient_privilege';
    WHEN OTHERS THEN
      rpc_error_count := rpc_error_count + 1;
      RAISE NOTICE '❌ is_admin(): ERROR - %', SQLERRM;
  END;
  
  -- Test check_admin_access RPC
  BEGIN
    SELECT api.check_admin_access() INTO rpc_result;
    rpc_success_count := rpc_success_count + 1;
    RAISE NOTICE '✅ check_admin_access(): SUCCESS - %', rpc_result;
  EXCEPTION 
    WHEN undefined_function THEN
      rpc_error_count := rpc_error_count + 1;
      RAISE NOTICE '❌ is_admin(): FUNCTION NOT FOUND - undefined_function';
    WHEN insufficient_privilege THEN
      rpc_error_count := rpc_error_count + 1;
      RAISE NOTICE '❌ check_admin_access(): PERMISSION ERROR - insufficient_privilege';
    WHEN OTHERS THEN
      rpc_error_count := rpc_error_count + 1;
      RAISE NOTICE '❌ check_admin_access(): ERROR - %', SQLERRM;
  END;
  
  RAISE NOTICE '=== RPC DIAGNOSTIC SUMMARY ===';
  RAISE NOTICE '✅ RPC Success: %', rpc_success_count;
  RAISE NOTICE '❌ RPC Errors: %', rpc_error_count;
END $$;

-- 3. Check for specific permission issues
DO $$
DECLARE
  perm_issue_count INTEGER := 0;
  table_name TEXT;
BEGIN
  RAISE NOTICE '=== PERMISSION DIAGNOSTIC ===';
  
  -- Check if we can perform different operations on key tables
  FOR table_name IN SELECT unnest(ARRAY['profiles', 'merchants', 'user_referrals', 'user_wallets'])
  LOOP
    -- Test SELECT permission
    BEGIN
      EXECUTE format('SELECT 1 FROM api.%I LIMIT 1', table_name);
      RAISE NOTICE '✅ %: SELECT permission OK', table_name;
    EXCEPTION WHEN OTHERS THEN
      perm_issue_count := perm_issue_count + 1;
      RAISE NOTICE '❌ %: SELECT permission issue - %', table_name, SQLERRM;
    END;
    
    -- Test INSERT permission (for tables we should be able to insert into)
    IF table_name IN ('user_wallets', 'user_referrals') THEN
      BEGIN
        EXECUTE format('INSERT INTO api.%I (id) VALUES (gen_random_uuid())', table_name);
        EXECUTE format('DELETE FROM api.%I WHERE id NOT IN (SELECT id FROM api.%I LIMIT 1)', table_name, table_name);
        RAISE NOTICE '✅ %: INSERT permission OK', table_name;
      EXCEPTION WHEN OTHERS THEN
        perm_issue_count := perm_issue_count + 1;
        RAISE NOTICE '❌ %: INSERT permission issue - %', table_name, SQLERRM;
      END;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== PERMISSION SUMMARY ===';
  RAISE NOTICE 'Permission issues found: %', perm_issue_count;
END $$;

-- 4. Check for RLS policy issues
DO $$
DECLARE
  policy_count INTEGER;
  table_name TEXT;
  rls_issue_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== RLS POLICY DIAGNOSTIC ===';
  
  -- Check RLS policies on key tables
  FOR table_name IN SELECT unnest(ARRAY['profiles', 'merchants', 'user_referrals', 'user_wallets', 'merchant_cards'])
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'api' AND tablename = table_name;
    
    IF policy_count > 0 THEN
      RAISE NOTICE '✅ %: % RLS policies active', table_name, policy_count;
    ELSE
      rls_issue_count := rls_issue_count + 1;
      RAISE NOTICE '⚠️ %: No RLS policies found', table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== RLS SUMMARY ===';
  RAISE NOTICE 'Tables without RLS policies: %', rls_issue_count;
END $$;

-- 5. Check for missing indexes or performance issues
DO $$
DECLARE
  index_count INTEGER;
  table_name TEXT;
  performance_issue_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== PERFORMANCE DIAGNOSTIC ===';
  
  -- Check for indexes on key tables
  FOR table_name IN SELECT unnest(ARRAY['profiles', 'merchants', 'user_referrals', 'user_wallets'])
  LOOP
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'api' AND tablename = table_name;
    
    IF index_count > 0 THEN
      RAISE NOTICE '✅ %: % indexes found', table_name, index_count;
    ELSE
      performance_issue_count := performance_issue_count + 1;
      RAISE NOTICE '⚠️ %: No indexes found (may impact performance)', table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== PERFORMANCE SUMMARY ===';
  RAISE NOTICE 'Tables without indexes: %', performance_issue_count;
END $$;

-- 6. Final comprehensive summary
SELECT 
  'Health Tab Diagnostic Complete' as status,
  'Check the NOTICE messages above for detailed results' as message,
  now() as diagnostic_time;
