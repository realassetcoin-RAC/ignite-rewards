-- Part 4: Verification queries
-- This is the final part to verify all fixes are working

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the fixes
DO $$
BEGIN
    RAISE NOTICE '=== HEALTH CHECK FIXES VERIFICATION ===';
    
    -- Check DAO Organizations table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'dao_organizations') THEN
        RAISE NOTICE '✅ api.dao_organizations table exists';
    ELSE
        RAISE NOTICE '❌ api.dao_organizations table missing';
    END IF;
    
    -- Check DAO Proposals table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'dao_proposals') THEN
        RAISE NOTICE '✅ api.dao_proposals table exists';
    ELSE
        RAISE NOTICE '❌ api.dao_proposals table missing';
    END IF;
    
    -- Check transaction_type column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'loyalty_transactions' 
        AND column_name = 'transaction_type'
    ) THEN
        RAISE NOTICE '✅ transaction_type column exists in public.loyalty_transactions';
    ELSE
        RAISE NOTICE '❌ transaction_type column missing in public.loyalty_transactions';
    END IF;
    
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
END $$;
