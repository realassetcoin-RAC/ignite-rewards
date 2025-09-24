-- Database Cleanup Script for RAC Rewards
-- This script removes unnecessary tables, views, and functions
-- Run this script carefully and backup your database first!

-- ==============================================
-- 1. CLEAN UP DUPLICATE/UNNECESSARY TABLES
-- ==============================================

-- Check for tables that might be duplicates or unused
-- Note: These are commented out for safety - uncomment only after verification

-- Remove old schema tables if they exist in wrong schema
-- DROP TABLE IF EXISTS api.merchant_subscription_plans CASCADE;
-- DROP TABLE IF EXISTS api.user_referrals CASCADE;
-- DROP TABLE IF EXISTS api.virtual_cards CASCADE;
-- DROP TABLE IF EXISTS api.merchants CASCADE;
-- DROP TABLE IF EXISTS api.profiles CASCADE;

-- ==============================================
-- 2. CLEAN UP TEST DATA FUNCTIONS
-- ==============================================

-- Remove test data generation functions (keep only if needed for development)
DROP FUNCTION IF EXISTS public.create_dao_test_data() CASCADE;
DROP FUNCTION IF EXISTS public.create_comprehensive_test_data() CASCADE;
DROP FUNCTION IF EXISTS public.update_test_data_with_real_users() CASCADE;

-- Keep clear_all_test_data() function as it's useful for cleanup
-- DROP FUNCTION IF EXISTS public.clear_all_test_data() CASCADE;

-- ==============================================
-- 3. CLEAN UP UNUSED VIEWS
-- ==============================================

-- Remove any views that are no longer needed
-- (Add specific view names here if any are identified)

-- ==============================================
-- 4. CLEAN UP UNUSED INDEXES
-- ==============================================

-- Remove indexes that are no longer needed
DROP INDEX IF EXISTS public.idx_user_referrals_referrer;
DROP INDEX IF EXISTS public.idx_user_referrals_referred;
DROP INDEX IF EXISTS public.idx_virtual_cards_user;
DROP INDEX IF EXISTS public.idx_profiles_role;

-- ==============================================
-- 5. CLEAN UP UNUSED POLICIES
-- ==============================================

-- Remove old RLS policies that might be redundant
DROP POLICY IF EXISTS "Admins can view all subscription plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins can view all virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Admins can view all merchants" ON public.merchants;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- ==============================================
-- 6. CLEAN UP UNUSED FUNCTIONS
-- ==============================================

-- Remove functions that are no longer used
DROP FUNCTION IF EXISTS public.create_dao_tables() CASCADE;

-- ==============================================
-- 7. CLEAN UP TEST DATA
-- ==============================================

-- Remove test data entries (be careful with this!)
DELETE FROM public.dao_votes WHERE id::text LIKE 'test_%';
DELETE FROM public.dao_proposals WHERE id::text LIKE 'test_%';
DELETE FROM public.dao_members WHERE id::text LIKE 'test_%';
DELETE FROM public.dao_organizations WHERE id::text LIKE 'test_%';
DELETE FROM public.loyalty_transactions WHERE id::text LIKE 'test_%';
DELETE FROM public.merchants WHERE id::text LIKE 'test_%';
DELETE FROM public.marketplace_listings WHERE id::text LIKE 'test_%';

-- ==============================================
-- 8. OPTIMIZE REMAINING TABLES
-- ==============================================

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active 
ON public.merchant_subscription_plans (is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_referrals_status 
ON public.user_referrals (status);

CREATE INDEX IF NOT EXISTS idx_virtual_cards_active 
ON public.virtual_cards (is_active) WHERE is_active = true;

-- ==============================================
-- 9. CLEAN UP SCHEMA PERMISSIONS
-- ==============================================

-- Revoke unnecessary permissions
REVOKE ALL ON public.dao_organizations FROM authenticated;
REVOKE ALL ON public.dao_members FROM authenticated;
REVOKE ALL ON public.dao_proposals FROM authenticated;
REVOKE ALL ON public.dao_votes FROM authenticated;

-- ==============================================
-- 10. FINAL CLEANUP
-- ==============================================

-- Vacuum and analyze tables for better performance
VACUUM ANALYZE public.merchant_subscription_plans;
VACUUM ANALYZE public.user_referrals;
VACUUM ANALYZE public.virtual_cards;
VACUUM ANALYZE public.merchants;
VACUUM ANALYZE public.profiles;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Run these queries to verify the cleanup was successful:

-- Check remaining tables
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema IN ('public', 'api') 
ORDER BY table_schema, table_name;

-- Check remaining functions
SELECT routine_name, routine_schema 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Check remaining indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname IN ('public', 'api')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
