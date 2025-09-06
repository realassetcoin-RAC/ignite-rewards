-- Test script to verify the referrals fix is working correctly
-- Run this to check if the user_referrals table is properly set up

-- 1. Check if the user_referrals table exists in the correct schema
SELECT 
  table_schema,
  table_name,
  'Table exists' as status
FROM information_schema.tables 
WHERE table_name = 'user_referrals'
ORDER BY table_schema;

-- 2. Check the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_referrals'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_referrals' 
  AND schemaname = 'public';

-- 4. Check permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name = 'user_referrals';

-- 5. Test basic table access (this should work if everything is set up correctly)
SELECT COUNT(*) as referral_count FROM public.user_referrals;

-- 6. Check if referral_campaigns table exists
SELECT COUNT(*) as campaign_count FROM public.referral_campaigns;

-- 7. Check if merchants table exists
SELECT COUNT(*) as merchant_count FROM public.merchants;

-- 8. Verify api.profiles table exists (for admin checks)
SELECT COUNT(*) as profile_count FROM api.profiles;

-- 9. Check current user authentication
SELECT 
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'Authenticated'
    ELSE 'Not authenticated'
  END as auth_status;

-- 10. Check if current user has admin role
SELECT 
  p.id,
  p.email,
  p.role,
  CASE 
    WHEN p.role = 'admin' THEN 'Admin user'
    ELSE 'Regular user'
  END as user_type
FROM api.profiles p
WHERE p.id = auth.uid();
