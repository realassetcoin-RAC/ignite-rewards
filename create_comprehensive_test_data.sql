-- Comprehensive Test Data Creation Script
-- Creates 50 merchants and 100 users with diverse configurations for testing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test data for merchants with different subscription plans
DO $$ 
DECLARE
    i INTEGER;
    plan_names TEXT[] := ARRAY['StartUp', 'Momentum', 'Energizer', 'Cloud', 'Super'];
    plan_costs DECIMAL[] := ARRAY[20.00, 50.00, 100.00, 250.00, 500.00];
    plan_points INTEGER[] := ARRAY[100, 300, 600, 1800, 4000];
    plan_transactions INTEGER[] := ARRAY[100, 300, 600, 1800, 4000];
    business_types TEXT[] := ARRAY['Restaurant', 'Retail Store', 'Coffee Shop', 'Gym', 'Salon', 'Clinic', 'Hotel', 'Gas Station', 'Pharmacy', 'Bookstore'];
    cities TEXT[] := ARRAY['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
    states TEXT[] := ARRAY['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];
BEGIN
    RAISE NOTICE 'Creating 50 test merchants...';
    
    FOR i IN 1..50 LOOP
        -- Create merchant profile
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'merchant' || i || '@testbusiness.com',
            'Merchant ' || i || ' Owner',
            'merchant',
            NOW() - (random() * interval '365 days'),
            NOW()
        );
        
        -- Create merchant record
        INSERT INTO public.merchants (
            id,
            user_id,
            business_name,
            business_type,
            contact_email,
            phone_number,
            address,
            city,
            state,
            zip_code,
            country,
            status,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM public.profiles WHERE email = 'merchant' || i || '@testbusiness.com' LIMIT 1),
            'Test Business ' || i,
            business_types[1 + (i % array_length(business_types, 1))],
            'merchant' || i || '@testbusiness.com',
            '+1-555-' || LPAD((1000 + i)::TEXT, 4, '0'),
            (100 + i) || ' Main Street',
            cities[1 + (i % array_length(cities, 1))],
            states[1 + (i % array_length(states, 1))],
            LPAD((10000 + i)::TEXT, 5, '0'),
            'USA',
            CASE 
                WHEN i % 10 = 0 THEN 'inactive'
                WHEN i % 15 = 0 THEN 'suspended'
                ELSE 'active'
            END,
            NOW() - (random() * interval '365 days'),
            NOW()
        );
        
        -- Create merchant subscription
        INSERT INTO public.merchant_subscriptions (
            id,
            merchant_id,
            plan_name,
            monthly_cost,
            points_limit,
            transaction_limit,
            start_date,
            end_date,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM public.merchants WHERE business_name = 'Test Business ' || i LIMIT 1),
            plan_names[1 + (i % array_length(plan_names, 1))],
            plan_costs[1 + (i % array_length(plan_costs, 1))],
            plan_points[1 + (i % array_length(plan_points, 1))],
            plan_transactions[1 + (i % array_length(plan_transactions, 1))],
            NOW() - (random() * interval '300 days'),
            -- Some merchants close to expiry (within 30 days)
            CASE 
                WHEN i % 8 = 0 THEN NOW() + (random() * interval '30 days')
                ELSE NOW() + (random() * interval '300 days')
            END,
            true,
            NOW() - (random() * interval '300 days'),
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE '✅ Created 50 test merchants with subscriptions';
END $$;

-- Create test data for users with different loyalty NFT types
DO $$ 
DECLARE
    i INTEGER;
    nft_types TEXT[] := ARRAY['Pearl White', 'Lava Orange', 'Pink', 'Silver', 'Gold', 'Black'];
    nft_rarities TEXT[] := ARRAY['Common', 'Less Common', 'Less Common', 'Rare', 'Rare', 'Very Rare'];
    nft_prices DECIMAL[] := ARRAY[0, 100, 100, 200, 300, 500];
    first_names TEXT[] := ARRAY['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'James', 'Jessica'];
    last_names TEXT[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    cities TEXT[] := ARRAY['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
    states TEXT[] := ARRAY['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];
BEGIN
    RAISE NOTICE 'Creating 100 test users...';
    
    FOR i IN 1..100 LOOP
        -- Create user profile
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'user' || i || '@testuser.com',
            first_names[1 + (i % array_length(first_names, 1))] || ' ' || last_names[1 + (i % array_length(last_names, 1))],
            'customer',
            NOW() - (random() * interval '365 days'),
            NOW()
        );
        
        -- Create user loyalty card
        INSERT INTO public.user_loyalty_cards (
            id,
            user_id,
            loyalty_number,
            nft_type,
            is_custodial,
            is_upgraded,
            is_evolved,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM public.profiles WHERE email = 'user' || i || '@testuser.com' LIMIT 1),
            CHR(65 + (i % 26)) || LPAD((i % 1000000)::TEXT, 6, '0'),
            nft_types[1 + (i % array_length(nft_types, 1))],
            CASE WHEN i % 3 = 0 THEN false ELSE true END, -- 1/3 non-custodial
            CASE WHEN i % 5 = 0 THEN true ELSE false END, -- 1/5 upgraded
            CASE WHEN i % 10 = 0 THEN true ELSE false END, -- 1/10 evolved
            NOW() - (random() * interval '365 days'),
            NOW()
        );
        
        -- Create user points
        INSERT INTO public.user_points (
            id,
            user_id,
            total_points,
            available_points,
            pending_points,
            lifetime_points,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM public.profiles WHERE email = 'user' || i || '@testuser.com' LIMIT 1),
            (random() * 10000)::INTEGER,
            (random() * 5000)::INTEGER,
            (random() * 1000)::INTEGER,
            (random() * 50000)::INTEGER,
            NOW() - (random() * interval '365 days'),
            NOW()
        );
        
        -- Create user wallet (for custodial users)
        IF i % 3 != 0 THEN
            INSERT INTO public.user_wallets (
                id,
                user_id,
                wallet_address,
                wallet_type,
                is_primary,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                (SELECT id FROM public.profiles WHERE email = 'user' || i || '@testuser.com' LIMIT 1),
                '0x' || encode(gen_random_bytes(20), 'hex'),
                'custodial',
                true,
                NOW() - (random() * interval '365 days'),
                NOW()
            );
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Created 100 test users with loyalty cards and points';
END $$;

-- Create sample transactions between users and merchants
DO $$ 
DECLARE
    i INTEGER;
    user_count INTEGER;
    merchant_count INTEGER;
    transaction_amount DECIMAL;
    points_earned INTEGER;
BEGIN
    RAISE NOTICE 'Creating sample transactions...';
    
    -- Get counts
    SELECT COUNT(*) INTO user_count FROM public.profiles WHERE role = 'customer';
    SELECT COUNT(*) INTO merchant_count FROM public.merchants WHERE status = 'active';
    
    -- Create 500 sample transactions
    FOR i IN 1..500 LOOP
        transaction_amount := (random() * 500 + 10)::DECIMAL(10,2);
        points_earned := (transaction_amount * 0.01)::INTEGER; -- 1% points
        
        INSERT INTO public.loyalty_transactions (
            id,
            user_id,
            merchant_id,
            transaction_amount,
            points_earned,
            transaction_date,
            status,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM public.profiles WHERE role = 'customer' ORDER BY random() LIMIT 1),
            (SELECT id FROM public.merchants WHERE status = 'active' ORDER BY random() LIMIT 1),
            transaction_amount,
            points_earned,
            NOW() - (random() * interval '90 days'),
            'completed',
            NOW() - (random() * interval '90 days'),
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE '✅ Created 500 sample transactions';
END $$;

-- Create sample referral campaigns
DO $$ 
DECLARE
    i INTEGER;
    campaign_types TEXT[] := ARRAY['user', 'merchant', 'both'];
    statuses TEXT[] := ARRAY['active', 'completed', 'paused'];
BEGIN
    RAISE NOTICE 'Creating sample referral campaigns...';
    
    FOR i IN 1..10 LOOP
        INSERT INTO public.referral_campaigns (
            id,
            campaign_name,
            campaign_type,
            points_per_referral,
            max_referrals_per_user,
            start_date,
            end_date,
            status,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Test Campaign ' || i,
            campaign_types[1 + (i % array_length(campaign_types, 1))],
            (random() * 100 + 50)::INTEGER,
            (random() * 10 + 5)::INTEGER,
            NOW() - (random() * interval '30 days'),
            NOW() + (random() * interval '60 days'),
            statuses[1 + (i % array_length(statuses, 1))],
            NOW() - (random() * interval '30 days'),
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE '✅ Created 10 sample referral campaigns';
END $$;

-- Create sample asset initiatives
DO $$ 
DECLARE
    i INTEGER;
    initiative_types TEXT[] := ARRAY['Environmental', 'Social', 'Governance', 'Education', 'Healthcare'];
    statuses TEXT[] := ARRAY['active', 'funding', 'completed'];
BEGIN
    RAISE NOTICE 'Creating sample asset initiatives...';
    
    FOR i IN 1..15 LOOP
        INSERT INTO public.asset_initiatives (
            id,
            name,
            description,
            initiative_type,
            target_amount,
            current_amount,
            status,
            impact_score,
            risk_level,
            expected_return,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Initiative ' || i || ' - ' || initiative_types[1 + (i % array_length(initiative_types, 1))],
            'This is a test ' || initiative_types[1 + (i % array_length(initiative_types, 1))] || ' initiative for demonstration purposes.',
            initiative_types[1 + (i % array_length(initiative_types, 1))],
            (random() * 1000000 + 100000)::DECIMAL(15,2),
            (random() * 500000)::DECIMAL(15,2),
            statuses[1 + (i % array_length(statuses, 1))],
            (random() * 10 + 1)::INTEGER,
            CASE 
                WHEN i % 3 = 0 THEN 'High'
                WHEN i % 3 = 1 THEN 'Medium'
                ELSE 'Low'
            END,
            (random() * 0.2 + 0.05)::DECIMAL(5,4),
            true,
            NOW() - (random() * interval '180 days'),
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE '✅ Created 15 sample asset initiatives';
END $$;

-- Create sample user asset selections
DO $$ 
DECLARE
    i INTEGER;
    user_count INTEGER;
    initiative_count INTEGER;
BEGIN
    RAISE NOTICE 'Creating sample user asset selections...';
    
    -- Get counts
    SELECT COUNT(*) INTO user_count FROM public.profiles WHERE role = 'customer';
    SELECT COUNT(*) INTO initiative_count FROM public.asset_initiatives WHERE is_active = true;
    
    -- Create 200 sample selections
    FOR i IN 1..200 LOOP
        INSERT INTO public.user_asset_selections (
            id,
            user_id,
            asset_initiative_id,
            selected_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM public.profiles WHERE role = 'customer' ORDER BY random() LIMIT 1),
            (SELECT id FROM public.asset_initiatives WHERE is_active = true ORDER BY random() LIMIT 1),
            NOW() - (random() * interval '60 days'),
            NOW() - (random() * interval '60 days'),
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE '✅ Created 200 sample user asset selections';
END $$;

-- Create sample merchant custom NFTs
DO $$ 
DECLARE
    i INTEGER;
    merchant_count INTEGER;
    discount_types TEXT[] := ARRAY['percentage', 'fixed'];
BEGIN
    RAISE NOTICE 'Creating sample merchant custom NFTs...';
    
    -- Get merchant count
    SELECT COUNT(*) INTO merchant_count FROM public.merchants WHERE status = 'active';
    
    -- Create 30 sample custom NFTs
    FOR i IN 1..30 LOOP
        INSERT INTO public.merchant_custom_nfts (
            id,
            merchant_id,
            nft_name,
            description,
            image_url,
            discount_code,
            discount_type,
            discount_value,
            min_purchase_amount,
            max_uses,
            valid_from,
            valid_until,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM public.merchants WHERE status = 'active' ORDER BY random() LIMIT 1),
            'VIP Card ' || i,
            'Exclusive VIP membership card with special benefits and discounts.',
            'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
            'VIP' || LPAD(i::TEXT, 3, '0'),
            discount_types[1 + (i % array_length(discount_types, 1))],
            CASE 
                WHEN i % 2 = 0 THEN (random() * 20 + 5)::DECIMAL(5,2)
                ELSE (random() * 50 + 10)::DECIMAL(10,2)
            END,
            (random() * 100 + 25)::DECIMAL(10,2),
            (random() * 100 + 50)::INTEGER,
            NOW() - (random() * interval '30 days'),
            NOW() + (random() * interval '365 days'),
            true,
            NOW() - (random() * interval '30 days'),
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE '✅ Created 30 sample merchant custom NFTs';
END $$;

-- Create sample fractionalized investments
DO $$ 
DECLARE
    i INTEGER;
    user_count INTEGER;
    asset_count INTEGER;
BEGIN
    RAISE NOTICE 'Creating sample fractionalized investments...';
    
    -- Get counts
    SELECT COUNT(*) INTO user_count FROM public.profiles WHERE role = 'customer';
    SELECT COUNT(*) INTO asset_count FROM public.fractionalized_assets WHERE is_active = true;
    
    -- Create 100 sample investments
    FOR i IN 1..100 LOOP
        INSERT INTO public.user_fractional_investments (
            id,
            user_id,
            asset_id,
            investment_amount,
            shares_purchased,
            investment_date,
            status,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM public.profiles WHERE role = 'customer' ORDER BY random() LIMIT 1),
            (SELECT id FROM public.fractionalized_assets WHERE is_active = true ORDER BY random() LIMIT 1),
            (random() * 10000 + 100)::DECIMAL(15,2),
            (random() * 100 + 1)::INTEGER,
            NOW() - (random() * interval '90 days'),
            'completed',
            NOW() - (random() * interval '90 days'),
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE '✅ Created 100 sample fractionalized investments';
END $$;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '🎉 COMPREHENSIVE TEST DATA CREATION COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 CREATED DATA SUMMARY:';
    RAISE NOTICE '   👥 50 Merchants with different subscription plans';
    RAISE NOTICE '   👤 100 Users with various loyalty NFT types';
    RAISE NOTICE '   💳 100 User loyalty cards (1/3 non-custodial)';
    RAISE NOTICE '   💰 100 User point balances';
    RAISE NOTICE '   🔗 100 User wallets (custodial users)';
    RAISE NOTICE '   🛒 500 Sample transactions';
    RAISE NOTICE '   📢 10 Referral campaigns';
    RAISE NOTICE '   🌱 15 Asset initiatives';
    RAISE NOTICE '   🎯 200 User asset selections';
    RAISE NOTICE '   🎨 30 Merchant custom NFTs';
    RAISE NOTICE '   📈 100 Fractionalized investments';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 TESTING SCENARIOS COVERED:';
    RAISE NOTICE '   • Different subscription plans (StartUp to Super)';
    RAISE NOTICE '   • Merchants close to plan expiry (within 30 days)';
    RAISE NOTICE '   • Various loyalty NFT types and rarities';
    RAISE NOTICE '   • Custodial and non-custodial users';
    RAISE NOTICE '   • Upgraded and evolved NFTs';
    RAISE NOTICE '   • Active, inactive, and suspended merchants';
    RAISE NOTICE '   • Different business types and locations';
    RAISE NOTICE '   • Various transaction amounts and points';
    RAISE NOTICE '   • Multiple referral campaign types';
    RAISE NOTICE '   • Different asset initiative categories';
    RAISE NOTICE '   • Custom NFT discount codes';
    RAISE NOTICE '   • Fractionalized investment scenarios';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 READY FOR COMPREHENSIVE TESTING!';
END $$;

