-- Direct DAO Tables Creation Script
-- Run this directly in Supabase SQL Editor to create DAO tables

-- Create DAO organizations table
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

-- Create DAO members table
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

-- Create DAO proposals table
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
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create DAO votes table
CREATE TABLE IF NOT EXISTS public.dao_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  choice text NOT NULL,
  voting_power numeric NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dao_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

DROP POLICY IF EXISTS "Users can update their own votes" ON public.dao_votes;
CREATE POLICY "Users can update their own votes" ON public.dao_votes
  FOR UPDATE TO authenticated USING (auth.uid() = voter_id) WITH CHECK (auth.uid() = voter_id);

DROP POLICY IF EXISTS "Users can delete their own votes" ON public.dao_votes;
CREATE POLICY "Users can delete their own votes" ON public.dao_votes
  FOR DELETE TO authenticated USING (auth.uid() = voter_id);

-- Grant permissions
GRANT ALL ON public.dao_organizations TO authenticated;
GRANT ALL ON public.dao_members TO authenticated;
GRANT ALL ON public.dao_proposals TO authenticated;
GRANT ALL ON public.dao_votes TO authenticated;

-- Insert test data
INSERT INTO public.dao_organizations (
  id,
  name,
  description,
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
  'Decentralized governance for the RAC Rewards loyalty platform',
  'RAC',
  9,
  100,
  7,
  24,
  10.0,
  66.67,
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert DAO members
INSERT INTO public.dao_members (
  id,
  dao_id,
  user_id,
  wallet_address,
  role,
  governance_tokens,
  voting_power,
  is_active,
  user_email,
  user_full_name
) VALUES 
(
  '650e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440001',
  'AdminWallet123456789',
  'admin',
  10000,
  10000,
  true,
  'admin@rac.com',
  'DAO Admin'
),
(
  '650e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440002',
  'MemberWallet123456789',
  'member',
  5000,
  5000,
  true,
  'member1@rac.com',
  'DAO Member 1'
),
(
  '650e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440003',
  'MemberWallet987654321',
  'member',
  3000,
  3000,
  true,
  'member2@rac.com',
  'DAO Member 2'
),
(
  '650e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440004',
  'MemberWallet456789123',
  'member',
  2000,
  2000,
  true,
  'member3@rac.com',
  'DAO Member 3'
) ON CONFLICT (id) DO NOTHING;

-- Insert DAO proposals
INSERT INTO public.dao_proposals (
  id,
  dao_id,
  proposer_id,
  title,
  description,
  full_description,
  category,
  voting_type,
  status,
  start_time,
  end_time,
  total_votes,
  yes_votes,
  no_votes,
  abstain_votes,
  participation_rate,
  treasury_impact_amount,
  treasury_impact_currency,
  tags
) VALUES 
(
  '850e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440001',
  'Increase Loyalty Point Rewards by 20%',
  'Proposal to increase the loyalty point multiplier from 1x to 1.2x for all merchants',
  'This proposal aims to increase customer engagement by boosting the loyalty point rewards. The change would affect all merchants on the platform and require updates to the reward calculation system.',
  'governance',
  'simple_majority',
  'active',
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '5 days',
  0,
  0,
  0,
  0,
  0,
  0,
  'SOL',
  ARRAY['governance', 'rewards', 'loyalty']
),
(
  '850e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440002',
  'Add Solana USDC as Payment Option',
  'Enable USDC payments on Solana blockchain for loyalty transactions',
  'This proposal would integrate Solana USDC as a payment method, allowing users to pay for loyalty transactions using USDC.',
  'technical',
  'simple_majority',
  'active',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '6 days',
  0,
  0,
  0,
  0,
  0,
  0,
  'USDC',
  ARRAY['technical', 'payments', 'solana']
),
(
  '850e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440001',
  'Implement Quadratic Voting for Governance',
  'Change voting mechanism from simple majority to quadratic voting',
  'This proposal would implement quadratic voting to reduce the influence of large token holders.',
  'governance',
  'super_majority',
  'passed',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '3 days',
  3,
  2,
  1,
  0,
  75.0,
  0,
  'SOL',
  ARRAY['governance', 'voting', 'democracy']
),
(
  '850e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440003',
  'Increase Platform Fees by 50%',
  'Proposal to increase transaction fees to fund development',
  'This proposal would increase platform fees from 2% to 3% to provide additional funding.',
  'treasury',
  'simple_majority',
  'rejected',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '8 days',
  3,
  1,
  2,
  0,
  75.0,
  0,
  'SOL',
  ARRAY['treasury', 'fees', 'development']
),
(
  '850e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440000',
  '750e8400-e29b-41d4-a716-446655440002',
  'Add NFT Rewards for High-Value Customers',
  'Proposal to create NFT rewards for customers with high loyalty points',
  'This proposal would create a new NFT reward system for customers who accumulate high loyalty points.',
  'rewards',
  'simple_majority',
  'draft',
  NULL,
  NULL,
  0,
  0,
  0,
  0,
  0,
  0,
  'SOL',
  ARRAY['rewards', 'nft', 'loyalty']
) ON CONFLICT (id) DO NOTHING;

-- Insert DAO votes
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
) ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'DAO tables and test data created successfully!' as message;
