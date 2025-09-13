-- Safe comprehensive fix for both DAO status and subscription plans
-- This script avoids enum type modifications and handles missing tables gracefully

-- =====================================================
-- 1. DAO STATUS FIX (SAFE APPROACH)
-- =====================================================

-- Check if dao_proposals table exists and update status values
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dao_proposals' AND table_schema = 'public') THEN
        -- Update existing proposal status values to Capital Case
        UPDATE public.dao_proposals 
        SET status = CASE 
          WHEN status::text = 'draft' THEN 'Draft'::text
          WHEN status::text = 'active' THEN 'Active'::text
          WHEN status::text = 'passed' THEN 'Passed'::text
          WHEN status::text = 'rejected' THEN 'Rejected'::text
          WHEN status::text = 'executed' THEN 'Executed'::text
          WHEN status::text = 'cancelled' THEN 'Cancelled'::text
          ELSE status::text
        END::text
        WHERE status::text IN ('draft', 'active', 'passed', 'rejected', 'executed', 'cancelled');
        
        RAISE NOTICE 'DAO status values updated to Capital Case';
    ELSE
        RAISE NOTICE 'dao_proposals table does not exist. Skipping DAO status updates.';
    END IF;
END $$;

-- =====================================================
-- 2. SUBSCRIPTION PLANS CLEANUP
-- =====================================================

-- Check if merchant_subscription_plans table exists and clean up plans
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_subscription_plans' AND table_schema = 'public') THEN
        -- Remove all unwanted subscription plans
        DELETE FROM public.merchant_subscription_plans 
        WHERE name NOT IN (
          'StartUp', 
          'Momentum Plan', 
          'Energizer Plan', 
          'Cloud9 Plan', 
          'Super Plan'
        );
        
        -- Also remove any plans with similar names that might exist
        DELETE FROM public.merchant_subscription_plans 
        WHERE name ILIKE '%premium%' 
           OR name ILIKE '%enterprise%' 
           OR name ILIKE '%basic%'
           OR name ILIKE '%starter%'
           OR name ILIKE '%professional%';
        
        RAISE NOTICE 'Unwanted subscription plans removed';
    ELSE
        RAISE NOTICE 'merchant_subscription_plans table does not exist. Skipping subscription plan cleanup.';
    END IF;
END $$;

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Verify DAO status updates (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dao_proposals' AND table_schema = 'public') THEN
        RAISE NOTICE '=== DAO STATUS VERIFICATION ===';
        PERFORM 1; -- This will be replaced by actual queries below
    END IF;
END $$;

-- Show DAO status distribution
SELECT 
    'DAO Status Distribution' as info,
    status, 
    COUNT(*) as count 
FROM public.dao_proposals 
GROUP BY status 
ORDER BY status;

-- Verify subscription plans cleanup (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_subscription_plans' AND table_schema = 'public') THEN
        RAISE NOTICE '=== SUBSCRIPTION PLANS VERIFICATION ===';
        PERFORM 1; -- This will be replaced by actual queries below
    END IF;
END $$;

-- Show remaining subscription plans
SELECT 
    'Remaining Subscription Plans' as info,
    plan_number,
    name,
    price_monthly,
    price_yearly,
    monthly_points,
    monthly_transactions,
    popular,
    is_active
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Show count of remaining plans
SELECT 
    'Total Plans Count' as info,
    COUNT(*) as remaining_plans 
FROM public.merchant_subscription_plans;
