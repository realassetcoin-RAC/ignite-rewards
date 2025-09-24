-- Check for existing triggers and functions that might conflict
-- Run this to see what's causing the api.profiles error

-- ===========================================
-- 1. CHECK FOR TRIGGERS ON AUTH.USERS
-- ===========================================

SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
    AND event_object_schema = 'auth';

-- ===========================================
-- 2. CHECK FOR FUNCTIONS THAT MIGHT REFERENCE API.PROFILES
-- ===========================================

SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_definition LIKE '%api.profiles%';

-- ===========================================
-- 3. CHECK FOR FUNCTIONS THAT MIGHT REFERENCE HANDLE_NEW_USER
-- ===========================================

SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_definition LIKE '%handle_new_user%';

-- ===========================================
-- 4. CHECK FOR EXISTING PROFILES TABLE
-- ===========================================

SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'profiles';

-- ===========================================
-- 5. CHECK FOR API SCHEMA
-- ===========================================

SELECT 
    schema_name
FROM information_schema.schemata 
WHERE schema_name = 'api';
