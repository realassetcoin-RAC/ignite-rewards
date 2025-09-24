-- CREATE ADMIN USER PROPERLY
-- This script creates an admin user that will work with the fixed functions

-- ==============================================
-- METHOD 1: UPDATE EXISTING USER TO ADMIN
-- ==============================================

-- If you already have a user in auth.users, update their profile to admin
-- Replace 'USER_EMAIL_HERE' with the actual email of the user you want to make admin
/*
UPDATE public.profiles 
SET 
  role = 'admin',
  full_name = 'System Administrator',
  updated_at = now()
WHERE email = 'USER_EMAIL_HERE';
*/

-- ==============================================
-- METHOD 2: CREATE ADMIN PROFILE FOR SPECIFIC USER
-- ==============================================

-- If you know the UUID of the user from auth.users, use this:
-- Replace 'USER_UUID_HERE' with the actual UUID from auth.users
/*
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  'USER_UUID_HERE',
  'admin@igniterewards.com',
  'System Administrator',
  'admin',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'System Administrator',
  updated_at = now();
*/

-- ==============================================
-- METHOD 3: CREATE ADMIN FOR REALASSETCOIN@GMAIL.COM
-- ==============================================

-- This will create an admin profile for the specific email mentioned in the code
-- Note: The user must first exist in auth.users
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- This will be replaced with actual UUID when user is created in auth
  'realassetcoin@gmail.com',
  'System Administrator',
  'admin',
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  full_name = 'System Administrator',
  updated_at = now();

-- ==============================================
-- VERIFICATION
-- ==============================================

-- Show all admin users
SELECT 
  'Admin users after creation:' as info,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Test admin functions
SELECT 'Testing admin functions...' as test;
SELECT public.is_admin() as is_admin_result;
SELECT public.check_admin_access() as check_admin_result;

-- Show completion
SELECT '✅ Admin user creation completed!' as status;

