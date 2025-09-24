-- ===========================================
-- BACKUP CLOUD DATA BEFORE MIGRATION
-- ===========================================
-- This script backs up existing data from the cloud Supabase database
-- Run this BEFORE executing the main migration

-- ===========================================
-- STEP 1: CREATE BACKUP TABLES
-- ===========================================

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_migration;

-- Backup existing tables (if they exist)
DO $$ 
BEGIN
    -- Backup profiles table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP TABLE IF EXISTS backup_migration.profiles_backup;
        CREATE TABLE backup_migration.profiles_backup AS SELECT * FROM public.profiles;
        RAISE NOTICE 'Backed up profiles table: % rows', (SELECT COUNT(*) FROM backup_migration.profiles_backup);
    END IF;

    -- Backup merchants table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchants') THEN
        DROP TABLE IF EXISTS backup_migration.merchants_backup;
        CREATE TABLE backup_migration.merchants_backup AS SELECT * FROM public.merchants;
        RAISE NOTICE 'Backed up merchants table: % rows', (SELECT COUNT(*) FROM backup_migration.merchants_backup);
    END IF;

    -- Backup merchant_subscription_plans table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans') THEN
        DROP TABLE IF EXISTS backup_migration.merchant_subscription_plans_backup;
        CREATE TABLE backup_migration.merchant_subscription_plans_backup AS SELECT * FROM public.merchant_subscription_plans;
        RAISE NOTICE 'Backed up merchant_subscription_plans table: % rows', (SELECT COUNT(*) FROM backup_migration.merchant_subscription_plans_backup);
    END IF;

    -- Backup nft_types table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nft_types') THEN
        DROP TABLE IF EXISTS backup_migration.nft_types_backup;
        CREATE TABLE backup_migration.nft_types_backup AS SELECT * FROM public.nft_types;
        RAISE NOTICE 'Backed up nft_types table: % rows', (SELECT COUNT(*) FROM backup_migration.nft_types_backup);
    END IF;

    -- Backup user_loyalty_cards table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_loyalty_cards') THEN
        DROP TABLE IF EXISTS backup_migration.user_loyalty_cards_backup;
        CREATE TABLE backup_migration.user_loyalty_cards_backup AS SELECT * FROM public.user_loyalty_cards;
        RAISE NOTICE 'Backed up user_loyalty_cards table: % rows', (SELECT COUNT(*) FROM backup_migration.user_loyalty_cards_backup);
    END IF;

    -- Backup loyalty_transactions table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loyalty_transactions') THEN
        DROP TABLE IF EXISTS backup_migration.loyalty_transactions_backup;
        CREATE TABLE backup_migration.loyalty_transactions_backup AS SELECT * FROM public.loyalty_transactions;
        RAISE NOTICE 'Backed up loyalty_transactions table: % rows', (SELECT COUNT(*) FROM backup_migration.loyalty_transactions_backup);
    END IF;

    -- Backup user_points table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_points') THEN
        DROP TABLE IF EXISTS backup_migration.user_points_backup;
        CREATE TABLE backup_migration.user_points_backup AS SELECT * FROM public.user_points;
        RAISE NOTICE 'Backed up user_points table: % rows', (SELECT COUNT(*) FROM backup_migration.user_points_backup);
    END IF;

    -- Backup user_referrals table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_referrals') THEN
        DROP TABLE IF EXISTS backup_migration.user_referrals_backup;
        CREATE TABLE backup_migration.user_referrals_backup AS SELECT * FROM public.user_referrals;
        RAISE NOTICE 'Backed up user_referrals table: % rows', (SELECT COUNT(*) FROM backup_migration.user_referrals_backup);
    END IF;

    -- Backup DAO tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_organizations') THEN
        DROP TABLE IF EXISTS backup_migration.dao_organizations_backup;
        CREATE TABLE backup_migration.dao_organizations_backup AS SELECT * FROM public.dao_organizations;
        RAISE NOTICE 'Backed up dao_organizations table: % rows', (SELECT COUNT(*) FROM backup_migration.dao_organizations_backup);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_members') THEN
        DROP TABLE IF EXISTS backup_migration.dao_members_backup;
        CREATE TABLE backup_migration.dao_members_backup AS SELECT * FROM public.dao_members;
        RAISE NOTICE 'Backed up dao_members table: % rows', (SELECT COUNT(*) FROM backup_migration.dao_members_backup);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_proposals') THEN
        DROP TABLE IF EXISTS backup_migration.dao_proposals_backup;
        CREATE TABLE backup_migration.dao_proposals_backup AS SELECT * FROM public.dao_proposals;
        RAISE NOTICE 'Backed up dao_proposals table: % rows', (SELECT COUNT(*) FROM backup_migration.dao_proposals_backup);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_votes') THEN
        DROP TABLE IF EXISTS backup_migration.dao_votes_backup;
        CREATE TABLE backup_migration.dao_votes_backup AS SELECT * FROM public.dao_votes;
        RAISE NOTICE 'Backed up dao_votes table: % rows', (SELECT COUNT(*) FROM backup_migration.dao_votes_backup);
    END IF;

    -- Backup marketplace tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketplace_listings') THEN
        DROP TABLE IF EXISTS backup_migration.marketplace_listings_backup;
        CREATE TABLE backup_migration.marketplace_listings_backup AS SELECT * FROM public.marketplace_listings;
        RAISE NOTICE 'Backed up marketplace_listings table: % rows', (SELECT COUNT(*) FROM backup_migration.marketplace_listings_backup);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketplace_investments') THEN
        DROP TABLE IF EXISTS backup_migration.marketplace_investments_backup;
        CREATE TABLE backup_migration.marketplace_investments_backup AS SELECT * FROM public.marketplace_investments;
        RAISE NOTICE 'Backed up marketplace_investments table: % rows', (SELECT COUNT(*) FROM backup_migration.marketplace_investments_backup);
    END IF;

END $$;

-- ===========================================
-- STEP 2: CREATE BACKUP SUMMARY
-- ===========================================

-- Create backup summary table
CREATE TABLE IF NOT EXISTS backup_migration.backup_summary (
    table_name TEXT PRIMARY KEY,
    backup_table_name TEXT,
    row_count INTEGER,
    backup_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert backup summary
INSERT INTO backup_migration.backup_summary (table_name, backup_table_name, row_count)
SELECT 
    'profiles' as table_name,
    'profiles_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.profiles_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'profiles_backup')

UNION ALL

SELECT 
    'merchants' as table_name,
    'merchants_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.merchants_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'merchants_backup')

UNION ALL

SELECT 
    'merchant_subscription_plans' as table_name,
    'merchant_subscription_plans_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.merchant_subscription_plans_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'merchant_subscription_plans_backup')

UNION ALL

SELECT 
    'nft_types' as table_name,
    'nft_types_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.nft_types_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'nft_types_backup')

UNION ALL

SELECT 
    'user_loyalty_cards' as table_name,
    'user_loyalty_cards_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.user_loyalty_cards_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'user_loyalty_cards_backup')

UNION ALL

SELECT 
    'loyalty_transactions' as table_name,
    'loyalty_transactions_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.loyalty_transactions_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'loyalty_transactions_backup')

UNION ALL

SELECT 
    'user_points' as table_name,
    'user_points_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.user_points_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'user_points_backup')

UNION ALL

SELECT 
    'user_referrals' as table_name,
    'user_referrals_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.user_referrals_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'user_referrals_backup')

UNION ALL

SELECT 
    'dao_organizations' as table_name,
    'dao_organizations_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.dao_organizations_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'dao_organizations_backup')

UNION ALL

SELECT 
    'dao_members' as table_name,
    'dao_members_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.dao_members_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'dao_members_backup')

UNION ALL

SELECT 
    'dao_proposals' as table_name,
    'dao_proposals_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.dao_proposals_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'dao_proposals_backup')

UNION ALL

SELECT 
    'dao_votes' as table_name,
    'dao_votes_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.dao_votes_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'dao_votes_backup')

UNION ALL

SELECT 
    'marketplace_listings' as table_name,
    'marketplace_listings_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.marketplace_listings_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'marketplace_listings_backup')

UNION ALL

SELECT 
    'marketplace_investments' as table_name,
    'marketplace_investments_backup' as backup_table_name,
    (SELECT COUNT(*) FROM backup_migration.marketplace_investments_backup) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_migration' AND table_name = 'marketplace_investments_backup');

-- ===========================================
-- STEP 3: SHOW BACKUP SUMMARY
-- ===========================================

SELECT '✅ CLOUD DATA BACKUP COMPLETED!' as message;

SELECT 
    'Backup Summary:' as info,
    table_name,
    backup_table_name,
    row_count,
    backup_timestamp
FROM backup_migration.backup_summary
ORDER BY table_name;

-- Show total backup size
SELECT 
    'Total Tables Backed Up:' as info,
    COUNT(*) as count
FROM backup_migration.backup_summary;

SELECT 
    'Total Rows Backed Up:' as info,
    SUM(row_count) as count
FROM backup_migration.backup_summary;

-- ===========================================
-- STEP 4: BACKUP COMPLETION MESSAGE
-- ===========================================

SELECT '🎯 READY FOR MIGRATION!' as message;
SELECT 'Next step: Run 02_schema_synchronization.sql' as next_step;

