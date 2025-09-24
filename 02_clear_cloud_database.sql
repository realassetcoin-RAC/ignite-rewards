-- ===========================================
-- CLEAR CLOUD DATABASE - COMPLETE RESET
-- ===========================================
-- This script completely clears the cloud Supabase database
-- Run this AFTER backing up data and BEFORE schema migration
-- WARNING: This will delete ALL data and tables!

-- ===========================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- ===========================================

-- Disable RLS on all tables to allow deletion
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
-- STEP 2: DROP ALL FOREIGN KEY CONSTRAINTS
-- ===========================================

-- Drop all foreign key constraints first
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT 
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I CASCADE', 
                      constraint_record.table_name, 
                      constraint_record.constraint_name);
        RAISE NOTICE 'Dropped foreign key constraint: %.%', 
                     constraint_record.table_name, 
                     constraint_record.constraint_name;
    END LOOP;
END $$;

-- ===========================================
-- STEP 3: DROP ALL TABLES
-- ===========================================

-- Drop all tables in public schema
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
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', table_name);
        RAISE NOTICE 'Dropped table: %', table_name;
    END LOOP;
END $$;

-- ===========================================
-- STEP 4: DROP ALL CUSTOM TYPES/ENUMS
-- ===========================================

-- Drop all custom enum types
DO $$ 
DECLARE
    type_name TEXT;
BEGIN
    FOR type_name IN 
        SELECT t.typname 
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        AND t.typtype = 'e'  -- enum types
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', type_name);
        RAISE NOTICE 'Dropped enum type: %', type_name;
    END LOOP;
END $$;

-- ===========================================
-- STEP 5: DROP ALL FUNCTIONS
-- ===========================================

-- Drop all custom functions
DO $$ 
DECLARE
    function_record RECORD;
BEGIN
    FOR function_record IN 
        SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'  -- functions only
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                      function_record.function_name, 
                      function_record.arguments);
        RAISE NOTICE 'Dropped function: %(%)', 
                     function_record.function_name, 
                     function_record.arguments;
    END LOOP;
END $$;

-- ===========================================
-- STEP 6: DROP ALL SEQUENCES
-- ===========================================

-- Drop all sequences
DO $$ 
DECLARE
    sequence_name TEXT;
BEGIN
    FOR sequence_name IN 
        SELECT s.sequence_name 
        FROM information_schema.sequences s
        WHERE s.sequence_schema = 'public'
    LOOP
        EXECUTE format('DROP SEQUENCE IF EXISTS public.%I CASCADE', sequence_name);
        RAISE NOTICE 'Dropped sequence: %', sequence_name;
    END LOOP;
END $$;

-- ===========================================
-- STEP 7: DROP ALL VIEWS
-- ===========================================

-- Drop all views
DO $$ 
DECLARE
    view_name TEXT;
BEGIN
    FOR view_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'VIEW'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
        RAISE NOTICE 'Dropped view: %', view_name;
    END LOOP;
END $$;

-- ===========================================
-- STEP 8: DROP ALL TRIGGERS
-- ===========================================

-- Drop all triggers
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT 
            t.trigger_name,
            t.event_object_table
        FROM information_schema.triggers t
        WHERE t.trigger_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE', 
                      trigger_record.trigger_name, 
                      trigger_record.event_object_table);
        RAISE NOTICE 'Dropped trigger: % on table %', 
                     trigger_record.trigger_name, 
                     trigger_record.event_object_table;
    END LOOP;
END $$;

-- ===========================================
-- STEP 9: DROP ALL INDEXES
-- ===========================================

-- Drop all custom indexes (except primary keys)
DO $$ 
DECLARE
    index_record RECORD;
BEGIN
    FOR index_record IN 
        SELECT 
            i.indexname,
            t.tablename
        FROM pg_indexes i
        JOIN pg_tables t ON t.tablename = i.tablename
        WHERE i.schemaname = 'public'
        AND t.schemaname = 'public'
        AND i.indexname NOT LIKE '%_pkey'  -- Keep primary key indexes
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS public.%I CASCADE', index_record.indexname);
        RAISE NOTICE 'Dropped index: % on table %', 
                     index_record.indexname, 
                     index_record.tablename;
    END LOOP;
END $$;

-- ===========================================
-- STEP 10: CLEAN UP SCHEMAS
-- ===========================================

-- Drop custom schemas (except system schemas)
DO $$ 
DECLARE
    schema_name TEXT;
BEGIN
    FOR schema_name IN 
        SELECT s.schema_name 
        FROM information_schema.schemata s
        WHERE s.schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'graphql', 'graphql_public', 'realtime', 'supabase_functions', 'vault', 'pgsodium', 'pgsodium_masks', 'supabase_migrations')
        AND s.schema_name LIKE 'backup_%'  -- Only drop backup schemas
    LOOP
        EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
        RAISE NOTICE 'Dropped schema: %', schema_name;
    END LOOP;
END $$;

-- ===========================================
-- STEP 11: VERIFY CLEANUP
-- ===========================================

-- Show remaining tables (should be empty)
SELECT 
    'Remaining Tables in Public Schema:' as info,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Show remaining functions (should be empty)
SELECT 
    'Remaining Functions in Public Schema:' as info,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.prokind = 'f';

-- Show remaining types (should be empty)
SELECT 
    'Remaining Types in Public Schema:' as info,
    COUNT(*) as count
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
AND t.typtype = 'e';

-- ===========================================
-- STEP 12: COMPLETION MESSAGE
-- ===========================================

SELECT '✅ CLOUD DATABASE COMPLETELY CLEARED!' as message;
SELECT '🎯 READY FOR SCHEMA MIGRATION!' as next_step;
SELECT 'Next: Run 03_schema_synchronization.sql' as instruction;

-- ===========================================
-- STEP 13: SUMMARY
-- ===========================================

SELECT 
    'Database Cleanup Summary:' as info,
    'All tables, functions, types, and data have been removed' as status,
    'Public schema is now empty and ready for migration' as result;

