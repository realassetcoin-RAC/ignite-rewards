-- Fix Missing Database Functions and Tables
-- This migration creates the missing functions and tables causing console errors
-- Date: 2025-01-28

-- 1. Create the missing get_user_loyalty_card function
CREATE OR REPLACE FUNCTION public.get_user_loyalty_card(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    nft_type_id UUID,
    loyalty_number TEXT,
    card_number TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
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
        ulc.phone,
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

-- 2. Create the missing user_notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'earnings', 'asset_linking', 'new_features')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Create the missing user_asset_selections table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_asset_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_initiative_id UUID NOT NULL REFERENCES public.asset_initiatives(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, is_active) -- One active selection per user
);

-- 4. Create the missing asset_initiatives table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.asset_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('environmental', 'social', 'economic', 'health')),
    icon VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Create the missing nft_types table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Less Common', 'Rare', 'Very Rare')),
    earn_on_spend_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.0100,
    buy_price_usdt DECIMAL(10,2) NOT NULL DEFAULT 0,
    upgrade_bonus DECIMAL(5,4) NOT NULL DEFAULT 0,
    evolution_min_investment DECIMAL(10,2) NOT NULL DEFAULT 0,
    evolution_earnings DECIMAL(5,4) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Create the missing user_loyalty_cards table (if it doesn't exist)
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

-- 7. Enable Row Level Security
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_asset_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
-- User notifications policy
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- User asset selections policy
CREATE POLICY "Users can view their own asset selections" ON public.user_asset_selections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own asset selections" ON public.user_asset_selections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own asset selections" ON public.user_asset_selections
    FOR UPDATE USING (auth.uid() = user_id);

-- Asset initiatives policy (public read)
CREATE POLICY "Anyone can view active asset initiatives" ON public.asset_initiatives
    FOR SELECT USING (is_active = TRUE);

-- NFT types policy (public read)
CREATE POLICY "Anyone can view active NFT types" ON public.nft_types
    FOR SELECT USING (is_active = TRUE);

-- User loyalty cards policy
CREATE POLICY "Users can view their own loyalty cards" ON public.user_loyalty_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loyalty cards" ON public.user_loyalty_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty cards" ON public.user_loyalty_cards
    FOR UPDATE USING (auth.uid() = user_id);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_asset_selections_user_id ON public.user_asset_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_user_id ON public.user_loyalty_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_loyalty_number ON public.user_loyalty_cards(loyalty_number);

-- 10. Insert some default data
INSERT INTO public.asset_initiatives (name, description, category, icon) VALUES
    ('Environmental Conservation', 'Support environmental protection and conservation efforts', 'environmental', '🌱'),
    ('Social Impact', 'Fund social programs and community development', 'social', '🤝'),
    ('Economic Development', 'Invest in economic growth and job creation', 'economic', '💼'),
    ('Health & Wellness', 'Support healthcare and wellness initiatives', 'health', '🏥')
ON CONFLICT DO NOTHING;

INSERT INTO public.nft_types (nft_name, display_name, rarity, earn_on_spend_ratio, buy_price_usdt, upgrade_bonus_ratio, evolution_min_investment, evolution_earnings_ratio) VALUES
    ('Pearl White', 'Pearl White NFT', 'Common', 0.0100, 0, 0.0000, 100, 0.0025),
    ('Lava Orange', 'Lava Orange NFT', 'Less Common', 0.0110, 100, 0.0010, 500, 0.0050),
    ('Pink', 'Pink NFT', 'Less Common', 0.0110, 100, 0.0010, 500, 0.0050),
    ('Silver', 'Silver NFT', 'Rare', 0.0120, 200, 0.0015, 1000, 0.0075),
    ('Gold', 'Gold NFT', 'Rare', 0.0130, 300, 0.0020, 1500, 0.0100),
    ('Black', 'Black NFT', 'Very Rare', 0.0140, 500, 0.0030, 2500, 0.0125)
ON CONFLICT DO NOTHING;

-- 11. Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_user_notifications_updated_at ON public.user_notifications;
CREATE TRIGGER update_user_notifications_updated_at
    BEFORE UPDATE ON public.user_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_asset_selections_updated_at ON public.user_asset_selections;
CREATE TRIGGER update_user_asset_selections_updated_at
    BEFORE UPDATE ON public.user_asset_selections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_asset_initiatives_updated_at ON public.asset_initiatives;
CREATE TRIGGER update_asset_initiatives_updated_at
    BEFORE UPDATE ON public.asset_initiatives
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_nft_types_updated_at ON public.nft_types;
CREATE TRIGGER update_nft_types_updated_at
    BEFORE UPDATE ON public.nft_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_loyalty_cards_updated_at ON public.user_loyalty_cards;
CREATE TRIGGER update_user_loyalty_cards_updated_at
    BEFORE UPDATE ON public.user_loyalty_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Create seed phrase authentication function
CREATE OR REPLACE FUNCTION public.authenticate_with_seed_phrase(p_seed_phrase TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    auth_provider TEXT,
    has_solana_wallet BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_user_id UUID;
    user_profile RECORD;
BEGIN
    -- Find user by seed phrase in user_solana_wallets table
    SELECT usw.user_id INTO found_user_id
    FROM public.user_solana_wallets usw
    WHERE usw.seed_phrase_encrypted = p_seed_phrase
    LIMIT 1;
    
    -- If not found in user_solana_wallets, try user_wallets table
    IF found_user_id IS NULL THEN
        SELECT uw.user_id INTO found_user_id
        FROM public.user_wallets uw
        WHERE uw.encrypted_seed_phrase = p_seed_phrase
        LIMIT 1;
    END IF;
    
    -- If still not found, return empty result
    IF found_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Get user profile information
    SELECT p.id, p.email, p.full_name, p.role, p.auth_provider, p.has_solana_wallet
    INTO user_profile
    FROM public.profiles p
    WHERE p.id = found_user_id;
    
    -- Return user information
    RETURN QUERY SELECT 
        user_profile.id,
        user_profile.email,
        user_profile.full_name,
        user_profile.role,
        user_profile.auth_provider,
        user_profile.has_solana_wallet;
END;
$$;


��- -   S e e d   P h r a s e   A u t h e n t i c a t i o n   F u n c t i o n 
 - -   T h i s   m i g r a t i o n   c r e a t e s   t h e   a u t h e n t i c a t e _ w i t h _ s e e d _ p h r a s e   f u n c t i o n   f o r   s e e d   p h r a s e   l o g i n 
 - -   D a t e :   2 0 2 5 - 0 1 - 2 8 
 
 - -   C r e a t e   s e e d   p h r a s e   a u t h e n t i c a t i o n   f u n c t i o n 
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . a u t h e n t i c a t e _ w i t h _ s e e d _ p h r a s e ( p _ s e e d _ p h r a s e   T E X T ) 
 R E T U R N S   T A B L E   ( 
         u s e r _ i d   U U I D , 
         e m a i l   T E X T , 
         f u l l _ n a m e   T E X T , 
         r o l e   T E X T , 
         a u t h _ p r o v i d e r   T E X T , 
         h a s _ s o l a n a _ w a l l e t   B O O L E A N 
 ) 
 L A N G U A G E   p l p g s q l 
 S E C U R I T Y   D E F I N E R 
 A S   \ $ \ $ 
 D E C L A R E 
         f o u n d _ u s e r _ i d   U U I D ; 
         u s e r _ p r o f i l e   R E C O R D ; 
 B E G I N 
         - -   F i n d   u s e r   b y   s e e d   p h r a s e   i n   u s e r _ s o l a n a _ w a l l e t s   t a b l e 
         S E L E C T   u s w . u s e r _ i d   I N T O   f o u n d _ u s e r _ i d 
         F R O M   p u b l i c . u s e r _ s o l a n a _ w a l l e t s   u s w 
         W H E R E   u s w . s e e d _ p h r a s e _ e n c r y p t e d   =   p _ s e e d _ p h r a s e 
         L I M I T   1 ; 
         
         - -   I f   n o t   f o u n d   i n   u s e r _ s o l a n a _ w a l l e t s ,   t r y   u s e r _ w a l l e t s   t a b l e 
         I F   f o u n d _ u s e r _ i d   I S   N U L L   T H E N 
                 S E L E C T   u w . u s e r _ i d   I N T O   f o u n d _ u s e r _ i d 
                 F R O M   p u b l i c . u s e r _ w a l l e t s   u w 
                 W H E R E   u w . e n c r y p t e d _ s e e d _ p h r a s e   =   p _ s e e d _ p h r a s e 
                 L I M I T   1 ; 
         E N D   I F ; 
         
         - -   I f   s t i l l   n o t   f o u n d ,   r e t u r n   e m p t y   r e s u l t 
         I F   f o u n d _ u s e r _ i d   I S   N U L L   T H E N 
                 R E T U R N ; 
         E N D   I F ; 
         
         - -   G e t   u s e r   p r o f i l e   i n f o r m a t i o n 
         S E L E C T   p . i d ,   p . e m a i l ,   p . f u l l _ n a m e ,   p . r o l e ,   p . a u t h _ p r o v i d e r ,   p . h a s _ s o l a n a _ w a l l e t 
         I N T O   u s e r _ p r o f i l e 
         F R O M   p u b l i c . p r o f i l e s   p 
         W H E R E   p . i d   =   f o u n d _ u s e r _ i d ; 
         
         - -   R e t u r n   u s e r   i n f o r m a t i o n 
         R E T U R N   Q U E R Y   S E L E C T   
                 u s e r _ p r o f i l e . i d , 
                 u s e r _ p r o f i l e . e m a i l , 
                 u s e r _ p r o f i l e . f u l l _ n a m e , 
                 u s e r _ p r o f i l e . r o l e , 
                 u s e r _ p r o f i l e . a u t h _ p r o v i d e r , 
                 u s e r _ p r o f i l e . h a s _ s o l a n a _ w a l l e t ; 
 E N D ; 
 \ $ \ $ ;  
 