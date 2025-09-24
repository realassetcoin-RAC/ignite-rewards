-- Clean up conflicting triggers and functions
-- This will remove the problematic handle_new_user function and related triggers

-- ===========================================
-- 1. DROP PROBLEMATIC TRIGGERS
-- ===========================================

-- Drop any triggers that might be calling handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_user_profile ON auth.users CASCADE;

-- ===========================================
-- 2. DROP PROBLEMATIC FUNCTIONS
-- ===========================================

-- Drop the handle_new_user function that's trying to insert into api.profiles
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS auth.handle_new_user() CASCADE;

-- Drop any other functions that might reference api.profiles
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;

-- ===========================================
-- 3. VERIFY CLEANUP
-- ===========================================

-- Check if any triggers still exist on auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
    AND event_object_schema = 'auth';

-- Check if any functions still reference api.profiles
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_definition LIKE '%api.profiles%';

-- ===========================================
-- 4. SUCCESS MESSAGE
-- ===========================================

SELECT 'Cleanup completed successfully!' as status;
