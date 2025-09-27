-- TEST SUPABASE CONNECTION
-- This script tests basic connectivity and table access

-- ==============================================
-- STEP 1: BASIC CONNECTIVITY TEST
-- ==============================================

SELECT 'Connection test:' as test, now() as current_time;

-- ==============================================
-- STEP 2: CHECK IF TABLES EXIST
-- ==============================================

SELECT 
  'Table existence check:' as info,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_organizations') THEN '✅ dao_organizations' ELSE '❌ dao_organizations' END as organizations,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_members') THEN '✅ dao_members' ELSE '❌ dao_members' END as members,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_proposals') THEN '✅ dao_proposals' ELSE '❌ dao_proposals' END as proposals,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_votes') THEN '✅ dao_votes' ELSE '❌ dao_votes' END as votes;

-- ==============================================
-- STEP 3: TEST BASIC QUERIES
-- ==============================================

-- Test dao_organizations
SELECT 
  'dao_organizations test:' as test,
  count(*) as record_count
FROM public.dao_organizations;

-- Test dao_members
SELECT 
  'dao_members test:' as test,
  count(*) as record_count
FROM public.dao_members;

-- Test dao_proposals
SELECT 
  'dao_proposals test:' as test,
  count(*) as record_count
FROM public.dao_proposals;

-- Test dao_votes
SELECT 
  'dao_votes test:' as test,
  count(*) as record_count
FROM public.dao_votes;

-- ==============================================
-- STEP 4: CHECK RLS STATUS
-- ==============================================

SELECT 
  'RLS Status:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'dao_%'
ORDER BY tablename;

-- ==============================================
-- STEP 5: CHECK PERMISSIONS
-- ==============================================

SELECT 
  'Table Permissions:' as info,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name LIKE 'dao_%'
  AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, privilege_type;

-- Show completion message
SELECT '✅ Supabase connection test completed!' as status;








