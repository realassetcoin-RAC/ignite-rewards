-- ===========================================
-- COMPREHENSIVE MERCHANT TABLES ASSESSMENT
-- ===========================================
-- This script analyzes all merchant-related tables and their structures

-- ===========================================
-- 1. CHECK ALL MERCHANT-RELATED TABLES
-- ===========================================

SELECT 'MERCHANT-RELATED TABLES:' as assessment_section;
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%merchant%' OR table_name LIKE '%subscription%')
ORDER BY table_name;

-- ===========================================
-- 2. DETAILED STRUCTURE OF MERCHANTS TABLE
-- ===========================================

SELECT 'MERCHANTS TABLE STRUCTURE:' as assessment_section;
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'merchants'
ORDER BY ordinal_position;

-- ===========================================
-- 3. DETAILED STRUCTURE OF MERCHANT_SUBSCRIPTION_PLANS TABLE
-- ===========================================

SELECT 'MERCHANT_SUBSCRIPTION_PLANS TABLE STRUCTURE:' as assessment_section;
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'merchant_subscription_plans'
ORDER BY ordinal_position;

-- ===========================================
-- 4. CHECK FOR OTHER SUBSCRIPTION-RELATED TABLES
-- ===========================================

SELECT 'OTHER SUBSCRIPTION TABLES:' as assessment_section;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%subscription%' OR table_name LIKE '%plan%')
  AND table_name NOT IN ('merchants', 'merchant_subscription_plans')
ORDER BY table_name, ordinal_position;

-- ===========================================
-- 5. CHECK CONSTRAINTS AND FOREIGN KEYS
-- ===========================================

SELECT 'MERCHANT TABLE CONSTRAINTS:' as assessment_section;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' 
  AND tc.table_name IN ('merchants', 'merchant_subscription_plans')
ORDER BY tc.table_name, tc.constraint_type;

-- ===========================================
-- 6. CHECK INDEXES
-- ===========================================

SELECT 'MERCHANT TABLE INDEXES:' as assessment_section;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('merchants', 'merchant_subscription_plans')
ORDER BY tablename, indexname;

-- ===========================================
-- 7. CHECK EXISTING DATA
-- ===========================================

SELECT 'EXISTING MERCHANTS DATA:' as assessment_section;
SELECT COUNT(*) as merchant_count FROM public.merchants;

SELECT 'EXISTING SUBSCRIPTION PLANS DATA:' as assessment_section;
SELECT COUNT(*) as subscription_plans_count FROM public.merchant_subscription_plans;

-- ===========================================
-- 8. SAMPLE DATA FROM MERCHANTS TABLE
-- ===========================================

SELECT 'SAMPLE MERCHANTS DATA:' as assessment_section;
SELECT * FROM public.merchants LIMIT 3;

-- ===========================================
-- 9. SAMPLE DATA FROM SUBSCRIPTION PLANS TABLE
-- ===========================================

SELECT 'SAMPLE SUBSCRIPTION PLANS DATA:' as assessment_section;
SELECT * FROM public.merchant_subscription_plans LIMIT 3;

-- ===========================================
-- 10. CHECK ENUMS USED IN MERCHANT TABLES
-- ===========================================

SELECT 'ENUMS USED IN MERCHANT TABLES:' as assessment_section;
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN (
    SELECT DISTINCT data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name IN ('merchants', 'merchant_subscription_plans')
      AND data_type LIKE '%enum%'
)
ORDER BY t.typname, e.enumsortorder;

-- ===========================================
-- 11. CHECK FOR TRIGGERS
-- ===========================================

SELECT 'TRIGGERS ON MERCHANT TABLES:' as assessment_section;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
  AND event_object_table IN ('merchants', 'merchant_subscription_plans')
ORDER BY event_object_table, trigger_name;

-- ===========================================
-- 12. CHECK RLS POLICIES
-- ===========================================

SELECT 'RLS POLICIES ON MERCHANT TABLES:' as assessment_section;
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
  AND tablename IN ('merchants', 'merchant_subscription_plans')
ORDER BY tablename, policyname;
