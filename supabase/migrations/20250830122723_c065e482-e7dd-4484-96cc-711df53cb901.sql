-- Create a simpler admin check function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'::app_role
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Update admin panel RLS policies to use the simpler function
DROP POLICY IF EXISTS "Admins can manage all virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Admins can manage all merchants" ON public.merchants;
DROP POLICY IF EXISTS "Admins can manage all merchant cards" ON public.merchant_cards;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.merchant_subscriptions;

-- Recreate admin policies with the new function
CREATE POLICY "Admins can manage all virtual cards" 
ON public.virtual_cards FOR ALL 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all merchants" 
ON public.merchants FOR ALL 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all merchant cards" 
ON public.merchant_cards FOR ALL 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all subscriptions" 
ON public.merchant_subscriptions FOR ALL 
USING (public.is_admin(auth.uid()));

-- Also allow admins to view all profiles without recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id OR public.is_admin(auth.uid()));