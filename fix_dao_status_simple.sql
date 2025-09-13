-- Simple fix for DAO status capitalization (without changing enum type)
-- This approach only updates the data, not the enum type

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

-- Verify the update
SELECT DISTINCT status FROM public.dao_proposals ORDER BY status;

-- Show count of proposals by status
SELECT status, COUNT(*) as count 
FROM public.dao_proposals 
GROUP BY status 
ORDER BY status;
