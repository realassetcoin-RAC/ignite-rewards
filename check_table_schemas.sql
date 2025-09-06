-- =============================================================================
-- TABLE SCHEMA DIAGNOSTIC - IDENTIFY MISSING COLUMNS
-- =============================================================================
-- 
-- This script checks the actual structure of tables to identify schema issues
-- like missing "status" columns or other mismatches.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to the SQL Editor
-- 4. Copy and paste this entire script
-- 5. Click "RUN" to execute
--
-- =============================================================================

-- Check 1: Show structure of merchant_subscription_plans table
SELECT 
    'merchant_subscription_plans columns:' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
ORDER BY ordinal_position;

-- Check 2: Show structure of profiles table
SELECT 
    'profiles columns:' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'api' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check 3: Show structure of merchants table (if it exists)
SELECT 
    'merchants columns:' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'api' AND table_name = 'merchants'
ORDER BY ordinal_position;

-- Check 4: Show structure of virtual_cards table (if it exists)
SELECT 
    'virtual_cards columns:' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'api' AND table_name = 'virtual_cards'
ORDER BY ordinal_position;

-- Check 5: List all tables in api schema
SELECT 
    'All tables in api schema:' as schema_info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'api'
ORDER BY table_name;

-- Check 6: Search for any table that has a "status" column
SELECT 
    'Tables with status column:' as search_info,
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name = 'status'
AND table_schema IN ('api', 'public')
ORDER BY table_schema, table_name;

-- Check 7: Common table structures that might need a status column
DO $$
BEGIN
    -- Check if merchants table exists and if it has status column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchants') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'api' AND table_name = 'merchants' AND column_name = 'status') THEN
            RAISE NOTICE '⚠️  merchants table exists but missing status column';
        ELSE
            RAISE NOTICE '✅ merchants table has status column';
        END IF;
    ELSE
        RAISE NOTICE '❌ merchants table does not exist';
    END IF;
    
    -- Check if virtual_cards table exists and if it has status column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'virtual_cards') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'api' AND table_name = 'virtual_cards' AND column_name = 'status') THEN
            RAISE NOTICE '⚠️  virtual_cards table exists but missing status column';
        ELSE
            RAISE NOTICE '✅ virtual_cards table has status column';
        END IF;
    ELSE
        RAISE NOTICE '❌ virtual_cards table does not exist';
    END IF;
END $$;

-- =============================================================================
-- SUMMARY
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 SCHEMA DIAGNOSTIC COMPLETE';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Review the results above to identify:';
    RAISE NOTICE '   • Which tables exist in the api schema';
    RAISE NOTICE '   • What columns each table has';
    RAISE NOTICE '   • Which tables are missing a "status" column';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Common fixes for missing status column:';
    RAISE NOTICE '   • Add status column to merchants table';
    RAISE NOTICE '   • Add status column to virtual_cards table';
    RAISE NOTICE '   • Update SQL queries to use correct column names';
    RAISE NOTICE '';
END $$;