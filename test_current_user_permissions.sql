-- Test current user permissions and admin status
-- This helps verify if the RPC functions are working correctly

-- 1. Check current user info
SELECT 
  'Current User Info' as check_type,
  auth.uid() as user_id,
  auth.role() as user_role;

-- 2. Test admin RPC functions (using explicit function calls)
DO $$
DECLARE
  is_admin_result BOOLEAN;
  check_admin_result BOOLEAN;
BEGIN
  -- Test is_admin function
  BEGIN
    SELECT api.is_admin() INTO is_admin_result;
    RAISE NOTICE '✅ is_admin() result: %', is_admin_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ is_admin() error: %', SQLERRM;
  END;
  
  -- Test check_admin_access function
  BEGIN
    SELECT api.check_admin_access() INTO check_admin_result;
    RAISE NOTICE '✅ check_admin_access() result: %', check_admin_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ check_admin_access() error: %', SQLERRM;
  END;
END $$;

-- 3. Test table access with current user
SELECT 
  'Table Access Test' as check_type,
  (SELECT COUNT(*) FROM api.profiles WHERE id = auth.uid()) as profile_exists,
  (SELECT role FROM api.profiles WHERE id = auth.uid()) as user_role_in_profile;

-- 4. Test if we can access the tables that were created
SELECT 
  'Created Tables Access' as check_type,
  (SELECT COUNT(*) FROM api.user_wallets) as user_wallets_count,
  (SELECT COUNT(*) FROM api.merchant_cards) as merchant_cards_count,
  (SELECT COUNT(*) FROM api.merchant_subscriptions) as merchant_subscriptions_count,
  (SELECT COUNT(*) FROM api.subscribers) as subscribers_count;
