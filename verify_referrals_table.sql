-- Quick verification script to check the current state of the referrals table
-- Run this to see what's currently in your database

-- 1. Check if user_referrals table exists in any schema
SELECT 
  table_schema,
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_name = 'user_referrals'
ORDER BY table_schema;

-- 2. If table exists, show its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_referrals'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'user_referrals' 
  AND schemaname = 'public';

-- 4. Check permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name = 'user_referrals';

-- 5. Test basic access
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_referrals')
    THEN 'Table exists in public schema'
    ELSE 'Table does NOT exist in public schema'
  END as table_status;

-- 6. If table exists, test query
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_referrals') THEN
    RAISE NOTICE 'Testing table access...';
    PERFORM COUNT(*) FROM public.user_referrals;
    RAISE NOTICE 'SUCCESS: Table is accessible';
  ELSE
    RAISE NOTICE 'ERROR: Table does not exist in public schema';
  END IF;
END $$;
