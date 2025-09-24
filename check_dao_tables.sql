-- Check if DAO tables exist and their structure
SELECT 
  'Checking DAO tables existence...' as status;

-- Check if dao_organizations table exists
SELECT 
  'dao_organizations table:' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_organizations') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if dao_members table exists
SELECT 
  'dao_members table:' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_members') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if dao_proposals table exists
SELECT 
  'dao_proposals table:' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_proposals') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if dao_votes table exists
SELECT 
  'dao_votes table:' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_votes') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- If tables exist, show their structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_organizations') THEN
    RAISE NOTICE 'dao_organizations table structure:';
  END IF;
END $$;

-- Show dao_organizations columns if table exists
SELECT 
  'dao_organizations columns:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_organizations'
ORDER BY ordinal_position;

-- Show dao_members columns if table exists
SELECT 
  'dao_members columns:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_members'
ORDER BY ordinal_position;

-- Show dao_proposals columns if table exists
SELECT 
  'dao_proposals columns:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_proposals'
ORDER BY ordinal_position;

-- Show dao_votes columns if table exists
SELECT 
  'dao_votes columns:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_votes'
ORDER BY ordinal_position;

-- Check for any existing data
SELECT 
  'Existing DAO data count:' as info,
  (SELECT count(*) FROM public.dao_organizations) as organizations,
  (SELECT count(*) FROM public.dao_members) as members,
  (SELECT count(*) FROM public.dao_proposals) as proposals,
  (SELECT count(*) FROM public.dao_votes) as votes;

