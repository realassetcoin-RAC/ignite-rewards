-- Drop the problematic RLS policies and recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create simple, working RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles  
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also allow service role full access
CREATE POLICY "Service role can manage profiles" ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);