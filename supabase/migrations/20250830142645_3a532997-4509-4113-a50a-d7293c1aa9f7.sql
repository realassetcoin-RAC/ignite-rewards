-- Drop all existing policies that depend on is_admin function
DROP POLICY IF EXISTS "Admins can manage all merchant cards" ON public.merchant_cards;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.merchant_subscriptions;
DROP POLICY IF EXISTS "Admin full access virtual_cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Public view active virtual_cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Admin full access merchants" ON public.merchants;
DROP POLICY IF EXISTS "Merchant view own" ON public.merchants;
DROP POLICY IF EXISTS "Merchant update own" ON public.merchants;
DROP POLICY IF EXISTS "Profile access" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Public can view active virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Admins have full access to merchants" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can view own data" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can update own data" ON public.merchants;
DROP POLICY IF EXISTS "Users can access own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Merchants can view assigned cards" ON public.merchant_cards;
DROP POLICY IF EXISTS "Admins have full access to merchant cards" ON public.merchant_cards;
DROP POLICY IF EXISTS "Merchants can view own subscriptions" ON public.merchant_subscriptions;
DROP POLICY IF EXISTS "Admins have full access to merchant subscriptions" ON public.merchant_subscriptions;

-- Now recreate the is_admin function
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

-- Create new RLS policies for virtual_cards
CREATE POLICY "Admin full access virtual cards" ON public.virtual_cards
FOR ALL TO authenticated
USING (public.is_admin());

CREATE POLICY "Public view active virtual cards" ON public.virtual_cards
FOR SELECT TO authenticated
USING (is_active = true OR public.is_admin());

-- Create new RLS policies for merchants
CREATE POLICY "Admin full access merchants" ON public.merchants
FOR ALL TO authenticated
USING (public.is_admin());

CREATE POLICY "Merchant view own data" ON public.merchants
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Merchant update own data" ON public.merchants
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Create new RLS policies for profiles
CREATE POLICY "Profile access" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profile insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Profile update" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Create new RLS policies for merchant_cards
CREATE POLICY "Merchant view assigned cards" ON public.merchant_cards
FOR SELECT TO authenticated
USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "Admin manage merchant cards" ON public.merchant_cards
FOR ALL TO authenticated
USING (public.is_admin());

-- Create new RLS policies for merchant_subscriptions  
CREATE POLICY "Merchant view own subscriptions" ON public.merchant_subscriptions
FOR SELECT TO authenticated
USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "Admin manage subscriptions" ON public.merchant_subscriptions
FOR ALL TO authenticated
USING (public.is_admin());

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;