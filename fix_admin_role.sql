-- =============================================================================
-- FIX ADMIN ROLE - ENSURE YOUR USER HAS ADMIN PERMISSIONS
-- =============================================================================
-- 
-- This script ensures your user has the proper admin role to access
-- subscription plans in the admin dashboard.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to the SQL Editor
-- 4. REPLACE 'your-email@example.com' with your actual email address
-- 5. Copy and paste this entire script
-- 6. Click "RUN" to execute
--
-- =============================================================================

-- STEP 1: Replace this email with YOUR actual email address
-- CHANGE THIS LINE BELOW:
-- UPDATE api.profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- STEP 2: Alternative - if you know your user ID, use this instead:
-- UPDATE api.profiles SET role = 'admin' WHERE id = 'your-user-id-here';

-- STEP 3: Or update the most recently created user to admin (if that's you):
-- UPDATE api.profiles SET role = 'admin' WHERE id = (
--     SELECT id FROM api.profiles ORDER BY created_at DESC LIMIT 1
-- );

-- =============================================================================
-- DIAGNOSTIC QUERIES - Run these first to find your user
-- =============================================================================

-- Find all users in the system
SELECT 
    id,
    email,
    role,
    created_at,
    updated_at
FROM api.profiles 
ORDER BY created_at DESC;

-- Show current admin users
SELECT 
    id,
    email,
    role,
    created_at
FROM api.profiles 
WHERE role = 'admin';

-- Show users by role
SELECT 
    role,
    COUNT(*) as count
FROM api.profiles 
GROUP BY role;

-- =============================================================================
-- INSTRUCTIONS FOR MANUAL UPDATE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ADMIN ROLE DIAGNOSTIC';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Steps to fix admin role:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Look at the query results above';
    RAISE NOTICE '2. Find your user record (by email or most recent)';
    RAISE NOTICE '3. Note your user ID or email';
    RAISE NOTICE '4. Uncomment and modify ONE of these commands:';
    RAISE NOTICE '';
    RAISE NOTICE '   Option A - Update by email:';
    RAISE NOTICE '   UPDATE api.profiles SET role = ''admin'' WHERE email = ''your-email@example.com'';';
    RAISE NOTICE '';
    RAISE NOTICE '   Option B - Update by user ID:';
    RAISE NOTICE '   UPDATE api.profiles SET role = ''admin'' WHERE id = ''your-user-id'';';
    RAISE NOTICE '';
    RAISE NOTICE '   Option C - Update most recent user:';
    RAISE NOTICE '   UPDATE api.profiles SET role = ''admin'' WHERE id = (';
    RAISE NOTICE '       SELECT id FROM api.profiles ORDER BY created_at DESC LIMIT 1';
    RAISE NOTICE '   );';
    RAISE NOTICE '';
    RAISE NOTICE '5. Run the UPDATE command';
    RAISE NOTICE '6. Verify with: SELECT * FROM api.profiles WHERE role = ''admin'';';
    RAISE NOTICE '';
END $$;