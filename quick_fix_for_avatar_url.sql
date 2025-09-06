-- Quick fix for the avatar_url column issue
-- Replace lines 185-195 in the original script with this:

-- Step 13: Copy existing admin user from public.profiles to api.profiles if it exists
-- (Fixed to handle missing avatar_url column)
INSERT INTO api.profiles (id, email, full_name, role, created_at, updated_at)
SELECT id, email, full_name, role, created_at, updated_at
FROM public.profiles
WHERE role = 'admin'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = now();
