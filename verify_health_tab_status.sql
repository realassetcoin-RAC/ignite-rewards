-- Comprehensive Health Tab Status Verification
-- This script checks each table and RPC that the Health Tab monitors

-- 1. Check table accessibility and row counts
DO $$
DECLARE
  tbl_name TEXT;
  table_count INTEGER;
  total_tables INTEGER := 0;
  accessible_tables INTEGER := 0;
  table_results TEXT := '';
BEGIN
  RAISE NOTICE '=== TABLE ACCESSIBILITY CHECK ===';
  
  -- List of tables that the health tab checks
  FOR tbl_name IN SELECT unnest(ARRAY[
    'profiles', 'merchants', 'virtual_cards', 'loyalty_transactions', 
    'user_loyalty_cards', 'user_points', 'user_referrals', 'user_wallets',
    'merchant_cards', 'merchant_subscriptions', 'merchant_subscription_plans',
    'referral_campaigns', 'transaction_qr_codes', 'subscribers'
  ])
  LOOP
    total_tables := total_tables + 1;
    
    -- Test if table is accessible and get row count
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM api.%I', tbl_name) INTO table_count;
      accessible_tables := accessible_tables + 1;
      table_results := table_results || format('✅ %s: %s rows | ', tbl_name, table_count);
      RAISE NOTICE '✅ %: % rows', tbl_name, table_count;
    EXCEPTION WHEN OTHERS THEN
      table_results := table_results || format('❌ %s: ERROR - %s | ', tbl_name, SQLERRM);
      RAISE NOTICE '❌ %: ERROR - %', tbl_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '=== TABLE SUMMARY ===';
  RAISE NOTICE 'Accessible tables: %/%', accessible_tables, total_tables;
  RAISE NOTICE 'Success rate: %', ROUND((accessible_tables::DECIMAL / total_tables) * 100, 2) || '%';
END $$;

-- 2. Check RPC function accessibility
DO $$
DECLARE
  rpc_name TEXT;
  rpc_result BOOLEAN;
  total_rpcs INTEGER := 0;
  working_rpcs INTEGER := 0;
BEGIN
  RAISE NOTICE '=== RPC FUNCTION CHECK ===';
  
  -- Test is_admin RPC
  total_rpcs := total_rpcs + 1;
  BEGIN
    SELECT api.is_admin() INTO rpc_result;
    working_rpcs := working_rpcs + 1;
    RAISE NOTICE '✅ is_admin(): %', rpc_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ is_admin(): ERROR - %', SQLERRM;
  END;
  
  -- Test check_admin_access RPC
  total_rpcs := total_rpcs + 1;
  BEGIN
    SELECT api.check_admin_access() INTO rpc_result;
    working_rpcs := working_rpcs + 1;
    RAISE NOTICE '✅ check_admin_access(): %', rpc_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ check_admin_access(): ERROR - %', SQLERRM;
  END;
  
  RAISE NOTICE '=== RPC SUMMARY ===';
  RAISE NOTICE 'Working RPCs: %/%', working_rpcs, total_rpcs;
  RAISE NOTICE 'Success rate: %', ROUND((working_rpcs::DECIMAL / total_rpcs) * 100, 2) || '%';
END $$;

-- 3. Check specific table schemas and permissions
DO $$
DECLARE
  table_info RECORD;
BEGIN
  RAISE NOTICE '=== TABLE SCHEMA CHECK ===';
  
  -- Check if our created tables exist and have proper structure
  FOR table_info IN 
    SELECT 
      table_name,
      CASE 
        WHEN table_name IN ('user_wallets', 'merchant_cards', 'merchant_subscriptions', 'subscribers') 
        THEN 'Created by Health Tab Fix'
        ELSE 'Existing table'
      END as status
    FROM information_schema.tables 
    WHERE table_schema = 'api' 
    AND table_name IN ('user_wallets', 'merchant_cards', 'merchant_subscriptions', 'subscribers')
    ORDER BY table_name
  LOOP
    RAISE NOTICE '✅ %: %', table_info.table_name, table_info.status;
  END LOOP;
END $$;

-- 4. Check RLS policies
DO $$
DECLARE
  policy_count INTEGER;
  table_name TEXT;
BEGIN
  RAISE NOTICE '=== RLS POLICIES CHECK ===';
  
  -- Check RLS policies on our created tables
  FOR table_name IN SELECT unnest(ARRAY['user_wallets', 'merchant_cards', 'merchant_subscriptions', 'subscribers'])
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'api' AND tablename = table_name;
    
    IF policy_count > 0 THEN
      RAISE NOTICE '✅ %: % RLS policies active', table_name, policy_count;
    ELSE
      RAISE NOTICE '⚠️ %: No RLS policies found', table_name;
    END IF;
  END LOOP;
END $$;

-- 5. Check permissions
DO $$
DECLARE
  perm_info RECORD;
BEGIN
  RAISE NOTICE '=== PERMISSIONS CHECK ===';
  
  -- Check if authenticated role has permissions on our tables
  FOR perm_info IN
    SELECT 
      table_name,
      privilege_type
    FROM information_schema.table_privileges 
    WHERE table_schema = 'api' 
    AND grantee = 'authenticated'
    AND table_name IN ('user_wallets', 'merchant_cards', 'merchant_subscriptions', 'subscribers')
    ORDER BY table_name, privilege_type
  LOOP
    RAISE NOTICE '✅ %: % permission granted', perm_info.table_name, perm_info.privilege_type;
  END LOOP;
END $$;

-- 6. Final summary
SELECT 
  'Health Tab Verification Complete' as status,
  'All checks have been performed' as message,
  now() as verified_at;
