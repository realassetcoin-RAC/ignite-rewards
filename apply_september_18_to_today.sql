-- Apply All Database Changes from September 18, 2025 to Today
-- This script executes all database changes on local PostgreSQL database
-- Date Range: September 18, 2025 - October 4, 2025

-- =============================================================================
-- 1. CORE DATABASE RESTORATION (Latest)
-- =============================================================================

-- Complete database restoration with all tables
\i restore_complete_database.sql

-- Complete system restoration with advanced features
\i restore_complete_system.sql

-- =============================================================================
-- 2. MERCHANT SYSTEM FIXES (September 29 - October 2)
-- =============================================================================

-- Fix subscription plans
\i fix_subscription_plans_complete.sql

-- Fix merchant subscription plans public schema
\i FIX_MERCHANT_SUBSCRIPTION_PLANS_PUBLIC_SCHEMA.sql

-- Fix merchant subscription plans schema
\i FIX_MERCHANT_SUBSCRIPTION_PLANS_SCHEMA.sql

-- Update plan features
\i update_plan_features_correct.sql

-- Update subscription prices
\i update_subscription_prices.sql

-- Fix popular plan column
\i FIX_POPULAR_PLAN_COLUMN.sql

-- Comprehensive popular plan fix
\i COMPREHENSIVE_POPULAR_PLAN_FIX.sql

-- Fix merchants table
\i fix_merchants_table.sql

-- =============================================================================
-- 3. DAO SYSTEM COMPLETE SETUP (October 2)
-- =============================================================================

-- Fix DAO tables and data
\i FIX_DAO_TABLES_AND_DATA.sql

-- Fix DAO tables complete
\i fix_dao_tables_complete.sql

-- Fix DAO proposal creation
\i fix_dao_proposal_creation.sql

-- Comprehensive DAO ecosystem
\i COMPREHENSIVE_DAO_ECOSYSTEM.sql

-- Migrate to 5 main DAOs
\i MIGRATE_TO_5_MAIN_DAOS.sql

-- Fix DAO proposals RLS policies
\i FIX_DAO_PROPOSALS_RLS_POLICIES.sql

-- Update DAO trigger for new mapping
\i UPDATE_DAO_TRIGGER_FOR_NEW_MAPPING.sql

-- =============================================================================
-- 4. NFT AND LOYALTY SYSTEM (October 2 - October 4)
-- =============================================================================

-- Fix NFT types schema
\i FIX_NFT_TYPES_SCHEMA.sql

-- Link NFT types to collections
\i LINK_NFT_TYPES_TO_COLLECTIONS.sql

-- Create loyalty providers table
\i CREATE_LOYALTY_PROVIDERS_TABLE.sql

-- Create loyalty change requests table
\i CREATE_LOYALTY_CHANGE_REQUESTS_TABLE.sql

-- Fix loyalty card function
\i fix_loyalty_card_function.sql

-- Create loyalty cards table
\i create_loyalty_cards_table.sql

-- Fix loyalty cards loading
\i fix_loyalty_cards_loading.sql

-- =============================================================================
-- 5. MARKETPLACE AND REFERRAL SYSTEM (September 29 - October 4)
-- =============================================================================

-- Create marketplace tables
\i create_marketplace_tables.sql

-- Fix DAO marketplace field gaps
\i fix_dao_marketplace_field_gaps.sql

-- Fix referral system
\i fix_referral_system.sql

-- =============================================================================
-- 6. REWARDS AND CONFIGURATION SYSTEM (October 2)
-- =============================================================================

-- Fix rewards config simple
\i fix_rewards_config_simple.sql

-- Fix config proposals issue
\i fix_config_proposals_issue.sql

-- =============================================================================
-- 7. CITIES LOOKUP SYSTEM (October 4)
-- =============================================================================

-- Create cities lookup table
\i create_cities_lookup_table.sql

-- Apply cities lookup
\i apply_cities_lookup.sql

-- Apply cities data (10K chunks)
\i apply_cities_10k_chunks.sql

-- =============================================================================
-- 8. TERMS AND PRIVACY SYSTEM (October 4)
-- =============================================================================

-- Permanent terms table fix
\i PERMANENT_TERMS_TABLE_FIX.sql

-- =============================================================================
-- 9. DATABASE CLEANUP AND OPTIMIZATION (October 2)
-- =============================================================================

-- Remove duplicate loyalty cards
\i remove_duplicate_loyalty_cards.sql

-- Prevent future duplicates
\i prevent_future_duplicates.sql

-- Fix missing category column
\i fix_missing_category_column.sql

-- Create missing tables only
\i create_missing_tables_only.sql

-- Create missing dashboard tables
\i create_missing_dashboard_tables.sql

-- =============================================================================
-- 10. RLS POLICIES AND SECURITY (October 2)
-- =============================================================================

-- Comprehensive RLS fix
\i COMPREHENSIVE_RLS_FIX.sql

-- Check and fix RLS policies
\i CHECK_AND_FIX_RLS_POLICIES.sql

-- Fix RLS policies comprehensive
\i FIX_RLS_POLICIES_COMPREHENSIVE.sql

-- =============================================================================
-- 11. DATABASE CONSTRAINTS AND TRIGGERS (October 2)
-- =============================================================================

-- Check database triggers and constraints
\i CHECK_DATABASE_TRIGGERS_AND_CONSTRAINTS.sql

-- =============================================================================
-- 12. PRICE AND MONTHLY UPDATES (October 2)
-- =============================================================================

-- Fix price monthly update issue
\i FIX_PRICE_MONTHLY_UPDATE_ISSUE.sql

-- Fix price monthly update issue V2
\i FIX_PRICE_MONTHLY_UPDATE_ISSUE_V2.sql

-- Check price monthly column specific
\i CHECK_PRICE_MONTHLY_COLUMN_SPECIFIC.sql

-- =============================================================================
-- 13. VERIFICATION AND TESTING
-- =============================================================================

-- Verify cities data
\i verify_cities_data_10k.sql

-- Verify loyalty providers data
\i VERIFY_LOYALTY_PROVIDERS_DATA.sql

-- Check database schema
\i check_database_schema.sql

-- Check DAO tables
\i check_dao_tables.sql

-- =============================================================================
-- FINAL VERIFICATION
-- =============================================================================

-- Final verification query
SELECT 
    'All changes from September 18, 2025 to today applied successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
    (SELECT COUNT(*) FROM public.nft_types) as nft_types,
    (SELECT COUNT(*) FROM public.merchant_subscription_plans) as subscription_plans,
    (SELECT COUNT(*) FROM public.dao_organizations) as dao_organizations,
    (SELECT COUNT(*) FROM public.cities_lookup) as cities_count,
    (SELECT COUNT(*) FROM public.loyalty_networks) as loyalty_networks,
    (SELECT COUNT(*) FROM public.loyalty_providers) as loyalty_providers,
    (SELECT COUNT(*) FROM public.marketplace_listings) as marketplace_listings;
