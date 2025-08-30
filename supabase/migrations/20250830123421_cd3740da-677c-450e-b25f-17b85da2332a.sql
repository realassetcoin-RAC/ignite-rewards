-- Create subscribers table for customer subscriptions
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription info
CREATE POLICY "Users can view own subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

-- Create policy for edge functions to update subscription info
CREATE POLICY "Service can update subscriptions" ON public.subscribers
FOR UPDATE
USING (true);

-- Create policy for edge functions to insert subscription info  
CREATE POLICY "Service can insert subscriptions" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Fix the is_admin function with proper search path
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'::app_role
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Test the function works
SELECT public.is_admin('884977f6-bda7-4347-91ca-f6b4fab8caa6'::uuid) as admin_test;