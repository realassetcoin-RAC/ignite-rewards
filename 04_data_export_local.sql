-- ===========================================
-- EXPORT LOCAL DATABASE DATA
-- ===========================================
-- This script exports all data from the local database
-- Run this on your LOCAL database to prepare data for cloud migration

-- ===========================================
-- STEP 1: CREATE EXPORT SCHEMA
-- ===========================================

-- Create export schema for data export
CREATE SCHEMA IF NOT EXISTS data_export;

-- ===========================================
-- STEP 2: EXPORT CORE TABLES DATA
-- ===========================================

-- Export profiles data
DROP TABLE IF EXISTS data_export.profiles_export;
CREATE TABLE data_export.profiles_export AS 
SELECT * FROM public.profiles;

-- Export merchants data
DROP TABLE IF EXISTS data_export.merchants_export;
CREATE TABLE data_export.merchants_export AS 
SELECT * FROM public.merchants;

-- Export NFT types data
DROP TABLE IF EXISTS data_export.nft_types_export;
CREATE TABLE data_export.nft_types_export AS 
SELECT * FROM public.nft_types;

-- Export user loyalty cards data
DROP TABLE IF EXISTS data_export.user_loyalty_cards_export;
CREATE TABLE data_export.user_loyalty_cards_export AS 
SELECT * FROM public.user_loyalty_cards;

-- Export user points data
DROP TABLE IF EXISTS data_export.user_points_export;
CREATE TABLE data_export.user_points_export AS 
SELECT * FROM public.user_points;

-- Export loyalty transactions data
DROP TABLE IF EXISTS data_export.loyalty_transactions_export;
CREATE TABLE data_export.loyalty_transactions_export AS 
SELECT * FROM public.loyalty_transactions;

-- ===========================================
-- STEP 3: EXPORT REFERRAL SYSTEM DATA
-- ===========================================

-- Export referral campaigns data
DROP TABLE IF EXISTS data_export.referral_campaigns_export;
CREATE TABLE data_export.referral_campaigns_export AS 
SELECT * FROM public.referral_campaigns;

-- Export user referrals data
DROP TABLE IF EXISTS data_export.user_referrals_export;
CREATE TABLE data_export.user_referrals_export AS 
SELECT * FROM public.user_referrals;

-- ===========================================
-- STEP 4: EXPORT MERCHANT SYSTEM DATA
-- ===========================================

-- Export merchant subscription plans data
DROP TABLE IF EXISTS data_export.merchant_subscription_plans_export;
CREATE TABLE data_export.merchant_subscription_plans_export AS 
SELECT * FROM public.merchant_subscription_plans;

-- Export virtual cards data
DROP TABLE IF EXISTS data_export.virtual_cards_export;
CREATE TABLE data_export.virtual_cards_export AS 
SELECT * FROM public.virtual_cards;

-- ===========================================
-- STEP 5: EXPORT MARKETPLACE DATA
-- ===========================================

-- Export marketplace listings data
DROP TABLE IF EXISTS data_export.marketplace_listings_export;
CREATE TABLE data_export.marketplace_listings_export AS 
SELECT * FROM public.marketplace_listings;

-- Export marketplace investments data
DROP TABLE IF EXISTS data_export.marketplace_investments_export;
CREATE TABLE data_export.marketplace_investments_export AS 
SELECT * FROM public.marketplace_investments;

-- ===========================================
-- STEP 6: EXPORT DAO SYSTEM DATA
-- ===========================================

-- Export DAO organizations data
DROP TABLE IF EXISTS data_export.dao_organizations_export;
CREATE TABLE data_export.dao_organizations_export AS 
SELECT * FROM public.dao_organizations;

-- Export DAO members data
DROP TABLE IF EXISTS data_export.dao_members_export;
CREATE TABLE data_export.dao_members_export AS 
SELECT * FROM public.dao_members;

-- Export DAO proposals data
DROP TABLE IF EXISTS data_export.dao_proposals_export;
CREATE TABLE data_export.dao_proposals_export AS 
SELECT * FROM public.dao_proposals;

-- Export DAO votes data
DROP TABLE IF EXISTS data_export.dao_votes_export;
CREATE TABLE data_export.dao_votes_export AS 
SELECT * FROM public.dao_votes;

-- ===========================================
-- STEP 7: EXPORT ADVANCED FEATURE DATA
-- ===========================================

-- Export user wallets data
DROP TABLE IF EXISTS data_export.user_wallets_export;
CREATE TABLE data_export.user_wallets_export AS 
SELECT * FROM public.user_wallets;

-- Export loyalty networks data
DROP TABLE IF EXISTS data_export.loyalty_networks_export;
CREATE TABLE data_export.loyalty_networks_export AS 
SELECT * FROM public.loyalty_networks;

-- Export asset initiatives data
DROP TABLE IF EXISTS data_export.asset_initiatives_export;
CREATE TABLE data_export.asset_initiatives_export AS 
SELECT * FROM public.asset_initiatives;

-- Export user asset selections data
DROP TABLE IF EXISTS data_export.user_asset_selections_export;
CREATE TABLE data_export.user_asset_selections_export AS 
SELECT * FROM public.user_asset_selections;

-- ===========================================
-- STEP 8: CREATE EXPORT SUMMARY
-- ===========================================

-- Create export summary table
CREATE TABLE IF NOT EXISTS data_export.export_summary (
    table_name TEXT PRIMARY KEY,
    export_table_name TEXT,
    row_count INTEGER,
    export_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert or update export summary
INSERT INTO data_export.export_summary (table_name, export_table_name, row_count)
SELECT 
    'profiles' as table_name,
    'profiles_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.profiles_export) as row_count

UNION ALL

SELECT 
    'merchants' as table_name,
    'merchants_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.merchants_export) as row_count

UNION ALL

SELECT 
    'nft_types' as table_name,
    'nft_types_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.nft_types_export) as row_count

UNION ALL

SELECT 
    'user_loyalty_cards' as table_name,
    'user_loyalty_cards_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.user_loyalty_cards_export) as row_count

UNION ALL

SELECT 
    'user_points' as table_name,
    'user_points_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.user_points_export) as row_count

UNION ALL

SELECT 
    'loyalty_transactions' as table_name,
    'loyalty_transactions_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.loyalty_transactions_export) as row_count

UNION ALL

SELECT 
    'referral_campaigns' as table_name,
    'referral_campaigns_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.referral_campaigns_export) as row_count

UNION ALL

SELECT 
    'user_referrals' as table_name,
    'user_referrals_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.user_referrals_export) as row_count

UNION ALL

SELECT 
    'merchant_subscription_plans' as table_name,
    'merchant_subscription_plans_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.merchant_subscription_plans_export) as row_count

UNION ALL

SELECT 
    'virtual_cards' as table_name,
    'virtual_cards_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.virtual_cards_export) as row_count

UNION ALL

SELECT 
    'marketplace_listings' as table_name,
    'marketplace_listings_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.marketplace_listings_export) as row_count

UNION ALL

SELECT 
    'marketplace_investments' as table_name,
    'marketplace_investments_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.marketplace_investments_export) as row_count

UNION ALL

SELECT 
    'dao_organizations' as table_name,
    'dao_organizations_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.dao_organizations_export) as row_count

UNION ALL

SELECT 
    'dao_members' as table_name,
    'dao_members_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.dao_members_export) as row_count

UNION ALL

SELECT 
    'dao_proposals' as table_name,
    'dao_proposals_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.dao_proposals_export) as row_count

UNION ALL

SELECT 
    'dao_votes' as table_name,
    'dao_votes_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.dao_votes_export) as row_count

UNION ALL

SELECT 
    'user_wallets' as table_name,
    'user_wallets_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.user_wallets_export) as row_count

UNION ALL

SELECT 
    'loyalty_networks' as table_name,
    'loyalty_networks_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.loyalty_networks_export) as row_count

UNION ALL

SELECT 
    'asset_initiatives' as table_name,
    'asset_initiatives_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.asset_initiatives_export) as row_count

UNION ALL

SELECT 
    'user_asset_selections' as table_name,
    'user_asset_selections_export' as export_table_name,
    (SELECT COUNT(*) FROM data_export.user_asset_selections_export) as row_count

ON CONFLICT (table_name) DO UPDATE SET
    export_table_name = EXCLUDED.export_table_name,
    row_count = EXCLUDED.row_count,
    export_timestamp = NOW();

-- ===========================================
-- STEP 9: SHOW EXPORT SUMMARY
-- ===========================================

SELECT '✅ LOCAL DATA EXPORT COMPLETED!' as message;

SELECT 
    'Export Summary:' as info,
    table_name,
    export_table_name,
    row_count,
    export_timestamp
FROM data_export.export_summary
ORDER BY table_name;

-- Show total export size
SELECT 
    'Total Tables Exported:' as info,
    COUNT(*) as count
FROM data_export.export_summary;

SELECT 
    'Total Rows Exported:' as info,
    SUM(row_count) as count
FROM data_export.export_summary;

-- ===========================================
-- STEP 10: CREATE INSERT STATEMENTS
-- ===========================================

-- Create a function to generate INSERT statements
CREATE OR REPLACE FUNCTION data_export.generate_insert_statements()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    insert_statements TEXT := '';
    table_record RECORD;
    column_list TEXT;
    value_list TEXT;
    row_record RECORD;
BEGIN
    -- Loop through each export table
    FOR table_record IN 
        SELECT table_name, export_table_name 
        FROM data_export.export_summary 
        ORDER BY table_name
    LOOP
        -- Get column list
        SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
        INTO column_list
        FROM information_schema.columns
        WHERE table_schema = 'data_export'
        AND table_name = table_record.export_table_name;
        
        -- Add table header
        insert_statements := insert_statements || 
            E'\n-- ===========================================\n' ||
            E'-- INSERT DATA FOR ' || UPPER(table_record.table_name) || E'\n' ||
            E'-- ===========================================\n\n';
        
        -- Generate INSERT statements for each row
        FOR row_record IN 
            EXECUTE format('SELECT * FROM data_export.%I', table_record.export_table_name)
        LOOP
            -- Build value list (simplified - you may need to handle different data types)
            value_list := '';
            -- This is a simplified version - in practice, you'd need to handle each column type properly
            
            insert_statements := insert_statements || 
                format('INSERT INTO public.%I (%s) VALUES (...);\n', 
                       table_record.table_name, column_list);
        END LOOP;
        
        insert_statements := insert_statements || E'\n';
    END LOOP;
    
    RETURN insert_statements;
END;
$$;

-- ===========================================
-- STEP 11: EXPORT COMPLETION MESSAGE
-- ===========================================

SELECT '🎯 DATA EXPORT READY FOR MIGRATION!' as message;
SELECT 'Next step: Run 05_data_import_cloud.sql on cloud database' as next_step;
SELECT 'Note: You may need to manually copy the data or use pg_dump/pg_restore' as note;

-- ===========================================
-- STEP 12: EXPORT INSTRUCTIONS
-- ===========================================

SELECT '📋 EXPORT INSTRUCTIONS:' as info;
SELECT '1. All data has been exported to data_export schema' as step1;
SELECT '2. Use pg_dump to export the data_export schema' as step2;
SELECT '3. Or manually copy the INSERT statements' as step3;
SELECT '4. Import the data to your cloud database' as step4;
