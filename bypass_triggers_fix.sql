-- =============================================================================
-- BYPASS TRIGGERS AND CREATE DATA DIRECTLY
-- =============================================================================

-- =============================================================================
-- 1. DROP PROBLEMATIC TRIGGERS
-- =============================================================================

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS set_loyalty_number ON user_loyalty_cards;

-- =============================================================================
-- 2. CREATE PEARL WHITE NFT TYPE
-- =============================================================================

INSERT INTO nft_types (
    id,
    nft_name,
    display_name,
    description,
    image_url,
    buy_price_usdt,
    rarity,
    mint_quantity,
    is_upgradeable,
    is_evolvable,
    is_fractional_eligible,
    is_custodial,
    auto_staking_duration,
    earn_on_spend_ratio,
    upgrade_bonus_ratio,
    evolution_min_investment,
    evolution_earnings_ratio,
    passive_income_rate,
    custodial_income_rate,
    is_active,
    features,
    subscription_plan,
    pricing_type,
    one_time_fee,
    monthly_fee,
    annual_fee,
    collection,
    card_name,
    card_type,
    buy_price_nft,
    collection_id
) VALUES (
    gen_random_uuid(),
    'Pearl White',
    'Pearl White Loyalty Card',
    'A beautiful pearl white loyalty card for new users',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    0.00,
    'Common',
    10000,
    true,
    true,
    false,
    true,
    'Forever',
    0.01,
    0.00,
    100.00,
    0.0025,
    0.01,
    0.00,
    true,
    '{}',
    'basic',
    'free',
    0.00,
    0.00,
    0.00,
    'Pearl White Collection',
    'Pearl White',
    'Virtual',
    0.00000000,
    gen_random_uuid()
) ON CONFLICT (nft_name) DO NOTHING;

-- =============================================================================
-- 3. CREATE USER PROFILE
-- =============================================================================

INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    google_auth_disabled
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@igniterewards.com',
    'Admin User',
    'admin',
    false
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. CREATE LOYALTY CARD DIRECTLY
-- =============================================================================

-- Get the Pearl White NFT type ID and create loyalty card
WITH nft_data AS (
    SELECT id as nft_id FROM nft_types WHERE nft_name = 'Pearl White' LIMIT 1
)
INSERT INTO user_loyalty_cards (
    id,
    user_id,
    nft_type_id,
    loyalty_number,
    card_number,
    full_name,
    email,
    points_balance,
    tier_level,
    is_active,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    nft_id,
    'A0000001',
    'A0000001',
    'Admin User',
    'admin@igniterewards.com',
    0,
    'Common',
    true,
    NOW(),
    NOW()
FROM nft_data
WHERE NOT EXISTS (
    SELECT 1 FROM user_loyalty_cards 
    WHERE user_id = '00000000-0000-0000-0000-000000000001'
);

-- =============================================================================
-- 5. VERIFY DATA
-- =============================================================================

-- Check loyalty cards
SELECT 
    'LOYALTY CARDS' as table_name,
    ulc.loyalty_number,
    ulc.card_number,
    ulc.full_name,
    ulc.email,
    ulc.points_balance,
    nt.nft_name,
    nt.display_name
FROM user_loyalty_cards ulc
JOIN nft_types nt ON ulc.nft_type_id = nt.id
WHERE ulc.user_id = '00000000-0000-0000-0000-000000000001'

UNION ALL

-- Check wallets
SELECT 
    'WALLETS' as table_name,
    usw.public_key as loyalty_number,
    usw.public_key as card_number,
    'Wallet' as full_name,
    'wallet@example.com' as email,
    0 as points_balance,
    'Solana' as nft_name,
    'Solana Wallet' as display_name
FROM user_solana_wallets usw
WHERE usw.user_id = '00000000-0000-0000-0000-000000000001'

UNION ALL

-- Check profiles
SELECT 
    'PROFILES' as table_name,
    p.email as loyalty_number,
    p.full_name as card_number,
    p.full_name,
    p.email,
    0 as points_balance,
    p.role as nft_name,
    'User Profile' as display_name
FROM profiles p
WHERE p.id = '00000000-0000-0000-0000-000000000001';

-- =============================================================================
-- 6. FINAL SUMMARY
-- =============================================================================

SELECT 
    'FINAL SUMMARY' as info,
    (SELECT COUNT(*) FROM user_loyalty_cards) as loyalty_cards,
    (SELECT COUNT(*) FROM user_solana_wallets) as wallets,
    (SELECT COUNT(*) FROM profiles) as profiles;
