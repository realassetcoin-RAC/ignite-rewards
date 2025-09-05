-- Fix virtual card creation issues
-- This migration ensures proper function signatures and database permissions

-- 1. Ensure both generate_loyalty_number functions exist and are accessible

-- Function in api schema (with user_email parameter)
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
        
        -- Check if this number already exists
        IF NOT EXISTS (
            SELECT 1 FROM api.user_loyalty_cards 
            WHERE loyalty_number = loyalty_number
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

-- Function in public schema (no parameters)
CREATE OR REPLACE FUNCTION public.generate_loyalty_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  loyalty_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a 12-digit loyalty number
    loyalty_num := 'LY' || lpad(floor(random() * 1000000000)::text, 10, '0');
    
    -- Check if number already exists
    SELECT COUNT(*) INTO exists_check 
    FROM public.user_loyalty_cards 
    WHERE loyalty_number = loyalty_num;
    
    -- If unique, return it
    IF exists_check = 0 THEN
      RETURN loyalty_num;
    END IF;
  END LOOP;
END;
$$;

-- 2. Grant proper permissions on functions
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number() TO anon;

-- 3. Ensure schema access
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT USAGE ON SCHEMA api TO anon;

-- 4. Ensure table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON api.user_loyalty_cards TO authenticated;
GRANT SELECT ON api.user_loyalty_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_loyalty_cards TO authenticated;
GRANT SELECT ON public.user_loyalty_cards TO anon;

-- 5. Ensure sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

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

    -- Public schema policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_loyalty_cards' 
        AND policyname = 'Users can manage their own loyalty cards'
    ) THEN
        CREATE POLICY "Users can manage their own loyalty cards" ON public.user_loyalty_cards
        FOR ALL TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 7. Enable RLS on tables
ALTER TABLE api.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;

-- 8. Test the functions
DO $$
DECLARE
    test_result_api VARCHAR(8);
    test_result_public TEXT;
BEGIN
    -- Test api function
    BEGIN
        SELECT api.generate_loyalty_number('test@example.com') INTO test_result_api;
        RAISE NOTICE 'SUCCESS: api.generate_loyalty_number function works, generated: %', test_result_api;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: api.generate_loyalty_number function failed: %', SQLERRM;
    END;

    -- Test public function
    BEGIN
        SELECT public.generate_loyalty_number() INTO test_result_public;
        RAISE NOTICE 'SUCCESS: public.generate_loyalty_number function works, generated: %', test_result_public;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: public.generate_loyalty_number function failed: %', SQLERRM;
    END;
END $$;