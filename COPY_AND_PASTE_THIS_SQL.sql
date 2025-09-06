-- =============================================================================
-- COMPREHENSIVE SUBSCRIPTION PLANS PERMISSION FIX
-- =============================================================================
-- 
-- COPY EVERYTHING BELOW THIS LINE AND PASTE INTO SUPABASE SQL EDITOR
-- =============================================================================

-- Step 1: Ensure the api schema exists and has proper permissions
CREATE SCHEMA IF NOT EXISTS api;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT USAGE ON SCHEMA api TO anon;
GRANT USAGE ON SCHEMA api TO service_role;

-- Step 2: Ensure profiles table exists in api schema for admin checks
CREATE TABLE IF NOT EXISTS api.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON api.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON api.profiles;

CREATE POLICY "Users can view own profile" ON api.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON api.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON api.profiles
  FOR ALL TO service_role USING (true);

-- Grant permissions on profiles
GRANT SELECT, INSERT, UPDATE ON api.profiles TO authenticated;
GRANT SELECT ON api.profiles TO anon;
GRANT ALL ON api.profiles TO service_role;

-- Step 3: Create admin check function
CREATE OR REPLACE FUNCTION api.check_admin_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user has admin role in the profiles table
  RETURN EXISTS (
    SELECT 1 FROM api.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, return false
    RETURN false;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION api.check_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION api.check_admin_access() TO anon;

-- Step 4: Create the merchant_subscription_plans table in api schema
CREATE TABLE IF NOT EXISTS api.merchant_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 5: Enable Row Level Security
ALTER TABLE api.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Public can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Authenticated can manage plans" ON api.merchant_subscription_plans;

-- Step 7: Create comprehensive RLS policies

-- Allow anyone (authenticated and anonymous) to view active plans
CREATE POLICY "Public can view active plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated, anon
USING (is_active = true);

-- Allow admins to view ALL plans (active and inactive)
CREATE POLICY "Admins can view all plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated
USING (api.check_admin_access());

-- Allow admins to insert new plans
CREATE POLICY "Admins can insert plans" 
ON api.merchant_subscription_plans 
FOR INSERT 
TO authenticated
WITH CHECK (api.check_admin_access());

-- Allow admins to update existing plans
CREATE POLICY "Admins can update plans" 
ON api.merchant_subscription_plans 
FOR UPDATE 
TO authenticated
USING (api.check_admin_access())
WITH CHECK (api.check_admin_access());

-- Allow admins to delete plans
CREATE POLICY "Admins can delete plans" 
ON api.merchant_subscription_plans 
FOR DELETE 
TO authenticated
USING (api.check_admin_access());

-- Step 8: Grant necessary table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON api.merchant_subscription_plans TO authenticated;
GRANT SELECT ON api.merchant_subscription_plans TO anon;
GRANT ALL ON api.merchant_subscription_plans TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO service_role;

-- Step 9: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active ON api.merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_name ON api.merchant_subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON api.profiles(role);

-- Step 10: Create or update the trigger function for updated_at
CREATE OR REPLACE FUNCTION api.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 11: Create the trigger
DROP TRIGGER IF EXISTS update_merchant_subscription_plans_updated_at ON api.merchant_subscription_plans;
CREATE TRIGGER update_merchant_subscription_plans_updated_at
  BEFORE UPDATE ON api.merchant_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION api.update_updated_at_column();

-- Step 12: Insert default subscription plans (only if they don't exist)
INSERT INTO api.merchant_subscription_plans (name, description, price_monthly, features, trial_days, is_active) 
VALUES
  ('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support"]'::jsonb, 30, true),
  ('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access"]'::jsonb, 30, true),
  ('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]'::jsonb, 30, true)
ON CONFLICT (name) DO NOTHING;

-- Step 13: Copy existing admin user from public.profiles to api.profiles if it exists
INSERT INTO api.profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
SELECT id, email, full_name, avatar_url, role, created_at, updated_at
FROM public.profiles
WHERE role = 'admin'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role,
  updated_at = now();

-- Step 14: Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SUBSCRIPTION PLANS FIX COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Created api.merchant_subscription_plans table';
  RAISE NOTICE '✅ Set up 5 RLS policies for secure access';
  RAISE NOTICE '✅ Created admin role checking function';
  RAISE NOTICE '✅ Granted all necessary permissions';
  RAISE NOTICE '✅ Added performance indexes';
  RAISE NOTICE '✅ Inserted 3 default subscription plans';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 NEXT: Set your user as admin with:';
  RAISE NOTICE '   UPDATE api.profiles SET role = ''admin'' WHERE email = ''your-email@example.com'';';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Then test the Plans tab in your admin dashboard!';
END $$;