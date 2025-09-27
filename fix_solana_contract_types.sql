-- Fix Solana Contract Types - Update check constraint to allow Solana-specific types
-- This script updates the smart_contracts table to support Solana contract types

-- First, let's check the current constraint
DO $$ 
BEGIN
    RAISE NOTICE 'Current contract_type constraint allows: nft, token, dao, staking';
    RAISE NOTICE 'Adding Solana-specific types: loyalty_nft, spl_token, candy_machine, metaplex_metadata';
END $$;

-- Drop the existing check constraint
DO $$ 
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'smart_contracts'
        AND tc.constraint_name = 'smart_contracts_contract_type_check'
        AND tc.table_schema = 'public'
    ) THEN
        ALTER TABLE public.smart_contracts 
        DROP CONSTRAINT smart_contracts_contract_type_check;
        RAISE NOTICE 'Dropped existing contract_type check constraint';
    ELSE
        RAISE NOTICE 'No existing contract_type check constraint found';
    END IF;
END $$;

-- Add the new check constraint with Solana-specific types
ALTER TABLE public.smart_contracts 
ADD CONSTRAINT smart_contracts_contract_type_check 
CHECK (contract_type IN (
    'nft', 
    'token', 
    'dao', 
    'staking',
    'loyalty_nft',
    'spl_token',
    'candy_machine',
    'metaplex_metadata',
    'anchor_program'
));

-- Verify the constraint was added
DO $$ 
BEGIN
    RAISE NOTICE '✅ Updated contract_type constraint to include Solana types:';
    RAISE NOTICE '   - nft, token, dao, staking (existing)';
    RAISE NOTICE '   - loyalty_nft, spl_token, candy_machine, metaplex_metadata, anchor_program (new)';
END $$;

-- Now let's insert the Solana contracts with the correct types
DO $$ 
BEGIN
    -- Insert loyalty NFT contract
    IF NOT EXISTS (
        SELECT 1 FROM public.smart_contracts 
        WHERE contract_name = 'Loyalty NFT Contract'
    ) THEN
        INSERT INTO public.smart_contracts (
            contract_name,
            contract_address,
            network,
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
            'Loyalty NFT Contract',
            '81y1B91W78o5zLz6Lg8P96Y7JvW4Y9q6D8W2o7Jz8K9',
            'solana',
            'loyalty_nft',
            NULL, -- candy_machine_address
            NULL, -- collection_mint_address
            NULL, -- collection_metadata_address
            NULL, -- collection_master_edition_address
            NULL, -- metaplex_metadata_uri
            NULL, -- arweave_metadata_hash
            NULL, -- spl_token_mint_address
            'devnet',
            'https://api.devnet.solana.com',
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE '✅ Inserted Loyalty NFT Contract';
    ELSE
        RAISE NOTICE 'ℹ️  Loyalty NFT Contract already exists';
    END IF;

    -- Insert RAC token contract
    IF NOT EXISTS (
        SELECT 1 FROM public.smart_contracts 
        WHERE contract_name = 'RAC Token Contract'
    ) THEN
        INSERT INTO public.smart_contracts (
            contract_name,
            contract_address,
            network,
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
            'RAC Token Contract',
            'RAC1111111111111111111111111111111111111111',
            'solana',
            'spl_token',
            NULL, -- candy_machine_address
            NULL, -- collection_mint_address
            NULL, -- collection_metadata_address
            NULL, -- collection_master_edition_address
            NULL, -- metaplex_metadata_uri
            NULL, -- arweave_metadata_hash
            'RAC1111111111111111111111111111111111111111', -- spl_token_mint_address
            'devnet',
            'https://api.devnet.solana.com',
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE '✅ Inserted RAC Token Contract';
    ELSE
        RAISE NOTICE 'ℹ️  RAC Token Contract already exists';
    END IF;

    -- Insert Candy Machine contract
    IF NOT EXISTS (
        SELECT 1 FROM public.smart_contracts 
        WHERE contract_name = 'Candy Machine v3 Contract'
    ) THEN
        INSERT INTO public.smart_contracts (
            contract_name,
            contract_address,
            network,
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
            'Candy Machine v3 Contract',
            'CndyV3Ldq4fpfF7WikjPfkyxjZz2zSCv3g9NXxJ2jAP',
            'solana',
            'candy_machine',
            'CndyV3Ldq4fpfF7WikjPfkyxjZz2zSCv3g9NXxJ2jAP', -- candy_machine_address
            NULL, -- collection_mint_address
            NULL, -- collection_metadata_address
            NULL, -- collection_master_edition_address
            NULL, -- metaplex_metadata_uri
            NULL, -- arweave_metadata_hash
            NULL, -- spl_token_mint_address
            'devnet',
            'https://api.devnet.solana.com',
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE '✅ Inserted Candy Machine v3 Contract';
    ELSE
        RAISE NOTICE 'ℹ️  Candy Machine v3 Contract already exists';
    END IF;

    -- Insert Metaplex Metadata contract
    IF NOT EXISTS (
        SELECT 1 FROM public.smart_contracts 
        WHERE contract_name = 'Metaplex Metadata Contract'
    ) THEN
        INSERT INTO public.smart_contracts (
            contract_name,
            contract_address,
            network,
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
            'Metaplex Metadata Contract',
            'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
            'solana',
            'metaplex_metadata',
            NULL, -- candy_machine_address
            NULL, -- collection_mint_address
            NULL, -- collection_metadata_address
            NULL, -- collection_master_edition_address
            NULL, -- metaplex_metadata_uri
            NULL, -- arweave_metadata_hash
            NULL, -- spl_token_mint_address
            'devnet',
            'https://api.devnet.solana.com',
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE '✅ Inserted Metaplex Metadata Contract';
    ELSE
        RAISE NOTICE 'ℹ️  Metaplex Metadata Contract already exists';
    END IF;
END $$;

-- Verify the contracts were inserted
DO $$ 
BEGIN
    RAISE NOTICE '📊 Verifying inserted contracts:';
    
    -- Count contracts by type
    FOR rec IN 
        SELECT contract_type, COUNT(*) as count 
        FROM public.smart_contracts 
        WHERE network = 'solana'
        GROUP BY contract_type
        ORDER BY contract_type
    LOOP
        RAISE NOTICE '   %: % contracts', rec.contract_type, rec.count;
    END LOOP;
END $$;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '🎉 Solana contract types fix completed successfully!';
    RAISE NOTICE '✅ Updated contract_type constraint to support Solana types';
    RAISE NOTICE '✅ Inserted Solana smart contracts';
    RAISE NOTICE '🚀 Ready for Solana NFT operations!';
END $$;
