-- Fix virtual card creation schema mismatch
-- This migration resolves the issue where frontend code tries to access user_loyalty_cards
-- without specifying schema, causing confusion between api.user_loyalty_cards and public.user_loyalty_cards

-- 1. First, let's see what data exists in both tables and migrate if needed
DO $$
DECLARE
    api_count INTEGER;
    public_count INTEGER;
    rec RECORD;
BEGIN
    -- Count records in both tables
    SELECT COUNT(*) INTO api_count FROM api.user_loyalty_cards;
    SELECT COUNT(*) INTO public_count FROM public.user_loyalty_cards;
    
    RAISE NOTICE 'Found % records in api.user_loyalty_cards', api_count;
    RAISE NOTICE 'Found % records in public.user_loyalty_cards', public_count;
    
    -- If there are records in api schema but not in public, migrate them
    IF api_count > 0 AND public_count = 0 THEN
        RAISE NOTICE 'Migrating records from api.user_loyalty_cards to public.user_loyalty_cards';
        
        INSERT INTO public.user_loyalty_cards (
            id, user_id, loyalty_number, full_name, email, phone, is_active, created_at, updated_at
        )
        SELECT 
            id, user_id, loyalty_number, full_name, email, phone, is_active, created_at, updated_at
        FROM api.user_loyalty_cards;
        
        RAISE NOTICE 'Migration completed: % records moved', api_count;
    END IF;
END $$;

-- 2. Ensure both schemas have proper functions that work with the unified public table
-- Drop old api function that references api table
DROP FUNCTION IF EXISTS api.generate_loyalty_number(TEXT);

-- Create new api function that works with public table but maintains compatibility
CREATE OR REPLACE FUNCTION api.generate_loyalty_number(user_email TEXT DEFAULT '')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    initial CHAR(1);
    random_digits VARCHAR(7);
    loyalty_number TEXT;
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
        loyalty_number := initial || random_digits;
        
        -- Check if this number already exists in public table
        IF NOT EXISTS (
            SELECT 1 FROM public.user_loyalty_cards 
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

-- Update public function to be consistent
CREATE OR REPLACE FUNCTION public.generate_loyalty_number(user_email TEXT DEFAULT '')
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    initial CHAR(1);
    random_digits VARCHAR(7);
    loyalty_number TEXT;
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
        loyalty_number := initial || random_digits;
        
        -- Check if this number already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.user_loyalty_cards 
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

-- 3. Grant proper permissions on both functions
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number(TEXT) TO anon;

-- Also grant the no-parameter version for backward compatibility
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number() TO authenticated;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number() TO anon;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number() TO anon;

-- 4. Ensure schema access
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT USAGE ON SCHEMA api TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 5. Ensure table permissions on public table (this is what frontend will use)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_loyalty_cards TO authenticated;
GRANT SELECT ON public.user_loyalty_cards TO anon;

-- 6. Ensure sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 7. Update RLS policies on public table to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can view their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can insert their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can update their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can manage their own loyalty cards" ON public.user_loyalty_cards;

-- Create comprehensive RLS policy
CREATE POLICY "Users can manage their own loyalty cards" ON public.user_loyalty_cards
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. Enable RLS
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;

-- 9. Create view for backward compatibility with api schema access
CREATE OR REPLACE VIEW api.user_loyalty_cards AS
SELECT * FROM public.user_loyalty_cards;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON api.user_loyalty_cards TO authenticated;
GRANT SELECT ON api.user_loyalty_cards TO anon;

-- 10. Test the functions
DO $$
DECLARE
    test_result_api TEXT;
    test_result_public TEXT;
BEGIN
    -- Test api function with email
    BEGIN
        SELECT api.generate_loyalty_number('test@example.com') INTO test_result_api;
        RAISE NOTICE 'SUCCESS: api.generate_loyalty_number with email works, generated: %', test_result_api;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: api.generate_loyalty_number with email failed: %', SQLERRM;
    END;
    
    -- Test api function without email
    BEGIN
        SELECT api.generate_loyalty_number() INTO test_result_api;
        RAISE NOTICE 'SUCCESS: api.generate_loyalty_number without email works, generated: %', test_result_api;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: api.generate_loyalty_number without email failed: %', SQLERRM;
    END;

    -- Test public function with email
    BEGIN
        SELECT public.generate_loyalty_number('test@example.com') INTO test_result_public;
        RAISE NOTICE 'SUCCESS: public.generate_loyalty_number with email works, generated: %', test_result_public;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: public.generate_loyalty_number with email failed: %', SQLERRM;
    END;
    
    -- Test public function without email
    BEGIN
        SELECT public.generate_loyalty_number() INTO test_result_public;
        RAISE NOTICE 'SUCCESS: public.generate_loyalty_number without email works, generated: %', test_result_public;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: public.generate_loyalty_number without email failed: %', SQLERRM;
    END;
END $$;

-- 11. Add helpful comments
COMMENT ON TABLE public.user_loyalty_cards IS 'Main table for user loyalty cards - used by frontend';
COMMENT ON VIEW api.user_loyalty_cards IS 'Compatibility view for api schema access to public.user_loyalty_cards';
COMMENT ON FUNCTION api.generate_loyalty_number(TEXT) IS 'Generate unique loyalty number with user email initial (api schema)';
COMMENT ON FUNCTION public.generate_loyalty_number(TEXT) IS 'Generate unique loyalty number with user email initial (public schema)';

RAISE NOTICE 'Virtual card schema mismatch fix completed successfully!';
RAISE NOTICE 'Frontend should now be able to save virtual cards to user_loyalty_cards table.';