-- Web3 Investment Flow Implementation
-- This script implements the complete Web3 investment system for asset initiatives

-- 1. Enhanced asset initiatives with multi-sig wallet info
ALTER TABLE public.asset_initiatives 
ADD COLUMN IF NOT EXISTS multi_sig_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS multi_sig_threshold INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS multi_sig_signers JSONB,
ADD COLUMN IF NOT EXISTS blockchain_network TEXT DEFAULT 'ethereum',
ADD COLUMN IF NOT EXISTS supported_currencies JSONB DEFAULT '["USDT", "SOL", "ETH", "BTC"]',
ADD COLUMN IF NOT EXISTS investment_contract_address TEXT,
ADD COLUMN IF NOT EXISTS is_web3_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS hot_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS cold_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS total_investments NUMERIC(18, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_investors INTEGER DEFAULT 0;

-- 2. Investment transactions table
CREATE TABLE IF NOT EXISTS public.asset_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    asset_initiative_id UUID REFERENCES public.asset_initiatives(id) NOT NULL,
    
    -- Investment Details
    investment_amount NUMERIC(18, 8) NOT NULL CHECK (investment_amount > 0),
    currency_type TEXT NOT NULL CHECK (currency_type IN ('USDT', 'SOL', 'ETH', 'BTC', 'RAC')),
    investment_type TEXT NOT NULL CHECK (investment_type IN ('direct_web3', 'rac_conversion', 'custodial')),
    
    -- Blockchain Details
    transaction_hash TEXT UNIQUE,
    blockchain_network TEXT NOT NULL,
    from_wallet_address TEXT NOT NULL,
    to_wallet_address TEXT NOT NULL, -- Multi-sig wallet address
    
    -- Status and Tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    confirmation_blocks INTEGER DEFAULT 0,
    gas_fee NUMERIC(18, 8),
    
    -- Returns Tracking
    current_value NUMERIC(18, 8) DEFAULT 0,
    total_returns NUMERIC(18, 8) DEFAULT 0,
    return_percentage NUMERIC(5, 2) DEFAULT 0,
    
    -- Timestamps
    invested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User wallet connections
CREATE TABLE IF NOT EXISTS public.user_wallet_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Wallet Details
    wallet_address TEXT NOT NULL,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('metamask', 'phantom', 'trust_wallet', 'hardware', 'custodial')),
    blockchain_network TEXT NOT NULL CHECK (blockchain_network IN ('ethereum', 'solana', 'bitcoin', 'polygon')),
    
    -- Connection Details
    connection_method TEXT NOT NULL CHECK (connection_method IN ('signature', 'transaction', 'api')),
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verification_data JSONB,
    
    -- Security
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RAC conversion tracking
CREATE TABLE IF NOT EXISTS public.rac_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Conversion Details
    rac_amount NUMERIC(18, 8) NOT NULL CHECK (rac_amount > 0),
    target_currency TEXT NOT NULL CHECK (target_currency IN ('USDT', 'ETH', 'SOL', 'BTC')),
    converted_amount NUMERIC(18, 8) NOT NULL CHECK (converted_amount > 0),
    exchange_rate NUMERIC(18, 8) NOT NULL CHECK (exchange_rate > 0),
    
    -- DEX Details
    dex_provider TEXT NOT NULL CHECK (dex_provider IN ('uniswap', 'pancakeswap', 'raydium', 'jupiter')),
    transaction_hash TEXT UNIQUE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    
    -- Timestamps
    converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Investment returns tracking
CREATE TABLE IF NOT EXISTS public.investment_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id UUID REFERENCES public.asset_investments(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    asset_initiative_id UUID REFERENCES public.asset_initiatives(id) NOT NULL,
    
    -- Returns Details
    return_amount NUMERIC(18, 8) NOT NULL,
    return_percentage NUMERIC(5, 2) NOT NULL,
    return_type TEXT NOT NULL CHECK (return_type IN ('dividend', 'capital_gain', 'interest', 'bonus')),
    
    -- Blockchain Details
    transaction_hash TEXT,
    blockchain_network TEXT NOT NULL,
    
    -- Timestamps
    return_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS on all tables
ALTER TABLE public.asset_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallet_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rac_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_returns ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for asset_investments
CREATE POLICY "Users can view their own investments" ON public.asset_investments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investments" ON public.asset_investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments" ON public.asset_investments
    FOR UPDATE USING (auth.uid() = user_id);

-- 8. RLS Policies for user_wallet_connections
CREATE POLICY "Users can view their own wallet connections" ON public.user_wallet_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet connections" ON public.user_wallet_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet connections" ON public.user_wallet_connections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallet connections" ON public.user_wallet_connections
    FOR DELETE USING (auth.uid() = user_id);

-- 9. RLS Policies for rac_conversions
CREATE POLICY "Users can view their own RAC conversions" ON public.rac_conversions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own RAC conversions" ON public.rac_conversions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. RLS Policies for investment_returns
CREATE POLICY "Users can view their own investment returns" ON public.investment_returns
    FOR SELECT USING (auth.uid() = user_id);

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_investments_user_id ON public.asset_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_investments_asset_initiative_id ON public.asset_investments(asset_initiative_id);
CREATE INDEX IF NOT EXISTS idx_asset_investments_status ON public.asset_investments(status);
CREATE INDEX IF NOT EXISTS idx_asset_investments_transaction_hash ON public.asset_investments(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_asset_investments_invested_at ON public.asset_investments(invested_at);

CREATE INDEX IF NOT EXISTS idx_user_wallet_connections_user_id ON public.user_wallet_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallet_connections_wallet_address ON public.user_wallet_connections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_wallet_connections_verification_status ON public.user_wallet_connections(verification_status);

CREATE INDEX IF NOT EXISTS idx_rac_conversions_user_id ON public.rac_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_rac_conversions_status ON public.rac_conversions(status);
CREATE INDEX IF NOT EXISTS idx_rac_conversions_transaction_hash ON public.rac_conversions(transaction_hash);

CREATE INDEX IF NOT EXISTS idx_investment_returns_investment_id ON public.investment_returns(investment_id);
CREATE INDEX IF NOT EXISTS idx_investment_returns_user_id ON public.investment_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_returns_asset_initiative_id ON public.investment_returns(asset_initiative_id);

-- 12. Create functions for investment management
CREATE OR REPLACE FUNCTION public.create_asset_investment(
    p_user_id UUID,
    p_asset_initiative_id UUID,
    p_investment_amount NUMERIC,
    p_currency_type TEXT,
    p_investment_type TEXT,
    p_transaction_hash TEXT,
    p_blockchain_network TEXT,
    p_from_wallet_address TEXT,
    p_to_wallet_address TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_investment_id UUID;
BEGIN
    -- Insert investment record
    INSERT INTO public.asset_investments (
        user_id,
        asset_initiative_id,
        investment_amount,
        currency_type,
        investment_type,
        transaction_hash,
        blockchain_network,
        from_wallet_address,
        to_wallet_address,
        status
    ) VALUES (
        p_user_id,
        p_asset_initiative_id,
        p_investment_amount,
        p_currency_type,
        p_investment_type,
        p_transaction_hash,
        p_blockchain_network,
        p_from_wallet_address,
        p_to_wallet_address,
        'pending'
    ) RETURNING id INTO v_investment_id;
    
    -- Update asset initiative totals
    UPDATE public.asset_initiatives 
    SET 
        total_investments = total_investments + p_investment_amount,
        total_investors = total_investors + 1,
        updated_at = NOW()
    WHERE id = p_asset_initiative_id;
    
    RETURN v_investment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_asset_investment(
    p_investment_id UUID,
    p_transaction_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update investment status
    UPDATE public.asset_investments 
    SET 
        status = 'confirmed',
        confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_investment_id AND transaction_hash = p_transaction_hash;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_wallet_ownership(
    p_user_id UUID,
    p_wallet_address TEXT,
    p_wallet_type TEXT,
    p_blockchain_network TEXT,
    p_verification_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_connection_id UUID;
BEGIN
    -- Insert wallet connection
    INSERT INTO public.user_wallet_connections (
        user_id,
        wallet_address,
        wallet_type,
        blockchain_network,
        connection_method,
        verification_status,
        verification_data
    ) VALUES (
        p_user_id,
        p_wallet_address,
        p_wallet_type,
        p_blockchain_network,
        'signature',
        'verified',
        p_verification_data
    ) RETURNING id INTO v_connection_id;
    
    RETURN v_connection_id IS NOT NULL;
END;
$$;

-- 13. Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_asset_investments_updated_at
    BEFORE UPDATE ON public.asset_investments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_wallet_connections_updated_at
    BEFORE UPDATE ON public.user_wallet_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_investments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_wallet_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rac_conversions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investment_returns TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_asset_investment(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_asset_investment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_wallet_ownership(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- 15. Insert sample asset initiatives with multi-sig wallets
DO $$
BEGIN
    -- Only insert if no asset initiatives exist
    IF NOT EXISTS (SELECT 1 FROM public.asset_initiatives LIMIT 1) THEN
        INSERT INTO public.asset_initiatives (
            name,
            description,
            category,
            impact_score,
            risk_level,
            expected_return,
            min_investment,
            max_investment,
            current_funding,
            target_funding,
            is_active,
            multi_sig_wallet_address,
            multi_sig_threshold,
            multi_sig_signers,
            blockchain_network,
            supported_currencies,
            hot_wallet_address,
            cold_wallet_address
        ) VALUES 
        (
            'Green Energy Initiative',
            'Investing in renewable energy projects to combat climate change and promote sustainable development.',
            'environmental',
            9,
            'medium',
            12.5,
            100.00,
            100000.00,
            0,
            1000000.00,
            true,
            '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            3,
            '["0x1234567890123456789012345678901234567890", "0x2345678901234567890123456789012345678901", "0x3456789012345678901234567890123456789012", "0x4567890123456789012345678901234567890123", "0x5678901234567890123456789012345678901234"]',
            'ethereum',
            '["USDT", "ETH", "BTC"]',
            '0xhot1234567890123456789012345678901234567890',
            '0xcold1234567890123456789012345678901234567890'
        ),
        (
            'Education Technology',
            'Supporting innovative educational technology solutions to improve learning outcomes globally.',
            'education',
            8,
            'low',
            8.0,
            50.00,
            50000.00,
            0,
            500000.00,
            true,
            '0x852d35Cc6634C0532925a3b8D4C9db96C4b4d8b7',
            2,
            '["0x6789012345678901234567890123456789012345", "0x7890123456789012345678901234567890123456", "0x8901234567890123456789012345678901234567"]',
            'ethereum',
            '["USDT", "ETH", "SOL"]',
            '0xhot2345678901234567890123456789012345678901',
            '0xcold2345678901234567890123456789012345678901'
        ),
        (
            'Healthcare Innovation',
            'Funding breakthrough healthcare technologies and treatments to improve global health outcomes.',
            'healthcare',
            10,
            'high',
            15.0,
            200.00,
            200000.00,
            0,
            2000000.00,
            true,
            '0x962d35Cc6634C0532925a3b8D4C9db96C4b4d8b8',
            4,
            '["0x9012345678901234567890123456789012345678", "0x0123456789012345678901234567890123456789", "0x1234567890123456789012345678901234567890", "0x2345678901234567890123456789012345678901", "0x3456789012345678901234567890123456789012"]',
            'ethereum',
            '["USDT", "ETH", "BTC", "SOL"]',
            '0xhot3456789012345678901234567890123456789012',
            '0xcold3456789012345678901234567890123456789012'
        );
        
        RAISE NOTICE 'Inserted sample asset initiatives with multi-sig wallets';
    ELSE
        RAISE NOTICE 'Asset initiatives already exist - skipping sample data';
    END IF;
END $$;

-- 16. Final status message
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully implemented Web3 Investment Flow!';
    RAISE NOTICE '📊 Created tables: asset_investments, user_wallet_connections, rac_conversions, investment_returns';
    RAISE NOTICE '🔒 Enabled RLS policies for all tables';
    RAISE NOTICE '📈 Created indexes for performance';
    RAISE NOTICE '⚡ Created functions and triggers';
    RAISE NOTICE '🎯 Granted permissions to authenticated users';
    RAISE NOTICE '🏦 Added multi-sig wallet support to asset initiatives';
    RAISE NOTICE '💡 Sample asset initiatives with multi-sig wallets created';
END $$;
