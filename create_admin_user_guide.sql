-- COMPREHENSIVE ADMIN ACCOUNT CREATION GUIDE
-- This script provides multiple methods to create an administrator account

-- ==============================================
-- METHOD 1: CREATE ADMIN VIA SUPABASE AUTH (RECOMMENDED)
-- ==============================================

-- Step 1: First, create the user in Supabase Auth dashboard or via API
-- Go to: Supabase Dashboard > Authentication > Users > Add User
-- Or use the Supabase Management API

-- Step 2: Once the user is created in auth.users, update their profile to admin
-- Replace 'ACTUAL_USER_UUID' with the UUID from auth.users table

/*
UPDATE public.profiles 
SET 
  role = 'admin',
  full_name = 'Administrator',
  updated_at = now()
WHERE id = 'ACTUAL_USER_UUID';
*/

-- ==============================================
-- METHOD 2: CREATE ADMIN PROFILE DIRECTLY
-- ==============================================

-- This method creates a profile record (but user must exist in auth.users first)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  'REPLACE_WITH_ACTUAL_UUID', -- Must be a valid UUID from auth.users
  'admin@igniterewards.com',
  'System Administrator',
  'admin',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'System Administrator',
  updated_at = now();

-- ==============================================
-- METHOD 3: PROMOTE EXISTING USER TO ADMIN
-- ==============================================

-- If you have an existing user, you can promote them to admin
-- Replace 'EXISTING_USER_EMAIL' with the actual email

/*
UPDATE public.profiles 
SET 
  role = 'admin',
  updated_at = now()
WHERE email = 'EXISTING_USER_EMAIL';
*/

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check current admin users
SELECT 
  'Current admin users:' as info,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Count admin users
SELECT 
  'Admin user count:' as info,
  count(*) as admin_count
FROM public.profiles 
WHERE role = 'admin';

-- Test admin functions
SELECT 'Testing admin access functions...' as test;

-- Test if current user is admin (will return false if not logged in as admin)
SELECT public.is_admin() as current_user_is_admin;

-- Test admin access check
SELECT public.check_admin_access() as admin_access_check;

-- ==============================================
-- INSTRUCTIONS FOR MANUAL CREATION
-- ==============================================

/*
TO CREATE AN ADMIN ACCOUNT MANUALLY:

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Users
3. Click "Add User"
4. Enter admin email and password
5. Copy the generated UUID
6. Run this SQL with the actual UUID:

UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'COPIED_UUID_HERE';

OR

INSERT INTO public.profiles (id, email, full_name, role) 
VALUES ('COPIED_UUID_HERE', 'admin@yourcompany.com', 'Admin User', 'admin');
*/
