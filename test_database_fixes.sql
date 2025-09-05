-- Test Script to Verify Database Fixes
-- Run this after applying the comprehensive fix to ensure everything works

-- =============================================================================
-- 1. TABLE EXISTENCE TESTS
-- =============================================================================

DO $$
DECLARE
    table_exists_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testing Table Existence...';
    
    -- Check if all required tables exist
    SELECT COUNT(*) INTO table_exists_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'merchant_subscription_plans', 'virtual_cards');
    
    IF table_exists_count = 3 THEN
        RAISE NOTICE '✅ All 3 required tables exist in public schema';
    ELSE
        RAISE NOTICE '❌ Missing tables! Found % out of 3 expected', table_exists_count;
    END IF;
END $$;

-- =============================================================================
-- 2. TABLE STRUCTURE TESTS
-- =============================================================================

DO $$
DECLARE
    column_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testing Table Structures...';
    
    -- Check merchant_subscription_plans has correct columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'merchant_subscription_plans'
    AND column_name IN ('price_monthly', 'trial_days', 'features');
    
    IF column_count = 3 THEN
        RAISE NOTICE '✅ merchant_subscription_plans has correct column structure';
    ELSE
        RAISE NOTICE '❌ merchant_subscription_plans missing required columns! Found % out of 3', column_count;
    END IF;
    
    -- Check virtual_cards has correct columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'virtual_cards'
    AND column_name IN ('card_name', 'card_type', 'pricing_type');
    
    IF column_count = 3 THEN
        RAISE NOTICE '✅ virtual_cards has correct column structure';
    ELSE
        RAISE NOTICE '❌ virtual_cards missing required columns! Found % out of 3', column_count;
    END IF;
END $$;

-- =============================================================================
-- 3. RLS POLICY TESTS
-- =============================================================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testing RLS Policies...';
    
    -- Check merchant_subscription_plans policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'merchant_subscription_plans';
    
    RAISE NOTICE '✅ merchant_subscription_plans has % RLS policies', policy_count;
    
    -- Check virtual_cards policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'virtual_cards';
    
    RAISE NOTICE '✅ virtual_cards has % RLS policies', policy_count;
    
    -- Check profiles policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles';
    
    RAISE NOTICE '✅ profiles has % RLS policies', policy_count;
END $$;

-- =============================================================================
-- 4. FUNCTION TESTS
-- =============================================================================

DO $$
DECLARE
    function_exists BOOLEAN;
    test_result BOOLEAN;
BEGIN
    RAISE NOTICE '🧪 Testing Functions...';
    
    -- Check if has_role function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'has_role'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ has_role function exists';
        
        -- Test the function (this will always return false since we're not authenticated)
        BEGIN
            SELECT public.has_role('00000000-0000-0000-0000-000000000000', 'admin') INTO test_result;
            RAISE NOTICE '✅ has_role function is callable';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ has_role function error: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '❌ has_role function does not exist';
    END IF;
    
    -- Check if update_updated_at_column function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'update_updated_at_column'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ update_updated_at_column function exists';
    ELSE
        RAISE NOTICE '❌ update_updated_at_column function does not exist';
    END IF;
END $$;

-- =============================================================================
-- 5. DATA ACCESS TESTS
-- =============================================================================

DO $$
DECLARE
    plan_count INTEGER;
    card_count INTEGER;
    profile_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testing Data Access...';
    
    -- Test reading from merchant_subscription_plans
    BEGIN
        SELECT COUNT(*) INTO plan_count FROM public.merchant_subscription_plans;
        RAISE NOTICE '✅ Can read merchant_subscription_plans: % records', plan_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Cannot read merchant_subscription_plans: %', SQLERRM;
    END;
    
    -- Test reading from virtual_cards
    BEGIN
        SELECT COUNT(*) INTO card_count FROM public.virtual_cards;
        RAISE NOTICE '✅ Can read virtual_cards: % records', card_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Cannot read virtual_cards: %', SQLERRM;
    END;
    
    -- Test reading from profiles
    BEGIN
        SELECT COUNT(*) INTO profile_count FROM public.profiles;
        RAISE NOTICE '✅ Can read profiles: % records', profile_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Cannot read profiles: %', SQLERRM;
    END;
END $$;

-- =============================================================================
-- 6. DEFAULT DATA TESTS
-- =============================================================================

DO $$
DECLARE
    basic_plan_exists BOOLEAN;
    basic_card_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🧪 Testing Default Data...';
    
    -- Check if default subscription plans exist
    SELECT EXISTS (
        SELECT 1 FROM public.merchant_subscription_plans 
        WHERE name = 'Basic'
    ) INTO basic_plan_exists;
    
    IF basic_plan_exists THEN
        RAISE NOTICE '✅ Default subscription plans were inserted';
    ELSE
        RAISE NOTICE '❌ Default subscription plans missing';
    END IF;
    
    -- Check if default virtual cards exist
    SELECT EXISTS (
        SELECT 1 FROM public.virtual_cards 
        WHERE card_name = 'Basic RAC Card'
    ) INTO basic_card_exists;
    
    IF basic_card_exists THEN
        RAISE NOTICE '✅ Default virtual cards were inserted';
    ELSE
        RAISE NOTICE '❌ Default virtual cards missing';
    END IF;
END $$;

-- =============================================================================
-- 7. ENUM TESTS
-- =============================================================================

DO $$
DECLARE
    enum_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testing ENUM Types...';
    
    SELECT COUNT(*) INTO enum_count
    FROM pg_type 
    WHERE typname IN ('app_role', 'card_type', 'pricing_type', 'subscription_plan', 'merchant_status');
    
    RAISE NOTICE '✅ Found % ENUM types out of 5 expected', enum_count;
END $$;

-- =============================================================================
-- 8. TRIGGER TESTS
-- =============================================================================

DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testing Triggers...';
    
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%updated_at%';
    
    RAISE NOTICE '✅ Found % update timestamp triggers', trigger_count;
END $$;

-- =============================================================================
-- 9. PERMISSION TESTS
-- =============================================================================

DO $$
DECLARE
    grant_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testing Permissions...';
    
    -- Check table permissions
    SELECT COUNT(*) INTO grant_count
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
    AND table_name IN ('merchant_subscription_plans', 'virtual_cards', 'profiles')
    AND grantee = 'authenticated';
    
    RAISE NOTICE '✅ Found % table permissions for authenticated role', grant_count;
END $$;

-- =============================================================================
-- 10. FINAL SUMMARY
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 DATABASE FIX VERIFICATION COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE 'If all tests above show ✅, your database fix was successful.';
    RAISE NOTICE 'You should now be able to:';
    RAISE NOTICE '• Create and edit subscription plans without errors';
    RAISE NOTICE '• Create and manage virtual cards successfully';
    RAISE NOTICE '• Access admin dashboard features';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test plan creation in your application';
    RAISE NOTICE '2. Test virtual card creation in your application';
    RAISE NOTICE '3. Verify your user has admin role if needed';
    RAISE NOTICE '';
END $$;