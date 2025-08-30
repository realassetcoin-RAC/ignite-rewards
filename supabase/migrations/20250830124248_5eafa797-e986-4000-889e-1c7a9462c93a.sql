-- Let's completely recreate the profiles table and fix any schema issues
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recreate the profiles table from scratch
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'customer'::app_role,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert the admin user directly
INSERT INTO public.profiles (id, email, full_name, role) 
VALUES ('884977f6-bda7-4347-91ca-f6b4fab8caa6', 'realassetcoin@gmail.com', 'realassetcoin@gmail.com', 'admin'::app_role)
ON CONFLICT (id) DO UPDATE SET role = 'admin'::app_role;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
CREATE POLICY "Enable read access for users" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable insert access for users" ON public.profiles  
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update access for users" ON public.profiles
FOR UPDATE TO authenticated  
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;