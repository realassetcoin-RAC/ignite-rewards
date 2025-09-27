-- Verification script to check that all missing features were created successfully
-- Run this after complete_missing_features.sql to verify everything is working

-- ============================================================================
-- PART 1: CHECK NEW TABLES WERE CREATED
-- ============================================================================

SELECT 
  'Payment Gateway Tables' as feature_category,
  COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('nft_upgrade_payments', 'subscription_payments')

UNION ALL

SELECT 
  'SMS Service Tables' as feature_category,
  COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sms_otp_codes')

UNION ALL

SELECT 
  'Security Tables' as feature_category,
  COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('security_audit_logs', 'rate_limits')

UNION ALL

SELECT 
  'Blockchain Tables' as feature_category,
  COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('smart_contracts', 'blockchain_transactions')

UNION ALL

SELECT 
  'Email Service Tables' as feature_category,
  COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('email_providers');

-- ============================================================================
-- PART 2: CHECK NEW FUNCTIONS WERE CREATED
-- ============================================================================

SELECT 
  'Security Functions' as function_category,
  COUNT(*) as functions_created
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('encrypt_seed_phrase', 'decrypt_seed_phrase', 'check_rate_limit', 'cleanup_expired_data')

UNION ALL

SELECT 
  'Admin Functions' as function_category,
  COUNT(*) as functions_created
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('check_admin_access', 'get_current_user_profile', 'handle_new_user', 'update_updated_at_column');

-- ============================================================================
-- PART 3: CHECK RLS POLICIES WERE CREATED
-- ============================================================================

SELECT 
  'RLS Policies' as policy_category,
  COUNT(*) as policies_created
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
  'nft_upgrade_payments', 
  'subscription_payments', 
  'sms_otp_codes', 
  'security_audit_logs', 
  'rate_limits', 
  'smart_contracts', 
  'blockchain_transactions', 
  'email_providers'
);

-- ============================================================================
-- PART 4: CHECK INDEXES WERE CREATED
-- ============================================================================

SELECT 
  'Performance Indexes' as index_category,
  COUNT(*) as indexes_created
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
AND tablename IN (
  'nft_upgrade_payments', 
  'subscription_payments', 
  'sms_otp_codes', 
  'security_audit_logs', 
  'rate_limits', 
  'blockchain_transactions'
);

-- ============================================================================
-- PART 5: CHECK DEFAULT DATA WAS INSERTED
-- ============================================================================

SELECT 
  'Smart Contracts' as data_category,
  COUNT(*) as records_inserted
FROM public.smart_contracts

UNION ALL

SELECT 
  'Email Providers' as data_category,
  COUNT(*) as records_inserted
FROM public.email_providers;

-- ============================================================================
-- PART 6: CHECK ENHANCED PROFILES TABLE
-- ============================================================================

SELECT 
  'Enhanced Profiles' as enhancement_category,
  COUNT(*) as columns_added
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name IN ('seed_phrase_encrypted', 'seed_phrase_salt', 'encryption_version');

-- ============================================================================
-- PART 7: CHECK SYSTEM STATUS VIEW
-- ============================================================================

SELECT 
  'System Status View' as view_category,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'system_status'
    ) THEN 1 
    ELSE 0 
  END as view_created;

-- ============================================================================
-- PART 8: OVERALL STATUS SUMMARY
-- ============================================================================

SELECT 
  '🎉 IMPLEMENTATION STATUS' as summary,
  CASE 
    WHEN (
      -- Check if all major tables exist
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('nft_upgrade_payments', 'subscription_payments', 'sms_otp_codes', 'security_audit_logs', 'rate_limits', 'smart_contracts', 'blockchain_transactions', 'email_providers')) = 8
      AND
      -- Check if key functions exist
      (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('check_admin_access', 'encrypt_seed_phrase', 'check_rate_limit', 'cleanup_expired_data')) >= 4
      AND
      -- Check if system status view exists
      (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'system_status') = 1
    ) THEN '✅ COMPLETE - All missing features implemented successfully!'
    ELSE '⚠️ PARTIAL - Some features may be missing. Check individual results above.'
  END as status;
