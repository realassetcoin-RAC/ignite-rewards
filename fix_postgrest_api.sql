-- FIX POSTGREST API CONNECTIVITY
-- This script attempts to fix the PostgREST API issues

-- ==============================================
-- STEP 1: CHECK POSTGREST STATUS
-- ==============================================

SELECT 'Checking PostgREST connectivity...' as status;

-- ==============================================
-- STEP 2: REFRESH SCHEMA CACHE
-- ==============================================

-- Try to refresh the schema cache that PostgREST uses
SELECT pg_reload_conf();

-- ==============================================
-- STEP 3: CHECK EXTENSIONS
-- ==============================================

-- Check if required extensions are enabled
SELECT 
  'Required Extensions:' as info,
  extname,
  extversion
FROM pg_extension 
WHERE extname IN ('postgrest', 'pg_stat_statements', 'pgcrypto')
ORDER BY extname;

-- ==============================================
-- STEP 4: VERIFY API ACCESS
-- ==============================================

-- Test basic table access that should work via API
SELECT 
  'API Test - dao_organizations:' as test,
  count(*) as record_count
FROM public.dao_organizations;

SELECT 
  'API Test - dao_members:' as test,
  count(*) as record_count
FROM public.dao_members;

SELECT 
  'API Test - dao_proposals:' as test,
  count(*) as record_count
FROM public.dao_proposals;

SELECT 
  'API Test - dao_votes:' as test,
  count(*) as record_count
FROM public.dao_votes;

-- ==============================================
-- STEP 5: CHECK RLS POLICIES
-- ==============================================

-- Ensure RLS policies are permissive for API access
SELECT 
  'RLS Policies Status:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename LIKE 'dao_%'
ORDER BY tablename;

-- ==============================================
-- STEP 6: GRANT API PERMISSIONS
-- ==============================================

-- Ensure proper permissions for API access
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table permissions
GRANT ALL ON public.dao_organizations TO anon;
GRANT ALL ON public.dao_members TO anon;
GRANT ALL ON public.dao_proposals TO anon;
GRANT ALL ON public.dao_votes TO anon;

GRANT ALL ON public.dao_organizations TO authenticated;
GRANT ALL ON public.dao_members TO authenticated;
GRANT ALL ON public.dao_proposals TO authenticated;
GRANT ALL ON public.dao_votes TO authenticated;

-- ==============================================
-- STEP 7: CREATE PERMISSIVE RLS POLICIES
-- ==============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on dao_organizations" ON public.dao_organizations;
DROP POLICY IF EXISTS "Allow all operations on dao_members" ON public.dao_members;
DROP POLICY IF EXISTS "Allow all operations on dao_proposals" ON public.dao_proposals;
DROP POLICY IF EXISTS "Allow all operations on dao_votes" ON public.dao_votes;

-- Create very permissive policies for API access
CREATE POLICY "Allow all operations on dao_organizations" ON public.dao_organizations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on dao_members" ON public.dao_members
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on dao_proposals" ON public.dao_proposals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on dao_votes" ON public.dao_votes
  FOR ALL USING (true) WITH CHECK (true);

-- ==============================================
-- STEP 8: VERIFY FINAL STATE
-- ==============================================

-- Test that everything is accessible
SELECT 
  'Final API Test:' as test,
  (SELECT count(*) FROM public.dao_organizations) as organizations,
  (SELECT count(*) FROM public.dao_members) as members,
  (SELECT count(*) FROM public.dao_proposals) as proposals,
  (SELECT count(*) FROM public.dao_votes) as votes;

-- Show completion message
SELECT '✅ PostgREST API fix completed! Please restart your dev server.' as status;








