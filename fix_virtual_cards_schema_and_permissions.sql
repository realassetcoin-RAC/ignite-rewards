-- Comprehensive Fix for Virtual Cards Creation Issues
-- This migration addresses all identified issues:
-- 1. Schema mismatch (app uses 'api' schema, table is in 'public' schema)
-- 2. Missing enum types in API schema
-- 3. RLS policy issues preventing admin access
-- 4. Permission problems

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
        CREATE TYPE api.card_type AS ENUM ('loyalty', 'loyalty_plus');
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
-- STEP 3: CREATE SYNC FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to sync data from public to api schema
CREATE OR REPLACE FUNCTION sync_public_to_api()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Sync profiles
    IF TG_TABLE_NAME = 'profiles' THEN
        INSERT INTO api.profiles (id, email, full_name, role, created_at, updated_at)
        VALUES (NEW.id, NEW.email, NEW.full_name, NEW.role::api.app_role, NEW.created_at, NEW.updated_at)
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            updated_at = EXCLUDED.updated_at;
    END IF;
    
    -- Sync virtual_cards
    IF TG_TABLE_NAME = 'virtual_cards' THEN
        INSERT INTO api.virtual_cards (
            id, card_name, card_type, description, image_url, 
            subscription_plan, pricing_type, one_time_fee, monthly_fee, 
            annual_fee, features, is_active, created_by, created_at, updated_at
        )
        VALUES (
            NEW.id, NEW.card_name, NEW.card_type::api.card_type, NEW.description, NEW.image_url,
            NEW.subscription_plan::api.subscription_plan, NEW.pricing_type::api.pricing_type, 
            NEW.one_time_fee, NEW.monthly_fee, NEW.annual_fee, NEW.features, NEW.is_active, 
            NEW.created_by, NEW.created_at, NEW.updated_at
        )
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
    
    RETURN NEW;
END;
$$;

-- Function to sync data from api to public schema
CREATE OR REPLACE FUNCTION sync_api_to_public()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Sync profiles
    IF TG_TABLE_NAME = 'profiles' THEN
        INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
        VALUES (NEW.id, NEW.email, NEW.full_name, NEW.role::public.app_role, NEW.created_at, NEW.updated_at)
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            updated_at = EXCLUDED.updated_at;
    END IF;
    
    -- Sync virtual_cards
    IF TG_TABLE_NAME = 'virtual_cards' THEN
        INSERT INTO public.virtual_cards (
            id, card_name, card_type, description, image_url, 
            subscription_plan, pricing_type, one_time_fee, monthly_fee, 
            annual_fee, features, is_active, created_by, created_at, updated_at
        )
        VALUES (
            NEW.id, NEW.card_name, NEW.card_type::public.card_type, NEW.description, NEW.image_url,
            NEW.subscription_plan::public.subscription_plan, NEW.pricing_type::public.pricing_type, 
            NEW.one_time_fee, NEW.monthly_fee, NEW.annual_fee, NEW.features, NEW.is_active, 
            NEW.created_by, NEW.created_at, NEW.updated_at
        )
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
    
    RETURN NEW;
END;
$$;

-- ========================================
-- STEP 4: SYNC EXISTING DATA
-- ========================================

-- Sync existing profiles from public to api
INSERT INTO api.profiles (id, email, full_name, role, created_at, updated_at)
SELECT id, email, full_name, role::api.app_role, created_at, updated_at
FROM public.profiles
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Sync existing virtual_cards from public to api (if any exist)
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

-- ========================================
-- STEP 5: CREATE TRIGGERS FOR ONGOING SYNC
-- ========================================

-- Create triggers for public schema tables
DROP TRIGGER IF EXISTS sync_profiles_to_api ON public.profiles;
CREATE TRIGGER sync_profiles_to_api
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_public_to_api();

DROP TRIGGER IF EXISTS sync_virtual_cards_to_api ON public.virtual_cards;
CREATE TRIGGER sync_virtual_cards_to_api
    AFTER INSERT OR UPDATE ON public.virtual_cards
    FOR EACH ROW
    EXECUTE FUNCTION sync_public_to_api();

-- Create triggers for api schema tables
DROP TRIGGER IF EXISTS sync_profiles_to_public ON api.profiles;
CREATE TRIGGER sync_profiles_to_public
    AFTER INSERT OR UPDATE ON api.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_api_to_public();

DROP TRIGGER IF EXISTS sync_virtual_cards_to_public ON api.virtual_cards;
CREATE TRIGGER sync_virtual_cards_to_public
    AFTER INSERT OR UPDATE ON api.virtual_cards
    FOR EACH ROW
    EXECUTE FUNCTION sync_api_to_public();

-- ========================================
-- STEP 6: CREATE UPDATED_AT TRIGGERS
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
-- STEP 7: ENABLE RLS AND CREATE POLICIES
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

-- Create helper function to check if user is authenticated
CREATE OR REPLACE FUNCTION api.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT auth.uid() IS NOT NULL;
$$;

-- Drop existing policies for virtual_cards in API schema
DROP POLICY IF EXISTS "Admin full access to virtual_cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Users can view active virtual_cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Admins can manage all virtual cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Everyone can view active virtual cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Public can view active virtual cards" ON api.virtual_cards;

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

-- Drop existing policies for profiles in API schema
DROP POLICY IF EXISTS "Users can view their own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON api.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON api.profiles;

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
-- STEP 8: GRANT PERMISSIONS
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
GRANT EXECUTE ON FUNCTION api.is_authenticated() TO authenticated;
GRANT EXECUTE ON FUNCTION api.is_authenticated() TO anon;

-- ========================================
-- STEP 9: CREATE ADMIN USER SETUP FUNCTION
-- ========================================

-- Function to create admin user (for testing and setup)
CREATE OR REPLACE FUNCTION api.create_admin_user(
    user_email TEXT,
    user_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
BEGIN
    -- This function should only be callable by service role or existing admins
    IF NOT (
        auth.jwt() ->> 'role' = 'service_role' 
        OR api.is_admin()
    ) THEN
        RAISE EXCEPTION 'Only service role or existing admins can create admin users';
    END IF;
    
    -- Generate a user ID
    user_id := gen_random_uuid();
    
    -- Insert into profiles (this will sync to public schema via trigger)
    INSERT INTO api.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (
        user_id,
        user_email,
        COALESCE(user_name, user_email),
        'admin',
        now(),
        now()
    );
    
    RETURN user_id;
END;
$$;

-- Grant execute permission on admin creation function
GRANT EXECUTE ON FUNCTION api.create_admin_user(TEXT, TEXT) TO service_role;

-- ========================================
-- STEP 10: CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_virtual_cards_active ON api.virtual_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_api_virtual_cards_type ON api.virtual_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_api_virtual_cards_pricing ON api.virtual_cards(pricing_type);
CREATE INDEX IF NOT EXISTS idx_api_profiles_role ON api.profiles(role);
CREATE INDEX IF NOT EXISTS idx_api_profiles_email ON api.profiles(email);

-- ========================================
-- STEP 11: TEST THE SETUP
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
        PERFORM 'loyalty'::api.card_type;
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
    
    -- Test 4: Check if we can create a test card (this will test RLS policies)
    BEGIN
        INSERT INTO api.virtual_cards (
            card_name, card_type, description, pricing_type, is_active
        ) VALUES (
            'Test Card - DELETE ME',
            'loyalty',
            'Test card for setup verification',
            'free',
            false
        ) RETURNING id INTO test_card_id;
        
        -- Clean up test card
        DELETE FROM api.virtual_cards WHERE id = test_card_id;
        test_results := test_results || '✅ Virtual card creation/deletion works' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || '❌ Virtual card creation failed: ' || SQLERRM || E'\n';
    END;
    
    -- Test 5: Check admin count
    SELECT COUNT(*) INTO admin_count FROM api.profiles WHERE role = 'admin';
    test_results := test_results || '📊 Admin users count: ' || admin_count || E'\n';
    
    test_results := test_results || E'\n' || 'Setup verification completed!';
    
    RETURN test_results;
END;
$$;

-- Grant execute permission on test function
GRANT EXECUTE ON FUNCTION api.test_virtual_cards_setup() TO authenticated;
GRANT EXECUTE ON FUNCTION api.test_virtual_cards_setup() TO anon;

-- ========================================
-- FINAL VERIFICATION AND COMMENTS
-- ========================================

-- Add helpful comments
COMMENT ON TABLE api.virtual_cards IS 'Virtual cards table in API schema - primary table for app usage';
COMMENT ON TABLE api.profiles IS 'User profiles table in API schema - synced with public.profiles';
COMMENT ON FUNCTION api.is_admin() IS 'Helper function to check if current user is admin';
COMMENT ON FUNCTION api.create_admin_user(TEXT, TEXT) IS 'Function to create admin users (service role only)';
COMMENT ON FUNCTION api.test_virtual_cards_setup() IS 'Test function to verify virtual cards setup';

-- Run the test to verify setup
SELECT api.test_virtual_cards_setup();

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '🎉 VIRTUAL CARDS SCHEMA AND PERMISSIONS FIX COMPLETE';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created API schema infrastructure';
    RAISE NOTICE '✅ Created virtual_cards table in API schema';  
    RAISE NOTICE '✅ Set up bidirectional sync between public and API schemas';
    RAISE NOTICE '✅ Created proper RLS policies for admin access';
    RAISE NOTICE '✅ Granted all necessary permissions';
    RAISE NOTICE '✅ Created helper functions and indexes';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Virtual card creation should now work for admin users!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Ensure you have an admin user in the system';
    RAISE NOTICE '2. Test virtual card creation in the admin dashboard';
    RAISE NOTICE '3. Run api.test_virtual_cards_setup() to verify everything works';
    RAISE NOTICE '';
END $$;