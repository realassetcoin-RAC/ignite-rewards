-- REVISED Safe Database Cleanup Script for RAC Rewards
-- This script performs MINIMAL cleanup operations that won't break functionality
-- CRITICAL: DAO functionality is actively used - do not remove DAO tables or functions!

-- ==============================================
-- 1. CLEAN UP TEST DATA ENTRIES ONLY
-- ==============================================

-- Remove test data entries (safe operation - keeps all functionality intact)
DELETE FROM public.dao_votes WHERE id::text LIKE 'test_%';
DELETE FROM public.dao_proposals WHERE id::text LIKE 'test_%';
DELETE FROM public.dao_members WHERE id::text LIKE 'test_%';
DELETE FROM public.dao_organizations WHERE id::text LIKE 'test_%';
DELETE FROM public.loyalty_transactions WHERE id::text LIKE 'test_%';
DELETE FROM public.merchants WHERE id::text LIKE 'test_%';
DELETE FROM public.marketplace_listings WHERE id::text LIKE 'test_%';

-- ==============================================
-- 2. ADD PERFORMANCE INDEXES
-- ==============================================

-- Add missing indexes for better performance (safe operation)
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active 
ON public.merchant_subscription_plans (is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_referrals_status 
ON public.user_referrals (status);

CREATE INDEX IF NOT EXISTS idx_virtual_cards_active 
ON public.virtual_cards (is_active) WHERE is_active = true;

-- DAO performance indexes (safe to add)
CREATE INDEX IF NOT EXISTS idx_dao_organizations_active 
ON public.dao_organizations (is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_dao_proposals_status 
ON public.dao_proposals (status);

CREATE INDEX IF NOT EXISTS idx_dao_members_active 
ON public.dao_members (is_active) WHERE is_active = true;

-- ==============================================
-- 3. VACUUM AND ANALYZE
-- ==============================================

-- Optimize table performance (safe operation)
VACUUM ANALYZE public.merchant_subscription_plans;
VACUUM ANALYZE public.user_referrals;
VACUUM ANALYZE public.virtual_cards;
VACUUM ANALYZE public.merchants;
VACUUM ANALYZE public.profiles;
VACUUM ANALYZE public.dao_organizations;
VACUUM ANALYZE public.dao_members;
VACUUM ANALYZE public.dao_proposals;
VACUUM ANALYZE public.dao_votes;

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

-- Verify DAO functionality is intact
SELECT 'dao_organizations' as table_name, count(*) as total_records 
FROM public.dao_organizations
UNION ALL
SELECT 'dao_members', count(*) 
FROM public.dao_members
UNION ALL
SELECT 'dao_proposals', count(*) 
FROM public.dao_proposals
UNION ALL
SELECT 'dao_votes', count(*) 
FROM public.dao_votes;

-- Check that DAO functions still exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%dao%'
ORDER BY routine_name;
