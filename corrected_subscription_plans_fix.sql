-- =============================================================================
-- CORRECTED SUBSCRIPTION PLANS FIX
-- =============================================================================
-- 
-- This fixes the "status" column error by using the correct column names
-- and structure that matches your existing table.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to the SQL Editor
-- 4. Copy and paste this entire script
-- 5. Click "RUN" to execute
--
-- =============================================================================

-- Step 1: Ensure the table has the correct structure
-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add status column if it doesn't exist (for the policies you want to use)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans' AND column_name = 'status') THEN
        ALTER TABLE api.merchant_subscription_plans ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft'));
        RAISE NOTICE '✅ Added status column';
    END IF;
    
    -- Add price_cents column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans' AND column_name = 'price_cents') THEN
        -- Convert existing price_monthly to price_cents
        ALTER TABLE api.merchant_subscription_plans ADD COLUMN price_cents INTEGER;
        UPDATE api.merchant_subscription_plans SET price_cents = (price_monthly * 100)::INTEGER WHERE price_cents IS NULL;
        RAISE NOTICE '✅ Added price_cents column and converted from price_monthly';
    END IF;
    
    -- Add interval column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans' AND column_name = 'interval') THEN
        ALTER TABLE api.merchant_subscription_plans ADD COLUMN interval TEXT DEFAULT 'monthly';
        RAISE NOTICE '✅ Added interval column';
    END IF;
    
    -- Update existing records to have proper status (convert from is_active if needed)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans' AND column_name = 'is_active') THEN
        UPDATE api.merchant_subscription_plans 
        SET status = CASE WHEN is_active = true THEN 'active' ELSE 'inactive' END 
        WHERE status IS NULL;
        RAISE NOTICE '✅ Updated status column based on is_active values';
    END IF;
    
END $$;

-- Step 2: Enable RLS on the table (if not already enabled)
ALTER TABLE api.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies (if any)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON api.merchant_subscription_plans', r.policyname);
  END LOOP;
  RAISE NOTICE '✅ Dropped existing policies';
END $$;

-- Step 4: Create new policies with correct approach

-- SELECT policy: allow anyone (public) to read only active plans
CREATE POLICY "Public read active plans" ON api.merchant_subscription_plans
FOR SELECT TO anon, authenticated
USING (status = 'active');

-- Admin policies using profiles table (more reliable than JWT)
CREATE POLICY "Admin insert plans" ON api.merchant_subscription_plans
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin update plans" ON api.merchant_subscription_plans
FOR UPDATE TO authenticated
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

CREATE POLICY "Admin delete plans" ON api.merchant_subscription_plans
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Step 5: Grant necessary privileges
GRANT SELECT ON api.merchant_subscription_plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON api.merchant_subscription_plans TO authenticated;
GRANT SELECT ON api.profiles TO authenticated, anon;

-- Step 6: Create indexes to support the policies and frequent queries
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_status ON api.merchant_subscription_plans (status);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_updated_at ON api.merchant_subscription_plans (updated_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON api.profiles(role);

-- Step 7: Create or update the trigger function for updated_at
CREATE OR REPLACE FUNCTION api.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Step 8: Create the trigger
DROP TRIGGER IF EXISTS set_updated_at_trigger ON api.merchant_subscription_plans;
CREATE TRIGGER set_updated_at_trigger
BEFORE UPDATE ON api.merchant_subscription_plans
FOR EACH ROW EXECUTE FUNCTION api.set_updated_at();

-- Step 9: Insert default subscription plans if they do not exist
INSERT INTO api.merchant_subscription_plans (id, name, price_cents, interval, status, created_at, updated_at)
SELECT gen_random_uuid(), 'Basic', 999, 'monthly', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM api.merchant_subscription_plans WHERE name = 'Basic');

INSERT INTO api.merchant_subscription_plans (id, name, price_cents, interval, status, created_at, updated_at)
SELECT gen_random_uuid(), 'Pro', 1999, 'monthly', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM api.merchant_subscription_plans WHERE name = 'Pro');

-- Also ensure our original plans exist with the new structure
INSERT INTO api.merchant_subscription_plans (name, description, price_monthly, price_cents, features, trial_days, status, interval, created_at, updated_at) 
VALUES
  ('Premium', 'Advanced features for growing businesses', 79.99, 7999, '["Advanced analytics", "Custom branding", "Priority support", "API access"]'::jsonb, 30, 'active', 'monthly', NOW(), NOW()),
  ('Enterprise', 'Full-featured solution for large businesses', 199.99, 19999, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]'::jsonb, 30, 'active', 'monthly', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  price_cents = EXCLUDED.price_cents,
  status = EXCLUDED.status,
  interval = EXCLUDED.interval,
  updated_at = NOW();

-- Step 10: Verification
DO $$
DECLARE
    table_exists boolean;
    policies_count integer;
    plans_count integer;
    admin_count integer;
    status_column_exists boolean;
BEGIN
    -- Check table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
    ) INTO table_exists;
    
    -- Check status column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans' AND column_name = 'status'
    ) INTO status_column_exists;
    
    -- Count policies
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies 
    WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
    
    -- Count plans
    SELECT COUNT(*) INTO plans_count FROM api.merchant_subscription_plans;
    
    -- Count admin users
    SELECT COUNT(*) INTO admin_count FROM api.profiles WHERE role = 'admin';
    
    -- Report results
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CORRECTED FIX RESULTS:';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Table exists: %', CASE WHEN table_exists THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '✅ Status column exists: %', CASE WHEN status_column_exists THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '✅ RLS policies: % (should be 4)', policies_count;
    RAISE NOTICE '✅ Subscription plans: %', plans_count;
    RAISE NOTICE '✅ Admin users: %', admin_count;
    RAISE NOTICE '';
    
    IF admin_count = 0 THEN
        RAISE NOTICE '⚠️  WARNING: No admin users found!';
        RAISE NOTICE '   Run this to make yourself admin:';
        RAISE NOTICE '   UPDATE api.profiles SET role = ''admin'' WHERE email = ''your-email@example.com'';';
    END IF;
    
    RAISE NOTICE '🚀 The admin dashboard Plans tab should now work!';
    RAISE NOTICE '';
    
END $$;

-- Step 11: Show current subscription plans
SELECT 
    'Current Subscription Plans:' as info,
    id,
    name,
    price_monthly,
    price_cents,
    status,
    interval,
    is_active,
    created_at
FROM api.merchant_subscription_plans
ORDER BY created_at;