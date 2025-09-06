-- Test script to verify loyalty_transactions table fixes
-- This script tests the new schema and functionality

-- Test 1: Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'loyalty_transactions'
ORDER BY ordinal_position;

-- Test 2: Verify RLS policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'loyalty_transactions'
ORDER BY policyname;

-- Test 3: Verify indexes exist
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'loyalty_transactions'
ORDER BY indexname;

-- Test 4: Verify function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'create_loyalty_transaction';

-- Test 5: Check if old api.loyalty_transactions table was removed
SELECT 
  table_schema,
  table_name
FROM information_schema.tables 
WHERE table_name = 'loyalty_transactions'
ORDER BY table_schema, table_name;
