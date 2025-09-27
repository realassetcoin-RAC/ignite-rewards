-- Update Smart Contracts for Solana Compliance
-- This script updates the database to store Solana-specific contract information

-- Add Solana-specific columns to smart_contracts table
DO $$ 
BEGIN
    -- Add Candy Machine address column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contracts' 
        AND column_name = 'candy_machine_address'
    ) THEN
        ALTER TABLE public.smart_contracts 
        ADD COLUMN candy_machine_address VARCHAR(44);
    END IF;

    -- Add collection mint address column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contracts' 
        AND column_name = 'collection_mint_address'
    ) THEN
        ALTER TABLE public.smart_contracts 
        ADD COLUMN collection_mint_address VARCHAR(44);
    END IF;

    -- Add collection metadata address column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contracts' 
        AND column_name = 'collection_metadata_address'
    ) THEN
        ALTER TABLE public.smart_contracts 
        ADD COLUMN collection_metadata_address VARCHAR(44);
    END IF;

    -- Add collection master edition address column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contracts' 
        AND column_name = 'collection_master_edition_address'
    ) THEN
        ALTER TABLE public.smart_contracts 
        ADD COLUMN collection_master_edition_address VARCHAR(44);
    END IF;

    -- Add Metaplex metadata URI column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contracts' 
        AND column_name = 'metaplex_metadata_uri'
    ) THEN
        ALTER TABLE public.smart_contracts 
        ADD COLUMN metaplex_metadata_uri TEXT;
    END IF;

    -- Add Arweave metadata hash column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contracts' 
        AND column_name = 'arweave_metadata_hash'
    ) THEN
        ALTER TABLE public.smart_contracts 
        ADD COLUMN arweave_metadata_hash VARCHAR(64);
    END IF;

    -- Add SPL Token mint address column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contracts' 
        AND column_name = 'spl_token_mint_address'
    ) THEN
        ALTER TABLE public.smart_contracts 
        ADD COLUMN spl_token_mint_address VARCHAR(44);
    END IF;

    -- Add network type column (devnet, testnet, mainnet-beta)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contracts' 
        AND column_name = 'network_type'
    ) THEN
        ALTER TABLE public.smart_contracts 
        ADD COLUMN network_type VARCHAR(20) DEFAULT 'devnet';
    END IF;

    -- Add RPC endpoint column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contracts' 
        AND column_name = 'rpc_endpoint'
    ) THEN
        ALTER TABLE public.smart_contracts 
        ADD COLUMN rpc_endpoint TEXT DEFAULT 'https://api.devnet.solana.com';
    END IF;
END $$;

-- Create Candy Machine configurations table
CREATE TABLE IF NOT EXISTS public.candy_machine_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candy_machine_address VARCHAR(44) NOT NULL UNIQUE,
    config_address VARCHAR(44) NOT NULL,
    collection_mint VARCHAR(44) NOT NULL,
    collection_metadata VARCHAR(44) NOT NULL,
    collection_master_edition VARCHAR(44) NOT NULL,
    authority VARCHAR(44) NOT NULL,
    price DECIMAL(20,9) NOT NULL, -- Price in SOL
    items_available INTEGER NOT NULL,
    items_redeemed INTEGER DEFAULT 0,
    seller_fee_basis_points INTEGER DEFAULT 500, -- 5% royalty
    symbol VARCHAR(10),
    max_edition_supply INTEGER DEFAULT 0,
    is_mutable BOOLEAN DEFAULT true,
    retain_authority BOOLEAN DEFAULT true,
    go_live_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    gatekeeper_config JSONB,
    whitelist_mint_settings JSONB,
    hidden_settings JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Metaplex metadata table
CREATE TABLE IF NOT EXISTS public.metaplex_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mint_address VARCHAR(44) NOT NULL UNIQUE,
    metadata_address VARCHAR(44) NOT NULL,
    master_edition_address VARCHAR(44),
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10),
    description TEXT,
    image_uri TEXT,
    external_url TEXT,
    attributes JSONB,
    properties JSONB,
    collection_key VARCHAR(44),
    collection_verified BOOLEAN DEFAULT false,
    creators JSONB,
    seller_fee_basis_points INTEGER DEFAULT 500,
    is_mutable BOOLEAN DEFAULT true,
    primary_sale_happened BOOLEAN DEFAULT false,
    update_authority VARCHAR(44) NOT NULL,
    arweave_uri TEXT,
    arweave_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create SPL Token accounts table
CREATE TABLE IF NOT EXISTS public.spl_token_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mint_address VARCHAR(44) NOT NULL,
    owner_address VARCHAR(44) NOT NULL,
    token_account_address VARCHAR(44) NOT NULL UNIQUE,
    amount DECIMAL(20,0) NOT NULL DEFAULT 0,
    decimals INTEGER NOT NULL DEFAULT 0,
    is_frozen BOOLEAN DEFAULT false,
    is_native BOOLEAN DEFAULT false,
    state VARCHAR(20) DEFAULT 'initialized',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Solana wallet connections table
CREATE TABLE IF NOT EXISTS public.solana_wallet_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(44) NOT NULL,
    wallet_type VARCHAR(50) NOT NULL, -- phantom, solflare, backpack, etc.
    wallet_name VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verification_signature TEXT,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_address)
);

-- Add RLS policies for new tables
ALTER TABLE public.candy_machine_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metaplex_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spl_token_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solana_wallet_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for candy_machine_configs
CREATE POLICY "Users can view candy machine configs" ON public.candy_machine_configs
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage candy machine configs" ON public.candy_machine_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS policies for metaplex_metadata
CREATE POLICY "Users can view metaplex metadata" ON public.metaplex_metadata
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage metaplex metadata" ON public.metaplex_metadata
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS policies for spl_token_accounts
CREATE POLICY "Users can view their own token accounts" ON public.spl_token_accounts
    FOR SELECT USING (owner_address IN (
        SELECT wallet_address FROM public.solana_wallet_connections 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admins can view all token accounts" ON public.spl_token_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS policies for solana_wallet_connections
CREATE POLICY "Users can manage their own wallet connections" ON public.solana_wallet_connections
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all wallet connections" ON public.solana_wallet_connections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_candy_machine_configs_address ON public.candy_machine_configs(candy_machine_address);
CREATE INDEX IF NOT EXISTS idx_candy_machine_configs_collection ON public.candy_machine_configs(collection_mint);
CREATE INDEX IF NOT EXISTS idx_metaplex_metadata_mint ON public.metaplex_metadata(mint_address);
CREATE INDEX IF NOT EXISTS idx_metaplex_metadata_collection ON public.metaplex_metadata(collection_key);
CREATE INDEX IF NOT EXISTS idx_spl_token_accounts_owner ON public.spl_token_accounts(owner_address);
CREATE INDEX IF NOT EXISTS idx_spl_token_accounts_mint ON public.spl_token_accounts(mint_address);
CREATE INDEX IF NOT EXISTS idx_solana_wallet_connections_user ON public.solana_wallet_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_solana_wallet_connections_address ON public.solana_wallet_connections(wallet_address);

-- Create functions for Solana contract management
CREATE OR REPLACE FUNCTION public.create_solana_contract(
    p_contract_name VARCHAR(255),
    p_contract_address VARCHAR(44),
    p_contract_type VARCHAR(50),
    p_candy_machine_address VARCHAR(44) DEFAULT NULL,
    p_collection_mint_address VARCHAR(44) DEFAULT NULL,
    p_collection_metadata_address VARCHAR(44) DEFAULT NULL,
    p_collection_master_edition_address VARCHAR(44) DEFAULT NULL,
    p_metaplex_metadata_uri TEXT DEFAULT NULL,
    p_arweave_metadata_hash VARCHAR(64) DEFAULT NULL,
    p_spl_token_mint_address VARCHAR(44) DEFAULT NULL,
    p_network_type VARCHAR(20) DEFAULT 'devnet',
    p_rpc_endpoint TEXT DEFAULT 'https://api.devnet.solana.com'
) RETURNS UUID AS $$
DECLARE
    contract_id UUID;
BEGIN
    INSERT INTO public.smart_contracts (
        contract_name,
        contract_address,
        contract_type,
        candy_machine_address,
        collection_mint_address,
        collection_metadata_address,
        collection_master_edition_address,
        metaplex_metadata_uri,
        arweave_metadata_hash,
        spl_token_mint_address,
        network_type,
        rpc_endpoint,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_contract_name,
        p_contract_address,
        p_contract_type,
        p_candy_machine_address,
        p_collection_mint_address,
        p_collection_metadata_address,
        p_collection_master_edition_address,
        p_metaplex_metadata_uri,
        p_arweave_metadata_hash,
        p_spl_token_mint_address,
        p_network_type,
        p_rpc_endpoint,
        true,
        NOW(),
        NOW()
    ) RETURNING id INTO contract_id;
    
    RETURN contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get Solana contract by type
CREATE OR REPLACE FUNCTION public.get_solana_contract_by_type(
    p_contract_type VARCHAR(50)
) RETURNS TABLE (
    id UUID,
    contract_name VARCHAR(255),
    contract_address VARCHAR(44),
    candy_machine_address VARCHAR(44),
    collection_mint_address VARCHAR(44),
    collection_metadata_address VARCHAR(44),
    collection_master_edition_address VARCHAR(44),
    metaplex_metadata_uri TEXT,
    arweave_metadata_hash VARCHAR(64),
    spl_token_mint_address VARCHAR(44),
    network_type VARCHAR(20),
    rpc_endpoint TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.contract_name,
        sc.contract_address,
        sc.candy_machine_address,
        sc.collection_mint_address,
        sc.collection_metadata_address,
        sc.collection_master_edition_address,
        sc.metaplex_metadata_uri,
        sc.arweave_metadata_hash,
        sc.spl_token_mint_address,
        sc.network_type,
        sc.rpc_endpoint,
        sc.is_active
    FROM public.smart_contracts sc
    WHERE sc.contract_type = p_contract_type
    AND sc.is_active = true
    ORDER BY sc.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample Solana contracts
DO $$ 
BEGIN
    -- Insert loyalty NFT contract
    IF NOT EXISTS (
        SELECT 1 FROM public.smart_contracts 
        WHERE contract_name = 'Loyalty NFT Contract'
    ) THEN
        PERFORM public.create_solana_contract(
            'Loyalty NFT Contract',
            '81y1B91W78o5zLz6Lg8P96Y7JvW4Y9q6D8W2o7Jz8K9',
            'loyalty_nft',
            NULL, -- candy_machine_address
            NULL, -- collection_mint_address
            NULL, -- collection_metadata_address
            NULL, -- collection_master_edition_address
            NULL, -- metaplex_metadata_uri
            NULL, -- arweave_metadata_hash
            NULL, -- spl_token_mint_address
            'devnet',
            'https://api.devnet.solana.com'
        );
    END IF;

    -- Insert RAC token contract
    IF NOT EXISTS (
        SELECT 1 FROM public.smart_contracts 
        WHERE contract_name = 'RAC Token Contract'
    ) THEN
        PERFORM public.create_solana_contract(
            'RAC Token Contract',
            'RAC1111111111111111111111111111111111111111',
            'spl_token',
            NULL, -- candy_machine_address
            NULL, -- collection_mint_address
            NULL, -- collection_metadata_address
            NULL, -- collection_master_edition_address
            NULL, -- metaplex_metadata_uri
            NULL, -- arweave_metadata_hash
            'RAC1111111111111111111111111111111111111111', -- spl_token_mint_address
            'devnet',
            'https://api.devnet.solana.com'
        );
    END IF;
END $$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to new tables
CREATE TRIGGER update_candy_machine_configs_updated_at
    BEFORE UPDATE ON public.candy_machine_configs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metaplex_metadata_updated_at
    BEFORE UPDATE ON public.metaplex_metadata
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spl_token_accounts_updated_at
    BEFORE UPDATE ON public.spl_token_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_solana_wallet_connections_updated_at
    BEFORE UPDATE ON public.solana_wallet_connections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candy_machine_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metaplex_metadata TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spl_token_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solana_wallet_connections TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_solana_contract TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_solana_contract_by_type TO authenticated;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Solana smart contracts database schema updated successfully!';
    RAISE NOTICE '📊 Added tables: candy_machine_configs, metaplex_metadata, spl_token_accounts, solana_wallet_connections';
    RAISE NOTICE '🔧 Added functions: create_solana_contract, get_solana_contract_by_type';
    RAISE NOTICE '🔒 RLS policies and indexes created';
    RAISE NOTICE '🎯 Ready for Solana NFT operations!';
END $$;
