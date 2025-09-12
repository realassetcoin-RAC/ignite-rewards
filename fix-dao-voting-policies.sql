-- Fix DAO Voting RLS Policies
-- This script adds the necessary RLS policies for DAO voting to work properly

-- Enable RLS on dao_votes table
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own votes
CREATE POLICY "Users can insert their own votes" ON public.dao_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = voter_id);

-- Policy for users to read all votes (for transparency)
CREATE POLICY "Users can read all votes" ON public.dao_votes
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for users to update their own votes (if needed)
CREATE POLICY "Users can update their own votes" ON public.dao_votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = voter_id)
  WITH CHECK (auth.uid() = voter_id);

-- Policy for users to delete their own votes (if needed)
CREATE POLICY "Users can delete their own votes" ON public.dao_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = voter_id);

-- Grant necessary permissions
GRANT ALL ON public.dao_votes TO authenticated;
GRANT ALL ON public.dao_proposals TO authenticated;
GRANT ALL ON public.dao_members TO authenticated;
GRANT ALL ON public.dao_organizations TO authenticated;
