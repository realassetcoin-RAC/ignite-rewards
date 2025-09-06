-- Fix critical security vulnerability: Enable RLS on all public tables
-- This addresses the "RLS Disabled in Public" security finding

-- Check which tables in public schema don't have RLS enabled and enable it
DO $$
DECLARE
    table_record RECORD;
    tables_without_rls TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Find all tables in public schema without RLS enabled
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN (
            SELECT tablename 
            FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE t.schemaname = 'public' 
            AND c.relrowsecurity = true
        )
    LOOP
        tables_without_rls := array_append(tables_without_rls, table_record.tablename);
        
        -- Enable RLS on each table
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_record.tablename);
        
        RAISE NOTICE 'Enabled RLS on public.%', table_record.tablename;
    END LOOP;
    
    -- Report results
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE NOTICE 'RLS enabled on % tables: %', array_length(tables_without_rls, 1), array_to_string(tables_without_rls, ', ');
    ELSE
        RAISE NOTICE 'All public tables already have RLS enabled';
    END IF;
END $$;

-- Specifically ensure critical tables have RLS enabled (in case they exist)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Also check and enable RLS on API schema tables if they exist
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Find all tables in api schema without RLS enabled
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'api'
        AND tablename NOT IN (
            SELECT tablename 
            FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE t.schemaname = 'api' 
            AND c.relrowsecurity = true
        )
    LOOP
        -- Enable RLS on each table
        EXECUTE format('ALTER TABLE api.%I ENABLE ROW LEVEL SECURITY;', table_record.tablename);
        
        RAISE NOTICE 'Enabled RLS on api.%', table_record.tablename;
    END LOOP;
END $$;

-- Create a verification function to check RLS status
CREATE OR REPLACE FUNCTION public.verify_rls_status()
RETURNS TABLE(schema_name TEXT, table_name TEXT, rls_enabled BOOLEAN) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        t.schemaname::TEXT,
        t.tablename::TEXT,
        COALESCE(c.relrowsecurity, false) as rls_enabled
    FROM pg_tables t
    LEFT JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname IN ('public', 'api')
    ORDER BY t.schemaname, t.tablename;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.verify_rls_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_rls_status() TO anon;

-- Log final status
RAISE NOTICE 'RLS security fix completed. Run SELECT * FROM verify_rls_status() to check all tables.';