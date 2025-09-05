-- Fix the database functions and permissions for card creation
-- This script fixes the issues identified in the diagnostic

-- 1. Fix the generate_loyalty_number function in api schema
-- The issue is the ambiguous column reference in the WHERE clause
CREATE OR REPLACE FUNCTION api.generate_loyalty_number(user_email TEXT)
RETURNS VARCHAR(8)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'api'
AS $$
DECLARE
    initial CHAR(1);
    random_digits VARCHAR(7);
    loyalty_number VARCHAR(8);
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    -- Get the first character of the email as initial
    initial := UPPER(LEFT(user_email, 1));
    
    -- Generate unique loyalty number
    LOOP
        attempts := attempts + 1;
        
        -- Generate 7 random digits
        random_digits := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
        
        -- Combine initial + 7 digits
        loyalty_number := initial || random_digits;
        
        -- Check if this number already exists (fix ambiguous column reference)
        IF NOT EXISTS (
            SELECT 1 FROM api.user_loyalty_cards 
            WHERE api.user_loyalty_cards.loyalty_number = loyalty_number
        ) THEN
            RETURN loyalty_number;
        END IF;
        
        -- Prevent infinite loop
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique loyalty number after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$;

-- 2. Grant proper permissions on the function
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO anon;

-- 3. Ensure schema access
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT USAGE ON SCHEMA api TO anon;

-- 4. Ensure table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON api.user_loyalty_cards TO authenticated;
GRANT SELECT ON api.user_loyalty_cards TO anon;

-- 5. Ensure sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;

-- 6. Create RLS policies for user_loyalty_cards if they don't exist
DO $$
BEGIN
    -- API schema policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'api' 
        AND tablename = 'user_loyalty_cards' 
        AND policyname = 'Users can manage their own loyalty cards'
    ) THEN
        CREATE POLICY "Users can manage their own loyalty cards" ON api.user_loyalty_cards
        FOR ALL TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 7. Enable RLS on table
ALTER TABLE api.user_loyalty_cards ENABLE ROW LEVEL SECURITY;

-- 8. Test the function
DO $$
DECLARE
    test_result VARCHAR(8);
BEGIN
    -- Test api function
    BEGIN
        SELECT api.generate_loyalty_number('test@example.com') INTO test_result;
        RAISE NOTICE 'SUCCESS: api.generate_loyalty_number function works, generated: %', test_result;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: api.generate_loyalty_number function failed: %', SQLERRM;
    END;
END $$;