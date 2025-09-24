-- COMPREHENSIVE DEBUG TEST FOR SUPABASE CONNECTIVITY
-- This script runs all diagnostic tests to identify the root cause

-- ==============================================
-- STEP 1: BASIC CONNECTIVITY
-- ==============================================

SELECT '🔍 Starting comprehensive debug test...' as status;
SELECT 'Current time:' as info, now() as timestamp;

-- ==============================================
-- STEP 2: CHECK ALL DAO TABLES
-- ==============================================

SELECT 
  '📊 DAO Tables Status:' as info,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_organizations') THEN '✅ dao_organizations' ELSE '❌ dao_organizations' END as organizations,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_members') THEN '✅ dao_members' ELSE '❌ dao_members' END as members,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_proposals') THEN '✅ dao_proposals' ELSE '❌ dao_proposals' END as proposals,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_votes') THEN '✅ dao_votes' ELSE '❌ dao_votes' END as votes;

-- ==============================================
-- STEP 3: CHECK TABLE STRUCTURES
-- ==============================================

-- Check dao_organizations structure
SELECT 
  '🏢 dao_organizations structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_organizations'
ORDER BY ordinal_position;

-- Check dao_members structure
SELECT 
  '👥 dao_members structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_members'
ORDER BY ordinal_position;

-- Check dao_proposals structure
SELECT 
  '📋 dao_proposals structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_proposals'
ORDER BY ordinal_position;

-- Check dao_votes structure
SELECT 
  '🗳️ dao_votes structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_votes'
ORDER BY ordinal_position;

-- ==============================================
-- STEP 4: CHECK RLS POLICIES
-- ==============================================

SELECT 
  '🔒 RLS Status:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename LIKE 'dao_%'
ORDER BY tablename;

-- Show all RLS policies
SELECT 
  '🔐 RLS Policies:' as info,
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
-- STEP 5: CHECK PERMISSIONS
-- ==============================================

-- Check table permissions
SELECT 
  '🔑 Table Permissions:' as info,
  table_schema,
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name LIKE 'dao_%'
  AND grantee IN ('authenticated', 'anon', 'public')
ORDER BY table_name, grantee, privilege_type;

-- ==============================================
-- STEP 6: TEST DATA ACCESS
-- ==============================================

-- Test basic queries
SELECT 
  '📊 Data Counts:' as info,
  (SELECT count(*) FROM public.dao_organizations) as organizations,
  (SELECT count(*) FROM public.dao_members) as members,
  (SELECT count(*) FROM public.dao_proposals) as proposals,
  (SELECT count(*) FROM public.dao_votes) as votes;

-- Test sample data
SELECT 
  '🏢 Sample Organizations:' as info,
  id,
  name,
  is_active,
  created_at
FROM public.dao_organizations
LIMIT 3;

SELECT 
  '👥 Sample Members:' as info,
  id,
  user_email,
  role,
  governance_tokens,
  is_active
FROM public.dao_members
LIMIT 3;

SELECT 
  '📋 Sample Proposals:' as info,
  id,
  title,
  status,
  category,
  created_at
FROM public.dao_proposals
ORDER BY created_at DESC
LIMIT 3;

SELECT 
  '🗳️ Sample Votes:' as info,
  id,
  proposal_id,
  voter_id,
  choice,
  voting_power
FROM public.dao_votes
LIMIT 3;

-- ==============================================
-- STEP 7: CHECK EXTENSIONS
-- ==============================================

SELECT 
  '🔧 Required Extensions:' as info,
  extname,
  extversion,
  extrelocatable
FROM pg_extension 
WHERE extname IN ('postgrest', 'pg_stat_statements', 'pgcrypto', 'uuid-ossp')
ORDER BY extname;

-- ==============================================
-- STEP 8: CHECK SCHEMA PERMISSIONS
-- ==============================================

SELECT 
  '🏗️ Schema Permissions:' as info,
  schema_name,
  schema_owner
FROM information_schema.schemata 
WHERE schema_name = 'public';

-- ==============================================
-- STEP 9: CHECK FOR CONSTRAINTS
-- ==============================================

SELECT 
  '🔗 Foreign Key Constraints:' as info,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name LIKE 'dao_%'
ORDER BY tc.table_name, kcu.column_name;

-- ==============================================
-- STEP 10: CHECK INDEXES
-- ==============================================

SELECT 
  '📇 Indexes:' as info,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'dao_%'
ORDER BY tablename, indexname;

-- ==============================================
-- STEP 11: FINAL DIAGNOSTIC
-- ==============================================

-- Test a complex query that the API would use
SELECT 
  '🧪 Complex Query Test:' as info,
  p.id,
  p.title,
  p.status,
  p.category,
  o.name as dao_name,
  m.user_email as proposer_email
FROM public.dao_proposals p
LEFT JOIN public.dao_organizations o ON p.dao_id = o.id
LEFT JOIN public.dao_members m ON p.proposer_id = m.user_id
ORDER BY p.created_at DESC
LIMIT 1;

-- Show completion message
SELECT '✅ Comprehensive debug test completed!' as status;
SELECT '📋 Summary: Check all results above for any ❌ indicators' as note;







