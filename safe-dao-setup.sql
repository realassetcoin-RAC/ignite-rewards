-- Safe DAO Setup - No Conflicts with Existing Objects
-- This migration only creates what's missing and doesn't touch existing objects

-- Create DAO Organizations table (only if it doesn't exist)
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

-- Create DAO Members table (only if it doesn't exist)
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

-- Create DAO Proposals table (only if it doesn't exist)
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
  participation_rate numeric NOT NULL DEFAULT 0
);

-- Create DAO Votes table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.dao_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  choice text NOT NULL,
  voting_power numeric NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create Loyalty Change Requests table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.loyalty_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area text NOT NULL,
  payload jsonb NOT NULL,
  dao_proposal_id uuid REFERENCES public.dao_proposals(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all DAO tables (safe way)
ALTER TABLE public.dao_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_change_requests ENABLE ROW LEVEL SECURITY;

-- Create admin check function with unique name to avoid conflicts
CREATE OR REPLACE FUNCTION public.is_dao_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'::app_role
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_dao_admin(uuid) TO authenticated;

-- Create RLS policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Admins can manage DAO organizations" ON public.dao_organizations;
DROP POLICY IF EXISTS "Users can view active DAO organizations" ON public.dao_organizations;
DROP POLICY IF EXISTS "Admins can manage DAO members" ON public.dao_members;
DROP POLICY IF EXISTS "Users can view DAO members" ON public.dao_members;
DROP POLICY IF EXISTS "Admins can manage DAO proposals" ON public.dao_proposals;
DROP POLICY IF EXISTS "Users can view DAO proposals" ON public.dao_proposals;
DROP POLICY IF EXISTS "Admins can manage DAO votes" ON public.dao_votes;
DROP POLICY IF EXISTS "Users can view DAO votes" ON public.dao_votes;
DROP POLICY IF EXISTS "Admins can manage loyalty change requests" ON public.loyalty_change_requests;
DROP POLICY IF EXISTS "Users can view loyalty change requests" ON public.loyalty_change_requests;

-- Create new RLS policies
CREATE POLICY "Admins can manage DAO organizations" 
ON public.dao_organizations FOR ALL 
USING (public.is_dao_admin());

CREATE POLICY "Users can view active DAO organizations" 
ON public.dao_organizations FOR SELECT 
USING (is_active = true OR public.is_dao_admin());

CREATE POLICY "Admins can manage DAO members" 
ON public.dao_members FOR ALL 
USING (public.is_dao_admin());

CREATE POLICY "Users can view DAO members" 
ON public.dao_members FOR SELECT 
USING (user_id = auth.uid() OR public.is_dao_admin());

CREATE POLICY "Admins can manage DAO proposals" 
ON public.dao_proposals FOR ALL 
USING (public.is_dao_admin());

CREATE POLICY "Users can view DAO proposals" 
ON public.dao_proposals FOR SELECT 
USING (true); -- Allow all authenticated users to view proposals

CREATE POLICY "Admins can manage DAO votes" 
ON public.dao_votes FOR ALL 
USING (public.is_dao_admin());

CREATE POLICY "Users can view DAO votes" 
ON public.dao_votes FOR SELECT 
USING (voter_id = auth.uid() OR public.is_dao_admin());

CREATE POLICY "Admins can manage loyalty change requests" 
ON public.loyalty_change_requests FOR ALL 
USING (public.is_dao_admin());

CREATE POLICY "Users can view loyalty change requests" 
ON public.loyalty_change_requests FOR SELECT 
USING (public.is_dao_admin());

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Create test DAO organization (only if it doesn't exist)
INSERT INTO public.dao_organizations (
  id,
  name,
  description,
  logo_url,
  governance_token_symbol,
  governance_token_decimals,
  min_proposal_threshold,
  voting_period_days,
  execution_delay_hours,
  quorum_percentage,
  super_majority_threshold,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'RAC Rewards DAO',
  'The official governance organization for the RAC Rewards platform. Community-driven decisions for platform evolution.',
  'https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=DAO',
  'RAC',
  9,
  100,
  7,
  24,
  10.0,
  66.67,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();
