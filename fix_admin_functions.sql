-- FIX ADMIN FUNCTIONS AFTER MIGRATION
-- This script recreates the admin functions to work with the public schema

-- Drop existing admin functions if they exist
DROP FUNCTION IF EXISTS public.check_admin_access();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.has_role(text, uuid);
DROP FUNCTION IF EXISTS public.log_admin_action(text, text, text, jsonb);

-- Recreate check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Recreate is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = COALESCE(user_id, auth.uid()) 
    AND role = 'admin'
  );
$$;

-- Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_role text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = _user_id 
    AND role = _role
  );
$$;

-- Recreate log_admin_action function
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type text,
  table_name text,
  record_id text DEFAULT NULL,
  details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.admin_actions (
    user_id,
    action_type,
    table_name,
    record_id,
    details,
    created_at
  ) VALUES (
    auth.uid(),
    action_type,
    table_name,
    record_id,
    details,
    now()
  );
$$;

-- Create admin_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on admin_actions table
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admin_actions
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Test the functions
SELECT 'Testing fixed admin functions...' as test;

-- Test check_admin_access
SELECT 
  'check_admin_access() result:' as function,
  public.check_admin_access() as result;

-- Test is_admin
SELECT 
  'is_admin() result:' as function,
  public.is_admin() as result;

-- Test has_role
SELECT 
  'has_role() test:' as function,
  public.has_role('admin', auth.uid()) as result;

-- Show current user info
SELECT 
  'Current user info:' as info,
  auth.uid() as user_id,
  (SELECT email FROM public.profiles WHERE id = auth.uid()) as email,
  (SELECT role FROM public.profiles WHERE id = auth.uid()) as role;

-- Show all admin users
SELECT 
  'All admin users:' as info,
  id,
  email,
  full_name,
  role
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Show completion message
SELECT '✅ Admin functions fixed and ready to use!' as status;
