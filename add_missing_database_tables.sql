-- Add Missing Database Tables for Complete Schema Implementation
-- This script creates all missing tables identified in the analysis

-- 1. Create NFT types table (CRITICAL - missing from schema)
CREATE TABLE IF NOT EXISTS public.nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    card_type VARCHAR(50) NOT NULL, -- 'common', 'less_common', 'rare', 'very_rare'
    buy_price_usdt DECIMAL(18,8) NOT NULL DEFAULT 0,
    upgrade_available BOOLEAN DEFAULT TRUE,
    evolve_available BOOLEAN DEFAULT TRUE,
    rarity VARCHAR(50) NOT NULL,
    mint_count INTEGER NOT NULL DEFAULT 0,
    max_mint_count INTEGER NOT NULL DEFAULT 10000,
    fractional_investment BOOLEAN DEFAULT TRUE,
    auto_staking BOOLEAN DEFAULT TRUE,
    earn_on_spend_percentage DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    upgrade_bonus_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    evolution_min_investment DECIMAL(18,8) NOT NULL DEFAULT 100,
    evolution_earnings_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.25,
    is_custodial BOOLEAN DEFAULT TRUE, -- TRUE for custodial users, FALSE for non-custodial
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user loyalty cards table (CRITICAL - missing from schema)
CREATE TABLE IF NOT EXISTS public.user_loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    loyalty_number VARCHAR(8) NOT NULL UNIQUE, -- 8-character loyalty number
    is_evolved BOOLEAN DEFAULT FALSE,
    evolved_at TIMESTAMP WITH TIME ZONE,
    total_investment DECIMAL(18,8) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- One loyalty card per user
);

-- 3. Create user points table (CRITICAL - missing from schema)
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    available_points INTEGER NOT NULL DEFAULT 0,
    pending_points INTEGER NOT NULL DEFAULT 0, -- Points in 30-day release delay
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Create loyalty transactions table (CRITICAL - missing from schema)
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'earn', 'spend', 'referral', 'conversion'
    points_amount INTEGER NOT NULL,
    transaction_value DECIMAL(18,8), -- Transaction value in USD
    receipt_number VARCHAR(255),
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    name VARCHAR(255),
    comments TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    release_date TIMESTAMP WITH TIME ZONE, -- When points will be released (30 days later)
    is_released BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create user wallets table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    wallet_type VARCHAR(50) NOT NULL DEFAULT 'ethereum', -- 'ethereum', 'solana', 'custodial'
    is_primary BOOLEAN DEFAULT FALSE,
    seed_phrase_encrypted TEXT, -- Encrypted seed phrase for custodial wallets
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_type)
);

-- 6. Create merchant cards table (if not exists)
CREATE TABLE IF NOT EXISTS public.merchant_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    card_name VARCHAR(255) NOT NULL,
    card_description TEXT,
    card_image_url VARCHAR(500),
    qr_code_data TEXT, -- QR code data for merchant-customer linking
    discount_code VARCHAR(100),
    discount_percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create merchant subscriptions table (if not exists)
CREATE TABLE IF NOT EXISTS public.merchant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.merchant_subscription_plans(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method VARCHAR(50),
    last_payment_date TIMESTAMP WITH TIME ZONE,
    next_payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create transaction QR codes table (if not exists)
CREATE TABLE IF NOT EXISTS public.transaction_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    qr_code_data TEXT NOT NULL,
    transaction_value DECIMAL(18,8) NOT NULL,
    points_to_award INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    used_by UUID REFERENCES auth.users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create subscribers table (if not exists)
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_type VARCHAR(50) DEFAULT 'newsletter',
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- 10. Enable RLS on all tables
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies for NFT types
CREATE POLICY "Anyone can view active NFT types" ON public.nft_types
    FOR SELECT TO authenticated
    USING (is_active = TRUE);

CREATE POLICY "Admins can manage NFT types" ON public.nft_types
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 12. Create RLS policies for user loyalty cards
CREATE POLICY "Users can view their own loyalty cards" ON public.user_loyalty_cards
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loyalty cards" ON public.user_loyalty_cards
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty cards" ON public.user_loyalty_cards
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all loyalty cards" ON public.user_loyalty_cards
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 13. Create RLS policies for user points
CREATE POLICY "Users can view their own points" ON public.user_points
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can update user points" ON public.user_points
    FOR UPDATE TO authenticated
    WITH CHECK (TRUE);

CREATE POLICY "Admins can view all user points" ON public.user_points
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 14. Create RLS policies for loyalty transactions
CREATE POLICY "Users can view their own transactions" ON public.loyalty_transactions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions" ON public.loyalty_transactions
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

CREATE POLICY "Merchants can view their transactions" ON public.loyalty_transactions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.merchants 
            WHERE id = merchant_id AND (user_id = auth.uid() OR created_by = auth.uid())
        )
    );

CREATE POLICY "Admins can view all transactions" ON public.loyalty_transactions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 15. Create RLS policies for user wallets
CREATE POLICY "Users can manage their own wallets" ON public.user_wallets
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

-- 16. Create RLS policies for merchant cards
CREATE POLICY "Merchants can manage their own cards" ON public.merchant_cards
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.merchants 
            WHERE id = merchant_id AND (user_id = auth.uid() OR created_by = auth.uid())
        )
    );

CREATE POLICY "Anyone can view active merchant cards" ON public.merchant_cards
    FOR SELECT TO authenticated
    USING (is_active = TRUE);

-- 17. Create RLS policies for merchant subscriptions
CREATE POLICY "Merchants can view their own subscriptions" ON public.merchant_subscriptions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.merchants 
            WHERE id = merchant_id AND (user_id = auth.uid() OR created_by = auth.uid())
        )
    );

CREATE POLICY "Admins can manage all subscriptions" ON public.merchant_subscriptions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 18. Create RLS policies for transaction QR codes
CREATE POLICY "Merchants can manage their own QR codes" ON public.transaction_qr_codes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.merchants 
            WHERE id = merchant_id AND (user_id = auth.uid() OR created_by = auth.uid())
        )
    );

CREATE POLICY "Users can view active QR codes" ON public.transaction_qr_codes
    FOR SELECT TO authenticated
    USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- 19. Create RLS policies for subscribers
CREATE POLICY "Anyone can subscribe" ON public.subscribers
    FOR INSERT TO anon
    WITH CHECK (TRUE);

CREATE POLICY "Admins can manage subscribers" ON public.subscribers
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 20. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_user_id ON public.user_loyalty_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_nft_type_id ON public.user_loyalty_cards(nft_type_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_loyalty_number ON public.user_loyalty_cards(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_merchant_id ON public.loyalty_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_transaction_date ON public.loyalty_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_status ON public.loyalty_transactions(status);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_cards_merchant_id ON public.merchant_cards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_merchant_id ON public.merchant_subscriptions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_status ON public.merchant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_transaction_qr_codes_merchant_id ON public.transaction_qr_codes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transaction_qr_codes_is_active ON public.transaction_qr_codes(is_active);

-- 21. Create function to generate loyalty number
CREATE OR REPLACE FUNCTION public.generate_loyalty_number(user_id UUID)
RETURNS VARCHAR(8) AS $$
DECLARE
    user_profile RECORD;
    loyalty_number VARCHAR(8);
    counter INTEGER := 1;
BEGIN
    -- Get user's first name initial
    SELECT full_name INTO user_profile
    FROM public.profiles
    WHERE id = user_id;
    
    -- Extract first character of first name
    IF user_profile.full_name IS NOT NULL AND LENGTH(user_profile.full_name) > 0 THEN
        loyalty_number := UPPER(SUBSTRING(user_profile.full_name, 1, 1));
    ELSE
        loyalty_number := 'U'; -- Default to 'U' for User
    END IF;
    
    -- Generate unique 7-digit number
    LOOP
        loyalty_number := loyalty_number || LPAD(counter::TEXT, 7, '0');
        
        -- Check if this loyalty number already exists
        IF NOT EXISTS (SELECT 1 FROM public.user_loyalty_cards WHERE loyalty_number = loyalty_number) THEN
            RETURN loyalty_number;
        END IF;
        
        counter := counter + 1;
        
        -- Prevent infinite loop
        IF counter > 9999999 THEN
            RAISE EXCEPTION 'Unable to generate unique loyalty number';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 22. Create function to create user profile with loyalty card
CREATE OR REPLACE FUNCTION public.create_user_profile_with_loyalty_card(
    p_user_id UUID,
    p_email VARCHAR(255),
    p_full_name VARCHAR(255),
    p_role VARCHAR(20) DEFAULT 'user'
)
RETURNS BOOLEAN AS $$
DECLARE
    loyalty_number VARCHAR(8);
    default_nft_type_id UUID;
BEGIN
    -- Create user profile
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (p_user_id, p_email, p_full_name, p_role)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    
    -- Generate loyalty number
    loyalty_number := public.generate_loyalty_number(p_user_id);
    
    -- Get default NFT type (Pearl White for custodial users)
    SELECT id INTO default_nft_type_id
    FROM public.nft_types
    WHERE name = 'pearl_white' AND is_custodial = TRUE
    LIMIT 1;
    
    -- Create loyalty card if default NFT type exists
    IF default_nft_type_id IS NOT NULL THEN
        INSERT INTO public.user_loyalty_cards (user_id, nft_type_id, loyalty_number)
        VALUES (p_user_id, default_nft_type_id, loyalty_number)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    -- Initialize user points
    INSERT INTO public.user_points (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 23. Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile_with_loyalty_card(UUID, VARCHAR, VARCHAR, VARCHAR) TO authenticated;

-- 24. Insert default NFT types
INSERT INTO public.nft_types (name, display_name, card_type, buy_price_usdt, upgrade_available, evolve_available, rarity, mint_count, max_mint_count, fractional_investment, auto_staking, earn_on_spend_percentage, upgrade_bonus_percentage, evolution_min_investment, evolution_earnings_percentage, is_custodial) VALUES
-- Custodial NFT Types (Free for users with custodial wallets)
('pearl_white', 'Pearl White', 'common', 0, TRUE, TRUE, 'Common', 0, 10000, TRUE, TRUE, 1.00, 0.00, 100, 0.25, TRUE),
('lava_orange', 'Lava Orange', 'less_common', 100, TRUE, TRUE, 'Less Common', 0, 3000, TRUE, TRUE, 1.10, 0.10, 500, 0.50, TRUE),
('pink', 'Pink', 'less_common', 100, TRUE, TRUE, 'Less Common', 0, 3000, TRUE, TRUE, 1.10, 0.10, 500, 0.50, TRUE),
('silver', 'Silver', 'rare', 200, TRUE, TRUE, 'Rare', 0, 750, TRUE, TRUE, 1.20, 0.15, 1000, 0.75, TRUE),
('gold', 'Gold', 'rare', 300, TRUE, TRUE, 'Rare', 0, 750, TRUE, TRUE, 1.30, 0.20, 1500, 1.00, TRUE),
('black', 'Black', 'very_rare', 500, TRUE, TRUE, 'Very Rare', 0, 250, TRUE, TRUE, 1.40, 0.30, 2500, 1.25, TRUE),
-- Non-Custodial NFT Types (For users with external wallets)
('pearl_white_nc', 'Pearl White', 'common', 100, FALSE, TRUE, 'Common', 0, 10000, TRUE, TRUE, 1.00, 0.00, 500, 0.50, FALSE),
('lava_orange_nc', 'Lava Orange', 'less_common', 500, FALSE, TRUE, 'Less Common', 0, 3000, TRUE, TRUE, 1.10, 0.00, 2500, 1.25, FALSE),
('pink_nc', 'Pink', 'less_common', 500, FALSE, TRUE, 'Less Common', 0, 3000, TRUE, TRUE, 1.10, 0.00, 2500, 1.25, FALSE),
('silver_nc', 'Silver', 'rare', 1000, FALSE, TRUE, 'Rare', 0, 750, TRUE, TRUE, 1.20, 0.00, 5000, 0.15, FALSE),
('gold_nc', 'Gold', 'rare', 1000, FALSE, TRUE, 'Rare', 0, 750, TRUE, TRUE, 1.30, 0.00, 5000, 0.20, FALSE),
('black_nc', 'Black', 'very_rare', 2500, FALSE, TRUE, 'Very Rare', 0, 250, TRUE, TRUE, 1.40, 0.00, 13500, 0.30, FALSE)
ON CONFLICT (name) DO NOTHING;

-- 25. Add helpful comments
COMMENT ON TABLE public.nft_types IS 'NFT card types and configurations for loyalty system';
COMMENT ON TABLE public.user_loyalty_cards IS 'User loyalty card assignments and evolution status';
COMMENT ON TABLE public.user_points IS 'User point balances and tracking';
COMMENT ON TABLE public.loyalty_transactions IS 'Loyalty transaction history with 30-day release delay';
COMMENT ON TABLE public.user_wallets IS 'User wallet addresses and seed phrases';
COMMENT ON TABLE public.merchant_cards IS 'Merchant custom loyalty cards and QR codes';
COMMENT ON TABLE public.merchant_subscriptions IS 'Merchant subscription management';
COMMENT ON TABLE public.transaction_qr_codes IS 'Transaction QR codes for point earning';
COMMENT ON TABLE public.subscribers IS 'Email newsletter subscribers';
COMMENT ON FUNCTION public.generate_loyalty_number IS 'Generates unique 8-character loyalty number';
COMMENT ON FUNCTION public.create_user_profile_with_loyalty_card IS 'Creates user profile with default loyalty card';
