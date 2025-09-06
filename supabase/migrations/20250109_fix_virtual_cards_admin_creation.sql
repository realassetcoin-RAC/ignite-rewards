-- Fix Virtual Cards Admin Creation Issues
-- This migration addresses the core issues preventing virtual card creation:
-- 1. Schema mismatch (app uses 'api' schema, table is in 'public' schema)
-- 2. Missing enum types in API schema
-- 3. RLS policy issues preventing admin access

-- ========================================
-- STEP 1: CREATE API SCHEMA INFRASTRUCTURE
-- ========================================

-- Ensure API schema exists
CREATE SCHEMA IF NOT EXISTS api;

-- Create enum types in API schema (matching public schema)
DO $$
BEGIN
    -- Check and create card_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
        CREATE TYPE api.card_type AS ENUM ('rewards', 'loyalty', 'membership', 'gift', 'loyalty_plus');
    END IF;
    
    -- Check and create subscription_plan enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
        CREATE TYPE api.subscription_plan AS ENUM ('basic', 'premium', 'enterprise');
    END IF;
    
    -- Check and create pricing_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
        CREATE TYPE api.pricing_type AS ENUM ('free', 'one_time', 'subscription');
    END IF;
    
    -- Check and create app_role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
        CREATE TYPE api.app_role AS ENUM ('admin', 'merchant', 'customer');
    END IF;
END $$;

-- ========================================
-- STEP 2: CREATE VIRTUAL CARDS TABLE IN API SCHEMA
-- ========================================

-- Create virtual_cards table in API schema
CREATE TABLE IF NOT EXISTS api.virtual_cards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    card_name TEXT NOT NULL,
    card_type api.card_type NOT NULL,
    description TEXT,
    image_url TEXT,
    subscription_plan api.subscription_plan,
    pricing_type api.pricing_type NOT NULL DEFAULT 'free',
    one_time_fee DECIMAL(10,2) DEFAULT 0,
    monthly_fee DECIMAL(10,2) DEFAULT 0,
    annual_fee DECIMAL(10,2) DEFAULT 0,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table in API schema if it doesn't exist
CREATE TABLE IF NOT EXISTS api.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role api.app_role DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- STEP 3: SYNC EXISTING DATA
-- ========================================

-- Sync existing profiles from public to api (if public.profiles exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        INSERT INTO api.profiles (id, email, full_name, role, created_at, updated_at)
        SELECT id, email, full_name, role::api.app_role, created_at, updated_at
        FROM public.profiles
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            updated_at = EXCLUDED.updated_at;
    END IF;
END $$;

-- Sync existing virtual_cards from public to api (if any exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'virtual_cards') THEN
        INSERT INTO api.virtual_cards (
            id, card_name, card_type, description, image_url, 
            subscription_plan, pricing_type, one_time_fee, monthly_fee, 
            annual_fee, features, is_active, created_by, created_at, updated_at
        )
        SELECT 
            id, card_name, card_type::api.card_type, description, image_url,
            subscription_plan::api.subscription_plan, pricing_type::api.pricing_type, 
            one_time_fee, monthly_fee, annual_fee, features, is_active, 
            created_by, created_at, updated_at
        FROM public.virtual_cards
        ON CONFLICT (id) DO UPDATE SET
            card_name = EXCLUDED.card_name,
            card_type = EXCLUDED.card_type,
            description = EXCLUDED.description,
            image_url = EXCLUDED.image_url,
            subscription_plan = EXCLUDED.subscription_plan,
            pricing_type = EXCLUDED.pricing_type,
            one_time_fee = EXCLUDED.one_time_fee,
            monthly_fee = EXCLUDED.monthly_fee,
            annual_fee = EXCLUDED.annual_fee,
            features = EXCLUDED.features,
            is_active = EXCLUDED.is_active,
            created_by = EXCLUDED.created_by,
            updated_at = EXCLUDED.updated_at;
    END IF;
END $$;

-- ========================================
-- STEP 4: CREATE UPDATED_AT TRIGGERS
-- ========================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION api.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for API schema tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON api.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON api.profiles
    FOR EACH ROW
    EXECUTE FUNCTION api.update_updated_at_column();

DROP TRIGGER IF EXISTS update_virtual_cards_updated_at ON api.virtual_cards;
CREATE TRIGGER update_virtual_cards_updated_at
    BEFORE UPDATE ON api.virtual_cards
    FOR EACH ROW
    EXECUTE FUNCTION api.update_updated_at_column();

-- ========================================
-- STEP 5: ENABLE RLS AND CREATE POLICIES
-- ========================================

-- Enable RLS on API schema tables
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.virtual_cards ENABLE ROW LEVEL SECURITY;

-- Create helper function to check admin role in API schema
CREATE OR REPLACE FUNCTION api.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM api.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Drop existing conflicting policies for virtual_cards in API schema
DROP POLICY IF EXISTS "Admin full access to virtual_cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Users can view active virtual_cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Admins can manage all virtual cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Everyone can view active virtual cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Public can view active virtual cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Admins have full access to virtual_cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Authenticated users can view active virtual_cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Anonymous users can view active virtual_cards" ON api.virtual_cards;

-- Create comprehensive RLS policies for virtual_cards in API schema
CREATE POLICY "Admins have full access to virtual_cards" ON api.virtual_cards
    FOR ALL TO authenticated
    USING (api.is_admin())
    WITH CHECK (api.is_admin());

CREATE POLICY "Authenticated users can view active virtual_cards" ON api.virtual_cards
    FOR SELECT TO authenticated
    USING (is_active = true OR api.is_admin());

-- Allow anonymous users to view active virtual cards (for public display)
CREATE POLICY "Anonymous users can view active virtual_cards" ON api.virtual_cards
    FOR SELECT TO anon
    USING (is_active = true);

-- Drop existing conflicting policies for profiles in API schema
DROP POLICY IF EXISTS "Users can view their own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON api.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON api.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON api.profiles;

-- Create RLS policies for profiles in API schema
CREATE POLICY "Users can view their own profile" ON api.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR api.is_admin());

CREATE POLICY "Users can update their own profile" ON api.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id OR api.is_admin())
    WITH CHECK (auth.uid() = id OR api.is_admin());

CREATE POLICY "Users can insert their own profile" ON api.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id OR api.is_admin());

CREATE POLICY "Admins can manage all profiles" ON api.profiles
    FOR ALL TO authenticated
    USING (api.is_admin())
    WITH CHECK (api.is_admin());

-- ========================================
-- STEP 6: GRANT PERMISSIONS
-- ========================================

-- Grant schema usage
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT USAGE ON SCHEMA api TO anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON api.virtual_cards TO authenticated;
GRANT SELECT ON api.virtual_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.profiles TO authenticated;
GRANT SELECT ON api.profiles TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO anon;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION api.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION api.is_admin() TO anon;

-- ========================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_virtual_cards_active ON api.virtual_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_api_virtual_cards_type ON api.virtual_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_api_virtual_cards_pricing ON api.virtual_cards(pricing_type);
CREATE INDEX IF NOT EXISTS idx_api_profiles_role ON api.profiles(role);
CREATE INDEX IF NOT EXISTS idx_api_profiles_email ON api.profiles(email);

-- ========================================
-- STEP 8: CREATE TEST ADMIN USER FUNCTION
-- ========================================

-- Function to create admin user for testing
CREATE OR REPLACE FUNCTION api.create_test_admin(
    user_email TEXT DEFAULT 'admin@pointbridge.com',
    user_name TEXT DEFAULT 'Test Admin'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Generate a user ID
    user_id := gen_random_uuid();
    
    -- Insert into profiles
    INSERT INTO api.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (
        user_id,
        user_email,
        user_name,
        'admin',
        now(),
        now()
    )
    ON CONFLICT (email) DO UPDATE SET
        role = 'admin',
        updated_at = now()
    RETURNING id INTO user_id;
    
    RETURN user_id;
END;
$$;

-- Grant execute permission on admin creation function
GRANT EXECUTE ON FUNCTION api.create_test_admin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION api.create_test_admin(TEXT, TEXT) TO anon;

-- ========================================
-- STEP 9: TEST THE SETUP
-- ========================================

-- Test function to verify everything works
CREATE OR REPLACE FUNCTION api.test_virtual_cards_setup()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_results TEXT := '';
    test_card_id UUID;
    admin_count INTEGER;
    card_count INTEGER;
BEGIN
    test_results := 'Virtual Cards Setup Test Results:' || E'\n';
    
    -- Test 1: Check if enums exist
    BEGIN
        PERFORM 'rewards'::api.card_type;
        test_results := test_results || '✅ card_type enum exists' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || '❌ card_type enum missing: ' || SQLERRM || E'\n';
    END;
    
    -- Test 2: Check if tables exist
    SELECT COUNT(*) INTO card_count FROM api.virtual_cards;
    test_results := test_results || '✅ virtual_cards table exists (' || card_count || ' records)' || E'\n';
    
    -- Test 3: Check admin function
    BEGIN
        PERFORM api.is_admin();
        test_results := test_results || '✅ is_admin() function works' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || '❌ is_admin() function failed: ' || SQLERRM || E'\n';
    END;
    
    -- Test 4: Check admin count
    SELECT COUNT(*) INTO admin_count FROM api.profiles WHERE role = 'admin';
    test_results := test_results || '📊 Admin users count: ' || admin_count || E'\n';
    
    -- Test 5: Create test admin if none exist
    IF admin_count = 0 THEN
        BEGIN
            PERFORM api.create_test_admin();
            test_results := test_results || '✅ Created test admin user' || E'\n';
        EXCEPTION WHEN OTHERS THEN
            test_results := test_results || '❌ Failed to create test admin: ' || SQLERRM || E'\n';
        END;
    END IF;
    
    test_results := test_results || E'\n' || 'Setup verification completed!';
    
    RETURN test_results;
END;
$$;

-- Grant execute permission on test function
GRANT EXECUTE ON FUNCTION api.test_virtual_cards_setup() TO authenticated;
GRANT EXECUTE ON FUNCTION api.test_virtual_cards_setup() TO anon;

-- ========================================
-- FINAL VERIFICATION
-- ========================================

-- Add helpful comments
COMMENT ON TABLE api.virtual_cards IS 'Virtual cards table in API schema - primary table for app usage';
COMMENT ON TABLE api.profiles IS 'User profiles table in API schema - synced with public.profiles';
COMMENT ON FUNCTION api.is_admin() IS 'Helper function to check if current user is admin';
COMMENT ON FUNCTION api.create_test_admin(TEXT, TEXT) IS 'Function to create test admin users';
COMMENT ON FUNCTION api.test_virtual_cards_setup() IS 'Test function to verify virtual cards setup';

-- Run the test to verify setup
SELECT api.test_virtual_cards_setup();

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '🎉 VIRTUAL CARDS ADMIN CREATION FIX COMPLETE';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created API schema infrastructure';
    RAISE NOTICE '✅ Created virtual_cards table in API schema';  
    RAISE NOTICE '✅ Created proper RLS policies for admin access';
    RAISE NOTICE '✅ Granted all necessary permissions';
    RAISE NOTICE '✅ Created helper functions and indexes';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Virtual card creation should now work for admin users!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Ensure you have an admin user in the system';
    RAISE NOTICE '2. Test virtual card creation in the admin dashboard';
    RAISE NOTICE '3. Run SELECT api.test_virtual_cards_setup(); to verify setup';
    RAISE NOTICE '';
END $$;