-- Comprehensive fix for virtual card creation issues
-- This addresses all the problems identified in testing:
-- 1. Schema access configuration
-- 2. Ambiguous column reference in generate_loyalty_number function
-- 3. Table permissions and RLS policies

-- First, let's check what schemas and tables exist
DO $$
BEGIN
    RAISE NOTICE 'Checking existing schemas and tables...';
    
    -- Check if api schema exists
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'api') THEN
        RAISE NOTICE 'API schema exists';
    ELSE
        RAISE NOTICE 'API schema does not exist - creating it';
        CREATE SCHEMA IF NOT EXISTS api;
    END IF;
    
    -- Check if public.user_loyalty_cards exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_loyalty_cards') THEN
        RAISE NOTICE 'public.user_loyalty_cards table exists';
    ELSE
        RAISE NOTICE 'public.user_loyalty_cards table does not exist';
    END IF;
    
    -- Check if api.user_loyalty_cards exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'user_loyalty_cards') THEN
        RAISE NOTICE 'api.user_loyalty_cards table exists';
    ELSE
        RAISE NOTICE 'api.user_loyalty_cards table does not exist';
    END IF;
END $$;

-- Create the api.user_loyalty_cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS api.user_loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger for api.user_loyalty_cards
CREATE OR REPLACE FUNCTION api.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_loyalty_cards_updated_at ON api.user_loyalty_cards;
CREATE TRIGGER update_user_loyalty_cards_updated_at
    BEFORE UPDATE ON api.user_loyalty_cards
    FOR EACH ROW
    EXECUTE FUNCTION api.update_updated_at_column();

-- Fix the ambiguous column reference issue in generate_loyalty_number function
-- Create a corrected version that explicitly references the table
CREATE OR REPLACE FUNCTION api.generate_loyalty_number(user_email TEXT DEFAULT '')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = api
AS $$
DECLARE
    initial CHAR(1);
    random_digits VARCHAR(7);
    loyalty_number_var TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    -- Get the first character of the email as initial (fallback to 'U' if empty)
    IF user_email IS NULL OR user_email = '' THEN
        initial := 'U';
    ELSE
        initial := UPPER(LEFT(user_email, 1));
    END IF;
    
    -- Generate unique loyalty number
    LOOP
        attempts := attempts + 1;
        
        -- Generate 7 random digits
        random_digits := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
        
        -- Combine initial + 7 digits
        loyalty_number_var := initial || random_digits;
        
        -- Check if this number already exists (fix ambiguous column reference)
        IF NOT EXISTS (
            SELECT 1 FROM api.user_loyalty_cards ulc
            WHERE ulc.loyalty_number = loyalty_number_var
        ) THEN
            RETURN loyalty_number_var;
        END IF;
        
        -- Prevent infinite loop
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique loyalty number after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$;

-- Create overloaded version without parameters for backward compatibility
CREATE OR REPLACE FUNCTION api.generate_loyalty_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = api
AS $$
BEGIN
    RETURN api.generate_loyalty_number('');
END;
$$;

-- Grant proper permissions on the api schema
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT USAGE ON SCHEMA api TO anon;

-- Grant permissions on the table
GRANT SELECT, INSERT, UPDATE, DELETE ON api.user_loyalty_cards TO authenticated;
GRANT SELECT ON api.user_loyalty_cards TO anon;

-- Grant permissions on the functions
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number() TO authenticated;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number() TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;

-- Enable RLS on the table
ALTER TABLE api.user_loyalty_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own loyalty cards" ON api.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can view their own loyalty card" ON api.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can insert their own loyalty card" ON api.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can update their own loyalty card" ON api.user_loyalty_cards;

-- Create comprehensive RLS policy
CREATE POLICY "Users can manage their own loyalty cards" ON api.user_loyalty_cards
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to read (for testing purposes)
CREATE POLICY "Anonymous can view loyalty cards" ON api.user_loyalty_cards
FOR SELECT TO anon
USING (true);

-- Test the functions to ensure they work
DO $$
DECLARE
    test_result_with_email TEXT;
    test_result_without_email TEXT;
BEGIN
    -- Test function with email
    BEGIN
        SELECT api.generate_loyalty_number('test@example.com') INTO test_result_with_email;
        RAISE NOTICE 'SUCCESS: api.generate_loyalty_number with email works, generated: %', test_result_with_email;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: api.generate_loyalty_number with email failed: %', SQLERRM;
    END;
    
    -- Test function without email
    BEGIN
        SELECT api.generate_loyalty_number() INTO test_result_without_email;
        RAISE NOTICE 'SUCCESS: api.generate_loyalty_number without email works, generated: %', test_result_without_email;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: api.generate_loyalty_number without email failed: %', SQLERRM;
    END;
END $$;

-- Create helpful comments
COMMENT ON TABLE api.user_loyalty_cards IS 'Main table for user loyalty cards in api schema';
COMMENT ON FUNCTION api.generate_loyalty_number(TEXT) IS 'Generate unique loyalty number with user email initial (api schema) - fixed ambiguous column reference';
COMMENT ON FUNCTION api.generate_loyalty_number() IS 'Generate unique loyalty number without parameters (api schema)';

RAISE NOTICE 'Virtual card creation fix completed successfully!';
RAISE NOTICE 'The api.user_loyalty_cards table is now ready for use.';
RAISE NOTICE 'Functions have been fixed to resolve ambiguous column references.';
RAISE NOTICE 'Permissions and RLS policies have been properly configured.';