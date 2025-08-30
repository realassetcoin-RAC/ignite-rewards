-- Create the profiles table in the api schema
CREATE TABLE api.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;

-- Create trigger function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'api, public'
AS $$
BEGIN
  INSERT INTO api.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'::public.app_role
  );
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON api.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'api, public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM api.profiles
    WHERE id = _user_id AND role = _role
  );
$$;

-- Create RLS policies for profiles table (after functions are updated to avoid recursion)
CREATE POLICY "Users can view their own profile" ON api.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON api.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON api.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));