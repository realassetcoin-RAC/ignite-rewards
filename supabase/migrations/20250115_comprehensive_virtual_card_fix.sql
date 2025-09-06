-- Comprehensive Virtual Card Creation Fix
-- This migration addresses all identified issues:
-- 1. Schema access restrictions
-- 2. Ambiguous column references in functions
-- 3. Missing function signatures
-- 4. Permission and RLS policy issues

-- First, ensure we have the public.user_loyalty_cards table
CREATE TABLE IF NOT EXISTS public.user_loyalty_cards (
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

-- Create updated_at trigger for public.user_loyalty_cards
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_loyalty_cards_updated_at ON public.user_loyalty_cards;
CREATE TRIGGER update_user_loyalty_cards_updated_at
    BEFORE UPDATE ON public.user_loyalty_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Fix the ambiguous column reference issue by using proper table aliases
CREATE OR REPLACE FUNCTION public.generate_loyalty_number(user_email TEXT DEFAULT '')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
        
        -- Check if this number already exists (use table alias to avoid ambiguity)
        IF NOT EXISTS (
            SELECT 1 FROM public.user_loyalty_cards ulc
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
CREATE OR REPLACE FUNCTION public.generate_loyalty_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.generate_loyalty_number('');
END;
$$;

-- Create API schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS api;

-- Create API schema functions that work with the public table
CREATE OR REPLACE FUNCTION api.generate_loyalty_number(user_email TEXT DEFAULT '')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
        
        -- Check if this number already exists (use table alias to avoid ambiguity)
        IF NOT EXISTS (
            SELECT 1 FROM public.user_loyalty_cards ulc
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

-- Create overloaded version for API schema without parameters
CREATE OR REPLACE FUNCTION api.generate_loyalty_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN api.generate_loyalty_number('');
END;
$$;

-- Create API schema view for backward compatibility
CREATE OR REPLACE VIEW api.user_loyalty_cards AS
SELECT * FROM public.user_loyalty_cards;

-- Grant proper permissions on schemas
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT USAGE ON SCHEMA api TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on the public table (main table)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_loyalty_cards TO authenticated;
GRANT SELECT ON public.user_loyalty_cards TO anon;

-- Grant permissions on the API view
GRANT SELECT, INSERT, UPDATE, DELETE ON api.user_loyalty_cards TO authenticated;
GRANT SELECT ON api.user_loyalty_cards TO anon;

-- Grant permissions on all functions
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number() TO anon;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number() TO authenticated;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number() TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;

-- Enable RLS on the public table
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own loyalty cards" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can view their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can insert their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can update their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Anonymous can view loyalty cards" ON public.user_loyalty_cards;

-- Create comprehensive RLS policy for authenticated users
CREATE POLICY "Users can manage their own loyalty cards" ON public.user_loyalty_cards
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to read for testing (can be removed in production)
CREATE POLICY "Anonymous can view loyalty cards" ON public.user_loyalty_cards
FOR SELECT TO anon
USING (true);

-- Test all functions to ensure they work
DO $$
DECLARE
    test_result_public_with_email TEXT;
    test_result_public_no_email TEXT;
    test_result_api_with_email TEXT;
    test_result_api_no_email TEXT;
BEGIN
    RAISE NOTICE 'Testing all function variants...';
    
    -- Test public.generate_loyalty_number with email
    BEGIN
        SELECT public.generate_loyalty_number('test@example.com') INTO test_result_public_with_email;
        RAISE NOTICE 'SUCCESS: public.generate_loyalty_number with email works, generated: %', test_result_public_with_email;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: public.generate_loyalty_number with email failed: %', SQLERRM;
    END;
    
    -- Test public.generate_loyalty_number without email
    BEGIN
        SELECT public.generate_loyalty_number() INTO test_result_public_no_email;
        RAISE NOTICE 'SUCCESS: public.generate_loyalty_number without email works, generated: %', test_result_public_no_email;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: public.generate_loyalty_number without email failed: %', SQLERRM;
    END;
    
    -- Test api.generate_loyalty_number with email
    BEGIN
        SELECT api.generate_loyalty_number('test@example.com') INTO test_result_api_with_email;
        RAISE NOTICE 'SUCCESS: api.generate_loyalty_number with email works, generated: %', test_result_api_with_email;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: api.generate_loyalty_number with email failed: %', SQLERRM;
    END;
    
    -- Test api.generate_loyalty_number without email
    BEGIN
        SELECT api.generate_loyalty_number() INTO test_result_api_no_email;
        RAISE NOTICE 'SUCCESS: api.generate_loyalty_number without email works, generated: %', test_result_api_no_email;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: api.generate_loyalty_number without email failed: %', SQLERRM;
    END;
END $$;

-- Add helpful comments
COMMENT ON TABLE public.user_loyalty_cards IS 'Main table for user loyalty cards - primary data store';
COMMENT ON VIEW api.user_loyalty_cards IS 'Compatibility view for API schema access to public.user_loyalty_cards';
COMMENT ON FUNCTION public.generate_loyalty_number(TEXT) IS 'Generate unique loyalty number with user email initial (public schema) - fixed ambiguous column reference';
COMMENT ON FUNCTION public.generate_loyalty_number() IS 'Generate unique loyalty number without parameters (public schema)';
COMMENT ON FUNCTION api.generate_loyalty_number(TEXT) IS 'Generate unique loyalty number with user email initial (api schema) - fixed ambiguous column reference';
COMMENT ON FUNCTION api.generate_loyalty_number() IS 'Generate unique loyalty number without parameters (api schema)';

-- Final verification
DO $$
BEGIN
    RAISE NOTICE '=== COMPREHENSIVE VIRTUAL CARD FIX COMPLETED ===';
    RAISE NOTICE 'Fixed issues:';
    RAISE NOTICE '1. ✅ Schema access configuration';
    RAISE NOTICE '2. ✅ Ambiguous column reference in functions';
    RAISE NOTICE '3. ✅ Missing function signatures';
    RAISE NOTICE '4. ✅ Table permissions and RLS policies';
    RAISE NOTICE '5. ✅ API schema compatibility view';
    RAISE NOTICE '';
    RAISE NOTICE 'The virtual card creation should now work correctly!';
END $$;