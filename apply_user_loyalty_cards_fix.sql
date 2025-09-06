-- Apply this SQL directly in your Supabase dashboard SQL editor
-- This will fix the user_loyalty_cards table issues and resolve admin health tab errors

-- 1. Check current state
DO $$
DECLARE
    api_count INTEGER := 0;
    public_count INTEGER := 0;
    api_exists BOOLEAN := FALSE;
    public_exists BOOLEAN := FALSE;
BEGIN
    -- Check if tables exist and count records
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'api' AND table_name = 'user_loyalty_cards'
    ) INTO api_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_loyalty_cards'
    ) INTO public_exists;
    
    IF api_exists THEN
        SELECT COUNT(*) INTO api_count FROM api.user_loyalty_cards;
    END IF;
    
    IF public_exists THEN
        SELECT COUNT(*) INTO public_count FROM public.user_loyalty_cards;
    END IF;
    
    RAISE NOTICE 'Current state:';
    RAISE NOTICE '  api.user_loyalty_cards exists: %, records: %', api_exists, api_count;
    RAISE NOTICE '  public.user_loyalty_cards exists: %, records: %', public_exists, public_count;
END $$;

-- 2. Create unified table structure in public schema
CREATE TABLE IF NOT EXISTS public.user_loyalty_cards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Migrate existing data from api to public schema
DO $$
DECLARE
    api_count INTEGER := 0;
    public_count INTEGER := 0;
    migrated_count INTEGER := 0;
BEGIN
    -- Count existing records
    SELECT COUNT(*) INTO api_count FROM api.user_loyalty_cards;
    SELECT COUNT(*) INTO public_count FROM public.user_loyalty_cards;
    
    -- Migrate data if needed
    IF api_count > 0 AND public_count = 0 THEN
        RAISE NOTICE 'Migrating % records from api.user_loyalty_cards to public.user_loyalty_cards', api_count;
        
        INSERT INTO public.user_loyalty_cards (
            id, user_id, loyalty_number, full_name, email, phone, is_active, created_at, updated_at
        )
        SELECT 
            id, user_id, loyalty_number, full_name, email, phone, is_active, created_at, updated_at
        FROM api.user_loyalty_cards
        ON CONFLICT (loyalty_number) DO NOTHING;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migration completed: % records migrated', migrated_count;
    ELSIF api_count > 0 AND public_count > 0 THEN
        RAISE NOTICE 'Both tables have data - merging unique records from api to public';
        
        INSERT INTO public.user_loyalty_cards (
            id, user_id, loyalty_number, full_name, email, phone, is_active, created_at, updated_at
        )
        SELECT 
            id, user_id, loyalty_number, full_name, email, phone, is_active, created_at, updated_at
        FROM api.user_loyalty_cards
        WHERE loyalty_number NOT IN (SELECT loyalty_number FROM public.user_loyalty_cards)
        ON CONFLICT (loyalty_number) DO NOTHING;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Merge completed: % new records added', migrated_count;
    END IF;
END $$;

-- 4. Create updated_at trigger
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

-- 5. Create unified generate_loyalty_number function
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
        initial := UPPER(SUBSTRING(user_email, 1, 1));
    END IF;
    
    -- Generate unique loyalty number
    LOOP
        attempts := attempts + 1;
        
        IF attempts > max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique loyalty number after % attempts', max_attempts;
        END IF;
        
        -- Generate 7 random digits
        random_digits := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
        loyalty_number_var := initial || random_digits;
        
        -- Check if this number already exists
        IF NOT EXISTS (SELECT 1 FROM public.user_loyalty_cards WHERE loyalty_number = loyalty_number_var) THEN
            RETURN loyalty_number_var;
        END IF;
    END LOOP;
END;
$$;

-- 6. Create compatibility view in api schema
-- First, drop the existing table if it exists, then create the view
DROP TABLE IF EXISTS api.user_loyalty_cards CASCADE;
CREATE VIEW api.user_loyalty_cards AS
SELECT 
    id,
    user_id,
    loyalty_number,
    full_name,
    email,
    phone,
    is_active,
    created_at,
    updated_at
FROM public.user_loyalty_cards;

-- 7. Create compatibility function in api schema
CREATE OR REPLACE FUNCTION api.generate_loyalty_number(user_email TEXT DEFAULT '')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.generate_loyalty_number(user_email);
END;
$$;

-- 8. Enable Row Level Security
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
DROP POLICY IF EXISTS "Users can view their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can insert their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can update their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can delete their own loyalty card" ON public.user_loyalty_cards;

CREATE POLICY "Users can view their own loyalty card" 
ON public.user_loyalty_cards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loyalty card" 
ON public.user_loyalty_cards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty card" 
ON public.user_loyalty_cards 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loyalty card" 
ON public.user_loyalty_cards 
FOR DELETE 
USING (auth.uid() = user_id);

-- 10. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_loyalty_cards TO authenticated;
GRANT SELECT ON api.user_loyalty_cards TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION api.generate_loyalty_number(TEXT) TO authenticated;

-- 11. Test functions
DO $$
DECLARE
    test_number TEXT;
BEGIN
    -- Test the public function
    SELECT public.generate_loyalty_number('test@example.com') INTO test_number;
    RAISE NOTICE 'Public function test successful: %', test_number;
    
    -- Test the api function
    SELECT api.generate_loyalty_number('test@example.com') INTO test_number;
    RAISE NOTICE 'API function test successful: %', test_number;
    
    RAISE NOTICE 'All functions tested successfully!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Function test failed: %', SQLERRM;
END $$;

-- 12. Final status report
DO $$
DECLARE
    final_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_count FROM public.user_loyalty_cards;
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Final record count in public.user_loyalty_cards: %', final_count;
    RAISE NOTICE 'Both api and public schemas now point to the same data source.';
    RAISE NOTICE 'Admin health tab should now show healthy status for user_loyalty_cards.';
END $$;
