-- Analyze Current Database Schema
-- Run this in your Supabase SQL Editor to understand your current setup

-- ===========================================
-- 1. CHECK CURRENT MERCHANTS TABLE STRUCTURE
-- ===========================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'merchants' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- 2. CHECK IF SUBSCRIPTION PLANS TABLE EXISTS
-- ===========================================

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%subscription%';

-- ===========================================
-- 3. CHECK CURRENT MERCHANTS DATA
-- ===========================================

SELECT 
    id,
    name,
    description,
    user_id,
    status,
    created_at
FROM merchants 
LIMIT 10;

-- ===========================================
-- 4. CHECK FOR EXISTING FUNCTIONS
-- ===========================================

SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%subscription%';

-- ===========================================
-- 5. CHECK FOR ENUMS
-- ===========================================

SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%subscription%' OR t.typname LIKE '%merchant%'
ORDER BY t.typname, e.enumsortorder;
