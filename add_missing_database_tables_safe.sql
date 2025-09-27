-- Add Missing Database Tables for Complete Schema Implementation (SAFE VERSION)
-- This script creates all missing tables with proper error handling

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
DO $$
BEGIN
    -- Check if user_loyalty_cards table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_loyalty_cards'
    ) THEN
        CREATE TABLE public.user_loyalty_cards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            nft_type_id UUID,
            loyalty_number VARCHAR(8) NOT NULL UNIQUE, -- 8-character loyalty number
            is_evolved BOOLEAN DEFAULT FALSE,
            evolved_at TIMESTAMP WITH TIME ZONE,
            total_investment DECIMAL(18,8) DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id) -- One loyalty card per user
        );
        
        -- Add foreign key constraints if referenced tables exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
            ALTER TABLE public.user_loyalty_cards ADD CONSTRAINT fk_user_loyalty_cards_user_id 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nft_types') THEN
            ALTER TABLE public.user_loyalty_cards ADD CONSTRAINT fk_user_loyalty_cards_nft_type_id 
            FOREIGN KEY (nft_type_id) REFERENCES public.nft_types(id) ON DELETE CASCADE;
        END IF;
        
        RAISE NOTICE 'user_loyalty_cards table created successfully';
    ELSE
        RAISE NOTICE 'user_loyalty_cards table already exists - skipping creation';
    END IF;
END $$;

-- 3. Create user points table (CRITICAL - missing from schema)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_points'
    ) THEN
        CREATE TABLE public.user_points (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            total_points INTEGER NOT NULL DEFAULT 0,
            available_points INTEGER NOT NULL DEFAULT 0,
            pending_points INTEGER NOT NULL DEFAULT 0, -- Points in 30-day release delay
            lifetime_points INTEGER NOT NULL DEFAULT 0,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        
        -- Add foreign key constraint if auth.users exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
            ALTER TABLE public.user_points ADD CONSTRAINT fk_user_points_user_id 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        RAISE NOTICE 'user_points table created successfully';
    ELSE
        RAISE NOTICE 'user_points table already exists - skipping creation';
    END IF;
END $$;

-- 4. Create loyalty transactions table (CRITICAL - missing from schema)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'loyalty_transactions'
    ) THEN
        CREATE TABLE public.loyalty_transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            merchant_id UUID,
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
        
        -- Add foreign key constraints if referenced tables exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
            ALTER TABLE public.loyalty_transactions ADD CONSTRAINT fk_loyalty_transactions_user_id 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchants') THEN
            ALTER TABLE public.loyalty_transactions ADD CONSTRAINT fk_loyalty_transactions_merchant_id 
            FOREIGN KEY (merchant_id) REFERENCES public.merchants(merchant_id) ON DELETE SET NULL;
        END IF;
        
        RAISE NOTICE 'loyalty_transactions table created successfully';
    ELSE
        RAISE NOTICE 'loyalty_transactions table already exists - skipping creation';
    END IF;
END $$;

-- 5. Create user wallets table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_wallets'
    ) THEN
        CREATE TABLE public.user_wallets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            wallet_address TEXT NOT NULL,
            wallet_type VARCHAR(50) NOT NULL DEFAULT 'ethereum', -- 'ethereum', 'solana', 'custodial'
            is_primary BOOLEAN DEFAULT FALSE,
            seed_phrase_encrypted TEXT, -- Encrypted seed phrase for custodial wallets
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, wallet_type)
        );
        
        -- Add foreign key constraint if auth.users exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
            ALTER TABLE public.user_wallets ADD CONSTRAINT fk_user_wallets_user_id 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        RAISE NOTICE 'user_wallets table created successfully';
    ELSE
        RAISE NOTICE 'user_wallets table already exists - skipping creation';
    END IF;
END $$;

-- 6. Create merchant cards table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'merchant_cards'
    ) THEN
        CREATE TABLE public.merchant_cards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            merchant_id UUID NOT NULL,
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
        
        -- Add foreign key constraint if merchants table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchants') THEN
            ALTER TABLE public.merchant_cards ADD CONSTRAINT fk_merchant_cards_merchant_id 
            FOREIGN KEY (merchant_id) REFERENCES public.merchants(merchant_id) ON DELETE CASCADE;
        END IF;
        
        RAISE NOTICE 'merchant_cards table created successfully';
    ELSE
        RAISE NOTICE 'merchant_cards table already exists - skipping creation';
    END IF;
END $$;

-- 7. Create merchant subscriptions table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'merchant_subscriptions'
    ) THEN
        CREATE TABLE public.merchant_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            merchant_id UUID NOT NULL,
            plan_id UUID,
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
        
        -- Add foreign key constraints if referenced tables exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchants') THEN
            ALTER TABLE public.merchant_subscriptions ADD CONSTRAINT fk_merchant_subscriptions_merchant_id 
            FOREIGN KEY (merchant_id) REFERENCES public.merchants(merchant_id) ON DELETE CASCADE;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans') THEN
            ALTER TABLE public.merchant_subscriptions ADD CONSTRAINT fk_merchant_subscriptions_plan_id 
            FOREIGN KEY (plan_id) REFERENCES public.merchant_subscription_plans(id) ON DELETE CASCADE;
        END IF;
        
        RAISE NOTICE 'merchant_subscriptions table created successfully';
    ELSE
        RAISE NOTICE 'merchant_subscriptions table already exists - skipping creation';
    END IF;
END $$;

-- 8. Create transaction QR codes table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transaction_qr_codes'
    ) THEN
        CREATE TABLE public.transaction_qr_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            merchant_id UUID NOT NULL,
            qr_code_data TEXT NOT NULL,
            transaction_value DECIMAL(18,8) NOT NULL,
            points_to_award INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            expires_at TIMESTAMP WITH TIME ZONE,
            used_by UUID,
            used_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add foreign key constraints if referenced tables exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchants') THEN
            ALTER TABLE public.transaction_qr_codes ADD CONSTRAINT fk_transaction_qr_codes_merchant_id 
            FOREIGN KEY (merchant_id) REFERENCES public.merchants(merchant_id) ON DELETE CASCADE;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
            ALTER TABLE public.transaction_qr_codes ADD CONSTRAINT fk_transaction_qr_codes_used_by 
            FOREIGN KEY (used_by) REFERENCES auth.users(id);
        END IF;
        
        RAISE NOTICE 'transaction_qr_codes table created successfully';
    ELSE
        RAISE NOTICE 'transaction_qr_codes table already exists - skipping creation';
    END IF;
END $$;

-- 9. Create subscribers table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'subscribers'
    ) THEN
        CREATE TABLE public.subscribers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT TRUE,
            subscription_type VARCHAR(50) DEFAULT 'newsletter',
            subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            unsubscribed_at TIMESTAMP WITH TIME ZONE
        );
        
        RAISE NOTICE 'subscribers table created successfully';
    ELSE
        RAISE NOTICE 'subscribers table already exists - skipping creation';
    END IF;
END $$;

-- 10. Enable RLS on all tables (with error handling)
DO $$
DECLARE
    target_table TEXT;
    tables_to_enable_rls TEXT[] := ARRAY[
        'nft_types', 'user_loyalty_cards', 'user_points', 'loyalty_transactions',
        'user_wallets', 'merchant_cards', 'merchant_subscriptions', 
        'transaction_qr_codes', 'subscribers'
    ];
BEGIN
    FOREACH target_table IN ARRAY tables_to_enable_rls
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = target_table
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
            RAISE NOTICE 'RLS enabled on %', target_table;
        END IF;
    END LOOP;
END $$;

-- 11. Create basic RLS policies (with error handling)
DO $$
BEGIN
    -- NFT Types policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nft_types') THEN
        DROP POLICY IF EXISTS "Anyone can view active NFT types" ON public.nft_types;
        CREATE POLICY "Anyone can view active NFT types" ON public.nft_types
            FOR SELECT TO authenticated
            USING (is_active = TRUE);
        
        DROP POLICY IF EXISTS "Admins can manage NFT types" ON public.nft_types;
        CREATE POLICY "Admins can manage NFT types" ON public.nft_types
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
    
    -- User loyalty cards policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_loyalty_cards') THEN
        DROP POLICY IF EXISTS "Users can view their own loyalty cards" ON public.user_loyalty_cards;
        CREATE POLICY "Users can view their own loyalty cards" ON public.user_loyalty_cards
            FOR SELECT TO authenticated
            USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can create their own loyalty cards" ON public.user_loyalty_cards;
        CREATE POLICY "Users can create their own loyalty cards" ON public.user_loyalty_cards
            FOR INSERT TO authenticated
            WITH CHECK (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can update their own loyalty cards" ON public.user_loyalty_cards;
        CREATE POLICY "Users can update their own loyalty cards" ON public.user_loyalty_cards
            FOR UPDATE TO authenticated
            USING (auth.uid() = user_id);
    END IF;
    
    -- User points policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_points') THEN
        DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
        CREATE POLICY "Users can view their own points" ON public.user_points
            FOR SELECT TO authenticated
            USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "System can update user points" ON public.user_points;
        CREATE POLICY "System can update user points" ON public.user_points
            FOR UPDATE TO authenticated
            WITH CHECK (TRUE);
    END IF;
    
    -- User wallets policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_wallets') THEN
        DROP POLICY IF EXISTS "Users can manage their own wallets" ON public.user_wallets;
        CREATE POLICY "Users can manage their own wallets" ON public.user_wallets
            FOR ALL TO authenticated
            USING (auth.uid() = user_id);
    END IF;
    
    -- Subscribers policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscribers') THEN
        DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;
        CREATE POLICY "Anyone can subscribe" ON public.subscribers
            FOR INSERT TO anon
            WITH CHECK (TRUE);
        
        DROP POLICY IF EXISTS "Admins can manage subscribers" ON public.subscribers;
        CREATE POLICY "Admins can manage subscribers" ON public.subscribers
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
    
    RAISE NOTICE 'RLS policies created successfully';
END $$;

-- 12. Create indexes for performance (with error handling)
DO $$
DECLARE
    target_table TEXT;
    index_name TEXT;
    target_column TEXT;
    index_definitions TEXT[] := ARRAY[
        'user_loyalty_cards_user_id:user_loyalty_cards:user_id',
        'user_loyalty_cards_nft_type_id:user_loyalty_cards:nft_type_id',
        'user_loyalty_cards_loyalty_number:user_loyalty_cards:loyalty_number',
        'user_points_user_id:user_points:user_id',
        'loyalty_transactions_user_id:loyalty_transactions:user_id',
        'loyalty_transactions_merchant_id:loyalty_transactions:merchant_id',
        'loyalty_transactions_transaction_date:loyalty_transactions:transaction_date',
        'loyalty_transactions_status:loyalty_transactions:status',
        'user_wallets_user_id:user_wallets:user_id',
        'merchant_cards_merchant_id:merchant_cards:merchant_id',
        'merchant_subscriptions_merchant_id:merchant_subscriptions:merchant_id',
        'merchant_subscriptions_status:merchant_subscriptions:status',
        'transaction_qr_codes_merchant_id:transaction_qr_codes:merchant_id',
        'transaction_qr_codes_is_active:transaction_qr_codes:is_active'
    ];
    index_def TEXT;
BEGIN
    FOREACH index_def IN ARRAY index_definitions
    LOOP
        index_name := split_part(index_def, ':', 1);
        target_table := split_part(index_def, ':', 2);
        target_column := split_part(index_def, ':', 3);
        
        -- Check if table exists and column exists before creating index
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = target_table
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = target_table AND column_name = target_column
        ) THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I ON public.%I(%I)', 
                index_name, target_table, target_column);
            RAISE NOTICE 'Index created: idx_%', index_name;
        ELSE
            RAISE NOTICE 'Skipping index % - table or column does not exist', index_name;
        END IF;
    END LOOP;
END $$;

-- 13. Insert default NFT types (with error handling)
DO $$
BEGIN
    -- Check if nft_types table exists and has the required columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nft_types') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'nft_types' AND column_name = 'name')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'nft_types' AND column_name = 'display_name') THEN
        
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
        
        RAISE NOTICE 'Default NFT types inserted successfully';
    ELSE
        RAISE NOTICE 'nft_types table does not exist or missing required columns - skipping default data insertion';
    END IF;
END $$;

-- 14. Add helpful comments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nft_types') THEN
        COMMENT ON TABLE public.nft_types IS 'NFT card types and configurations for loyalty system';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_loyalty_cards') THEN
        COMMENT ON TABLE public.user_loyalty_cards IS 'User loyalty card assignments and evolution status';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_points') THEN
        COMMENT ON TABLE public.user_points IS 'User point balances and tracking';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loyalty_transactions') THEN
        COMMENT ON TABLE public.loyalty_transactions IS 'Loyalty transaction history with 30-day release delay';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_wallets') THEN
        COMMENT ON TABLE public.user_wallets IS 'User wallet addresses and seed phrases';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_cards') THEN
        COMMENT ON TABLE public.merchant_cards IS 'Merchant custom loyalty cards and QR codes';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscriptions') THEN
        COMMENT ON TABLE public.merchant_subscriptions IS 'Merchant subscription management';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transaction_qr_codes') THEN
        COMMENT ON TABLE public.transaction_qr_codes IS 'Transaction QR codes for point earning';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscribers') THEN
        COMMENT ON TABLE public.subscribers IS 'Email newsletter subscribers';
    END IF;
    
    RAISE NOTICE 'Table comments added successfully';
END $$;
