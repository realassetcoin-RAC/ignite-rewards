-- Add merchant role to app_role enum
ALTER TYPE api.app_role ADD VALUE IF NOT EXISTS 'merchant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'merchant';

-- Drop existing handle_new_user trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create enhanced handle_new_user function that assigns roles based on signup context
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'api, public'
AS $$
DECLARE
  user_role public.app_role;
  user_full_name TEXT;
BEGIN
  -- Determine user role based on metadata or signup context
  -- Check if user is signing up as merchant
  IF NEW.raw_user_meta_data->>'signup_type' = 'merchant' THEN
    user_role := 'merchant'::public.app_role;
  -- Check if user is being created as admin
  ELSIF NEW.raw_user_meta_data->>'signup_type' = 'admin' THEN
    user_role := 'admin'::public.app_role;
  -- Default to regular user
  ELSE
    user_role := 'user'::public.app_role;
  END IF;

  -- Extract full name from metadata or use email
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Insert into profiles table
  INSERT INTO api.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_role
  );

  -- If user is a merchant, create merchant record
  IF user_role = 'merchant'::public.app_role THEN
    INSERT INTO public.merchants (
      id,
      user_id,
      business_name,
      contact_name,
      email,
      phone,
      website,
      industry,
      address,
      status
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'business_name', 'Unnamed Business'),
      COALESCE(NEW.raw_user_meta_data->>'contact_name', user_full_name),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'website',
      NEW.raw_user_meta_data->>'industry',
      NEW.raw_user_meta_data->>'address',
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to create admin users
CREATE OR REPLACE FUNCTION public.create_admin_user(
  admin_email TEXT,
  admin_password TEXT DEFAULT NULL,
  admin_wallet_address TEXT DEFAULT NULL,
  admin_full_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'api, public'
AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- Check if caller is admin
  IF NOT public.check_admin_access() THEN
    RAISE EXCEPTION 'Only admins can create other admin users';
  END IF;

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- If password is provided, create user with password
  IF admin_password IS NOT NULL THEN
    -- Note: This requires using Supabase Admin API from backend
    -- For now, return instructions
    result := json_build_object(
      'success', false,
      'message', 'Password-based admin creation should be done through Supabase Admin API',
      'email', admin_email,
      'instructions', 'Use Supabase Admin API to create user with admin role metadata'
    );
  -- If wallet address is provided, create wallet-linked admin
  ELSIF admin_wallet_address IS NOT NULL THEN
    -- Generate new user ID
    new_user_id := gen_random_uuid();
    
    -- Create auth user with wallet
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      admin_email,
      crypt('wallet_auth_' || admin_wallet_address, gen_salt('bf')),
      NOW(),
      jsonb_build_object(
        'signup_type', 'admin',
        'wallet_address', admin_wallet_address,
        'full_name', COALESCE(admin_full_name, 'Admin User')
      ),
      NOW(),
      NOW()
    );

    -- The profile will be created by the trigger with admin role
    
    -- Create wallet record
    INSERT INTO public.user_wallets (
      user_id,
      wallet_address,
      wallet_type,
      is_primary
    ) VALUES (
      new_user_id,
      admin_wallet_address,
      'solana',
      true
    );

    result := json_build_object(
      'success', true,
      'user_id', new_user_id,
      'email', admin_email,
      'wallet_address', admin_wallet_address,
      'role', 'admin'
    );
  ELSE
    RAISE EXCEPTION 'Either password or wallet address must be provided';
  END IF;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (will be restricted by function logic)
GRANT EXECUTE ON FUNCTION public.create_admin_user TO authenticated;

-- Update RLS policies for merchants table to allow merchant role users
CREATE POLICY "Merchants can view their own record" ON public.merchants
  FOR SELECT USING (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Merchants can update their own record" ON public.merchants
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Admins can insert merchant records" ON public.merchants
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Admins can delete merchant records" ON public.merchants
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );