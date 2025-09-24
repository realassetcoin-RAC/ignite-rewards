-- CREATE ADMINISTRATOR ACCOUNT
-- This script creates an admin user account in the database

-- First, let's check if there are any existing admin users
SELECT 
  'Current admin users:' as info,
  count(*) as admin_count
FROM public.profiles 
WHERE role = 'admin';

-- Create an admin profile (you'll need to replace the UUID with an actual user ID from auth.users)
-- Note: The user must first be created in Supabase Auth, then we can update their profile

-- Method 1: Update existing user to admin role
-- Replace 'USER_UUID_HERE' with the actual UUID of the user you want to make admin
/*
UPDATE public.profiles 
SET role = 'admin', 
    updated_at = now()
WHERE id = 'USER_UUID_HERE';
*/

-- Method 2: Insert new admin profile (if user already exists in auth.users)
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
  'admin@yourcompany.com',
  'Administrator',
  'admin',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = now();
*/

-- Method 3: Create admin user with specific details
-- Replace the values below with your desired admin details
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- This will generate a random UUID
  'admin@igniterewards.com',
  'System Administrator',
  'admin',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = now();

-- Verify the admin account was created
SELECT 
  'Admin account created successfully!' as status,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin';

-- Show all admin users
SELECT 
  'All admin users:' as info,
  count(*) as total_admins
FROM public.profiles 
WHERE role = 'admin';

-- Test admin access function
SELECT 'Testing admin access...' as test;
SELECT public.is_admin() as is_admin_user;
