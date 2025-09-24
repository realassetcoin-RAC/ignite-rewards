-- ===========================================
-- TEST DATABASE STRUCTURE
-- ===========================================
-- This script checks what exists in your database

-- Check what enums exist
SELECT 'Existing Enums:' as info;
SELECT typname as enum_name, 
       array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typtype = 'e'
GROUP BY typname
ORDER BY typname;

-- Check what tables exist in public schema
SELECT 'Existing Tables in Public Schema:' as info;
SELECT table_name, 
       CASE WHEN table_type = 'BASE TABLE' THEN 'Table' ELSE table_type END as type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check what functions exist
SELECT 'Existing Functions:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Check if profiles table exists and its structure
SELECT 'Profiles Table Structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if merchants table exists and its structure
SELECT 'Merchants Table Structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'merchants'
ORDER BY ordinal_position;

-- Check if merchant_subscription_plans table exists
SELECT 'Merchant Subscription Plans Table Structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'merchant_subscription_plans'
ORDER BY ordinal_position;
