-- VERIFICATION SCRIPT FOR DATABASE FIXES
-- Run this after applying the consolidated_database_fix.sql to verify everything is working

-- Check if all required functions exist
SELECT 
    'check_admin_access' as function_name,
    EXISTS(
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'check_admin_access'
    ) as exists
UNION ALL
SELECT 
    'get_current_user_profile' as function_name,
    EXISTS(
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'get_current_user_profile'
    ) as exists
UNION ALL
SELECT 
    'is_admin' as function_name,
    EXISTS(
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'is_admin'
    ) as exists;

-- Check profiles table status
SELECT 
    'Total profiles' as metric,
    COUNT(*)::text as value
FROM public.profiles
UNION ALL
SELECT 
    'Admin profiles' as metric,
    COUNT(*)::text as value
FROM public.profiles 
WHERE role = 'admin'
UNION ALL
SELECT 
    'realassetcoin@gmail.com profile' as metric,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.profiles WHERE email = 'realassetcoin@gmail.com') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as value;

-- Test the functions
SELECT 'FUNCTION TESTS' as section, '===================' as details
UNION ALL
SELECT 'is_admin()' as section, 
       CASE 
           WHEN public.is_admin() THEN 'Returns TRUE (user is admin)'
           ELSE 'Returns FALSE (user is not admin)'
       END as details
UNION ALL
SELECT 'check_admin_access()' as section,
       CASE 
           WHEN public.check_admin_access() THEN 'Returns TRUE (user has admin access)'
           ELSE 'Returns FALSE (user does not have admin access)'
       END as details;

-- Run full diagnostic
SELECT public.diagnose_database_health() as diagnostic_results;