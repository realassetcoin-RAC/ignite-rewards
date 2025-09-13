-- Comprehensive fix for DAO status capitalization and subscription plan cleanup
-- This script addresses both issues in one go

-- =====================================================
-- 1. UPDATE DAO STATUS TO CAPITAL CASE
-- =====================================================

-- Update existing proposal status values to Capital Case
UPDATE public.dao_proposals 
SET status = CASE 
  WHEN status = 'draft' THEN 'Draft'
  WHEN status = 'active' THEN 'Active'
  WHEN status = 'passed' THEN 'Passed'
  WHEN status = 'rejected' THEN 'Rejected'
  WHEN status = 'executed' THEN 'Executed'
  WHEN status = 'cancelled' THEN 'Cancelled'
  ELSE status
END
WHERE status IN ('draft', 'active', 'passed', 'rejected', 'executed', 'cancelled');

-- Update the enum type to use Capital Case
-- First, create a new enum with Capital Case values
CREATE TYPE proposal_status_new AS ENUM (
    'Draft',
    'Active',
    'Passed',
    'Rejected',
    'Executed',
    'Cancelled'
);

-- Remove the default value temporarily
ALTER TABLE public.dao_proposals ALTER COLUMN status DROP DEFAULT;

-- Update the column to use the new enum type
ALTER TABLE public.dao_proposals 
ALTER COLUMN status TYPE proposal_status_new 
USING status::text::proposal_status_new;

-- Set a new default value with the new enum
ALTER TABLE public.dao_proposals ALTER COLUMN status SET DEFAULT 'Draft'::proposal_status_new;

-- Drop the old enum and rename the new one
DROP TYPE proposal_status;
ALTER TYPE proposal_status_new RENAME TO proposal_status;

-- =====================================================
-- 2. CLEAN UP SUBSCRIPTION PLANS
-- =====================================================

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

-- =====================================================
-- 3. VERIFICATION QUERIES
-- =====================================================

-- Verify DAO status updates
SELECT DISTINCT status FROM public.dao_proposals ORDER BY status;

-- Verify subscription plans cleanup
SELECT 
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
SELECT COUNT(*) as remaining_plans FROM public.merchant_subscription_plans;

-- Show count of DAO proposals by status
SELECT status, COUNT(*) as count 
FROM public.dao_proposals 
GROUP BY status 
ORDER BY status;
