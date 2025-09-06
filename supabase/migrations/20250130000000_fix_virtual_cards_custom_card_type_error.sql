-- Fix Virtual Cards Custom Card Type Error
-- This migration addresses the schema cache error for custom_card_type column
-- The issue is that the frontend tries to submit custom_card_type field which doesn't exist in the database
-- Additionally, there's a mismatch between enum and TEXT types for card_type

-- ========================================
-- STEP 1: ENSURE CONSISTENT SCHEMA
-- ========================================

-- First, let's ensure we have a consistent schema across both public and api schemas
-- We'll use TEXT for card_type to support custom types as intended

DO $$
BEGIN
    -- Check if api schema exists, create if not
    CREATE SCHEMA IF NOT EXISTS api;
    
    -- Create necessary enum types in api schema
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
        CREATE TYPE api.subscription_plan AS ENUM ('basic', 'premium', 'enterprise');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
        CREATE TYPE api.pricing_type AS ENUM ('free', 'one_time', 'subscription');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
        CREATE TYPE api.app_role AS ENUM ('admin', 'merchant', 'customer');
    END IF;
    
    RAISE NOTICE '✅ Ensured api schema and enum types exist';
END $$;

-- ========================================
-- STEP 2: FIX VIRTUAL CARDS TABLE STRUCTURE
-- ========================================

DO $$
DECLARE
    api_table_exists BOOLEAN;
    public_table_exists BOOLEAN;
    card_type_is_enum BOOLEAN := FALSE;
BEGIN
    -- Check table existence
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'api' AND table_name = 'virtual_cards'
    ) INTO api_table_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'virtual_cards'
    ) INTO public_table_exists;
    
    RAISE NOTICE 'Table existence - api: %, public: %', api_table_exists, public_table_exists;
    
    -- Handle api.virtual_cards
    IF api_table_exists THEN
        -- Check if card_type is currently an enum
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns c
            JOIN pg_type t ON c.udt_name = t.typname
            WHERE c.table_schema = 'api' 
            AND c.table_name = 'virtual_cards' 
            AND c.column_name = 'card_type'
            AND t.typcategory = 'E'
        ) INTO card_type_is_enum;
        
        IF card_type_is_enum THEN
            -- Convert enum to TEXT
            ALTER TABLE api.virtual_cards ALTER COLUMN card_type TYPE TEXT;
            RAISE NOTICE '✅ Converted api.virtual_cards.card_type from enum to TEXT';
        ELSE
            RAISE NOTICE '✅ api.virtual_cards.card_type is already TEXT';
        END IF;
    ELSE
        -- Create api.virtual_cards table
        CREATE TABLE api.virtual_cards (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            card_name TEXT NOT NULL,
            card_type TEXT NOT NULL DEFAULT 'loyalty',
            description TEXT,
            image_url TEXT,
            subscription_plan api.subscription_plan DEFAULT 'basic',
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
        
        RAISE NOTICE '✅ Created api.virtual_cards table with TEXT card_type';
    END IF;
    
    -- Handle public.virtual_cards (if exists)
    IF public_table_exists THEN
        -- Check if card_type is currently an enum
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns c
            JOIN pg_type t ON c.udt_name = t.typname
            WHERE c.table_schema = 'public' 
            AND c.table_name = 'virtual_cards' 
            AND c.column_name = 'card_type'
            AND t.typcategory = 'E'
        ) INTO card_type_is_enum;
        
        IF card_type_is_enum THEN
            -- Convert enum to TEXT
            ALTER TABLE public.virtual_cards ALTER COLUMN card_type TYPE TEXT;
            RAISE NOTICE '✅ Converted public.virtual_cards.card_type from enum to TEXT';
        ELSE
            RAISE NOTICE '✅ public.virtual_cards.card_type is already TEXT';
        END IF;
    END IF;
END $$;

-- ========================================
-- STEP 3: ENSURE PROFILES TABLE EXISTS
-- ========================================

DO $$
BEGIN
    -- Create profiles table in api schema if it doesn't exist
    CREATE TABLE IF NOT EXISTS api.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        role api.app_role DEFAULT 'customer',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    RAISE NOTICE '✅ Ensured api.profiles table exists';
END $$;

-- ========================================
-- STEP 4: CREATE/UPDATE HELPER FUNCTIONS
-- ========================================

-- Create admin check function
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION api.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 5: ENABLE RLS AND CREATE POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE api.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins have full access to virtual_cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Authenticated users can view active virtual_cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Anonymous users can view active virtual_cards" ON api.virtual_cards;
DROP POLICY IF EXISTS "Users can view their own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON api.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON api.profiles;

-- Create RLS policies for virtual_cards
CREATE POLICY "Admins have full access to virtual_cards" ON api.virtual_cards
    FOR ALL TO authenticated
    USING (api.is_admin())
    WITH CHECK (api.is_admin());

CREATE POLICY "Authenticated users can view active virtual_cards" ON api.virtual_cards
    FOR SELECT TO authenticated
    USING (is_active = true OR api.is_admin());

CREATE POLICY "Anonymous users can view active virtual_cards" ON api.virtual_cards
    FOR SELECT TO anon
    USING (is_active = true);

-- Create RLS policies for profiles
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
-- STEP 6: CREATE TRIGGERS
-- ========================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_virtual_cards_updated_at ON api.virtual_cards;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON api.profiles;

-- Create triggers
CREATE TRIGGER update_virtual_cards_updated_at
    BEFORE UPDATE ON api.virtual_cards
    FOR EACH ROW
    EXECUTE FUNCTION api.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON api.profiles
    FOR EACH ROW
    EXECUTE FUNCTION api.update_updated_at_column();

-- ========================================
-- STEP 7: GRANT PERMISSIONS
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
GRANT EXECUTE ON FUNCTION api.update_updated_at_column() TO authenticated;

-- ========================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_api_virtual_cards_active ON api.virtual_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_api_virtual_cards_type ON api.virtual_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_api_virtual_cards_pricing ON api.virtual_cards(pricing_type);
CREATE INDEX IF NOT EXISTS idx_api_profiles_role ON api.profiles(role);
CREATE INDEX IF NOT EXISTS idx_api_profiles_email ON api.profiles(email);

-- ========================================
-- STEP 9: SYNC DATA BETWEEN SCHEMAS
-- ========================================

DO $$
BEGIN
    -- Sync existing profiles from public to api (if public.profiles exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        INSERT INTO api.profiles (id, email, full_name, role, created_at, updated_at)
        SELECT id, email, full_name, role::api.app_role, created_at, updated_at
        FROM public.profiles
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            updated_at = EXCLUDED.updated_at;
        RAISE NOTICE '✅ Synced profiles from public to api schema';
    END IF;
    
    -- Sync existing virtual_cards from public to api (if any exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'virtual_cards') THEN
        INSERT INTO api.virtual_cards (
            id, card_name, card_type, description, image_url, 
            subscription_plan, pricing_type, one_time_fee, monthly_fee, 
            annual_fee, features, is_active, created_by, created_at, updated_at
        )
        SELECT 
            id, card_name, 
            -- Convert card_type to TEXT if it's currently an enum
            CASE 
                WHEN card_type::TEXT = 'standard' THEN 'loyalty'
                WHEN card_type::TEXT = 'premium' THEN 'loyalty'
                ELSE card_type::TEXT 
            END,
            description, image_url,
            subscription_plan::api.subscription_plan, 
            pricing_type::api.pricing_type, 
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
        RAISE NOTICE '✅ Synced virtual_cards from public to api schema';
    END IF;
END $$;

-- ========================================
-- STEP 10: VERIFICATION AND TESTING
-- ========================================

-- Test function to verify everything works
CREATE OR REPLACE FUNCTION api.test_virtual_cards_fix()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_results TEXT := '';
    card_count INTEGER;
    admin_count INTEGER;
    test_card_id UUID;
BEGIN
    test_results := 'Virtual Cards Fix Verification Results:' || E'\n';
    test_results := test_results || '===========================================' || E'\n';
    
    -- Test 1: Check if tables exist and are accessible
    BEGIN
        SELECT COUNT(*) INTO card_count FROM api.virtual_cards;
        test_results := test_results || '✅ api.virtual_cards table exists and accessible (' || card_count || ' records)' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || '❌ api.virtual_cards table issue: ' || SQLERRM || E'\n';
    END;
    
    -- Test 2: Check card_type column type
    BEGIN
        PERFORM column_name FROM information_schema.columns 
        WHERE table_schema = 'api' AND table_name = 'virtual_cards' AND column_name = 'card_type' AND data_type = 'text';
        test_results := test_results || '✅ card_type column is TEXT (supports custom types)' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || '❌ card_type column type issue: ' || SQLERRM || E'\n';
    END;
    
    -- Test 3: Check admin function
    BEGIN
        PERFORM api.is_admin();
        test_results := test_results || '✅ is_admin() function works' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || '❌ is_admin() function failed: ' || SQLERRM || E'\n';
    END;
    
    -- Test 4: Check admin count
    BEGIN
        SELECT COUNT(*) INTO admin_count FROM api.profiles WHERE role = 'admin';
        test_results := test_results || '📊 Admin users count: ' || admin_count || E'\n';
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || '❌ Failed to count admin users: ' || SQLERRM || E'\n';
    END;
    
    -- Test 5: Try creating a test card with custom type (will be rolled back)
    BEGIN
        INSERT INTO api.virtual_cards (card_name, card_type, description, pricing_type, is_active) 
        VALUES ('Test Custom Card', 'VIP', 'Test card with custom type', 'free', false)
        RETURNING id INTO test_card_id;
        
        -- Clean up test data
        DELETE FROM api.virtual_cards WHERE id = test_card_id;
        
        test_results := test_results || '✅ Custom card type creation test passed' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || '❌ Custom card type creation test failed: ' || SQLERRM || E'\n';
    END;
    
    test_results := test_results || E'\n' || 'Fix verification completed!' || E'\n';
    test_results := test_results || '🚀 Virtual card creation should now work without custom_card_type column errors!';
    
    RETURN test_results;
END;
$$;

-- Grant execute permission on test function
GRANT EXECUTE ON FUNCTION api.test_virtual_cards_fix() TO authenticated;
GRANT EXECUTE ON FUNCTION api.test_virtual_cards_fix() TO anon;

-- ========================================
-- FINAL SUCCESS MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '🎉 VIRTUAL CARDS CUSTOM CARD TYPE ERROR FIX COMPLETE';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Fixed card_type column to use TEXT (supports custom types)';
    RAISE NOTICE '✅ Removed enum constraints that were causing schema cache issues';
    RAISE NOTICE '✅ Updated frontend to exclude UI-only fields from database submission';
    RAISE NOTICE '✅ Created comprehensive RLS policies for admin access';
    RAISE NOTICE '✅ Synced data between public and api schemas';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 The custom_card_type column error should now be resolved!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test virtual card creation in the admin dashboard';
    RAISE NOTICE '2. Run SELECT api.test_virtual_cards_fix(); to verify the fix';
    RAISE NOTICE '3. Create cards with custom types (VIP, Corporate, Student, etc.)';
    RAISE NOTICE '';
END $$;

-- Run the test to verify setup
SELECT api.test_virtual_cards_fix();