-- Fix RLS policies to allow admin access to all tables
-- First, ensure the is_admin function works correctly
DROP FUNCTION IF EXISTS public.is_admin(uuid);

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'::app_role
  );
$$;

-- Update RLS policies for virtual_cards to allow admin full access
DROP POLICY IF EXISTS "Admins can manage all virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Everyone can view active virtual cards" ON public.virtual_cards;

CREATE POLICY "Admins have full access to virtual cards" ON public.virtual_cards
FOR ALL TO authenticated
USING (public.is_admin());

CREATE POLICY "Public can view active virtual cards" ON public.virtual_cards
FOR SELECT TO authenticated
USING (is_active = true OR public.is_admin());

-- Update RLS policies for merchants to allow admin full access
DROP POLICY IF EXISTS "Admins can manage all merchants" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can view their own data" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can update their own data" ON public.merchants;

CREATE POLICY "Admins have full access to merchants" ON public.merchants
FOR ALL TO authenticated
USING (public.is_admin());

CREATE POLICY "Merchants can view own data" ON public.merchants
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Merchants can update own data" ON public.merchants
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Update RLS policies for profiles to allow admin full access
DROP POLICY IF EXISTS "Enable read access for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert access for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for users" ON public.profiles;

CREATE POLICY "Users can access own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL TO authenticated
USING (public.is_admin());

-- Update RLS policies for merchant_cards
DROP POLICY IF EXISTS "Merchants can view their assigned cards" ON public.merchant_cards;
DROP POLICY IF EXISTS "Admins can manage all merchant cards" ON public.merchant_cards;

CREATE POLICY "Merchants can view assigned cards" ON public.merchant_cards
FOR SELECT TO authenticated
USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "Admins have full access to merchant cards" ON public.merchant_cards
FOR ALL TO authenticated
USING (public.is_admin());

-- Update RLS policies for merchant_subscriptions  
DROP POLICY IF EXISTS "Merchants can view their own subscriptions" ON public.merchant_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.merchant_subscriptions;

CREATE POLICY "Merchants can view own subscriptions" ON public.merchant_subscriptions
FOR SELECT TO authenticated
USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "Admins have full access to merchant subscriptions" ON public.merchant_subscriptions
FOR ALL TO authenticated
USING (public.is_admin());

-- Grant additional permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;