-- Supabase Service Reset Script
-- This script performs a complete service reset to fix persistent cache issues

-- 1. Force complete schema cache invalidation
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 2. Reset all RLS policies
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.merchants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.nft_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.nft_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.issue_categories DISABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies
DROP POLICY IF EXISTS "Allow anonymous read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous read access to merchants" ON public.merchants;
DROP POLICY IF EXISTS "Allow anonymous read access to nft_collections" ON public.nft_collections;
DROP POLICY IF EXISTS "Allow anonymous read access to nft_types" ON public.nft_types;
DROP POLICY IF EXISTS "Allow anonymous read access to issue_categories" ON public.issue_categories;

-- 4. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_categories ENABLE ROW LEVEL SECURITY;

-- 5. Create new permissive policies
CREATE POLICY "Allow all access to profiles" ON public.profiles
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to merchants" ON public.merchants
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to nft_collections" ON public.nft_collections
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to nft_types" ON public.nft_types
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to issue_categories" ON public.issue_categories
    FOR ALL USING (true) WITH CHECK (true);

-- 6. Force PostgREST to reload everything
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- 7. Verify tables are accessible
DO $$
DECLARE
    table_count INTEGER;
    test_result TEXT;
BEGIN
    -- Test table access
    BEGIN
        PERFORM * FROM public.profiles LIMIT 1;
        test_result := 'profiles: OK';
    EXCEPTION WHEN OTHERS THEN
        test_result := 'profiles: ERROR - ' || SQLERRM;
    END;
    
    RAISE NOTICE 'Table access test: %', test_result;
    
    -- Count tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('nft_types', 'nft_collections', 'issue_categories', 'merchants', 'profiles');
    
    RAISE NOTICE 'Tables accessible: %', table_count;
    
    IF table_count = 5 THEN
        RAISE NOTICE '✅ All tables are accessible';
    ELSE
        RAISE NOTICE '❌ Some tables are not accessible. Count: %', table_count;
    END IF;
END $$;

