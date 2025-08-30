-- Fix RLS policies for profiles table to ensure proper access
-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new, more permissive policies for admin access
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));

-- Also ensure the has_role function has proper permissions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;