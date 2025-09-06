-- =============================================================================
-- STEP 3: SET UP ADMIN USER
-- =============================================================================
-- 
-- IMPORTANT: Replace 'your-email@example.com' with your actual email address
-- that you use to log into the application.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project  
-- 3. Go to the SQL Editor
-- 4. REPLACE 'your-email@example.com' with your actual email below
-- 5. Copy and paste this entire script
-- 6. Click "RUN" to execute
--
-- =============================================================================

-- First, let's see what auth users exist
SELECT 
  'Current Auth Users' as info,
  id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

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
    
    RAISE NOTICE '';
    RAISE NOTICE '🔧 To fix this:';
    RAISE NOTICE '   1. Make sure you have signed up/logged into your app at least once';
    RAISE NOTICE '   2. Check the email address is correct';
    RAISE NOTICE '   3. Or manually create admin for an existing user from the list above';
  END IF;
END $$;

-- Verify the admin setup
SELECT 
  'Admin Users Verification' as info,
  p.id,
  p.email,
  p.role,
  p.created_at
FROM api.profiles p
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;

-- Show final status
DO $$
DECLARE
  total_users integer;
  admin_users integer;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO admin_users FROM api.profiles WHERE role = 'admin';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 FINAL STATUS:';
  RAISE NOTICE '   Total auth users: %', total_users;
  RAISE NOTICE '   Admin profiles: %', admin_users;
  RAISE NOTICE '';
  
  IF admin_users > 0 THEN
    RAISE NOTICE '🎉 SUCCESS: Admin user is set up!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '   1. Log out of your application';
    RAISE NOTICE '   2. Log back in with the admin email';
    RAISE NOTICE '   3. Navigate to Admin Dashboard → Plans tab';
    RAISE NOTICE '   4. You should now have access to subscription plans';
  ELSE
    RAISE NOTICE '⚠️  No admin users created - check the email address';
  END IF;
END $$;