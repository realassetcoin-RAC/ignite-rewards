-- =============================================================================
-- MANUAL FIX FOR SUBSCRIPTION PLANS PERMISSION ERROR
-- =============================================================================
-- 
-- This SQL script fixes the "You don't have permission to access subscription plans" error
-- in the admin dashboard when clicking the "Plans" tab.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to the SQL Editor
-- 4. Copy and paste this entire script
-- 5. Click "RUN" to execute
--
-- =============================================================================

-- Step 1: Ensure the table exists in the api schema (since client uses api schema)
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

-- Step 2: Enable Row Level Security
ALTER TABLE api.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON api.merchant_subscription_plans;

-- Step 4: Create comprehensive RLS policies

-- Allow anyone (authenticated and anonymous) to view active plans
CREATE POLICY "Anyone can view active plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated, anon
USING (is_active = true);

-- Allow admins to view ALL plans (active and inactive)
CREATE POLICY "Admins can view all plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to insert new plans
CREATE POLICY "Admins can insert plans" 
ON api.merchant_subscription_plans 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to update existing plans
CREATE POLICY "Admins can update plans" 
ON api.merchant_subscription_plans 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to delete plans
CREATE POLICY "Admins can delete plans" 
ON api.merchant_subscription_plans 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Step 5: Grant necessary table permissions
GRANT USAGE ON SCHEMA api TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.merchant_subscription_plans TO authenticated;
GRANT SELECT ON api.merchant_subscription_plans TO anon;

-- Step 6: Ensure profiles table permissions for admin checks
GRANT SELECT ON api.profiles TO authenticated, anon;

-- Step 7: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active ON api.merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_name ON api.merchant_subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON api.profiles(role);

-- Step 8: Create or update the trigger function for updated_at
CREATE OR REPLACE FUNCTION api.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create the trigger
DROP TRIGGER IF EXISTS update_merchant_subscription_plans_updated_at ON api.merchant_subscription_plans;
CREATE TRIGGER update_merchant_subscription_plans_updated_at
  BEFORE UPDATE ON api.merchant_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION api.update_updated_at_column();

-- Step 10: Insert default subscription plans (only if they don't exist)
INSERT INTO api.merchant_subscription_plans (name, description, price_monthly, features, trial_days, is_active) 
VALUES
  ('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support"]'::jsonb, 30, true),
  ('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access"]'::jsonb, 30, true),
  ('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]'::jsonb, 30, true)
ON CONFLICT (name) DO NOTHING;

-- Step 11: Verification queries
DO $$
DECLARE
  table_exists boolean;
  policies_count integer;
  plans_count integer;
  admin_count integer;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ merchant_subscription_plans table exists in api schema';
  ELSE
    RAISE NOTICE '❌ merchant_subscription_plans table does not exist in api schema';
  END IF;
  
  -- Check policies
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
  
  RAISE NOTICE '✅ Found % RLS policies on merchant_subscription_plans', policies_count;
  
  -- Check default plans
  SELECT COUNT(*) INTO plans_count FROM api.merchant_subscription_plans;
  RAISE NOTICE '✅ Found % subscription plans in the table', plans_count;
  
  -- Check if there are admin users
  SELECT COUNT(*) INTO admin_count FROM api.profiles WHERE role = 'admin';
  RAISE NOTICE '✅ Found % admin users in the system', admin_count;
  
  IF admin_count = 0 THEN
    RAISE NOTICE '⚠️  WARNING: No admin users found. You may need to update a user role to "admin" in the profiles table.';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error during verification: %', SQLERRM;
END $$;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SUBSCRIPTION PLANS FIX COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 What was fixed:';
  RAISE NOTICE '   ✅ Created merchant_subscription_plans table in api schema';
  RAISE NOTICE '   ✅ Enabled Row Level Security (RLS)';
  RAISE NOTICE '   ✅ Created 5 RLS policies for proper access control';
  RAISE NOTICE '   ✅ Granted necessary permissions to authenticated users';
  RAISE NOTICE '   ✅ Added performance indexes';
  RAISE NOTICE '   ✅ Created update trigger for timestamps';
  RAISE NOTICE '   ✅ Inserted 3 default subscription plans';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 The admin dashboard "Plans" tab should now work correctly!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 To test the fix:';
  RAISE NOTICE '   1. Log in as an admin user';
  RAISE NOTICE '   2. Navigate to Admin Dashboard';
  RAISE NOTICE '   3. Click on the "Plans" tab';
  RAISE NOTICE '   4. You should see the subscription plans without permission errors';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  If you still get permission errors, ensure your user has role = "admin" in the api.profiles table.';
END $$;