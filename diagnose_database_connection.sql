-- DIAGNOSE DATABASE CONNECTION ISSUES
-- This script helps identify what's wrong with the database connection

-- ==============================================
-- STEP 1: CHECK BASIC CONNECTIVITY
-- ==============================================

SELECT 'Database connection test:' as test, now() as current_time;

-- ==============================================
-- STEP 2: CHECK IF DAO TABLES EXIST
-- ==============================================

SELECT 
  'DAO Tables Status:' as status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_organizations') THEN '✅ dao_organizations' ELSE '❌ dao_organizations' END as organizations,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_members') THEN '✅ dao_members' ELSE '❌ dao_members' END as members,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_proposals') THEN '✅ dao_proposals' ELSE '❌ dao_proposals' END as proposals,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_votes') THEN '✅ dao_votes' ELSE '❌ dao_votes' END as votes;

-- ==============================================
-- STEP 3: CHECK RLS POLICIES
-- ==============================================

-- Check RLS status on DAO tables
SELECT 
  'RLS Status:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'dao_%'
ORDER BY tablename;

-- Check RLS policies
SELECT 
  'RLS Policies:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'dao_%'
ORDER BY tablename, policyname;

-- ==============================================
-- STEP 4: TEST BASIC QUERIES
-- ==============================================

-- Test if we can query dao_organizations
SELECT 
  'dao_organizations query test:' as test,
  count(*) as record_count
FROM public.dao_organizations;

-- Test if we can query dao_members
SELECT 
  'dao_members query test:' as test,
  count(*) as record_count
FROM public.dao_members;

-- Test if we can query dao_proposals
SELECT 
  'dao_proposals query test:' as test,
  count(*) as record_count
FROM public.dao_proposals;

-- Test if we can query dao_votes
SELECT 
  'dao_votes query test:' as test,
  count(*) as record_count
FROM public.dao_votes;

-- ==============================================
-- STEP 5: CHECK AUTH CONTEXT
-- ==============================================

-- Check current user context
SELECT 
  'Auth Context:' as info,
  current_user as current_user,
  session_user as session_user,
  current_setting('request.jwt.claims', true) as jwt_claims;

-- ==============================================
-- STEP 6: CHECK FOR DATA
-- ==============================================

-- Show any existing DAO data
SELECT 
  'Existing DAO Data:' as info,
  (SELECT count(*) FROM public.dao_organizations) as organizations,
  (SELECT count(*) FROM public.dao_members) as members,
  (SELECT count(*) FROM public.dao_proposals) as proposals,
  (SELECT count(*) FROM public.dao_votes) as votes;

-- Show sample data if it exists
SELECT 
  'Sample DAO Organizations:' as info,
  id,
  name,
  is_active
FROM public.dao_organizations
LIMIT 3;

-- ==============================================
-- STEP 7: CHECK SCHEMA PERMISSIONS
-- ==============================================

-- Check schema permissions
SELECT 
  'Schema Permissions:' as info,
  schema_name,
  schema_owner
FROM information_schema.schemata 
WHERE schema_name = 'public';

-- Check table permissions
SELECT 
  'Table Permissions:' as info,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name LIKE 'dao_%'
ORDER BY table_name, privilege_type;

-- Show completion message
SELECT '✅ Database diagnosis completed!' as status;









