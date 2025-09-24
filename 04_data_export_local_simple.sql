-- ===========================================
-- SIMPLE DATA EXPORT SCRIPT
-- ===========================================
-- This is a simplified version of the data export script
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
-- STEP 8: SHOW EXPORT SUMMARY
-- ===========================================

SELECT '✅ LOCAL DATA EXPORT COMPLETED!' as message;

-- Show export summary
SELECT 
    'profiles' as table_name,
    (SELECT COUNT(*) FROM data_export.profiles_export) as row_count

UNION ALL

SELECT 
    'merchants' as table_name,
    (SELECT COUNT(*) FROM data_export.merchants_export) as row_count

UNION ALL

SELECT 
    'nft_types' as table_name,
    (SELECT COUNT(*) FROM data_export.nft_types_export) as row_count

UNION ALL

SELECT 
    'user_loyalty_cards' as table_name,
    (SELECT COUNT(*) FROM data_export.user_loyalty_cards_export) as row_count

UNION ALL

SELECT 
    'user_points' as table_name,
    (SELECT COUNT(*) FROM data_export.user_points_export) as row_count

UNION ALL

SELECT 
    'loyalty_transactions' as table_name,
    (SELECT COUNT(*) FROM data_export.loyalty_transactions_export) as row_count

UNION ALL

SELECT 
    'referral_campaigns' as table_name,
    (SELECT COUNT(*) FROM data_export.referral_campaigns_export) as row_count

UNION ALL

SELECT 
    'user_referrals' as table_name,
    (SELECT COUNT(*) FROM data_export.user_referrals_export) as row_count

UNION ALL

SELECT 
    'merchant_subscription_plans' as table_name,
    (SELECT COUNT(*) FROM data_export.merchant_subscription_plans_export) as row_count

UNION ALL

SELECT 
    'virtual_cards' as table_name,
    (SELECT COUNT(*) FROM data_export.virtual_cards_export) as row_count

UNION ALL

SELECT 
    'marketplace_listings' as table_name,
    (SELECT COUNT(*) FROM data_export.marketplace_listings_export) as row_count

UNION ALL

SELECT 
    'marketplace_investments' as table_name,
    (SELECT COUNT(*) FROM data_export.marketplace_investments_export) as row_count

UNION ALL

SELECT 
    'dao_organizations' as table_name,
    (SELECT COUNT(*) FROM data_export.dao_organizations_export) as row_count

UNION ALL

SELECT 
    'dao_members' as table_name,
    (SELECT COUNT(*) FROM data_export.dao_members_export) as row_count

UNION ALL

SELECT 
    'dao_proposals' as table_name,
    (SELECT COUNT(*) FROM data_export.dao_proposals_export) as row_count

UNION ALL

SELECT 
    'dao_votes' as table_name,
    (SELECT COUNT(*) FROM data_export.dao_votes_export) as row_count

UNION ALL

SELECT 
    'user_wallets' as table_name,
    (SELECT COUNT(*) FROM data_export.user_wallets_export) as row_count

UNION ALL

SELECT 
    'loyalty_networks' as table_name,
    (SELECT COUNT(*) FROM data_export.loyalty_networks_export) as row_count

UNION ALL

SELECT 
    'asset_initiatives' as table_name,
    (SELECT COUNT(*) FROM data_export.asset_initiatives_export) as row_count

UNION ALL

SELECT 
    'user_asset_selections' as table_name,
    (SELECT COUNT(*) FROM data_export.user_asset_selections_export) as row_count

ORDER BY table_name;

-- ===========================================
-- STEP 9: EXPORT COMPLETION MESSAGE
-- ===========================================

SELECT '🎯 DATA EXPORT READY FOR MIGRATION!' as message;
SELECT 'Next step: Run 05_data_import_cloud.sql on cloud database' as next_step;
SELECT 'Note: You may need to manually copy the data or use pg_dump/pg_restore' as note;

-- ===========================================
-- STEP 10: EXPORT INSTRUCTIONS
-- ===========================================

SELECT '📋 EXPORT INSTRUCTIONS:' as info;
SELECT '1. All data has been exported to data_export schema' as step1;
SELECT '2. Use pg_dump to export the data_export schema' as step2;
SELECT '3. Or manually copy the INSERT statements' as step3;
SELECT '4. Import the data to your cloud database' as step4;

