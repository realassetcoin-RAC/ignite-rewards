-- Fix for "Could not find the table 'api.merchant_subscription_plans' in the schema cache"
-- This script addresses the schema mismatch between client configuration and table location

-- ============================================================================
-- OPTION 1: Create the table in the API schema (RECOMMENDED)
-- ============================================================================

-- Create the api schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS api;

-- Create the merchant_subscription_plans table in the api schema
CREATE TABLE IF NOT EXISTS api.merchant_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  features JSONB DEFAULT '[]',
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for api.merchant_subscription_plans
ALTER TABLE api.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api.merchant_subscription_plans
DROP POLICY IF EXISTS "Anyone can view active plans" ON api.merchant_subscription_plans;
CREATE POLICY "Anyone can view active plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage plans" ON api.merchant_subscription_plans;
CREATE POLICY "Admins can manage plans" 
ON api.merchant_subscription_plans 
FOR ALL 
USING (public.check_admin_access());

-- Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_merchant_subscription_plans_updated_at ON api.merchant_subscription_plans;
CREATE TRIGGER update_merchant_subscription_plans_updated_at
  BEFORE UPDATE ON api.merchant_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from public schema to api schema (if any)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans') THEN
    -- Copy data from public to api schema
    INSERT INTO api.merchant_subscription_plans (id, name, description, price_monthly, features, trial_days, is_active, created_at, updated_at)
    SELECT id, name, description, price_monthly, features, trial_days, is_active, created_at, updated_at
    FROM public.merchant_subscription_plans
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Migrated data from public.merchant_subscription_plans to api.merchant_subscription_plans';
  END IF;
END $$;

-- Insert default subscription plans if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM api.merchant_subscription_plans) THEN
    INSERT INTO api.merchant_subscription_plans (name, description, price_monthly, features, trial_days) VALUES
    ('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support"]', 30),
    ('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access"]', 30),
    ('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]', 30);
    
    RAISE NOTICE '✅ Inserted default subscription plans into api.merchant_subscription_plans';
  END IF;
END $$;

-- ============================================================================
-- ENSURE API SCHEMA PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users for the api schema
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA api TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;

-- Grant permissions to anon users for the api schema (for public access)
GRANT USAGE ON SCHEMA api TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA api TO anon;

-- ============================================================================
-- UPDATE MERCHANTS TABLE REFERENCE
-- ============================================================================

-- Update the merchants table to reference the correct schema
DO $$
BEGIN
  -- Check and update the foreign key reference if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'api' AND table_name = 'merchants' AND column_name = 'subscription_plan_id') THEN
    
    -- Drop existing foreign key constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_schema = 'api' AND table_name = 'merchants' 
               AND constraint_type = 'FOREIGN KEY' 
               AND constraint_name LIKE '%subscription_plan%') THEN
      
      ALTER TABLE api.merchants DROP CONSTRAINT IF EXISTS merchants_subscription_plan_id_fkey;
      
    END IF;
    
    -- Add new foreign key constraint to api schema
    ALTER TABLE api.merchants 
    ADD CONSTRAINT merchants_subscription_plan_id_fkey 
    FOREIGN KEY (subscription_plan_id) 
    REFERENCES api.merchant_subscription_plans(id);
    
    RAISE NOTICE '✅ Updated foreign key constraint for api.merchants.subscription_plan_id';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the table exists in the api schema
DO $$
DECLARE
  table_count INTEGER;
  plan_count INTEGER;
BEGIN
  -- Check if table exists
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans';
  
  IF table_count > 0 THEN
    RAISE NOTICE '✅ Table api.merchant_subscription_plans exists';
    
    -- Check data count
    SELECT COUNT(*) INTO plan_count FROM api.merchant_subscription_plans;
    RAISE NOTICE '✅ Found % subscription plans in api.merchant_subscription_plans', plan_count;
  ELSE
    RAISE EXCEPTION '❌ Table api.merchant_subscription_plans was not created successfully';
  END IF;
END $$;

-- Display current plans
SELECT 
  'Current Plans in api.merchant_subscription_plans' as info,
  id, name, price_monthly, is_active, created_at
FROM api.merchant_subscription_plans
ORDER BY created_at;

RAISE NOTICE '✅ Schema fix completed successfully!';
RAISE NOTICE '✅ The api.merchant_subscription_plans table is now available for your application';
RAISE NOTICE '✅ Your Supabase client configured with schema: "api" should now work correctly';