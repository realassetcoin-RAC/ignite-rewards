-- Apply all new features to the database (NO SAMPLE DATA VERSION)
-- This script creates all the necessary tables and functions for the new features
-- without inserting any sample data to avoid foreign key issues

-- First, let's check what tables exist and their structure
DO $$
DECLARE
    v_merchants_has_user_id boolean := false;
    v_merchants_has_created_by boolean := false;
    v_merchants_has_owner_id boolean := false;
    v_merchants_primary_key text;
BEGIN
    -- Check if merchants table exists and what its primary key is
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchants') THEN
        RAISE NOTICE 'Merchants table exists';
        
        -- Check what columns exist in merchants table
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'user_id'
        ) INTO v_merchants_has_user_id;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'created_by'
        ) INTO v_merchants_has_created_by;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'owner_id'
        ) INTO v_merchants_has_owner_id;
        
        -- Get primary key column name
        SELECT column_name INTO v_merchants_primary_key
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' AND tc.table_name = 'merchants' AND tc.constraint_type = 'PRIMARY KEY'
        LIMIT 1;
        
        RAISE NOTICE 'Merchants table structure:';
        RAISE NOTICE '  Primary key: %', COALESCE(v_merchants_primary_key, 'unknown');
        RAISE NOTICE '  Has user_id: %', v_merchants_has_user_id;
        RAISE NOTICE '  Has created_by: %', v_merchants_has_created_by;
        RAISE NOTICE '  Has owner_id: %', v_merchants_has_owner_id;
    ELSE
        RAISE NOTICE 'Merchants table does not exist - will create without foreign key reference';
    END IF;
    
    -- Check if asset_initiatives table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'asset_initiatives') THEN
        RAISE NOTICE 'Asset initiatives table exists';
    ELSE
        RAISE NOTICE 'Asset initiatives table does not exist - will create without foreign key reference';
    END IF;
END $$;

-- 1. Create merchant custom NFT table (with conditional foreign key)
CREATE TABLE IF NOT EXISTS public.merchant_custom_nfts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid NOT NULL, -- Will add foreign key constraint later if merchants table exists
    nft_name text NOT NULL,
    description text NOT NULL,
    image_url text,
    discount_code text NOT NULL UNIQUE,
    discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value numeric(10, 2) NOT NULL CHECK (discount_value > 0),
    min_purchase_amount numeric(10, 2) DEFAULT 0,
    max_uses integer DEFAULT 0 CHECK (max_uses >= 0),
    current_uses integer DEFAULT 0 CHECK (current_uses >= 0),
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    qr_code_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraint for merchants if the table exists
DO $$
DECLARE
    v_merchants_primary_key text;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchants') THEN
        -- Get primary key column name
        SELECT column_name INTO v_merchants_primary_key
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' AND tc.table_name = 'merchants' AND tc.constraint_type = 'PRIMARY KEY'
        LIMIT 1;
        
        IF v_merchants_primary_key IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.merchant_custom_nfts 
                ADD CONSTRAINT fk_merchant_custom_nfts_merchant_id 
                FOREIGN KEY (merchant_id) REFERENCES public.merchants(%I)', v_merchants_primary_key);
            RAISE NOTICE 'Added foreign key constraint for merchant_custom_nfts.merchant_id referencing merchants.%', v_merchants_primary_key;
        ELSE
            RAISE NOTICE 'Could not determine merchants table primary key - skipping foreign key constraint';
        END IF;
    ELSE
        RAISE NOTICE 'Merchants table does not exist - skipping foreign key constraint';
    END IF;
END $$;

-- 2. Create asset wallets table (with conditional foreign key)
CREATE TABLE IF NOT EXISTS public.asset_wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    asset_initiative_id uuid NOT NULL, -- Will add foreign key constraint later if asset_initiatives table exists
    wallet_address text NOT NULL UNIQUE,
    currency_type text NOT NULL CHECK (currency_type IN ('USDT', 'ETH', 'BTC', 'SOL', 'BNB', 'RAC')),
    balance numeric(18, 8) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    locked_balance numeric(18, 8) NOT NULL DEFAULT 0 CHECK (locked_balance >= 0),
    total_invested numeric(18, 8) NOT NULL DEFAULT 0 CHECK (total_invested >= 0),
    total_returns numeric(18, 8) NOT NULL DEFAULT 0,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, asset_initiative_id, currency_type)
);

-- Add foreign key constraint for asset_initiatives if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'asset_initiatives') THEN
        -- Check if asset_initiatives table has 'id' column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_initiatives' AND column_name = 'id') THEN
            ALTER TABLE public.asset_wallets 
            ADD CONSTRAINT fk_asset_wallets_asset_initiative_id 
            FOREIGN KEY (asset_initiative_id) REFERENCES public.asset_initiatives(id);
            RAISE NOTICE 'Added foreign key constraint for asset_wallets.asset_initiative_id';
        ELSE
            RAISE NOTICE 'Asset initiatives table exists but does not have id column - skipping foreign key constraint';
        END IF;
    ELSE
        RAISE NOTICE 'Asset initiatives table does not exist - skipping foreign key constraint';
    END IF;
END $$;

-- 3. Create DEX transactions table
CREATE TABLE IF NOT EXISTS public.dex_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    from_currency text NOT NULL,
    to_currency text NOT NULL,
    from_amount numeric(18, 8) NOT NULL CHECK (from_amount > 0),
    to_amount numeric(18, 8) NOT NULL CHECK (to_amount > 0),
    exchange_rate numeric(18, 8) NOT NULL CHECK (exchange_rate > 0),
    dex_provider text NOT NULL CHECK (dex_provider IN ('uniswap', 'pancakeswap', 'raydium', 'jupiter')),
    transaction_hash text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);

-- 4. Create asset investment transactions table (with conditional foreign key)
CREATE TABLE IF NOT EXISTS public.asset_investment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    wallet_id uuid NOT NULL, -- Will add foreign key constraint after asset_wallets is created
    transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'investment', 'return', 'dividend')),
    amount numeric(18, 8) NOT NULL,
    currency_type text NOT NULL,
    description text,
    reference_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraint for asset_wallets
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'asset_wallets') THEN
        ALTER TABLE public.asset_investment_transactions 
        ADD CONSTRAINT fk_asset_investment_transactions_wallet_id 
        FOREIGN KEY (wallet_id) REFERENCES public.asset_wallets(id);
        RAISE NOTICE 'Added foreign key constraint for asset_investment_transactions.wallet_id';
    ELSE
        RAISE NOTICE 'Asset wallets table does not exist - skipping foreign key constraint';
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.merchant_custom_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dex_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_investment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for merchant_custom_nfts (conditional based on merchants table structure)
DO $$
DECLARE
    v_merchants_has_user_id boolean := false;
    v_merchants_has_created_by boolean := false;
    v_merchants_has_owner_id boolean := false;
    v_merchants_primary_key text;
    v_user_column text;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchants') THEN
        -- Check what columns exist in merchants table
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'user_id'
        ) INTO v_merchants_has_user_id;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'created_by'
        ) INTO v_merchants_has_created_by;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'owner_id'
        ) INTO v_merchants_has_owner_id;
        
        -- Get primary key column name
        SELECT column_name INTO v_merchants_primary_key
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' AND tc.table_name = 'merchants' AND tc.constraint_type = 'PRIMARY KEY'
        LIMIT 1;
        
        -- Determine which column to use for user identification
        IF v_merchants_has_user_id THEN
            v_user_column := 'user_id';
        ELSIF v_merchants_has_created_by THEN
            v_user_column := 'created_by';
        ELSIF v_merchants_has_owner_id THEN
            v_user_column := 'owner_id';
        ELSE
            v_user_column := NULL;
        END IF;
        
        IF v_user_column IS NOT NULL AND v_merchants_primary_key IS NOT NULL THEN
            -- Create policies that reference merchants table with the correct column
            EXECUTE format('CREATE POLICY "Merchants can view their own custom NFTs" ON public.merchant_custom_nfts
                FOR SELECT USING (merchant_id IN (
                    SELECT %I FROM public.merchants WHERE %I = auth.uid()
                ))', v_merchants_primary_key, v_user_column);

            EXECUTE format('CREATE POLICY "Merchants can insert their own custom NFTs" ON public.merchant_custom_nfts
                FOR INSERT WITH CHECK (merchant_id IN (
                    SELECT %I FROM public.merchants WHERE %I = auth.uid()
                ))', v_merchants_primary_key, v_user_column);

            EXECUTE format('CREATE POLICY "Merchants can update their own custom NFTs" ON public.merchant_custom_nfts
                FOR UPDATE USING (merchant_id IN (
                    SELECT %I FROM public.merchants WHERE %I = auth.uid()
                ))', v_merchants_primary_key, v_user_column);

            EXECUTE format('CREATE POLICY "Merchants can delete their own custom NFTs" ON public.merchant_custom_nfts
                FOR DELETE USING (merchant_id IN (
                    SELECT %I FROM public.merchants WHERE %I = auth.uid()
                ))', v_merchants_primary_key, v_user_column);
            
            RAISE NOTICE 'Created RLS policies for merchant_custom_nfts with merchants table reference using % column', v_user_column;
        ELSE
            -- Create basic policies without merchants table reference
            CREATE POLICY "Users can view custom NFTs" ON public.merchant_custom_nfts
                FOR SELECT USING (true);

            CREATE POLICY "Users can insert custom NFTs" ON public.merchant_custom_nfts
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');

            CREATE POLICY "Users can update custom NFTs" ON public.merchant_custom_nfts
                FOR UPDATE USING (auth.role() = 'authenticated');

            CREATE POLICY "Users can delete custom NFTs" ON public.merchant_custom_nfts
                FOR DELETE USING (auth.role() = 'authenticated');
            
            RAISE NOTICE 'Created basic RLS policies for merchant_custom_nfts without merchants table reference';
        END IF;
    ELSE
        -- Create basic policies without merchants table reference
        CREATE POLICY "Users can view custom NFTs" ON public.merchant_custom_nfts
            FOR SELECT USING (true);

        CREATE POLICY "Users can insert custom NFTs" ON public.merchant_custom_nfts
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Users can update custom NFTs" ON public.merchant_custom_nfts
            FOR UPDATE USING (auth.role() = 'authenticated');

        CREATE POLICY "Users can delete custom NFTs" ON public.merchant_custom_nfts
            FOR DELETE USING (auth.role() = 'authenticated');
        
        RAISE NOTICE 'Created basic RLS policies for merchant_custom_nfts without merchants table reference';
    END IF;
END $$;

-- Public read access for active NFTs
CREATE POLICY "Public can view active custom NFTs" ON public.merchant_custom_nfts
    FOR SELECT USING (is_active = true AND valid_until > now());

-- RLS Policies for asset_wallets
CREATE POLICY "Users can view their own asset wallets" ON public.asset_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own asset wallets" ON public.asset_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own asset wallets" ON public.asset_wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own asset wallets" ON public.asset_wallets
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for dex_transactions
CREATE POLICY "Users can view their own DEX transactions" ON public.dex_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DEX transactions" ON public.dex_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DEX transactions" ON public.dex_transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for asset_investment_transactions
CREATE POLICY "Users can view their own investment transactions" ON public.asset_investment_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment transactions" ON public.asset_investment_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_merchant_custom_nfts_merchant_id ON public.merchant_custom_nfts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_custom_nfts_discount_code ON public.merchant_custom_nfts(discount_code);
CREATE INDEX IF NOT EXISTS idx_merchant_custom_nfts_active ON public.merchant_custom_nfts(is_active, valid_until);

CREATE INDEX IF NOT EXISTS idx_asset_wallets_user_id ON public.asset_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_wallets_asset_initiative_id ON public.asset_wallets(asset_initiative_id);
CREATE INDEX IF NOT EXISTS idx_asset_wallets_currency_type ON public.asset_wallets(currency_type);
CREATE INDEX IF NOT EXISTS idx_asset_wallets_wallet_address ON public.asset_wallets(wallet_address);

CREATE INDEX IF NOT EXISTS idx_dex_transactions_user_id ON public.dex_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_dex_transactions_status ON public.dex_transactions(status);
CREATE INDEX IF NOT EXISTS idx_dex_transactions_created_at ON public.dex_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_asset_investment_transactions_user_id ON public.asset_investment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_investment_transactions_wallet_id ON public.asset_investment_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_asset_investment_transactions_type ON public.asset_investment_transactions(transaction_type);

-- Create functions
CREATE OR REPLACE FUNCTION public.update_merchant_custom_nft_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_asset_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_merchant_custom_nft_updated_at
    BEFORE UPDATE ON public.merchant_custom_nfts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_merchant_custom_nft_updated_at();

CREATE TRIGGER update_asset_wallet_updated_at
    BEFORE UPDATE ON public.asset_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_asset_wallet_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_custom_nfts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dex_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_investment_transactions TO authenticated;

-- Final status message
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully applied all new features to the database!';
    RAISE NOTICE '📊 Created tables: merchant_custom_nfts, asset_wallets, dex_transactions, asset_investment_transactions';
    RAISE NOTICE '🔒 Enabled RLS policies for all tables';
    RAISE NOTICE '📈 Created indexes for performance';
    RAISE NOTICE '⚡ Created triggers and functions';
    RAISE NOTICE '🎯 Granted permissions to authenticated users';
    RAISE NOTICE '💡 No sample data inserted - you can add your own data through the application';
END $$;
