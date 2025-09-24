-- Safe Database Cleanup Script for RAC Rewards
-- This script performs safe cleanup operations that won't break functionality
-- Always backup your database before running this script!

-- ==============================================
-- 1. CLEAN UP TEST DATA ONLY
-- ==============================================

-- Remove test data entries (safe operation)
DELETE FROM public.dao_votes WHERE id::text LIKE 'test_%';
DELETE FROM public.dao_proposals WHERE id::text LIKE 'test_%';
DELETE FROM public.dao_members WHERE id::text LIKE 'test_%';
DELETE FROM public.dao_organizations WHERE id::text LIKE 'test_%';
DELETE FROM public.loyalty_transactions WHERE id::text LIKE 'test_%';
DELETE FROM public.merchants WHERE id::text LIKE 'test_%';
DELETE FROM public.marketplace_listings WHERE id::text LIKE 'test_%';

-- ==============================================
-- 2. REMOVE UNUSED TEST FUNCTIONS
-- ==============================================

-- Remove test data generation functions (safe to remove in production)
DROP FUNCTION IF EXISTS public.create_dao_test_data() CASCADE;
DROP FUNCTION IF EXISTS public.create_comprehensive_test_data() CASCADE;
DROP FUNCTION IF EXISTS public.update_test_data_with_real_users() CASCADE;

-- Keep clear_all_test_data() function as it's useful for cleanup

-- ==============================================
-- 3. OPTIMIZE PERFORMANCE
-- ==============================================

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active 
ON public.merchant_subscription_plans (is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_referrals_status 
ON public.user_referrals (status);

CREATE INDEX IF NOT EXISTS idx_virtual_cards_active 
ON public.virtual_cards (is_active) WHERE is_active = true;

-- ==============================================
-- 4. CLEAN UP UNUSED PERMISSIONS
-- ==============================================

-- Revoke unnecessary permissions on DAO tables (if not using DAO features)
REVOKE ALL ON public.dao_organizations FROM authenticated;
REVOKE ALL ON public.dao_members FROM authenticated;
REVOKE ALL ON public.dao_proposals FROM authenticated;
REVOKE ALL ON public.dao_votes FROM authenticated;

-- ==============================================
-- 5. VACUUM AND ANALYZE
-- ==============================================

-- Optimize table performance
VACUUM ANALYZE public.merchant_subscription_plans;
VACUUM ANALYZE public.user_referrals;
VACUUM ANALYZE public.virtual_cards;
VACUUM ANALYZE public.merchants;
VACUUM ANALYZE public.profiles;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check table sizes after cleanup
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname IN ('public', 'api')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for any remaining test data
SELECT 'dao_votes' as table_name, count(*) as test_records 
FROM public.dao_votes WHERE id::text LIKE 'test_%'
UNION ALL
SELECT 'dao_proposals', count(*) 
FROM public.dao_proposals WHERE id::text LIKE 'test_%'
UNION ALL
SELECT 'dao_members', count(*) 
FROM public.dao_members WHERE id::text LIKE 'test_%'
UNION ALL
SELECT 'dao_organizations', count(*) 
FROM public.dao_organizations WHERE id::text LIKE 'test_%'
UNION ALL
SELECT 'loyalty_transactions', count(*) 
FROM public.loyalty_transactions WHERE id::text LIKE 'test_%'
UNION ALL
SELECT 'merchants', count(*) 
FROM public.merchants WHERE id::text LIKE 'test_%'
UNION ALL
SELECT 'marketplace_listings', count(*) 
FROM public.marketplace_listings WHERE id::text LIKE 'test_%';
