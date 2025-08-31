-- Update the admin access functions with correct search path
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'api, public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM api.profiles 
    WHERE id = auth.uid() AND role = 'admin'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(id uuid, email text, full_name text, role text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'api, public'
AS $$
  SELECT p.id, p.email, p.full_name, p.role::text, p.created_at, p.updated_at
  FROM api.profiles p
  WHERE p.id = auth.uid();
$$;

-- Update existing user to admin role (update any existing user with the email from auth logs)
UPDATE api.profiles 
SET role = 'admin'::public.app_role 
WHERE email = 'realassetcoin@gmail.com';