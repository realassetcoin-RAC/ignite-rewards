-- Fix RLS policies step by step without dropping the function
-- First, recreate the RLS policies properly

-- Drop existing policies that depend on is_admin and recreate them
DROP POLICY IF EXISTS "Admins can manage all virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Everyone can view active virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Public can view active virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Admins have full access to virtual cards" ON public.virtual_cards;

-- Create new RLS policies for virtual_cards
CREATE POLICY "Admin full access virtual_cards" ON public.virtual_cards
FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Public view active virtual_cards" ON public.virtual_cards
FOR SELECT TO authenticated
USING (is_active = true OR public.is_admin(auth.uid()));

-- Drop and recreate merchants policies
DROP POLICY IF EXISTS "Admins can manage all merchants" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can view their own data" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can update their own data" ON public.merchants;
DROP POLICY IF EXISTS "Admins have full access to merchants" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can view own data" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can update own data" ON public.merchants;

CREATE POLICY "Admin full access merchants" ON public.merchants
FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Merchant view own" ON public.merchants
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Merchant update own" ON public.merchants
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Drop and recreate profiles policies
DROP POLICY IF EXISTS "Enable read access for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert access for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for users" ON public.profiles;
DROP POLICY IF EXISTS "Users can access own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Profile access" ON public.profiles
FOR ALL TO authenticated
USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- Grant permissions to make sure the schema is accessible
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;