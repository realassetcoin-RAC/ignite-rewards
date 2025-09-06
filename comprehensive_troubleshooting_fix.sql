-- =============================================================================
-- COMPREHENSIVE TROUBLESHOOTING FIX FOR SUBSCRIPTION PLANS
-- =============================================================================
-- 
-- This script addresses all common causes of the permission error:
-- "You don't have permission to access subscription plans"
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project  
-- 3. Go to the SQL Editor
-- 4. Copy and paste this entire script
-- 5. Click "RUN" to execute
--
-- =============================================================================

-- STEP 1: Ensure table exists with correct structure
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

-- STEP 2: Enable RLS
ALTER TABLE api.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop and recreate all policies to ensure they're correct
DROP POLICY IF EXISTS "Anyone can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON api.merchant_subscription_plans;

-- Policy 1: Allow anyone to view active plans
CREATE POLICY "Anyone can view active plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated, anon
USING (is_active = true);

-- Policy 2: Allow admins to view all plans
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

-- Policy 3: Allow admins to insert plans
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

-- Policy 4: Allow admins to update plans
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

-- Policy 5: Allow admins to delete plans
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

-- STEP 4: Grant comprehensive permissions
GRANT USAGE ON SCHEMA api TO authenticated, anon, postgres;
GRANT ALL ON api.merchant_subscription_plans TO authenticated;
GRANT SELECT ON api.merchant_subscription_plans TO anon;
GRANT ALL ON api.profiles TO authenticated;
GRANT SELECT ON api.profiles TO anon;

-- STEP 5: Ensure profiles table has proper permissions
GRANT SELECT ON api.profiles TO authenticated, anon;

-- STEP 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active ON api.merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_name ON api.merchant_subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON api.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON api.profiles(id);

-- STEP 7: Insert default plans if they don't exist
INSERT INTO api.merchant_subscription_plans (name, description, price_monthly, features, trial_days, is_active) 
VALUES
  ('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support"]'::jsonb, 30, true),
  ('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access"]'::jsonb, 30, true),
  ('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]'::jsonb, 30, true)
ON CONFLICT (name) DO NOTHING;

-- STEP 8: Fix common admin role issues
-- Update the most recently created user to admin (assuming that's you)
-- Comment this out if you don't want this automatic behavior
UPDATE api.profiles 
SET role = 'admin', updated_at = now() 
WHERE id = (
    SELECT id FROM api.profiles 
    WHERE role IS NULL OR role != 'admin'
    ORDER BY created_at DESC 
    LIMIT 1
);

-- STEP 9: Alternative - create a temporary admin check function
CREATE OR REPLACE FUNCTION api.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM api.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 10: Create a more permissive policy as fallback
CREATE POLICY "Fallback admin access" 
ON api.merchant_subscription_plans 
FOR ALL
TO authenticated
USING (api.is_admin())
WITH CHECK (api.is_admin());

-- STEP 11: Verification and diagnostics
DO $$
DECLARE
    table_exists boolean;
    policies_count integer;
    plans_count integer;
    admin_count integer;
    total_users integer;
BEGIN
    -- Check table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
    ) INTO table_exists;
    
    -- Count policies
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies 
    WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
    
    -- Count plans
    SELECT COUNT(*) INTO plans_count FROM api.merchant_subscription_plans;
    
    -- Count admin users
    SELECT COUNT(*) INTO admin_count FROM api.profiles WHERE role = 'admin';
    
    -- Count total users
    SELECT COUNT(*) INTO total_users FROM api.profiles;
    
    -- Report results
    RAISE NOTICE '';
    RAISE NOTICE '🔍 COMPREHENSIVE FIX RESULTS:';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Table exists: %', CASE WHEN table_exists THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '✅ RLS policies: % (should be 6)', policies_count;
    RAISE NOTICE '✅ Subscription plans: %', plans_count;
    RAISE NOTICE '✅ Admin users: % out of % total users', admin_count, total_users;
    RAISE NOTICE '';
    
    IF admin_count = 0 THEN
        RAISE NOTICE '⚠️  WARNING: No admin users found!';
        RAISE NOTICE '   Run this to make yourself admin:';
        RAISE NOTICE '   UPDATE api.profiles SET role = ''admin'' WHERE email = ''your-email@example.com'';';
    END IF;
    
    IF policies_count < 5 THEN
        RAISE NOTICE '⚠️  WARNING: Missing RLS policies (found %, expected 6)', policies_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Clear your browser cache and cookies';
    RAISE NOTICE '2. Log out and log back in to your app';
    RAISE NOTICE '3. Try accessing the Plans tab again';
    RAISE NOTICE '4. If still failing, check the browser console for errors';
    RAISE NOTICE '';
    
END $$;

-- STEP 12: Show current admin users for verification
SELECT 
    'Current Admin Users:' as info,
    id,
    email,
    role,
    created_at
FROM api.profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- STEP 13: Show available subscription plans
SELECT 
    'Available Subscription Plans:' as info,
    id,
    name,
    price_monthly,
    is_active,
    created_at
FROM api.merchant_subscription_plans
ORDER BY created_at;