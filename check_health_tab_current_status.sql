-- Quick Health Tab Status Check
-- This mimics what the Health Tab actually checks

-- 1. Test each table that the Health Tab monitors
SELECT 
  'profiles' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'profiles')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.profiles) as row_count
UNION ALL
SELECT 
  'merchants' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchants')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.merchants) as row_count
UNION ALL
SELECT 
  'virtual_cards' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'virtual_cards')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.virtual_cards) as row_count
UNION ALL
SELECT 
  'loyalty_transactions' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'loyalty_transactions')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.loyalty_transactions) as row_count
UNION ALL
SELECT 
  'user_loyalty_cards' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'user_loyalty_cards')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.user_loyalty_cards) as row_count
UNION ALL
SELECT 
  'user_points' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'user_points')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.user_points) as row_count
UNION ALL
SELECT 
  'user_referrals' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'user_referrals')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.user_referrals) as row_count
UNION ALL
SELECT 
  'user_wallets' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'user_wallets')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.user_wallets) as row_count
UNION ALL
SELECT 
  'merchant_cards' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchant_cards')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.merchant_cards) as row_count
UNION ALL
SELECT 
  'merchant_subscriptions' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchant_subscriptions')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.merchant_subscriptions) as row_count
UNION ALL
SELECT 
  'merchant_subscription_plans' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.merchant_subscription_plans) as row_count
UNION ALL
SELECT 
  'referral_campaigns' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'referral_campaigns')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.referral_campaigns) as row_count
UNION ALL
SELECT 
  'transaction_qr_codes' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'api' AND table_name = 'transaction_qr_codes')
    THEN 'VIEW_EXISTS'
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'transaction_qr_codes')
    THEN 'TABLE_EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.transaction_qr_codes) as row_count
UNION ALL
SELECT 
  'subscribers' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'subscribers')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as table_status,
  (SELECT COUNT(*) FROM api.subscribers) as row_count
ORDER BY table_name;
