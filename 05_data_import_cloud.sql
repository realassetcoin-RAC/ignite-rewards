-- ===========================================
-- IMPORT DATA TO CLOUD DATABASE
-- ===========================================
-- This script imports all data to the cloud Supabase database
-- Run this AFTER running the schema synchronization

-- ===========================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- ===========================================

-- Disable RLS on all tables to allow data import
DO $$ 
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Disabled RLS on table: %', table_name;
    END LOOP;
END $$;

-- ===========================================
-- STEP 2: INSERT DEFAULT DATA
-- ===========================================

-- Insert default referral campaign
INSERT INTO public.referral_campaigns (name, points_per_referral, max_referrals_per_user, is_active) 
SELECT 'Welcome Campaign', 100, 10, true
WHERE NOT EXISTS (SELECT 1 FROM public.referral_campaigns WHERE name = 'Welcome Campaign');

-- Insert default loyalty networks
INSERT INTO public.loyalty_networks (network_name, display_name, description, conversion_rate, is_active) 
SELECT 'starbucks_rewards', 'Starbucks Rewards', 'Convert your Starbucks Stars to PointBridge tokens', 1.0000, true
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_networks WHERE network_name = 'starbucks_rewards')

UNION ALL

SELECT 'airlines_miles', 'Airlines Miles', 'Convert airline miles to PointBridge tokens', 0.8000, true
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_networks WHERE network_name = 'airlines_miles')

UNION ALL

SELECT 'hotel_points', 'Hotel Points', 'Convert hotel loyalty points to PointBridge tokens', 0.9000, true
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_networks WHERE network_name = 'hotel_points')

UNION ALL

SELECT 'retail_rewards', 'Retail Rewards', 'Convert retail store points to PointBridge tokens', 1.1000, true
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_networks WHERE network_name = 'retail_rewards');

-- Insert default asset initiatives
INSERT INTO public.asset_initiatives (name, description, category, icon, is_active) 
SELECT 'Environmental Conservation', 'Support environmental protection and conservation efforts', 'environmental', '🌱', true
WHERE NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Environmental Conservation')

UNION ALL

SELECT 'Education for All', 'Provide educational opportunities for underprivileged children', 'social', '📚', true
WHERE NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Education for All')

UNION ALL

SELECT 'Economic Development', 'Support local economic development and entrepreneurship', 'economic', '💼', true
WHERE NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Economic Development')

UNION ALL

SELECT 'Healthcare Access', 'Improve healthcare access in underserved communities', 'health', '🏥', true
WHERE NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Healthcare Access')

UNION ALL

SELECT 'Clean Water Initiative', 'Provide clean water access to communities in need', 'environmental', '💧', true
WHERE NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Clean Water Initiative')

UNION ALL

SELECT 'Digital Literacy', 'Promote digital literacy and technology education', 'social', '💻', true
WHERE NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Digital Literacy')

UNION ALL

SELECT 'Sustainable Agriculture', 'Support sustainable farming practices', 'economic', '🚜', true
WHERE NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Sustainable Agriculture')

UNION ALL

SELECT 'Mental Health Support', 'Provide mental health resources and support', 'health', '🧠', true
WHERE NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Mental Health Support');

-- Insert default merchant subscription plans
INSERT INTO public.merchant_subscription_plans (
    plan_name, display_name, description, price, currency, billing_cycle, 
    max_transactions, max_points_distribution, features, is_active
) 
SELECT 'basic', 'Basic Plan', 'Essential features for small businesses', 29.99, 'USD', 'monthly',
    1000, 10000, ARRAY['basic_analytics', 'email_support'], true
WHERE NOT EXISTS (SELECT 1 FROM public.merchant_subscription_plans WHERE plan_name = 'basic')

UNION ALL

SELECT 'standard', 'Standard Plan', 'Advanced features for growing businesses', 79.99, 'USD', 'monthly',
    5000, 50000, ARRAY['advanced_analytics', 'priority_support', 'custom_branding'], true
WHERE NOT EXISTS (SELECT 1 FROM public.merchant_subscription_plans WHERE plan_name = 'standard')

UNION ALL

SELECT 'premium', 'Premium Plan', 'Full features for established businesses', 199.99, 'USD', 'monthly',
    20000, 200000, ARRAY['full_analytics', 'dedicated_support', 'white_label', 'api_access'], true
WHERE NOT EXISTS (SELECT 1 FROM public.merchant_subscription_plans WHERE plan_name = 'premium')

UNION ALL

SELECT 'enterprise', 'Enterprise Plan', 'Custom solutions for large enterprises', 499.99, 'USD', 'monthly',
    100000, 1000000, ARRAY['custom_analytics', '24_7_support', 'full_white_label', 'full_api_access', 'custom_integrations'], true
WHERE NOT EXISTS (SELECT 1 FROM public.merchant_subscription_plans WHERE plan_name = 'enterprise');

-- Insert default NFT types
INSERT INTO public.nft_types (
    nft_name, display_name, description, image_url, rarity, tier_level, 
    earn_on_spend_ratio, buy_price_usdt, is_custodial, is_active, benefits
) 
SELECT 'Pearl White', 'Pearl White Card', 'Free entry-level loyalty card with basic benefits', 
    'https://example.com/pearl-white.png', 'common', 'bronze', 1.00, 0.00, true, true,
    ARRAY['Basic rewards', 'Standard customer support']
WHERE NOT EXISTS (SELECT 1 FROM public.nft_types WHERE nft_name = 'Pearl White')

UNION ALL

SELECT 'Silver Elite', 'Silver Elite Card', 'Premium loyalty card with enhanced benefits', 
    'https://example.com/silver-elite.png', 'uncommon', 'silver', 1.25, 25.00, true, true,
    ARRAY['Enhanced rewards', 'Priority support', 'Exclusive offers']
WHERE NOT EXISTS (SELECT 1 FROM public.nft_types WHERE nft_name = 'Silver Elite')

UNION ALL

SELECT 'Gold Premium', 'Gold Premium Card', 'High-tier loyalty card with premium benefits', 
    'https://example.com/gold-premium.png', 'rare', 'gold', 1.50, 50.00, true, true,
    ARRAY['Premium rewards', 'VIP support', 'Exclusive events', 'Early access']
WHERE NOT EXISTS (SELECT 1 FROM public.nft_types WHERE nft_name = 'Gold Premium')

UNION ALL

SELECT 'Platinum VIP', 'Platinum VIP Card', 'Ultimate loyalty card with maximum benefits', 
    'https://example.com/platinum-vip.png', 'epic', 'platinum', 2.00, 100.00, true, true,
    ARRAY['Maximum rewards', 'Concierge support', 'VIP events', 'Exclusive partnerships']
WHERE NOT EXISTS (SELECT 1 FROM public.nft_types WHERE nft_name = 'Platinum VIP');

-- ===========================================
-- STEP 3: INSERT SAMPLE DATA
-- ===========================================

-- Insert sample DAO organizations
INSERT INTO public.dao_organizations (
    name, description, logo_url, website_url, discord_url, twitter_url, github_url,
    governance_token_symbol, governance_token_decimals, min_proposal_threshold,
    voting_period_days, execution_delay_hours, quorum_percentage, super_majority_threshold,
    treasury_address, is_active
) 
SELECT 'RAC Rewards DAO',
    'The official DAO for RAC Rewards platform governance',
    'https://example.com/rac-dao-logo.png',
    'https://rac-rewards.com/dao',
    'https://discord.gg/rac-rewards',
    'https://twitter.com/rac_rewards',
    'https://github.com/rac-rewards',
    'RAC',
    9,
    1000,
    7,
    24,
    10.0,
    66.67,
    'TreasuryWallet123456789',
    true
WHERE NOT EXISTS (SELECT 1 FROM public.dao_organizations WHERE name = 'RAC Rewards DAO')

UNION ALL

SELECT 'Community DAO',
    'Community-driven governance for platform decisions',
    'https://example.com/community-dao-logo.png',
    'https://community.rac-rewards.com',
    'https://discord.gg/rac-community',
    'https://twitter.com/rac_community',
    'https://github.com/rac-community',
    'COMM',
    9,
    500,
    5,
    12,
    15.0,
    60.0,
    'CommunityTreasury123456789',
    true
WHERE NOT EXISTS (SELECT 1 FROM public.dao_organizations WHERE name = 'Community DAO');

-- Insert sample marketplace listings
INSERT INTO public.marketplace_listings (
    title, description, listing_type, total_funding_goal, currency, status, is_featured
) 
SELECT 'Premium Investment Asset', 
    'High-yield investment with guaranteed returns', 
    'asset'::marketplace_listing_type, 
    1000.00, 
    'SOL', 
    'active'::marketplace_listing_status, 
    true
WHERE NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE title = 'Premium Investment Asset')

UNION ALL

SELECT 'NFT Collection Initiative', 
    'Exclusive NFT collection with utility benefits', 
    'initiative'::marketplace_listing_type, 
    500.00, 
    'SOL', 
    'active'::marketplace_listing_status, 
    false
WHERE NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE title = 'NFT Collection Initiative')

UNION ALL

SELECT 'Staking Pool Asset', 
    'Long-term staking opportunity with compound rewards', 
    'asset'::marketplace_listing_type, 
    2500.00, 
    'SOL', 
    'active'::marketplace_listing_status, 
    true
WHERE NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE title = 'Staking Pool Asset');

-- ===========================================
-- STEP 4: INSERT SAMPLE USERS AND DATA
-- ===========================================

-- Insert sample admin user
INSERT INTO public.profiles (
    id, email, full_name, role, is_active, email_verified, 
    terms_accepted, privacy_policy_accepted, terms_accepted_at, privacy_policy_accepted_at
) 
SELECT '00000000-0000-0000-0000-000000000001',
    'admin@igniterewards.com',
    'Admin User',
    'admin'::app_role,
    true,
    true,
    true,
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000001');

-- Insert sample regular user
INSERT INTO public.profiles (
    email, full_name, role, is_active, email_verified, 
    terms_accepted, privacy_policy_accepted, terms_accepted_at, privacy_policy_accepted_at
) 
SELECT 'user@example.com',
    'Test User',
    'customer'::app_role,
    true,
    true,
    true,
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'user@example.com');

-- Insert sample merchant
INSERT INTO public.merchants (
    user_id, business_name, business_type, description, contact_email, 
    status, subscription_plan, is_active
) 
SELECT (SELECT id FROM public.profiles WHERE email = 'user@example.com' LIMIT 1),
    'Test Merchant',
    'Retail',
    'A test merchant for demonstration purposes',
    'merchant@example.com',
    'active'::merchant_status,
    'basic'::subscription_plan,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.merchants WHERE business_name = 'Test Merchant');

-- ===========================================
-- STEP 5: INSERT SAMPLE LOYALTY DATA
-- ===========================================

-- Insert sample user loyalty card
INSERT INTO public.user_loyalty_cards (
    user_id, nft_type_id, loyalty_number, card_number, full_name, email, 
    points_balance, tier_level, is_active
) 
SELECT (SELECT id FROM public.profiles WHERE email = 'user@example.com' LIMIT 1),
    (SELECT id FROM public.nft_types WHERE nft_name = 'Pearl White' LIMIT 1),
    'U0000001',
    'LC000001',
    'Test User',
    'user@example.com',
    1000,
    'bronze',
    true
WHERE NOT EXISTS (SELECT 1 FROM public.user_loyalty_cards WHERE loyalty_number = 'U0000001');

-- Insert sample user points
INSERT INTO public.user_points (
    user_id, total_points, available_points, pending_points, lifetime_points
) 
SELECT (SELECT id FROM public.profiles WHERE email = 'user@example.com' LIMIT 1),
    1000,
    1000,
    0,
    1000
WHERE NOT EXISTS (SELECT 1 FROM public.user_points WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'user@example.com' LIMIT 1));

-- Insert sample loyalty transaction
INSERT INTO public.loyalty_transactions (
    user_id, merchant_id, transaction_type, points_amount, transaction_value, 
    description, status
) 
SELECT (SELECT id FROM public.profiles WHERE email = 'user@example.com' LIMIT 1),
    (SELECT id FROM public.merchants WHERE business_name = 'Test Merchant' LIMIT 1),
    'earn',
    100,
    50.00,
    'Sample transaction for testing',
    'completed'
WHERE NOT EXISTS (
    SELECT 1 FROM public.loyalty_transactions 
    WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'user@example.com' LIMIT 1)
    AND description = 'Sample transaction for testing'
);

-- ===========================================
-- STEP 6: RE-ENABLE RLS
-- ===========================================

-- Re-enable RLS on all tables
DO $$ 
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Re-enabled RLS on table: %', table_name;
    END LOOP;
END $$;

-- ===========================================
-- STEP 7: VERIFY DATA IMPORT
-- ===========================================

-- Show data import summary
SELECT '✅ DATA IMPORT COMPLETED!' as message;

SELECT 
    'Data Import Summary:' as info,
    'profiles' as table_name,
    COUNT(*) as row_count
FROM public.profiles

UNION ALL

SELECT 
    'Data Import Summary:' as info,
    'merchants' as table_name,
    COUNT(*) as row_count
FROM public.merchants

UNION ALL

SELECT 
    'Data Import Summary:' as info,
    'nft_types' as table_name,
    COUNT(*) as row_count
FROM public.nft_types

UNION ALL

SELECT 
    'Data Import Summary:' as info,
    'user_loyalty_cards' as table_name,
    COUNT(*) as row_count
FROM public.user_loyalty_cards

UNION ALL

SELECT 
    'Data Import Summary:' as info,
    'user_points' as table_name,
    COUNT(*) as row_count
FROM public.user_points

UNION ALL

SELECT 
    'Data Import Summary:' as info,
    'loyalty_transactions' as table_name,
    COUNT(*) as row_count
FROM public.loyalty_transactions

UNION ALL

SELECT 
    'Data Import Summary:' as info,
    'referral_campaigns' as table_name,
    COUNT(*) as row_count
FROM public.referral_campaigns

UNION ALL

SELECT 
    'Data Import Summary:' as info,
    'merchant_subscription_plans' as table_name,
    COUNT(*) as row_count
FROM public.merchant_subscription_plans

UNION ALL

SELECT 
    'Data Import Summary:' as info,
    'dao_organizations' as table_name,
    COUNT(*) as row_count
FROM public.dao_organizations

UNION ALL

SELECT 
    'Data Import Summary:' as info,
    'marketplace_listings' as table_name,
    COUNT(*) as row_count
FROM public.marketplace_listings

UNION ALL

SELECT 
    'Data Import Summary:' as info,
    'loyalty_networks' as table_name,
    COUNT(*) as row_count
FROM public.loyalty_networks

UNION ALL

SELECT 
    'Data Import Summary:' as info,
    'asset_initiatives' as table_name,
    COUNT(*) as row_count
FROM public.asset_initiatives;

-- ===========================================
-- STEP 8: COMPLETION MESSAGE
-- ===========================================

SELECT '🎯 DATA IMPORT COMPLETED SUCCESSFULLY!' as message;
SELECT 'Next step: Run 06_verification_queries.sql' as next_step;
SELECT 'Database is now ready for application use!' as status;
