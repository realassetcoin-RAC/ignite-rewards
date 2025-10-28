-- Fix Database Schema Gaps - Corrected Version
-- This migration addresses the mismatches between frontend expectations and actual database schema
-- Date: 2025-01-28

-- 1. Update asset_initiatives table to include missing Web3 fields
DO $$
BEGIN
    -- Add impact_score column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'impact_score') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN impact_score INTEGER DEFAULT 5;
    END IF;

    -- Add risk_level column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'risk_level') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN risk_level TEXT DEFAULT 'medium' 
            CHECK (risk_level IN ('low', 'medium', 'high'));
    END IF;

    -- Add expected_return column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'expected_return') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN expected_return DECIMAL(5,2) DEFAULT 7.50;
    END IF;

    -- Add min_investment column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'min_investment') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN min_investment DECIMAL(15,2) DEFAULT 100.00;
    END IF;

    -- Add max_investment column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'max_investment') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN max_investment DECIMAL(15,2) DEFAULT 100000.00;
    END IF;

    -- Add current_funding column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'current_funding') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN current_funding DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Add target_funding column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'target_funding') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN target_funding DECIMAL(15,2) DEFAULT 1000000.00;
    END IF;

    -- Add image_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'image_url') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN image_url TEXT;
    END IF;

    -- Add website_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'website_url') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN website_url TEXT;
    END IF;

    -- Add Web3 specific fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'multi_sig_wallet_address') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN multi_sig_wallet_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'multi_sig_threshold') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN multi_sig_threshold INTEGER DEFAULT 2;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'multi_sig_signers') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN multi_sig_signers JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'blockchain_network') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN blockchain_network TEXT DEFAULT 'ethereum';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'supported_currencies') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN supported_currencies JSONB DEFAULT '["USDT", "SOL", "ETH", "BTC"]';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'is_web3_enabled') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN is_web3_enabled BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'hot_wallet_address') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN hot_wallet_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'cold_wallet_address') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN cold_wallet_address TEXT;
    END IF;

    -- Add name column (alias for initiative_name for frontend compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'name') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN name TEXT;
    END IF;

    -- Add category column (alias for asset_type for frontend compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_initiatives' 
                   AND column_name = 'category') THEN
        ALTER TABLE public.asset_initiatives ADD COLUMN category TEXT;
    END IF;

    -- Update category constraint
    ALTER TABLE public.asset_initiatives DROP CONSTRAINT IF EXISTS asset_initiatives_category_check;
    ALTER TABLE public.asset_initiatives ADD CONSTRAINT asset_initiatives_category_check 
        CHECK (category IN ('environmental', 'social', 'governance', 'technology', 'healthcare', 'education', 'economic', 'health'));

    RAISE NOTICE 'Asset initiatives table updated with Web3 fields';
END $$;

-- 2. Update asset_investments table to include missing fields
DO $$
BEGIN
    -- Rename currency to currency_type if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'asset_investments' 
               AND column_name = 'currency') THEN
        ALTER TABLE public.asset_investments RENAME COLUMN currency TO currency_type;
    END IF;

    -- Add currency_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_investments' 
                   AND column_name = 'currency_type') THEN
        ALTER TABLE public.asset_investments ADD COLUMN currency_type TEXT DEFAULT 'USDT' 
            CHECK (currency_type IN ('USDT', 'SOL', 'ETH', 'BTC', 'RAC'));
    END IF;

    -- Add investment_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_investments' 
                   AND column_name = 'investment_type') THEN
        ALTER TABLE public.asset_investments ADD COLUMN investment_type TEXT DEFAULT 'direct_web3' 
            CHECK (investment_type IN ('direct_web3', 'rac_conversion', 'custodial'));
    END IF;

    -- Add blockchain_network column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_investments' 
                   AND column_name = 'blockchain_network') THEN
        ALTER TABLE public.asset_investments ADD COLUMN blockchain_network TEXT DEFAULT 'ethereum';
    END IF;

    -- Add from_wallet_address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_investments' 
                   AND column_name = 'from_wallet_address') THEN
        ALTER TABLE public.asset_investments ADD COLUMN from_wallet_address TEXT;
    END IF;

    -- Add to_wallet_address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_investments' 
                   AND column_name = 'to_wallet_address') THEN
        ALTER TABLE public.asset_investments ADD COLUMN to_wallet_address TEXT;
    END IF;

    -- Add current_value column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_investments' 
                   AND column_name = 'current_value') THEN
        ALTER TABLE public.asset_investments ADD COLUMN current_value DECIMAL(18,8) DEFAULT 0;
    END IF;

    -- Add total_returns column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_investments' 
                   AND column_name = 'total_returns') THEN
        ALTER TABLE public.asset_investments ADD COLUMN total_returns DECIMAL(18,8) DEFAULT 0;
    END IF;

    -- Add return_percentage column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_investments' 
                   AND column_name = 'return_percentage') THEN
        ALTER TABLE public.asset_investments ADD COLUMN return_percentage DECIMAL(5,2) DEFAULT 0;
    END IF;

    -- Add invested_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_investments' 
                   AND column_name = 'invested_at') THEN
        ALTER TABLE public.asset_investments ADD COLUMN invested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add confirmed_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'asset_investments' 
                   AND column_name = 'confirmed_at') THEN
        ALTER TABLE public.asset_investments ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    RAISE NOTICE 'Asset investments table updated with Web3 fields';
END $$;

-- 3. Create user_wallet_connections table
CREATE TABLE IF NOT EXISTS public.user_wallet_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('metamask', 'phantom', 'trust_wallet', 'hardware', 'custodial')),
    blockchain_network TEXT NOT NULL CHECK (blockchain_network IN ('ethereum', 'solana', 'bitcoin', 'polygon')),
    connection_method TEXT NOT NULL CHECK (connection_method IN ('signature', 'transaction', 'api')),
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verification_data JSONB,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create rac_conversions table
CREATE TABLE IF NOT EXISTS public.rac_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rac_amount DECIMAL(18,8) NOT NULL,
    target_currency TEXT NOT NULL CHECK (target_currency IN ('USDT', 'ETH', 'SOL', 'BTC')),
    converted_amount DECIMAL(18,8) NOT NULL,
    exchange_rate DECIMAL(18,8) NOT NULL,
    dex_provider TEXT NOT NULL CHECK (dex_provider IN ('uniswap', 'pancakeswap', 'raydium', 'jupiter')),
    transaction_hash TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create investment_returns table
CREATE TABLE IF NOT EXISTS public.investment_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id UUID NOT NULL REFERENCES public.asset_investments(id) ON DELETE CASCADE,
    return_amount DECIMAL(18,8) NOT NULL,
    return_percentage DECIMAL(5,2) NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_type TEXT NOT NULL CHECK (return_type IN ('dividend', 'capital_gain', 'interest', 'other')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security on new tables
ALTER TABLE public.user_wallet_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rac_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_returns ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for new tables (using profiles table instead of auth.users)
-- User wallet connections policies
CREATE POLICY "Users can view their own wallet connections" ON public.user_wallet_connections
    FOR SELECT USING (user_id = (SELECT id FROM public.profiles WHERE id = user_id));

CREATE POLICY "Users can insert their own wallet connections" ON public.user_wallet_connections
    FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE id = user_id));

CREATE POLICY "Users can update their own wallet connections" ON public.user_wallet_connections
    FOR UPDATE USING (user_id = (SELECT id FROM public.profiles WHERE id = user_id));

-- RAC conversions policies
CREATE POLICY "Users can view their own RAC conversions" ON public.rac_conversions
    FOR SELECT USING (user_id = (SELECT id FROM public.profiles WHERE id = user_id));

CREATE POLICY "Users can insert their own RAC conversions" ON public.rac_conversions
    FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE id = user_id));

-- Investment returns policies
CREATE POLICY "Users can view returns for their investments" ON public.investment_returns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.asset_investments 
            WHERE asset_investments.id = investment_returns.investment_id 
            AND asset_investments.user_id = (SELECT id FROM public.profiles WHERE id = asset_investments.user_id)
        )
    );

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_wallet_connections_user_id ON public.user_wallet_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallet_connections_wallet_address ON public.user_wallet_connections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_rac_conversions_user_id ON public.rac_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_rac_conversions_status ON public.rac_conversions(status);
CREATE INDEX IF NOT EXISTS idx_investment_returns_investment_id ON public.investment_returns(investment_id);
CREATE INDEX IF NOT EXISTS idx_investment_returns_return_date ON public.investment_returns(return_date);

-- 9. Update existing asset_initiatives with sample data and populate name/category columns
UPDATE public.asset_initiatives SET
    name = initiative_name,
    category = CASE 
        WHEN asset_type = 'real_estate' THEN 'environmental'
        WHEN asset_type = 'crypto' THEN 'technology'
        WHEN asset_type = 'stocks' THEN 'economic'
        WHEN asset_type = 'commodities' THEN 'economic'
        ELSE 'social'
    END,
    impact_score = CASE 
        WHEN asset_type = 'real_estate' THEN 9
        WHEN asset_type = 'crypto' THEN 7
        WHEN asset_type = 'stocks' THEN 6
        WHEN asset_type = 'commodities' THEN 5
        ELSE 8
    END,
    risk_level = CASE 
        WHEN asset_type = 'real_estate' THEN 'low'
        WHEN asset_type = 'crypto' THEN 'high'
        WHEN asset_type = 'stocks' THEN 'medium'
        WHEN asset_type = 'commodities' THEN 'medium'
        ELSE 'medium'
    END,
    expected_return = CASE 
        WHEN asset_type = 'real_estate' THEN 8.5
        WHEN asset_type = 'crypto' THEN 12.0
        WHEN asset_type = 'stocks' THEN 7.0
        WHEN asset_type = 'commodities' THEN 6.5
        ELSE 7.5
    END,
    min_investment = 100.00,
    max_investment = 100000.00,
    current_funding = COALESCE(current_amount, 0.00),
    target_funding = COALESCE(target_amount, 1000000.00),
    is_web3_enabled = TRUE,
    blockchain_network = 'ethereum',
    supported_currencies = '["USDT", "SOL", "ETH", "BTC"]'::jsonb
WHERE name IS NULL OR category IS NULL;

-- 10. Create updated_at triggers for new tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables that need them
DROP TRIGGER IF EXISTS update_user_wallet_connections_updated_at ON public.user_wallet_connections;
CREATE TRIGGER update_user_wallet_connections_updated_at
    BEFORE UPDATE ON public.user_wallet_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Grant permissions (using public schema instead of authenticated role)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_wallet_connections TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rac_conversions TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investment_returns TO PUBLIC;

-- 12. Final verification
DO $$
DECLARE
    asset_initiatives_columns INTEGER;
    asset_investments_columns INTEGER;
    user_wallet_connections_exists BOOLEAN;
    rac_conversions_exists BOOLEAN;
    investment_returns_exists BOOLEAN;
BEGIN
    -- Check asset_initiatives columns
    SELECT COUNT(*) INTO asset_initiatives_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'asset_initiatives';
    
    -- Check asset_investments columns
    SELECT COUNT(*) INTO asset_investments_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'asset_investments';
    
    -- Check new tables exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_wallet_connections'
    ) INTO user_wallet_connections_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'rac_conversions'
    ) INTO rac_conversions_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'investment_returns'
    ) INTO investment_returns_exists;
    
    RAISE NOTICE 'Schema update completed:';
    RAISE NOTICE '  Asset initiatives columns: %', asset_initiatives_columns;
    RAISE NOTICE '  Asset investments columns: %', asset_investments_columns;
    RAISE NOTICE '  User wallet connections table: %', user_wallet_connections_exists;
    RAISE NOTICE '  RAC conversions table: %', rac_conversions_exists;
    RAISE NOTICE '  Investment returns table: %', investment_returns_exists;
END $$;


