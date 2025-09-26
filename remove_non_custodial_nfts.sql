-- =====================================================
-- RAC Rewards - Remove Non-Custodial NFT Types
-- Removes non-custodial NFT types as they will be loaded from Web3 wallets
-- Keeps only custodial NFT types in the database
-- =====================================================

-- Step 1: Show current NFT types before deletion
-- =====================================================

SELECT 
    'BEFORE DELETION - Current NFT Types' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_custodial = true THEN 1 END) as custodial_nfts,
    COUNT(CASE WHEN is_custodial = false THEN 1 END) as non_custodial_nfts
FROM public.nft_types;

-- Show all current NFT types
SELECT 
    nft_name,
    display_name,
    rarity,
    buy_price_usdt,
    is_custodial,
    is_upgradeable,
    is_evolvable
FROM public.nft_types
ORDER BY is_custodial DESC, buy_price_usdt;

-- Step 2: Delete Non-Custodial NFT Types Only
-- =====================================================

-- Delete only non-custodial NFT types (is_custodial = false)
DELETE FROM public.nft_types 
WHERE is_custodial = false;

-- Step 3: Verify deletion results
-- =====================================================

-- Show NFT types after deletion
SELECT 
    'AFTER DELETION - Remaining NFT Types' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_custodial = true THEN 1 END) as custodial_nfts,
    COUNT(CASE WHEN is_custodial = false THEN 1 END) as non_custodial_nfts
FROM public.nft_types;

-- Show remaining NFT types (should be only custodial)
SELECT 
    nft_name,
    display_name,
    rarity,
    buy_price_usdt,
    mint_quantity,
    is_custodial,
    is_upgradeable,
    is_evolvable,
    earn_on_spend_ratio,
    evolution_min_investment,
    one_time_fee
FROM public.nft_types
ORDER BY buy_price_usdt;

-- =====================================================
-- Non-custodial NFT types removed successfully!
-- Only custodial NFT types remain in the database.
-- Non-custodial NFTs will be loaded from Web3 wallets when connected.
-- =====================================================
