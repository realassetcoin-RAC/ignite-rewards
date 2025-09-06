-- =============================================================================
-- STEP 7: FINAL NUCLEAR FIX - FORCE DISABLE RLS
-- =============================================================================
-- 
-- The previous nuclear fix didn't work completely. This is the final attempt.
-- This script will forcefully disable RLS and ensure the table is accessible.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to the SQL Editor
-- 4. Copy and paste this entire script
-- 5. Click "RUN" to execute
--
-- =============================================================================

-- Force drop and recreate everything
DROP TABLE IF EXISTS api.merchant_subscription_plans CASCADE;

-- Recreate the table
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

-- Ensure RLS is DISABLED
ALTER TABLE api.merchant_subscription_plans DISABLE ROW LEVEL SECURITY;

-- Grant ALL permissions to EVERYONE (temporary!)
GRANT ALL ON api.merchant_subscription_plans TO anon;
GRANT ALL ON api.merchant_subscription_plans TO authenticated;
GRANT ALL ON api.merchant_subscription_plans TO service_role;
GRANT ALL ON api.merchant_subscription_plans TO postgres;

-- Also grant schema permissions
GRANT USAGE ON SCHEMA api TO anon;
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT USAGE ON SCHEMA api TO service_role;
GRANT USAGE ON SCHEMA api TO postgres;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO postgres;

-- Insert test data
INSERT INTO api.merchant_subscription_plans (name, description, price_monthly, features, trial_days, is_active) 
VALUES
  ('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support"]'::jsonb, 30, true),
  ('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access"]'::jsonb, 30, true),
  ('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]'::jsonb, 30, true);

-- Verify RLS is disabled
SELECT 
  'RLS Status Check' as test,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';

-- Test direct access
SELECT 'Direct Table Access Test' as test, COUNT(*) as plan_count FROM api.merchant_subscription_plans;

-- Show all permissions
SELECT 
  'Table Permissions' as test,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'api' 
AND table_name = 'merchant_subscription_plans'
ORDER BY grantee, privilege_type;

-- Final status
DO $$
DECLARE
  rls_enabled boolean;
  plan_count integer;
BEGIN
  -- Check RLS status
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables 
  WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
  
  -- Check plan count
  SELECT COUNT(*) INTO plan_count FROM api.merchant_subscription_plans;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔥 FINAL NUCLEAR FIX COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Status:';
  RAISE NOTICE '   RLS Enabled: %', COALESCE(rls_enabled, false);
  RAISE NOTICE '   Subscription Plans: %', plan_count;
  RAISE NOTICE '';
  
  IF NOT COALESCE(rls_enabled, false) AND plan_count > 0 THEN
    RAISE NOTICE '🎉 SUCCESS! Table should now be fully accessible';
    RAISE NOTICE '⚠️  WARNING: Table is completely public - no security!';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test immediately:';
    RAISE NOTICE '   1. Clear browser cache';
    RAISE NOTICE '   2. Log out and back in';
    RAISE NOTICE '   3. Try the Plans tab';
  ELSE
    RAISE NOTICE '❌ Something is still wrong:';
    IF COALESCE(rls_enabled, false) THEN
      RAISE NOTICE '   • RLS is still enabled';
    END IF;
    IF plan_count = 0 THEN
      RAISE NOTICE '   • No plans inserted';
    END IF;
  END IF;
END $$;