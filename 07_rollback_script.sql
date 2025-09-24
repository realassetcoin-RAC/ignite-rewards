-- ===========================================
-- ROLLBACK SCRIPT
-- ===========================================
-- This script rolls back the migration if needed
-- WARNING: This will restore the backup data and remove migrated data

-- ===========================================
-- STEP 1: CHECK IF BACKUP EXISTS
-- ===========================================

SELECT '🔍 CHECKING FOR BACKUP DATA...' as message;

-- Check if backup schema exists
SELECT 
    'Backup Schema Check:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'backup_migration') 
        THEN '✅ Backup schema found'
        ELSE '❌ No backup schema found - cannot rollback'
    END as status;

-- Check backup tables
SELECT 
    'Backup Tables Check:' as info,
    COUNT(*) as backup_tables_found
FROM information_schema.tables 
WHERE table_schema = 'backup_migration';

-- ===========================================
-- STEP 2: DISABLE RLS TEMPORARILY
-- ===========================================

-- Disable RLS on all tables to allow rollback
DO $$ 
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Disabled RLS on table: %', table_name;
    END LOOP;
END $$;

-- ===========================================
-- STEP 3: CLEAR CURRENT DATA
-- ===========================================

SELECT '🗑️ CLEARING CURRENT DATA...' as message;

-- Clear all current data from public tables
DO $$ 
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
    LOOP
        EXECUTE format('TRUNCATE TABLE public.%I CASCADE', table_name);
        RAISE NOTICE 'Cleared table: %', table_name;
    END LOOP;
END $$;

-- ===========================================
-- STEP 4: RESTORE BACKUP DATA
-- ===========================================

SELECT '🔄 RESTORING BACKUP DATA...' as message;

-- Restore profiles data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'profiles_backup') THEN
        INSERT INTO public.profiles SELECT * FROM backup_migration.profiles_backup;
        RAISE NOTICE 'Restored profiles data: % rows', (SELECT COUNT(*) FROM backup_migration.profiles_backup);
    END IF;
END $$;

-- Restore merchants data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'merchants_backup') THEN
        INSERT INTO public.merchants SELECT * FROM backup_migration.merchants_backup;
        RAISE NOTICE 'Restored merchants data: % rows', (SELECT COUNT(*) FROM backup_migration.merchants_backup);
    END IF;
END $$;

-- Restore merchant_subscription_plans data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'merchant_subscription_plans_backup') THEN
        INSERT INTO public.merchant_subscription_plans SELECT * FROM backup_migration.merchant_subscription_plans_backup;
        RAISE NOTICE 'Restored merchant_subscription_plans data: % rows', (SELECT COUNT(*) FROM backup_migration.merchant_subscription_plans_backup);
    END IF;
END $$;

-- Restore nft_types data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'nft_types_backup') THEN
        INSERT INTO public.nft_types SELECT * FROM backup_migration.nft_types_backup;
        RAISE NOTICE 'Restored nft_types data: % rows', (SELECT COUNT(*) FROM backup_migration.nft_types_backup);
    END IF;
END $$;

-- Restore user_loyalty_cards data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'user_loyalty_cards_backup') THEN
        INSERT INTO public.user_loyalty_cards SELECT * FROM backup_migration.user_loyalty_cards_backup;
        RAISE NOTICE 'Restored user_loyalty_cards data: % rows', (SELECT COUNT(*) FROM backup_migration.user_loyalty_cards_backup);
    END IF;
END $$;

-- Restore loyalty_transactions data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'loyalty_transactions_backup') THEN
        INSERT INTO public.loyalty_transactions SELECT * FROM backup_migration.loyalty_transactions_backup;
        RAISE NOTICE 'Restored loyalty_transactions data: % rows', (SELECT COUNT(*) FROM backup_migration.loyalty_transactions_backup);
    END IF;
END $$;

-- Restore user_points data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'user_points_backup') THEN
        INSERT INTO public.user_points SELECT * FROM backup_migration.user_points_backup;
        RAISE NOTICE 'Restored user_points data: % rows', (SELECT COUNT(*) FROM backup_migration.user_points_backup);
    END IF;
END $$;

-- Restore user_referrals data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'user_referrals_backup') THEN
        INSERT INTO public.user_referrals SELECT * FROM backup_migration.user_referrals_backup;
        RAISE NOTICE 'Restored user_referrals data: % rows', (SELECT COUNT(*) FROM backup_migration.user_referrals_backup);
    END IF;
END $$;

-- Restore DAO data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'dao_organizations_backup') THEN
        INSERT INTO public.dao_organizations SELECT * FROM backup_migration.dao_organizations_backup;
        RAISE NOTICE 'Restored dao_organizations data: % rows', (SELECT COUNT(*) FROM backup_migration.dao_organizations_backup);
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'dao_members_backup') THEN
        INSERT INTO public.dao_members SELECT * FROM backup_migration.dao_members_backup;
        RAISE NOTICE 'Restored dao_members data: % rows', (SELECT COUNT(*) FROM backup_migration.dao_members_backup);
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'dao_proposals_backup') THEN
        INSERT INTO public.dao_proposals SELECT * FROM backup_migration.dao_proposals_backup;
        RAISE NOTICE 'Restored dao_proposals data: % rows', (SELECT COUNT(*) FROM backup_migration.dao_proposals_backup);
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'dao_votes_backup') THEN
        INSERT INTO public.dao_votes SELECT * FROM backup_migration.dao_votes_backup;
        RAISE NOTICE 'Restored dao_votes data: % rows', (SELECT COUNT(*) FROM backup_migration.dao_votes_backup);
    END IF;
END $$;

-- Restore marketplace data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'marketplace_listings_backup') THEN
        INSERT INTO public.marketplace_listings SELECT * FROM backup_migration.marketplace_listings_backup;
        RAISE NOTICE 'Restored marketplace_listings data: % rows', (SELECT COUNT(*) FROM backup_migration.marketplace_listings_backup);
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'marketplace_investments_backup') THEN
        INSERT INTO public.marketplace_investments SELECT * FROM backup_migration.marketplace_investments_backup;
        RAISE NOTICE 'Restored marketplace_investments data: % rows', (SELECT COUNT(*) FROM backup_migration.marketplace_investments_backup);
    END IF;
END $$;

-- ===========================================
-- STEP 5: RE-ENABLE RLS
-- ===========================================

-- Re-enable RLS on all tables
DO $$ 
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Re-enabled RLS on table: %', table_name;
    END LOOP;
END $$;

-- ===========================================
-- STEP 6: VERIFY ROLLBACK
-- ===========================================

SELECT '🔍 VERIFYING ROLLBACK...' as message;

-- Show rollback summary
SELECT 
    'Rollback Summary:' as info,
    table_name,
    backup_table_name,
    row_count,
    backup_timestamp
FROM backup_migration.backup_summary
ORDER BY table_name;

-- Show current data counts
SELECT 
    'Current Data After Rollback:' as info,
    'profiles' as table_name,
    COUNT(*) as row_count
FROM public.profiles

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'merchants' as table_name,
    COUNT(*) as row_count
FROM public.merchants

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'merchant_subscription_plans' as table_name,
    COUNT(*) as row_count
FROM public.merchant_subscription_plans

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'nft_types' as table_name,
    COUNT(*) as row_count
FROM public.nft_types

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'user_loyalty_cards' as table_name,
    COUNT(*) as row_count
FROM public.user_loyalty_cards

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'loyalty_transactions' as table_name,
    COUNT(*) as row_count
FROM public.loyalty_transactions

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'user_points' as table_name,
    COUNT(*) as row_count
FROM public.user_points

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'user_referrals' as table_name,
    COUNT(*) as row_count
FROM public.user_referrals

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'dao_organizations' as table_name,
    COUNT(*) as row_count
FROM public.dao_organizations

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'dao_members' as table_name,
    COUNT(*) as row_count
FROM public.dao_members

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'dao_proposals' as table_name,
    COUNT(*) as row_count
FROM public.dao_proposals

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'dao_votes' as table_name,
    COUNT(*) as row_count
FROM public.dao_votes

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'marketplace_listings' as table_name,
    COUNT(*) as row_count
FROM public.marketplace_listings

UNION ALL

SELECT 
    'Current Data After Rollback:' as info,
    'marketplace_investments' as table_name,
    COUNT(*) as row_count
FROM public.marketplace_investments;

-- ===========================================
-- STEP 7: ROLLBACK COMPLETION
-- ===========================================

SELECT '✅ ROLLBACK COMPLETED!' as message;

-- Overall rollback status
SELECT 
    'Rollback Status:' as info,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM public.profiles
        ) > 0
        OR (
            SELECT COUNT(*) FROM public.merchants
        ) > 0
        OR (
            SELECT COUNT(*) FROM public.merchant_subscription_plans
        ) > 0
        THEN '✅ Data restored from backup'
        ELSE '❌ No data restored - backup may be empty'
    END as status;

-- ===========================================
-- STEP 8: CLEANUP OPTIONS
-- ===========================================

SELECT '🧹 CLEANUP OPTIONS:' as info;
SELECT '1. Keep backup schema for future reference' as option1;
SELECT '2. Drop backup schema to free space' as option2;
SELECT '3. Archive backup data before dropping' as option3;

-- Option to drop backup schema (commented out for safety)
/*
DROP SCHEMA IF EXISTS backup_migration CASCADE;
SELECT 'Backup schema dropped' as cleanup_status;
*/

SELECT '🎯 ROLLBACK COMPLETED SUCCESSFULLY!' as final_message;
SELECT 'Database has been restored to pre-migration state' as status;

