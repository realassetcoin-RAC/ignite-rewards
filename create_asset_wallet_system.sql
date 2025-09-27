-- Create asset wallet system tables
-- This system allows users to create dedicated wallets for specific asset initiatives
-- with support for multiple cryptocurrencies and DEX integration

-- Asset Wallets Table
CREATE TABLE IF NOT EXISTS public.asset_wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    asset_initiative_id uuid REFERENCES public.asset_initiatives(id) NOT NULL,
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

-- DEX Transactions Table
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

-- Asset Investment Transactions Table
CREATE TABLE IF NOT EXISTS public.asset_investment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    wallet_id uuid REFERENCES public.asset_wallets(id) NOT NULL,
    transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'investment', 'return', 'dividend')),
    amount numeric(18, 8) NOT NULL,
    currency_type text NOT NULL,
    description text,
    reference_id text, -- Reference to external transaction or investment
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.asset_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dex_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_investment_transactions ENABLE ROW LEVEL SECURITY;

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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_asset_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_asset_wallet_updated_at
    BEFORE UPDATE ON public.asset_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_asset_wallet_updated_at();

-- Create function to validate wallet address format
CREATE OR REPLACE FUNCTION public.validate_wallet_address(p_address text, p_currency text)
RETURNS boolean AS $$
BEGIN
    -- Basic validation for different currency address formats
    CASE p_currency
        WHEN 'ETH', 'USDT' THEN
            -- Ethereum address format (0x followed by 40 hex characters)
            RETURN p_address ~ '^0x[a-fA-F0-9]{40}$';
        WHEN 'BTC' THEN
            -- Bitcoin address format (starts with 1, 3, or bc1)
            RETURN p_address ~ '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$' OR p_address ~ '^bc1[a-z0-9]{39,59}$';
        WHEN 'SOL' THEN
            -- Solana address format (base58, 32-44 characters)
            RETURN length(p_address) BETWEEN 32 AND 44;
        WHEN 'BNB' THEN
            -- BNB address format (similar to Ethereum)
            RETURN p_address ~ '^0x[a-fA-F0-9]{40}$';
        WHEN 'RAC' THEN
            -- RAC token address format (similar to Ethereum)
            RETURN p_address ~ '^0x[a-fA-F0-9]{40}$';
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to process DEX swap
CREATE OR REPLACE FUNCTION public.process_dex_swap(
    p_user_id uuid,
    p_from_currency text,
    p_to_currency text,
    p_from_amount numeric,
    p_exchange_rate numeric,
    p_dex_provider text
)
RETURNS uuid AS $$
DECLARE
    v_transaction_id uuid;
    v_to_amount numeric;
BEGIN
    -- Calculate to amount
    v_to_amount := p_from_amount * p_exchange_rate;
    
    -- Create DEX transaction record
    INSERT INTO public.dex_transactions (
        user_id,
        from_currency,
        to_currency,
        from_amount,
        to_amount,
        exchange_rate,
        dex_provider,
        status
    ) VALUES (
        p_user_id,
        p_from_currency,
        p_to_currency,
        p_from_amount,
        v_to_amount,
        p_exchange_rate,
        p_dex_provider,
        'pending'
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to complete DEX swap
CREATE OR REPLACE FUNCTION public.complete_dex_swap(
    p_transaction_id uuid,
    p_transaction_hash text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_transaction record;
    v_wallet_id uuid;
BEGIN
    -- Get transaction details
    SELECT * INTO v_transaction
    FROM public.dex_transactions
    WHERE id = p_transaction_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Find or create target wallet
    SELECT id INTO v_wallet_id
    FROM public.asset_wallets
    WHERE user_id = v_transaction.user_id 
    AND currency_type = v_transaction.to_currency
    AND is_active = true
    LIMIT 1;
    
    -- If no wallet exists, create one
    IF v_wallet_id IS NULL THEN
        INSERT INTO public.asset_wallets (
            user_id,
            asset_initiative_id,
            wallet_address,
            currency_type,
            balance,
            total_invested
        ) VALUES (
            v_transaction.user_id,
            (SELECT id FROM public.asset_initiatives LIMIT 1), -- Default to first initiative
            '0x' || encode(gen_random_bytes(20), 'hex'), -- Generate random address
            v_transaction.to_currency,
            v_transaction.to_amount,
            v_transaction.to_amount
        ) RETURNING id INTO v_wallet_id;
    ELSE
        -- Update existing wallet
        UPDATE public.asset_wallets
        SET balance = balance + v_transaction.to_amount,
            total_invested = total_invested + v_transaction.to_amount
        WHERE id = v_wallet_id;
    END IF;
    
    -- Update transaction status
    UPDATE public.dex_transactions
    SET status = 'completed',
        completed_at = now(),
        transaction_hash = p_transaction_hash
    WHERE id = p_transaction_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to record investment transaction
CREATE OR REPLACE FUNCTION public.record_investment_transaction(
    p_user_id uuid,
    p_wallet_id uuid,
    p_transaction_type text,
    p_amount numeric,
    p_currency_type text,
    p_description text DEFAULT NULL,
    p_reference_id text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_transaction_id uuid;
BEGIN
    -- Insert transaction record
    INSERT INTO public.asset_investment_transactions (
        user_id,
        wallet_id,
        transaction_type,
        amount,
        currency_type,
        description,
        reference_id
    ) VALUES (
        p_user_id,
        p_wallet_id,
        p_transaction_type,
        p_amount,
        p_currency_type,
        p_description,
        p_reference_id
    ) RETURNING id INTO v_transaction_id;
    
    -- Update wallet balance based on transaction type
    CASE p_transaction_type
        WHEN 'deposit', 'investment', 'return', 'dividend' THEN
            UPDATE public.asset_wallets
            SET balance = balance + p_amount
            WHERE id = p_wallet_id;
        WHEN 'withdrawal' THEN
            UPDATE public.asset_wallets
            SET balance = balance - p_amount
            WHERE id = p_wallet_id;
    END CASE;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dex_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_investment_transactions TO authenticated;

GRANT EXECUTE ON FUNCTION public.validate_wallet_address(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_dex_swap(uuid, text, text, numeric, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_dex_swap(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_investment_transaction(uuid, uuid, text, numeric, text, text, text) TO authenticated;

-- Insert sample data for testing (optional)
DO $$
BEGIN
    -- Only insert if no data exists
    IF NOT EXISTS (SELECT 1 FROM public.asset_wallets LIMIT 1) THEN
        -- Insert sample asset wallet for testing
        INSERT INTO public.asset_wallets (
            user_id,
            asset_initiative_id,
            wallet_address,
            currency_type,
            balance,
            total_invested,
            is_active
        ) VALUES (
            (SELECT id FROM auth.users LIMIT 1), -- Use first user
            (SELECT id FROM public.asset_initiatives LIMIT 1), -- Use first asset initiative
            '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            'USDT',
            1000.00,
            1000.00,
            true
        );
    END IF;
END $$;
