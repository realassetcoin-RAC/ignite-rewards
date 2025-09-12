-- Setup DAO Tables for Testing
-- Run this script in your Supabase SQL Editor to create the DAO tables

-- Drop existing DAO tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS public.dao_votes CASCADE;
DROP TABLE IF EXISTS public.dao_proposals CASCADE;
DROP TABLE IF EXISTS public.dao_members CASCADE;
DROP TABLE IF EXISTS public.dao_organizations CASCADE;

-- Create DAO organizations table
CREATE TABLE public.dao_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  website_url text,
  discord_url text,
  twitter_url text,
  github_url text,
  governance_token_address text,
  governance_token_symbol text NOT NULL,
  governance_token_decimals int NOT NULL DEFAULT 9,
  min_proposal_threshold numeric NOT NULL DEFAULT 0,
  voting_period_days int NOT NULL DEFAULT 7,
  execution_delay_hours int NOT NULL DEFAULT 24,
  quorum_percentage numeric NOT NULL DEFAULT 10.0,
  super_majority_threshold numeric NOT NULL DEFAULT 66.67,
  treasury_address text,
  created_by uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create DAO members table
CREATE TABLE public.dao_members (
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
  user_full_name text,
  user_avatar_url text
);

-- Create DAO proposals table
CREATE TABLE public.dao_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id uuid REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
  proposer_id uuid,
  title text NOT NULL,
  description text NOT NULL,
  full_description text,
  category text NOT NULL DEFAULT 'general',
  voting_type text NOT NULL DEFAULT 'simple_majority',
  status text NOT NULL DEFAULT 'draft',
  start_time timestamptz,
  end_time timestamptz,
  execution_time timestamptz,
  total_votes numeric NOT NULL DEFAULT 0,
  yes_votes numeric NOT NULL DEFAULT 0,
  no_votes numeric NOT NULL DEFAULT 0,
  abstain_votes numeric NOT NULL DEFAULT 0,
  participation_rate numeric NOT NULL DEFAULT 0,
  treasury_impact_amount numeric NOT NULL DEFAULT 0,
  treasury_impact_currency text NOT NULL DEFAULT 'SOL',
  tags text[] DEFAULT '{}',
  external_links jsonb,
  attachments jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz
);

-- Create DAO votes table
CREATE TABLE public.dao_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  vote_choice text NOT NULL CHECK (vote_choice IN ('yes', 'no', 'abstain')),
  voting_power numeric NOT NULL,
  voting_weight numeric NOT NULL,
  reason text,
  transaction_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  voter_email text,
  voter_avatar_url text
);

-- Enable Row Level Security
ALTER TABLE public.dao_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to dao_organizations" ON public.dao_organizations;
DROP POLICY IF EXISTS "Allow public read access to dao_members" ON public.dao_members;
DROP POLICY IF EXISTS "Allow public read access to dao_proposals" ON public.dao_proposals;
DROP POLICY IF EXISTS "Allow public read access to dao_votes" ON public.dao_votes;
DROP POLICY IF EXISTS "Allow public insert access to dao_organizations" ON public.dao_organizations;
DROP POLICY IF EXISTS "Allow public insert access to dao_members" ON public.dao_members;
DROP POLICY IF EXISTS "Allow public insert access to dao_proposals" ON public.dao_proposals;
DROP POLICY IF EXISTS "Allow public insert access to dao_votes" ON public.dao_votes;
DROP POLICY IF EXISTS "Allow public update access to dao_organizations" ON public.dao_organizations;
DROP POLICY IF EXISTS "Allow public update access to dao_members" ON public.dao_members;
DROP POLICY IF EXISTS "Allow public update access to dao_proposals" ON public.dao_proposals;
DROP POLICY IF EXISTS "Allow public update access to dao_votes" ON public.dao_votes;

-- Create policies for public access (for testing)
CREATE POLICY "Allow public read access to dao_organizations" ON public.dao_organizations
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to dao_members" ON public.dao_members
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to dao_proposals" ON public.dao_proposals
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to dao_votes" ON public.dao_votes
  FOR SELECT USING (true);

-- Allow inserts for testing
CREATE POLICY "Allow public insert access to dao_organizations" ON public.dao_organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert access to dao_members" ON public.dao_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert access to dao_proposals" ON public.dao_proposals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert access to dao_votes" ON public.dao_votes
  FOR INSERT WITH CHECK (true);

-- Allow updates for testing
CREATE POLICY "Allow public update access to dao_organizations" ON public.dao_organizations
  FOR UPDATE USING (true);

CREATE POLICY "Allow public update access to dao_members" ON public.dao_members
  FOR UPDATE USING (true);

CREATE POLICY "Allow public update access to dao_proposals" ON public.dao_proposals
  FOR UPDATE USING (true);

CREATE POLICY "Allow public update access to dao_votes" ON public.dao_votes
  FOR UPDATE USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dao_organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dao_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dao_proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dao_votes TO authenticated;

GRANT SELECT ON public.dao_organizations TO anon;
GRANT SELECT ON public.dao_members TO anon;
GRANT SELECT ON public.dao_proposals TO anon;
GRANT SELECT ON public.dao_votes TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dao_organizations_active ON public.dao_organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_dao_members_dao_id ON public.dao_members(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_user_id ON public.dao_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_dao_id ON public.dao_proposals(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status ON public.dao_proposals(status);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_created_at ON public.dao_proposals(created_at);
CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal_id ON public.dao_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_voter_id ON public.dao_votes(voter_id);

-- Success message
SELECT 'DAO tables created successfully! You can now generate test data.' as message;
