-- =============================================================================
-- ADMIN USER SETUP SCRIPT
-- =============================================================================
-- 
-- This script sets up an admin user in the profiles table.
-- Since the profiles table is empty, we need to create an admin user manually.
--
-- IMPORTANT: Replace 'your-email@example.com' with your actual email address
-- that you use to log into the application.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to the SQL Editor
-- 4. REPLACE 'your-email@example.com' with your actual email
-- 5. Copy and paste this entire script
-- 6. Click "RUN" to execute
--
-- =============================================================================

-- Step 1: Check current auth users
SELECT 
  'Current Auth Users' as info,
  id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Create admin profile for existing auth users
-- Replace 'your-email@example.com' with your actual email address
DO $$
DECLARE
  user_record record;
  admin_email text := 'your-email@example.com'; -- CHANGE THIS TO YOUR EMAIL
BEGIN
  RAISE NOTICE 'Setting up admin user for email: %', admin_email;
  
  -- Find the user in auth.users table
  SELECT id, email INTO user_record
  FROM auth.users 
  WHERE email = admin_email;
  
  IF user_record.id IS NOT NULL THEN
    -- User exists, create/update their profile
    INSERT INTO api.profiles (id, email, role, full_name, created_at, updated_at)
    VALUES (
      user_record.id,
      user_record.email,
      'admin',
      'Admin User',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      email = EXCLUDED.email,
      updated_at = now();
    
    RAISE NOTICE '✅ Admin profile created/updated for user: %', user_record.email;
  ELSE
    RAISE NOTICE '❌ User with email % not found in auth.users table', admin_email;
    RAISE NOTICE 'Available users:';
    
    FOR user_record IN SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 5 LOOP
      RAISE NOTICE '   - %', user_record.email;
    END LOOP;
  END IF;
END $$;

-- Step 3: Alternative - Create admin profile for ALL existing auth users
-- Uncomment this section if you want to make all existing users admin (for testing)
/*
INSERT INTO api.profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
  id,
  email,
  'admin',
  COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
  created_at,
  now()
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  email = EXCLUDED.email,
  updated_at = now();
*/

-- Step 4: Verify the admin setup
SELECT 
  'Admin Users Verification' as info,
  p.id,
  p.email,
  p.role,
  p.created_at
FROM api.profiles p
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;

-- Step 5: Test admin access function (create if needed)
CREATE OR REPLACE FUNCTION api.check_admin_access(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM api.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION api.check_admin_access(uuid) TO authenticated, anon;

-- Test the function
SELECT 
  'Admin Access Test' as info,
  u.email,
  api.check_admin_access(u.id) as has_admin_access
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 5;

-- Step 6: Show final status
DO $$
DECLARE
  total_users integer;
  admin_users integer;
  total_plans integer;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO admin_users FROM api.profiles WHERE role = 'admin';
  SELECT COUNT(*) INTO total_plans FROM api.merchant_subscription_plans;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 FINAL STATUS:';
  RAISE NOTICE '   Total auth users: %', total_users;
  RAISE NOTICE '   Admin profiles: %', admin_users;
  RAISE NOTICE '   Subscription plans: %', total_plans;
  RAISE NOTICE '';
  
  IF admin_users > 0 AND total_plans > 0 THEN
    RAISE NOTICE '🎉 SUCCESS: Admin user and subscription plans are set up!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '   1. Log out of your application';
    RAISE NOTICE '   2. Log back in with the admin email';
    RAISE NOTICE '   3. Navigate to Admin Dashboard → Plans tab';
    RAISE NOTICE '   4. You should now have full access to subscription plans';
  ELSE
    RAISE NOTICE '⚠️  SETUP INCOMPLETE:';
    IF admin_users = 0 THEN
      RAISE NOTICE '   • No admin users found - check the email address in this script';
    END IF;
    IF total_plans = 0 THEN
      RAISE NOTICE '   • No subscription plans found - run the permission fix script first';
    END IF;
  END IF;
END $$;