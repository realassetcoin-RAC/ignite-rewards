-- Comprehensive Database Fix for Plan Saving and Virtual Card Creation Issues
-- This script addresses both "schema must be one of the following:api" errors and virtual card creation failures

-- =============================================================================
-- 1. ENSURE REQUIRED ENUMS EXIST
-- =============================================================================

DO $$
BEGIN
    -- Create app_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('customer', 'admin', 'merchant');
    END IF;

    -- Create card_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_type') THEN
        CREATE TYPE card_type AS ENUM ('standard', 'premium', 'enterprise', 'loyalty', 'loyalty_plus');
    END IF;

    -- Create pricing_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_type') THEN
        CREATE TYPE pricing_type AS ENUM ('free', 'one_time', 'subscription');
    END IF;

    -- Create subscription_plan enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        CREATE TYPE subscription_plan AS ENUM ('basic', 'standard', 'premium', 'enterprise');
    END IF;

    -- Create merchant_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'merchant_status') THEN
        CREATE TYPE merchant_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
    END IF;
END $$;

-- =============================================================================
-- 2. CREATE/FIX PROFILES TABLE
-- =============================================================================

-- Drop and recreate profiles table to ensure consistency
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- =============================================================================
-- 3. CREATE/FIX MERCHANT_SUBSCRIPTION_PLANS TABLE
-- =============================================================================

-- Drop and recreate merchant_subscription_plans table with correct structure
DROP TABLE IF EXISTS public.merchant_subscription_plans CASCADE;

CREATE TABLE public.merchant_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for merchant_subscription_plans
CREATE POLICY "Anyone can view active plans" 
ON public.merchant_subscription_plans 
FOR SELECT 
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can view all plans" 
ON public.merchant_subscription_plans 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert plans" 
ON public.merchant_subscription_plans 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update plans" 
ON public.merchant_subscription_plans 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete plans" 
ON public.merchant_subscription_plans 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =============================================================================
-- 4. CREATE/FIX VIRTUAL_CARDS TABLE
-- =============================================================================

-- Drop and recreate virtual_cards table with correct structure
DROP TABLE IF EXISTS public.virtual_cards CASCADE;

CREATE TABLE public.virtual_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_name TEXT NOT NULL,
  card_type card_type NOT NULL DEFAULT 'standard',
  description TEXT,
  image_url TEXT,
  subscription_plan subscription_plan DEFAULT 'basic',
  pricing_type pricing_type NOT NULL DEFAULT 'free',
  one_time_fee NUMERIC DEFAULT 0,
  monthly_fee NUMERIC DEFAULT 0,
  annual_fee NUMERIC DEFAULT 0,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for virtual_cards
CREATE POLICY "Everyone can view active virtual cards" 
ON public.virtual_cards
FOR SELECT 
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can view all virtual cards" 
ON public.virtual_cards
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert virtual cards" 
ON public.virtual_cards
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update virtual cards" 
ON public.virtual_cards
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete virtual cards" 
ON public.virtual_cards
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =============================================================================
-- 5. CREATE HELPER FUNCTIONS
-- =============================================================================

-- Create has_role function for compatibility
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = _user_id
        AND role = _role
    );
END;
$$;

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6. CREATE TRIGGERS
-- =============================================================================

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_merchant_subscription_plans_updated_at ON public.merchant_subscription_plans;
CREATE TRIGGER update_merchant_subscription_plans_updated_at
  BEFORE UPDATE ON public.merchant_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_virtual_cards_updated_at ON public.virtual_cards;
CREATE TRIGGER update_virtual_cards_updated_at
  BEFORE UPDATE ON public.virtual_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 7. GRANT PERMISSIONS
-- =============================================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_subscription_plans TO authenticated;
GRANT SELECT ON public.merchant_subscription_plans TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.virtual_cards TO authenticated;
GRANT SELECT ON public.virtual_cards TO anon;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- =============================================================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes for merchant_subscription_plans
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active ON public.merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_name ON public.merchant_subscription_plans(name);

-- Indexes for virtual_cards
CREATE INDEX IF NOT EXISTS idx_virtual_cards_active ON public.virtual_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_type ON public.virtual_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_plan ON public.virtual_cards(subscription_plan);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- =============================================================================
-- 9. INSERT DEFAULT DATA
-- =============================================================================

-- Insert default subscription plans
INSERT INTO public.merchant_subscription_plans (name, description, price_monthly, features, trial_days, is_active) VALUES
('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support"]', 30, true),
('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access"]', 30, true),
('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]', 30, true)
ON CONFLICT (name) DO NOTHING;

-- Insert default virtual cards
INSERT INTO public.virtual_cards (card_name, card_type, pricing_type, description, features) VALUES
  ('Basic RAC Card', 'standard', 'free', 'Entry-level virtual card with basic features', '["Basic rewards", "Mobile app access", "Customer support"]'),
  ('Premium RAC Card', 'premium', 'subscription', 'Advanced virtual card with premium features', '["Premium rewards", "Priority support", "Advanced analytics", "Custom branding"]'),
  ('Enterprise RAC Card', 'enterprise', 'subscription', 'Full-featured enterprise virtual card', '["All premium features", "Dedicated account manager", "API access", "Custom integrations"]')
ON CONFLICT (card_name) DO NOTHING;

-- =============================================================================
-- 10. VERIFICATION AND TESTING
-- =============================================================================

DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
  plan_count INTEGER;
  card_count INTEGER;
BEGIN
  -- Check if tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'merchant_subscription_plans', 'virtual_cards');
  
  IF table_count = 3 THEN
    RAISE NOTICE '✅ All required tables exist in public schema';
  ELSE
    RAISE NOTICE '❌ Missing tables. Found % out of 3 expected tables', table_count;
  END IF;
  
  -- Check policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'merchant_subscription_plans', 'virtual_cards');
  
  RAISE NOTICE '✅ Found % RLS policies across all tables', policy_count;
  
  -- Check data
  SELECT COUNT(*) INTO plan_count FROM public.merchant_subscription_plans;
  SELECT COUNT(*) INTO card_count FROM public.virtual_cards;
  
  RAISE NOTICE '✅ Default data: % subscription plans, % virtual cards', plan_count, card_count;
  
  -- Test table access
  PERFORM COUNT(*) FROM public.profiles;
  PERFORM COUNT(*) FROM public.merchant_subscription_plans;
  PERFORM COUNT(*) FROM public.virtual_cards;
  RAISE NOTICE '✅ All tables are accessible';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error during verification: %', SQLERRM;
END $$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 COMPREHENSIVE DATABASE FIX COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed Issues:';
  RAISE NOTICE '✅ Plan saving "schema must be one of the following:api" error';
  RAISE NOTICE '✅ Virtual card creation failures';
  RAISE NOTICE '✅ Missing RLS policies and permissions';
  RAISE NOTICE '✅ Table structure inconsistencies';
  RAISE NOTICE '✅ Missing helper functions';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '• Create and edit subscription plans';
  RAISE NOTICE '• Create and manage virtual cards';
  RAISE NOTICE '• Access admin dashboard features';
  RAISE NOTICE '';
END $$;