-- Verify Database Setup
-- Run this to check if everything is working correctly

-- 1. Check all tables exist
SELECT 'Tables Created:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check admin user exists
SELECT 'Admin User:' as status;
SELECT id, email, role FROM auth.users WHERE role = 'admin';

-- 3. Check NFT types
SELECT 'NFT Types:' as status;
SELECT nft_name, display_name, pricing_type, buy_price_usdt FROM public.nft_types;

-- 4. Check subscription plans
SELECT 'Subscription Plans:' as status;
SELECT plan_name, price, billing_cycle FROM public.merchant_subscription_plans;

-- 5. Check if functions work
SELECT 'Admin Functions:' as status;
SELECT public.is_admin() as is_admin_result, public.check_admin_access() as check_admin_result;

-- 6. Test basic insert (will be rolled back)
BEGIN;
INSERT INTO public.subscribers (email) VALUES ('test@example.com');
SELECT 'Test Insert:' as status, COUNT(*) as subscriber_count FROM public.subscribers WHERE email = 'test@example.com';
ROLLBACK;

-- 7. Final status
SELECT 'Database Setup Complete!' as status, now() as verified_at;
