-- COMPREHENSIVE FIX FOR DAO TEST DATA ISSUES
-- This script creates DAO tables if they don't exist and fixes any structural issues

-- ==============================================
-- STEP 1: CREATE DAO TABLES IF THEY DON'T EXIST
-- ==============================================

-- Create dao_organizations table
CREATE TABLE IF NOT EXISTS public.dao_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  governance_token_symbol text,
  governance_token_decimals integer DEFAULT 9,
  min_proposal_threshold integer DEFAULT 100,
  voting_period_days integer DEFAULT 7,
  execution_delay_hours integer DEFAULT 24,
  quorum_percentage numeric(5,2) DEFAULT 10.0,
  super_majority_threshold numeric(5,2) DEFAULT 66.67,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dao_members table
CREATE TABLE IF NOT EXISTS public.dao_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id uuid NOT NULL REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  wallet_address text,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member', 'moderator')),
  governance_tokens bigint DEFAULT 0,
  voting_power bigint DEFAULT 0,
  is_active boolean DEFAULT true,
  user_email text,
  user_full_name text,
  user_avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(dao_id, user_id)
);

-- Create dao_proposals table
CREATE TABLE IF NOT EXISTS public.dao_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id uuid NOT NULL REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
  proposer_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  full_description text,
  category text DEFAULT 'general' CHECK (category IN ('governance', 'treasury', 'technical', 'community', 'partnership', 'marketing', 'rewards', 'general')),
  voting_type text DEFAULT 'simple_majority' CHECK (voting_type IN ('simple_majority', 'super_majority', 'unanimous', 'weighted', 'quadratic')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'executed', 'expired')),
  start_time timestamptz,
  end_time timestamptz,
  execution_time timestamptz,
  total_votes integer DEFAULT 0,
  yes_votes integer DEFAULT 0,
  no_votes integer DEFAULT 0,
  abstain_votes integer DEFAULT 0,
  participation_rate numeric(5,2) DEFAULT 0,
  treasury_impact_amount numeric(20,8) DEFAULT 0,
  treasury_impact_currency text DEFAULT 'SOL',
  tags text[] DEFAULT '{}',
  proposer_email text,
  proposer_tokens bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dao_votes table
CREATE TABLE IF NOT EXISTS public.dao_votes (
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
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dao_members_dao_id ON public.dao_members(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_user_id ON public.dao_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_dao_id ON public.dao_proposals(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_proposer_id ON public.dao_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status ON public.dao_proposals(status);
CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal_id ON public.dao_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_voter_id ON public.dao_votes(voter_id);

-- ==============================================
-- STEP 3: SET UP ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all DAO tables
ALTER TABLE public.dao_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dao_organizations
DROP POLICY IF EXISTS "Anyone can view active DAO organizations" ON public.dao_organizations;
CREATE POLICY "Anyone can view active DAO organizations" ON public.dao_organizations
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can create DAO organizations" ON public.dao_organizations;
CREATE POLICY "Authenticated users can create DAO organizations" ON public.dao_organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for dao_members
DROP POLICY IF EXISTS "Anyone can view DAO members" ON public.dao_members;
CREATE POLICY "Anyone can view DAO members" ON public.dao_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own DAO membership" ON public.dao_members;
CREATE POLICY "Users can manage their own DAO membership" ON public.dao_members
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for dao_proposals
DROP POLICY IF EXISTS "Anyone can view DAO proposals" ON public.dao_proposals;
CREATE POLICY "Anyone can view DAO proposals" ON public.dao_proposals
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create proposals" ON public.dao_proposals;
CREATE POLICY "Users can create proposals" ON public.dao_proposals
  FOR INSERT WITH CHECK (auth.uid() = proposer_id);

DROP POLICY IF EXISTS "Proposers can update their proposals" ON public.dao_proposals;
CREATE POLICY "Proposers can update their proposals" ON public.dao_proposals
  FOR UPDATE USING (auth.uid() = proposer_id);

-- Create RLS policies for dao_votes
DROP POLICY IF EXISTS "Anyone can view DAO votes" ON public.dao_votes;
CREATE POLICY "Anyone can view DAO votes" ON public.dao_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own votes" ON public.dao_votes;
CREATE POLICY "Users can create their own votes" ON public.dao_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- ==============================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ==============================================

-- Function to get user's voting power in a DAO
CREATE OR REPLACE FUNCTION public.get_user_voting_power(_dao_id uuid, _user_id uuid DEFAULT NULL)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT voting_power 
     FROM public.dao_members 
     WHERE dao_id = _dao_id 
     AND user_id = COALESCE(_user_id, auth.uid())
     AND is_active = true), 
    0
  );
$$;

-- Function to check if user can vote on a proposal
CREATE OR REPLACE FUNCTION public.can_user_vote(_proposal_id uuid, _user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.dao_proposals p
    JOIN public.dao_members m ON p.dao_id = m.dao_id
    WHERE p.id = _proposal_id
    AND m.user_id = COALESCE(_user_id, auth.uid())
    AND m.is_active = true
    AND p.status = 'active'
    AND p.end_time > now()
    AND NOT EXISTS (
      SELECT 1 FROM public.dao_votes v 
      WHERE v.proposal_id = _proposal_id 
      AND v.voter_id = COALESCE(_user_id, auth.uid())
    )
  );
$$;

-- ==============================================
-- STEP 5: VERIFY TABLE CREATION
-- ==============================================

-- Check that all tables were created successfully
SELECT 
  'DAO Tables Status:' as status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_organizations') THEN '✅ dao_organizations' ELSE '❌ dao_organizations' END as organizations,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_members') THEN '✅ dao_members' ELSE '❌ dao_members' END as members,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_proposals') THEN '✅ dao_proposals' ELSE '❌ dao_proposals' END as proposals,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dao_votes') THEN '✅ dao_votes' ELSE '❌ dao_votes' END as votes;

-- Show table structures
SELECT 
  'dao_organizations structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_organizations'
ORDER BY ordinal_position;

SELECT 
  'dao_members structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_members'
ORDER BY ordinal_position;

SELECT 
  'dao_proposals structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_proposals'
ORDER BY ordinal_position;

SELECT 
  'dao_votes structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dao_votes'
ORDER BY ordinal_position;

-- Show completion message
SELECT '✅ DAO tables created and configured successfully!' as status;

