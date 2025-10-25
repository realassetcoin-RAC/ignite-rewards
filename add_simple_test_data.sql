-- Add Simple Test Data to Local Database
-- This script adds basic test data so you can see real data in your application

-- Insert a simple NFT type
INSERT INTO public.nft_types (
    id, collection, nft_name, display_name, description, 
    image_url, buy_price_usdt, rarity, mint_quantity,
    is_upgradeable, is_evolvable, is_fractional_eligible, is_custodial,
    auto_staking_duration, earn_on_spend_ratio, upgrade_bonus_ratio,
    evolution_min_investment, evolution_earnings_ratio, passive_income_rate,
    custodial_income_rate, is_active, created_at, updated_at
) VALUES 
(
    gen_random_uuid(),
    'Test Collection',
    'Test Card',
    'Test Card',
    'A simple test card for development',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    0.00,
    'Common',
    1000,
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
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Insert a simple merchant
INSERT INTO public.merchants (
    id, user_id, business_name, business_type, contact_email, phone,
    address, city, country, website, description,
    is_verified, is_active, contact_name, terms_accepted,
    privacy_accepted, free_trial_months, subscription_plan, status,
    created_at, updated_at
) VALUES 
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'Test Business',
    'Technology',
    'test@testbusiness.com',
    '+1-555-0123',
    '123 Test Street',
    'Test City',
    'United States',
    'https://testbusiness.com',
    'A test business for development',
    true,
    true,
    'Test Owner',
    true,
    true,
    0,
    'startup',
    'active',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Insert a simple user profile
INSERT INTO public.profiles (
    id, email, full_name, role, phone, city, referral_code,
    terms_accepted, privacy_accepted, loyalty_card_number, first_name,
    last_name, wallet_address, created_at, updated_at
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'test@example.com',
    'Test User',
    'user',
    '+1-555-0101',
    'Test City',
    'REF001',
    true,
    true,
    'T0000001',
    'Test',
    'User',
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    updated_at = NOW();

-- Insert user points
INSERT INTO public.user_points (
    id, user_id, points_balance, tier_level,
    last_updated, created_at
) VALUES 
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    1000,
    'bronze',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Show completion message
SELECT 'Test data added successfully!' as message;
