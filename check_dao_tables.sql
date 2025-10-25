-- Check DAO Tables and Policies
-- This script will check the current state of DAO-related tables

-- =============================================================================
-- 1. CHECK IF DAO TABLES EXIST
-- =============================================================================

-- Check dao_organizations table
SELECT 
  'dao_organizations' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'dao_organizations'
    ) THEN 'EXISTS' 
    ELSE 'NOT EXISTS' 
  END as status;

-- Check dao_proposals table
SELECT 
  'dao_proposals' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'dao_proposals'
    ) THEN 'EXISTS' 
    ELSE 'NOT EXISTS' 
  END as status;

-- Check dao_members table
SELECT 
  'dao_members' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'dao_members'
    ) THEN 'EXISTS' 
    ELSE 'NOT EXISTS' 
  END as status;

-- =============================================================================
-- 2. CHECK COLUMNS IN DAO TABLES
-- =============================================================================

-- Check columns in dao_organizations table
SELECT 
  'dao_organizations' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_organizations'
ORDER BY ordinal_position;

-- Check columns in dao_proposals table
SELECT 
  'dao_proposals' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_proposals'
ORDER BY ordinal_position;

-- =============================================================================
-- 3. CHECK RLS POLICIES
-- =============================================================================

-- Check RLS policies on dao_organizations
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'dao_organizations';

-- Check RLS policies on dao_proposals
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'dao_proposals';

-- =============================================================================
-- 4. CHECK DATA IN DAO TABLES
-- =============================================================================

-- Check data in dao_organizations table
SELECT 
  'dao_organizations' as table_name,
  COUNT(*) as row_count,
  string_agg(name, ', ') as organization_names
FROM public.dao_organizations
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'dao_organizations'
);

-- Check data in dao_proposals table
SELECT 
  'dao_proposals' as table_name,
  COUNT(*) as row_count
FROM public.dao_proposals
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'dao_proposals'
);

-- =============================================================================
-- 5. SUMMARY REPORT
-- =============================================================================

DO $$
DECLARE
  dao_orgs_exists boolean;
  dao_proposals_exists boolean;
  dao_members_exists boolean;
  dao_orgs_count integer := 0;
  dao_proposals_count integer := 0;
  dao_orgs_policies integer := 0;
  dao_proposals_policies integer := 0;
BEGIN
  -- Check if tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'dao_organizations'
  ) INTO dao_orgs_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'dao_proposals'
  ) INTO dao_proposals_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'dao_members'
  ) INTO dao_members_exists;
  
  -- Count rows if tables exist
  IF dao_orgs_exists THEN
    SELECT COUNT(*) INTO dao_orgs_count FROM public.dao_organizations;
  END IF;
  
  IF dao_proposals_exists THEN
    SELECT COUNT(*) INTO dao_proposals_count FROM public.dao_proposals;
  END IF;
  
  -- Count policies
  SELECT COUNT(*) INTO dao_orgs_policies
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'dao_organizations';
  
  SELECT COUNT(*) INTO dao_proposals_policies
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'dao_proposals';
  
  -- Report results
  RAISE NOTICE '';
  RAISE NOTICE '=== DAO TABLES CHECK RESULTS ===';
  RAISE NOTICE '';
  RAISE NOTICE 'dao_organizations:';
  RAISE NOTICE '  - Exists: %', dao_orgs_exists;
  RAISE NOTICE '  - Row count: %', dao_orgs_count;
  RAISE NOTICE '  - RLS policies: %', dao_orgs_policies;
  RAISE NOTICE '';
  RAISE NOTICE 'dao_proposals:';
  RAISE NOTICE '  - Exists: %', dao_proposals_exists;
  RAISE NOTICE '  - Row count: %', dao_proposals_count;
  RAISE NOTICE '  - RLS policies: %', dao_proposals_policies;
  RAISE NOTICE '';
  RAISE NOTICE 'dao_members:';
  RAISE NOTICE '  - Exists: %', dao_members_exists;
  RAISE NOTICE '';
  
  IF NOT dao_orgs_exists THEN
    RAISE NOTICE '❌ RECOMMENDATION: Create dao_organizations table';
  ELSIF dao_orgs_count = 0 THEN
    RAISE NOTICE '⚠️  RECOMMENDATION: Insert default DAO organizations';
  END IF;
  
  IF NOT dao_proposals_exists THEN
    RAISE NOTICE '❌ RECOMMENDATION: Create dao_proposals table';
  ELSIF dao_proposals_policies = 0 THEN
    RAISE NOTICE '⚠️  RECOMMENDATION: Set up RLS policies for dao_proposals';
  END IF;
  
  IF NOT dao_members_exists THEN
    RAISE NOTICE '❌ RECOMMENDATION: Create dao_members table';
  END IF;
  
  RAISE NOTICE '';
END $$;
