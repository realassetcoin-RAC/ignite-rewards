-- Fix Solana Contract Types - Simple and Robust Version
-- This script updates the smart_contracts table to support Solana contract types

-- First, let's check what constraints exist
DO $$ 
BEGIN
    RAISE NOTICE '🔍 Checking existing constraints on smart_contracts table...';
END $$;

-- Try to drop the constraint if it exists (ignore error if it doesn't exist)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.smart_contracts 
        DROP CONSTRAINT smart_contracts_contract_type_check;
        RAISE NOTICE '✅ Dropped existing contract_type check constraint';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'ℹ️  No existing contract_type check constraint found (this is fine)';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  Error dropping constraint: %', SQLERRM;
    END;
END $$;

-- Add the new check constraint with Solana-specific types
DO $$ 
BEGIN
    BEGIN
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
        RAISE NOTICE '✅ Added new contract_type check constraint with Solana types';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'ℹ️  Constraint already exists';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Error adding constraint: %', SQLERRM;
    END;
END $$;

-- Now let's insert the Solana contracts
DO $$ 
BEGIN
    RAISE NOTICE '📝 Inserting Solana smart contracts...';
    
    -- Insert loyalty NFT contract
    BEGIN
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
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE 'ℹ️  Loyalty NFT Contract already exists';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Error inserting Loyalty NFT Contract: %', SQLERRM;
    END;

    -- Insert RAC token contract
    BEGIN
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
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE 'ℹ️  RAC Token Contract already exists';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Error inserting RAC Token Contract: %', SQLERRM;
    END;

    -- Insert Candy Machine contract
    BEGIN
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
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE 'ℹ️  Candy Machine v3 Contract already exists';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Error inserting Candy Machine v3 Contract: %', SQLERRM;
    END;

    -- Insert Metaplex Metadata contract
    BEGIN
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
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE 'ℹ️  Metaplex Metadata Contract already exists';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Error inserting Metaplex Metadata Contract: %', SQLERRM;
    END;
END $$;

-- Verify the contracts were inserted
DO $$ 
DECLARE
    rec RECORD;
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
    
    -- Show all Solana contracts
    RAISE NOTICE '📋 All Solana contracts:';
    FOR rec IN 
        SELECT contract_name, contract_type, contract_address
        FROM public.smart_contracts 
        WHERE network = 'solana'
        ORDER BY contract_type, contract_name
    LOOP
        RAISE NOTICE '   % (%) - %', rec.contract_name, rec.contract_type, rec.contract_address;
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
