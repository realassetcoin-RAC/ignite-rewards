-- FIX DAO_VOTES TABLE STRUCTURE
-- This script fixes the dao_votes table to match the expected structure

-- ==============================================
-- STEP 1: CHECK CURRENT STRUCTURE
-- ==============================================

SELECT 
  'Current dao_votes structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_votes'
ORDER BY ordinal_position;

-- ==============================================
-- STEP 2: DROP AND RECREATE DAO_VOTES TABLE
-- ==============================================

-- Drop the existing dao_votes table
DROP TABLE IF EXISTS public.dao_votes CASCADE;

-- Recreate dao_votes table with correct structure
CREATE TABLE public.dao_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  choice text NOT NULL CHECK (choice IN ('yes', 'no', 'abstain')),
  voting_power bigint DEFAULT 0,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id, voter_id)
);

-- ==============================================
-- STEP 3: CREATE INDEXES
-- ==============================================

CREATE INDEX idx_dao_votes_proposal_id ON public.dao_votes(proposal_id);
CREATE INDEX idx_dao_votes_voter_id ON public.dao_votes(voter_id);

-- ==============================================
-- STEP 4: SET UP RLS
-- ==============================================

ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for testing
CREATE POLICY "Allow all operations on dao_votes" ON public.dao_votes
  FOR ALL USING (true) WITH CHECK (true);

-- ==============================================
-- STEP 5: GRANT PERMISSIONS
-- ==============================================

GRANT ALL ON public.dao_votes TO authenticated;
GRANT SELECT ON public.dao_votes TO anon;

-- ==============================================
-- STEP 6: INSERT TEST DATA
-- ==============================================

-- Insert test DAO votes with correct structure
INSERT INTO public.dao_votes (
  id,
  proposal_id,
  voter_id,
  choice,
  voting_power,
  reason
) VALUES 
(
  '950e8400-e29b-41d4-a716-446655440001',
  '850e8400-e29b-41d4-a716-446655440003',
  '750e8400-e29b-41d4-a716-446655440001',
  'yes',
  10000,
  'This will make our governance more democratic and fair for all members.'
),
(
  '950e8400-e29b-41d4-a716-446655440002',
  '850e8400-e29b-41d4-a716-446655440003',
  '750e8400-e29b-41d4-a716-446655440002',
  'yes',
  5000,
  'I support this change to reduce the influence of large holders.'
),
(
  '950e8400-e29b-41d4-a716-446655440003',
  '850e8400-e29b-41d4-a716-446655440003',
  '750e8400-e29b-41d4-a716-446655440003',
  'no',
  3000,
  'The current system works fine and this change might be too complex.'
),
(
  '950e8400-e29b-41d4-a716-446655440004',
  '850e8400-e29b-41d4-a716-446655440004',
  '750e8400-e29b-41d4-a716-446655440001',
  'yes',
  10000,
  'We need more funding for development and platform improvements.'
),
(
  '950e8400-e29b-41d4-a716-446655440005',
  '850e8400-e29b-41d4-a716-446655440004',
  '750e8400-e29b-41d4-a716-446655440002',
  'no',
  5000,
  'Higher fees will discourage users from using the platform.'
),
(
  '950e8400-e29b-41d4-a716-446655440006',
  '850e8400-e29b-41d4-a716-446655440004',
  '750e8400-e29b-41d4-a716-446655440003',
  'no',
  3000,
  'This will hurt small merchants and users.'
);

-- ==============================================
-- STEP 7: VERIFY STRUCTURE AND DATA
-- ==============================================

-- Check the new structure
SELECT 
  'New dao_votes structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_votes'
ORDER BY ordinal_position;

-- Check the data
SELECT 
  'DAO votes data:' as info,
  count(*) as vote_count
FROM public.dao_votes;

-- Show sample votes
SELECT 
  'Sample votes:' as info,
  id,
  proposal_id,
  voter_id,
  choice,
  voting_power,
  reason
FROM public.dao_votes
LIMIT 3;

-- Show completion message
SELECT '✅ dao_votes table structure fixed and test data created!' as status;








