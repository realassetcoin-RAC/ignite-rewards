-- Fix card_type to support custom types
-- This changes card_type from enum to TEXT to allow Standard, Premium, and custom types

-- First, let's check if the virtual_cards table exists and what its current structure is
DO $$
BEGIN
    -- If the table exists in public schema, alter it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'virtual_cards') THEN
        -- Drop the enum constraint and change to TEXT
        ALTER TABLE public.virtual_cards ALTER COLUMN card_type TYPE TEXT;
        RAISE NOTICE '✅ Updated public.virtual_cards.card_type to TEXT';
    END IF;
    
    -- If the table exists in api schema, alter it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'virtual_cards') THEN
        -- Drop the enum constraint and change to TEXT  
        ALTER TABLE api.virtual_cards ALTER COLUMN card_type TYPE TEXT;
        RAISE NOTICE '✅ Updated api.virtual_cards.card_type to TEXT';
    END IF;
    
    -- If neither table exists, we'll create the api one
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'virtual_cards') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'virtual_cards') THEN
        
        -- Ensure API schema exists
        CREATE SCHEMA IF NOT EXISTS api;
        
        -- Create enum types we need (except card_type which will be TEXT)
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
            CREATE TYPE api.subscription_plan AS ENUM ('basic', 'premium', 'enterprise');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
            CREATE TYPE api.pricing_type AS ENUM ('free', 'one_time', 'subscription');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api')) THEN
            CREATE TYPE api.app_role AS ENUM ('admin', 'merchant', 'customer');
        END IF;
        
        -- Create virtual_cards table with TEXT card_type
        CREATE TABLE api.virtual_cards (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            card_name TEXT NOT NULL,
            card_type TEXT NOT NULL DEFAULT 'Standard', -- TEXT to support custom types
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
        
        -- Create profiles table
        CREATE TABLE IF NOT EXISTS api.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            role api.app_role DEFAULT 'customer',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE api.virtual_cards ENABLE ROW LEVEL SECURITY;
        ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;
        
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
        
        -- Create RLS policies
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
        
        -- Grant permissions
        GRANT USAGE ON SCHEMA api TO authenticated;
        GRANT USAGE ON SCHEMA api TO anon;
        GRANT SELECT, INSERT, UPDATE, DELETE ON api.virtual_cards TO authenticated;
        GRANT SELECT ON api.virtual_cards TO anon;
        GRANT SELECT, INSERT, UPDATE, DELETE ON api.profiles TO authenticated;
        GRANT SELECT ON api.profiles TO anon;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO anon;
        GRANT EXECUTE ON FUNCTION api.is_admin() TO authenticated;
        GRANT EXECUTE ON FUNCTION api.is_admin() TO anon;
        
        -- Create updated_at trigger function
        CREATE OR REPLACE FUNCTION api.update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Create triggers
        CREATE TRIGGER update_virtual_cards_updated_at
            BEFORE UPDATE ON api.virtual_cards
            FOR EACH ROW
            EXECUTE FUNCTION api.update_updated_at_column();
        
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON api.profiles
            FOR EACH ROW
            EXECUTE FUNCTION api.update_updated_at_column();
        
        -- Insert sample data
        INSERT INTO api.virtual_cards (card_name, card_type, description, subscription_plan, pricing_type, one_time_fee, monthly_fee, annual_fee, features, is_active) VALUES
            ('Basic Loyalty Card', 'Standard', 'Entry-level loyalty card with basic rewards', 'basic', 'free', 0, 0, 0, '["Basic rewards", "Mobile app access", "Customer support"]'::jsonb, true),
            ('Premium Loyalty Card', 'Premium', 'Premium loyalty card with enhanced benefits', 'premium', 'subscription', 0, 9.99, 99.99, '["Premium rewards", "Priority support", "Exclusive offers", "Advanced analytics"]'::jsonb, true);
        
        RAISE NOTICE '✅ Created new api.virtual_cards table with TEXT card_type';
    END IF;
    
END $$;

-- Final verification
DO $$
DECLARE
    card_count INTEGER;
    table_schema TEXT;
BEGIN
    -- Check which schema has the virtual_cards table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'virtual_cards') THEN
        table_schema := 'api';
        SELECT COUNT(*) INTO card_count FROM api.virtual_cards;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'virtual_cards') THEN
        table_schema := 'public';
        SELECT COUNT(*) INTO card_count FROM public.virtual_cards;
    ELSE
        table_schema := 'none';
        card_count := 0;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '🎉 CARD TYPE FIX COMPLETE';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Table location: %.virtual_cards', table_schema;
    RAISE NOTICE '✅ Card type: Now supports TEXT (Standard, Premium, custom)';
    RAISE NOTICE '✅ Existing cards: % found', card_count;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Admin can now create loyalty cards with:';
    RAISE NOTICE '   • Standard (built-in)';
    RAISE NOTICE '   • Premium (built-in)'; 
    RAISE NOTICE '   • Custom types (VIP, Corporate, Student, etc.)';
    RAISE NOTICE '';
END $$;