-- Check and Create Tables Script
-- Run this in Supabase SQL Editor to check what tables exist and create missing ones

-- Check if tables exist and show their structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN (
    'dao_organizations',
    'dao_members', 
    'dao_proposals',
    'dao_votes',
    'merchants',
    'loyalty_transactions',
    'marketplace_listings'
  )
ORDER BY table_name, ordinal_position;

-- Create dao_organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.dao_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  governance_token_symbol text NOT NULL,
  governance_token_decimals int NOT NULL DEFAULT 9,
  min_proposal_threshold numeric NOT NULL DEFAULT 0,
  voting_period_days int NOT NULL DEFAULT 7,
  execution_delay_hours int NOT NULL DEFAULT 24,
  quorum_percentage numeric NOT NULL DEFAULT 10.0,
  super_majority_threshold numeric NOT NULL DEFAULT 66.67,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create dao_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.dao_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id uuid REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  wallet_address text,
  role text NOT NULL DEFAULT 'member',
  governance_tokens numeric NOT NULL DEFAULT 0,
  voting_power numeric NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  user_email text,
  user_full_name text
);

-- Create dao_proposals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.dao_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id uuid REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
  proposer_id uuid,
  title text NOT NULL,
  description text,
  full_description text,
  category text,
  voting_type text NOT NULL DEFAULT 'simple_majority',
  status text NOT NULL DEFAULT 'draft',
  start_time timestamptz,
  end_time timestamptz,
  execution_time timestamptz,
  total_votes int NOT NULL DEFAULT 0,
  yes_votes int NOT NULL DEFAULT 0,
  no_votes int NOT NULL DEFAULT 0,
  abstain_votes int NOT NULL DEFAULT 0,
  participation_rate numeric NOT NULL DEFAULT 0,
  treasury_impact_amount numeric DEFAULT 0,
  treasury_impact_currency text DEFAULT 'SOL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create dao_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.dao_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  choice text NOT NULL,
  voting_power numeric NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.dao_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
DROP POLICY IF EXISTS "Users can read all DAO organizations" ON public.dao_organizations;
CREATE POLICY "Users can read all DAO organizations" ON public.dao_organizations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can read all DAO members" ON public.dao_members;
CREATE POLICY "Users can read all DAO members" ON public.dao_members
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can read all DAO proposals" ON public.dao_proposals;
CREATE POLICY "Users can read all DAO proposals" ON public.dao_proposals
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can read all DAO votes" ON public.dao_votes;
CREATE POLICY "Users can read all DAO votes" ON public.dao_votes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert their own votes" ON public.dao_votes;
CREATE POLICY "Users can insert their own votes" ON public.dao_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = voter_id);

-- Grant permissions
GRANT ALL ON public.dao_organizations TO authenticated;
GRANT ALL ON public.dao_members TO authenticated;
GRANT ALL ON public.dao_proposals TO authenticated;
GRANT ALL ON public.dao_votes TO authenticated;

-- Check table counts after creation
SELECT 
  'dao_organizations' as table_name, 
  COUNT(*) as record_count 
FROM public.dao_organizations
UNION ALL
SELECT 
  'dao_members' as table_name, 
  COUNT(*) as record_count 
FROM public.dao_members
UNION ALL
SELECT 
  'dao_proposals' as table_name, 
  COUNT(*) as record_count 
FROM public.dao_proposals
UNION ALL
SELECT 
  'dao_votes' as table_name, 
  COUNT(*) as record_count 
FROM public.dao_votes;

-- Success message
SELECT 'Tables checked and created successfully!' as message;
