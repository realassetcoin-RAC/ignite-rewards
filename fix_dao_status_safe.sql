-- Safe fix for DAO status capitalization
-- This script checks what exists first and handles different scenarios

-- =====================================================
-- 1. CHECK WHAT EXISTS FIRST
-- =====================================================

-- Check if dao_proposals table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dao_proposals' AND table_schema = 'public') THEN
        RAISE NOTICE 'dao_proposals table does not exist. Skipping DAO status updates.';
        RETURN;
    END IF;
END $$;

-- Check what enum types exist for proposal status
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%proposal%status%' OR t.typname LIKE '%status%'
ORDER BY t.typname, e.enumsortorder;

-- Check current status values in dao_proposals table
SELECT DISTINCT status, COUNT(*) as count
FROM public.dao_proposals 
GROUP BY status 
ORDER BY status;

-- =====================================================
-- 2. UPDATE STATUS VALUES (SAFE APPROACH)
-- =====================================================

-- Update existing proposal status values to Capital Case
-- This works regardless of the enum type
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

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Verify the update
SELECT DISTINCT status FROM public.dao_proposals ORDER BY status;

-- Show count of proposals by status
SELECT status, COUNT(*) as count 
FROM public.dao_proposals 
GROUP BY status 
ORDER BY status;
