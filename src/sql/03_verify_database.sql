-- Database Configuration Verification Script
-- This script verifies that all required tables and data have been created successfully

-- Check if all required tables exist
SELECT 
    'Table Check' as verification_type,
    table_name,
    CASE 
        WHEN table_name IN (
            'referral_campaigns',
            'user_wallets', 
            'point_release_delays',
            'loyalty_networks',
            'asset_initiatives',
            'merchant_custom_nfts',
            'discount_codes',
            'admin_feature_controls',
            'loyalty_otp_codes',
            'email_notifications',
            'ecommerce_webhooks'
        ) THEN '✅ REQUIRED'
        ELSE 'ℹ️ EXISTING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'referral_campaigns',
        'user_wallets', 
        'point_release_delays',
        'loyalty_networks',
        'asset_initiatives',
        'merchant_custom_nfts',
        'discount_codes',
        'admin_feature_controls',
        'loyalty_otp_codes',
        'email_notifications',
        'ecommerce_webhooks',
        'profiles',
        'merchants',
        'loyalty_cards',
        'transactions'
    )
ORDER BY status DESC, table_name;

-- Check default data in referral_campaigns
SELECT 
    'Referral Campaigns Data' as verification_type,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ DATA EXISTS'
        ELSE '❌ NO DATA'
    END as status
FROM public.referral_campaigns;

-- Check default data in loyalty_networks
SELECT 
    'Loyalty Networks Data' as verification_type,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ DATA EXISTS'
        ELSE '❌ NO DATA'
    END as status
FROM public.loyalty_networks;

-- Check default data in asset_initiatives
SELECT 
    'Asset Initiatives Data' as verification_type,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ DATA EXISTS'
        ELSE '❌ NO DATA'
    END as status
FROM public.asset_initiatives;

-- Check default data in admin_feature_controls
SELECT 
    'Feature Controls Data' as verification_type,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ DATA EXISTS'
        ELSE '❌ NO DATA'
    END as status
FROM public.admin_feature_controls;

-- Check table structures for key tables
SELECT 
    'Table Structure Check' as verification_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('referral_campaigns', 'user_wallets', 'point_release_delays')
ORDER BY table_name, ordinal_position;

-- Check for any missing indexes or constraints
SELECT 
    'Constraint Check' as verification_type,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN '✅ PK'
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN '✅ FK'
        WHEN tc.constraint_type = 'UNIQUE' THEN '✅ UNIQUE'
        ELSE 'ℹ️ OTHER'
    END as status
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public' 
    AND tc.table_name IN (
        'referral_campaigns',
        'user_wallets', 
        'point_release_delays',
        'loyalty_networks',
        'asset_initiatives',
        'merchant_custom_nfts',
        'discount_codes',
        'admin_feature_controls',
        'loyalty_otp_codes',
        'email_notifications',
        'ecommerce_webhooks'
    )
ORDER BY tc.table_name, tc.constraint_type;

-- Summary verification
SELECT 
    'SUMMARY' as verification_type,
    'Database Configuration' as check_item,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'referral_campaigns',
                'user_wallets', 
                'point_release_delays',
                'loyalty_networks',
                'asset_initiatives',
                'merchant_custom_nfts',
                'discount_codes',
                'admin_feature_controls',
                'loyalty_otp_codes',
                'email_notifications',
                'ecommerce_webhooks'
            )
        ) = 11 
        AND (
            SELECT COUNT(*) FROM public.referral_campaigns
        ) > 0
        AND (
            SELECT COUNT(*) FROM public.loyalty_networks
        ) > 0
        AND (
            SELECT COUNT(*) FROM public.asset_initiatives
        ) > 0
        AND (
            SELECT COUNT(*) FROM public.admin_feature_controls
        ) > 0
        THEN '✅ COMPLETE'
        ELSE '❌ INCOMPLETE'
    END as status;
