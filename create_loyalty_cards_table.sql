-- Create user_loyalty_cards table in public schema
-- This script creates the missing table and sets up all required components

-- 1. Create the user_loyalty_cards table
CREATE TABLE IF NOT EXISTS public.user_loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nft_type_id UUID REFERENCES public.nft_types(id),
    loyalty_number TEXT NOT NULL UNIQUE,
    card_number TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    points_balance INTEGER NOT NULL DEFAULT 0,
    tier_level TEXT NOT NULL DEFAULT 'Common',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Create nft_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Less Common', 'Rare', 'Very Rare')),
    earn_on_spend_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.0100,
    buy_price_usdt DECIMAL(10,2) NOT NULL DEFAULT 0,
    upgrade_bonus_ratio DECIMAL(5,4) NOT NULL DEFAULT 0,
    evolution_min_investment DECIMAL(10,2) NOT NULL DEFAULT 0,
    evolution_earnings_ratio DECIMAL(5,4) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Insert default NFT types if they don't exist
INSERT INTO public.nft_types (nft_name, display_name, rarity, earn_on_spend_ratio, buy_price_usdt, is_active)
SELECT 'Common', 'Common Card', 'Common', 0.0100, 0.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.nft_types WHERE nft_name = 'Common');

INSERT INTO public.nft_types (nft_name, display_name, rarity, earn_on_spend_ratio, buy_price_usdt, is_active)
SELECT 'Less Common', 'Less Common Card', 'Less Common', 0.0150, 0.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.nft_types WHERE nft_name = 'Less Common');

INSERT INTO public.nft_types (nft_name, display_name, rarity, earn_on_spend_ratio, buy_price_usdt, is_active)
SELECT 'Rare', 'Rare Card', 'Rare', 0.0200, 0.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.nft_types WHERE nft_name = 'Rare');

INSERT INTO public.nft_types (nft_name, display_name, rarity, earn_on_spend_ratio, buy_price_usdt, is_active)
SELECT 'Very Rare', 'Very Rare Card', 'Very Rare', 0.0250, 0.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.nft_types WHERE nft_name = 'Very Rare');

-- 4. Enable RLS on the table
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can insert their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can update their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can delete their own loyalty card" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can manage their own loyalty cards" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Anonymous can view loyalty cards" ON public.user_loyalty_cards;

-- 6. Create comprehensive RLS policies
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

-- 7. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_loyalty_cards TO authenticated;
GRANT SELECT ON public.user_loyalty_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nft_types TO authenticated;
GRANT SELECT ON public.nft_types TO anon;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_user_id ON public.user_loyalty_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_loyalty_number ON public.user_loyalty_cards(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_is_active ON public.user_loyalty_cards(is_active);

-- 9. Create a view for backward compatibility with api schema
CREATE OR REPLACE VIEW api.user_loyalty_cards AS
SELECT * FROM public.user_loyalty_cards;

-- 10. Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON api.user_loyalty_cards TO authenticated;
GRANT SELECT ON api.user_loyalty_cards TO anon;

-- 11. Create the get_user_loyalty_card function
CREATE OR REPLACE FUNCTION public.get_user_loyalty_card(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    nft_type_id UUID,
    loyalty_number TEXT,
    card_number TEXT,
    full_name TEXT,
    email TEXT,
    points_balance INTEGER,
    tier_level TEXT,
    is_active BOOLEAN,
    nft_name TEXT,
    nft_display_name TEXT,
    nft_rarity TEXT,
    nft_earn_ratio DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ulc.id,
        ulc.user_id,
        ulc.nft_type_id,
        ulc.loyalty_number,
        ulc.card_number,
        ulc.full_name,
        ulc.email,
        ulc.points_balance,
        ulc.tier_level,
        ulc.is_active,
        nt.nft_name,
        nt.display_name as nft_display_name,
        nt.rarity as nft_rarity,
        nt.earn_on_spend_ratio as nft_earn_ratio,
        ulc.created_at
    FROM public.user_loyalty_cards ulc
    LEFT JOIN public.nft_types nt ON ulc.nft_type_id = nt.id
    WHERE ulc.user_id = user_uuid
    AND ulc.is_active = TRUE
    ORDER BY ulc.created_at DESC
    LIMIT 1;
END;
$$;

-- 12. Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.get_user_loyalty_card(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_loyalty_card(UUID) TO anon;

-- 13. Create a simple function to generate loyalty numbers
CREATE OR REPLACE FUNCTION public.generate_loyalty_number(user_email TEXT DEFAULT '')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    first_char TEXT;
    random_suffix TEXT;
    loyalty_num TEXT;
    counter INTEGER := 0;
BEGIN
    -- Get first character of email or use 'U' as default
    IF user_email IS NOT NULL AND LENGTH(user_email) > 0 THEN
        first_char := UPPER(SUBSTRING(user_email, 1, 1));
    ELSE
        first_char := 'U';
    END IF;
    
    -- Generate random suffix
    random_suffix := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
    
    -- Combine to create loyalty number
    loyalty_num := first_char || random_suffix;
    
    -- Check for uniqueness and regenerate if needed
    WHILE EXISTS (SELECT 1 FROM public.user_loyalty_cards WHERE loyalty_number = loyalty_num) AND counter < 100 LOOP
        random_suffix := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
        loyalty_num := first_char || random_suffix;
        counter := counter + 1;
    END LOOP;
    
    RETURN loyalty_num;
END;
$$;

-- 14. Grant execute permissions on the generate function
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number(TEXT) TO anon;

-- 15. Test the setup
DO $$
DECLARE
    test_loyalty_number TEXT;
    nft_count INTEGER;
    table_exists BOOLEAN;
BEGIN
    -- Check if table was created
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_loyalty_cards'
    ) INTO table_exists;
    
    -- Count NFT types
    SELECT COUNT(*) INTO nft_count FROM public.nft_types;
    
    -- Test loyalty number generation
    test_loyalty_number := public.generate_loyalty_number('test@example.com');
    
    RAISE NOTICE 'Setup completed successfully:';
    RAISE NOTICE '  - user_loyalty_cards table exists: %', table_exists;
    RAISE NOTICE '  - NFT types count: %', nft_count;
    RAISE NOTICE '  - Generated test loyalty number: %', test_loyalty_number;
END $$;

-- 16. Final verification
SELECT 
    'Loyalty cards table created successfully' as status,
    (SELECT COUNT(*) FROM public.nft_types) as nft_types_count,
    (SELECT COUNT(*) FROM public.user_loyalty_cards) as loyalty_cards_count;
