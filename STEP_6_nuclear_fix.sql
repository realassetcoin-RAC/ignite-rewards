-- =============================================================================
-- STEP 6: NUCLEAR FIX - DISABLE RLS COMPLETELY FOR TESTING
-- =============================================================================
-- 
-- This is the most aggressive fix - it completely disables RLS for testing
-- ⚠️  This is TEMPORARY and INSECURE - only for debugging!
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to the SQL Editor
-- 4. Copy and paste this entire script
-- 5. Click "RUN" to execute
--
-- =============================================================================

-- Completely disable RLS on both tables (TEMPORARY!)
ALTER TABLE api.merchant_subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE api.profiles DISABLE ROW LEVEL SECURITY;

-- Grant maximum permissions
GRANT USAGE ON SCHEMA api TO anon, authenticated, service_role, postgres;
GRANT ALL PRIVILEGES ON api.merchant_subscription_plans TO anon, authenticated, service_role, postgres;
GRANT ALL PRIVILEGES ON api.profiles TO anon, authenticated, service_role, postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA api TO anon, authenticated, service_role, postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA api TO anon, authenticated, service_role, postgres;

-- Ensure tables exist with correct structure
DROP TABLE IF EXISTS api.merchant_subscription_plans CASCADE;
DROP TABLE IF EXISTS api.profiles CASCADE;

CREATE TABLE api.merchant_subscription_plans (
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

CREATE TABLE api.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grant permissions on new tables
GRANT ALL PRIVILEGES ON api.merchant_subscription_plans TO anon, authenticated, service_role, postgres;
GRANT ALL PRIVILEGES ON api.profiles TO anon, authenticated, service_role, postgres;

-- Insert default plans
INSERT INTO api.merchant_subscription_plans (name, description, price_monthly, features, trial_days, is_active) 
VALUES
  ('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support"]'::jsonb, 30, true),
  ('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access"]'::jsonb, 30, true),
  ('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]'::jsonb, 30, true);

-- Create admin users for all existing auth users
INSERT INTO api.profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  'admin',
  COALESCE(u.raw_user_meta_data->>'full_name', 'Admin User'),
  u.created_at,
  now()
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  email = EXCLUDED.email,
  updated_at = now();

-- Test access
SELECT 'Testing Plans Table' as test, COUNT(*) as plan_count FROM api.merchant_subscription_plans;
SELECT 'Testing Profiles Table' as test, COUNT(*) as profile_count, COUNT(*) FILTER (WHERE role = 'admin') as admin_count FROM api.profiles;

-- Show results
DO $$
DECLARE
  plans_count integer;
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO plans_count FROM api.merchant_subscription_plans;
  SELECT COUNT(*) INTO admin_count FROM api.profiles WHERE role = 'admin';
  
  RAISE NOTICE '';
  RAISE NOTICE '💥 NUCLEAR FIX COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  RLS IS COMPLETELY DISABLED - TABLES ARE FULLY PUBLIC!';
  RAISE NOTICE '   This is TEMPORARY and INSECURE - only for testing!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Results:';
  RAISE NOTICE '   Subscription plans: %', plans_count;
  RAISE NOTICE '   Admin users: %', admin_count;
  RAISE NOTICE '';
  
  IF plans_count > 0 AND admin_count > 0 THEN
    RAISE NOTICE '🚀 Tables should now be accessible without any restrictions';
    RAISE NOTICE '   Test your application immediately!';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 IMPORTANT: After testing, you MUST re-enable security!';
  ELSE
    RAISE NOTICE '❌ Something is still wrong - check the output above';
  END IF;
END $$;

-- Show admin users
SELECT 'ADMIN USERS' as info, email, role, created_at FROM api.profiles WHERE role = 'admin' ORDER BY created_at DESC LIMIT 10;