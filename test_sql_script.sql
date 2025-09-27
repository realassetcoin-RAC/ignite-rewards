-- Test script to verify the corrected SQL script
-- This script tests the key components without creating all tables

-- Test 1: Check if profiles table exists and has correct structure
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema IN ('public', 'api')
ORDER BY table_schema, ordinal_position;

-- Test 2: Check if app_role enum exists
SELECT 
    typname as enum_name,
    enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname = 'app_role'
ORDER BY e.enumsortorder;

-- Test 3: Check current user profile structure
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
LIMIT 1;

-- Test 4: Verify admin access function works
SELECT public.check_admin_access() as is_admin;
