-- Comprehensive DAO Ecosystem for RAC Rewards Platform
-- Based on complete product features and ecosystem analysis

-- =============================================================================
-- 1. DROP AND RECREATE DAO ORGANIZATIONS WITH COMPREHENSIVE COVERAGE
-- =============================================================================

-- Drop existing DAO organizations to ensure clean slate
DROP TABLE IF EXISTS public.dao_members CASCADE;
DROP TABLE IF EXISTS public.dao_proposals CASCADE;
DROP TABLE IF EXISTS public.dao_votes CASCADE;
DROP TABLE IF EXISTS public.dao_organizations CASCADE;

-- Create DAO organizations table
CREATE TABLE public.dao_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  discord_url TEXT,
  twitter_url TEXT,
  github_url TEXT,
  governance_token_address TEXT,
  governance_token_symbol TEXT NOT NULL,
  governance_token_decimals INTEGER NOT NULL DEFAULT 9,
  min_proposal_threshold NUMERIC NOT NULL DEFAULT 0,
  voting_period_days INTEGER NOT NULL DEFAULT 7,
  execution_delay_hours INTEGER NOT NULL DEFAULT 24,
  quorum_percentage NUMERIC NOT NULL DEFAULT 10.0,
  super_majority_threshold NUMERIC NOT NULL DEFAULT 66.67,
  treasury_address TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create DAO members table
CREATE TABLE public.dao_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id UUID REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_address TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  governance_tokens NUMERIC NOT NULL DEFAULT 0,
  voting_power NUMERIC NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  user_email TEXT,
  user_full_name TEXT,
  user_avatar_url TEXT,
  UNIQUE(dao_id, user_id)
);

-- Create DAO proposals table
CREATE TABLE public.dao_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id UUID REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
  proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  full_description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('governance', 'treasury', 'technical', 'community', 'partnership', 'marketing', 'rewards', 'nft', 'investment', 'security', 'compliance', 'integration', 'general')),
  voting_type TEXT NOT NULL DEFAULT 'simple_majority' CHECK (voting_type IN ('simple_majority', 'super_majority', 'unanimous', 'weighted', 'quadratic')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'executed', 'expired')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  execution_time TIMESTAMPTZ,
  total_votes INTEGER NOT NULL DEFAULT 0,
  yes_votes INTEGER NOT NULL DEFAULT 0,
  no_votes INTEGER NOT NULL DEFAULT 0,
  abstain_votes INTEGER NOT NULL DEFAULT 0,
  participation_rate NUMERIC NOT NULL DEFAULT 0,
  treasury_impact_amount NUMERIC NOT NULL DEFAULT 0,
  treasury_impact_currency TEXT NOT NULL DEFAULT 'SOL',
  tags TEXT[] DEFAULT '{}',
  external_links JSONB,
  attachments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- Create DAO votes table
CREATE TABLE public.dao_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  choice TEXT NOT NULL CHECK (choice IN ('yes', 'no', 'abstain')),
  voting_power NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(proposal_id, voter_id)
);

-- =============================================================================
-- 2. COMPREHENSIVE DAO ORGANIZATIONS FOR COMPLETE ECOSYSTEM
-- =============================================================================

-- Insert comprehensive DAO organizations covering all aspects of the platform
INSERT INTO public.dao_organizations (
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
) VALUES 

-- =============================================================================
-- CORE PLATFORM GOVERNANCE
-- =============================================================================

-- 1. Main Platform Governance DAO
(
  'RAC Platform DAO',
  'Primary governance body for RAC Rewards platform decisions including protocol upgrades, fee structures, major feature implementations, and platform-wide policy changes',
  'RAC',
  9,
  10000,
  7,
  24,
  15.0,
  66.67,
  true
),

-- 2. Treasury Management DAO
(
  'RAC Treasury DAO',
  'Manages platform treasury, revenue distribution, financial decisions including token buybacks, staking rewards, investment allocations, and multi-sig wallet management',
  'RAC-TREASURY',
  9,
  5000,
  5,
  48,
  20.0,
  75.0,
  true
),

-- 3. Technical Development DAO
(
  'RAC Tech DAO',
  'Oversees technical development, smart contract upgrades, security audits, integration decisions, API changes, and infrastructure improvements for the RAC ecosystem',
  'RAC-TECH',
  9,
  3000,
  3,
  12,
  10.0,
  60.0,
  true
),

-- =============================================================================
-- USER EXPERIENCE & COMMUNITY
-- =============================================================================

-- 4. Community & Marketing DAO
(
  'RAC Community DAO',
  'Manages community initiatives, marketing campaigns, partnerships, user engagement programs, social media strategy, and brand development',
  'RAC-COMMUNITY',
  9,
  2000,
  5,
  24,
  10.0,
  50.0,
  true
),

-- 5. User Experience DAO
(
  'RAC UX DAO',
  'Governs user interface design, user experience improvements, accessibility features, mobile app development, and user feedback implementation',
  'RAC-UX',
  9,
  1500,
  3,
  12,
  8.0,
  50.0,
  true
),

-- 6. Customer Support DAO
(
  'RAC Support DAO',
  'Manages customer support policies, help desk operations, user education programs, documentation standards, and support quality metrics',
  'RAC-SUPPORT',
  9,
  1000,
  3,
  12,
  5.0,
  50.0,
  true
),

-- =============================================================================
-- BUSINESS & PARTNERSHIPS
-- =============================================================================

-- 7. Merchant Relations DAO
(
  'RAC Merchant DAO',
  'Governs merchant onboarding, subscription plans, fee structures, merchant-specific platform features, and merchant support programs',
  'RAC-MERCHANT',
  9,
  1000,
  3,
  12,
  5.0,
  50.0,
  true
),

-- 8. Partnership & Integration DAO
(
  'RAC Partnership DAO',
  'Manages strategic partnerships, third-party integrations, API partnerships, white-label solutions, and business development initiatives',
  'RAC-PARTNERSHIP',
  9,
  2500,
  7,
  48,
  15.0,
  60.0,
  true
),

-- 9. Business Development DAO
(
  'RAC Business DAO',
  'Oversees business model evolution, revenue optimization, market expansion, competitive analysis, and strategic business decisions',
  'RAC-BUSINESS',
  9,
  3000,
  5,
  24,
  12.0,
  60.0,
  true
),

-- =============================================================================
-- NFT & LOYALTY SYSTEM
-- =============================================================================

-- 10. NFT & Loyalty DAO
(
  'RAC NFT DAO',
  'Manages NFT collections, loyalty programs, card tiers, Web3 integration features, NFT marketplace policies, and loyalty economics',
  'RAC-NFT',
  9,
  1500,
  5,
  24,
  10.0,
  60.0,
  true
),

-- 11. Referral & Rewards DAO
(
  'RAC Rewards DAO',
  'Oversees referral programs, reward distributions, point economics, gamification features, reward calculations, and incentive structures',
  'RAC-REWARDS',
  9,
  1000,
  3,
  12,
  5.0,
  50.0,
  true
),

-- 12. Loyalty Economics DAO
(
  'RAC Economics DAO',
  'Governs loyalty point economics, reward multipliers, earning ratios, spending bonuses, and economic model adjustments',
  'RAC-ECONOMICS',
  9,
  2000,
  5,
  24,
  12.0,
  60.0,
  true
),

-- =============================================================================
-- INVESTMENT & FINANCIAL
-- =============================================================================

-- 13. Investment Marketplace DAO
(
  'RAC Investment DAO',
  'Governs investment marketplace, listing criteria, platform fees, investment opportunities, asset initiative management, and investment policies',
  'RAC-INVESTMENT',
  9,
  2000,
  7,
  48,
  15.0,
  66.67,
  true
),

-- 14. Asset Initiative DAO
(
  'RAC Asset DAO',
  'Manages asset initiatives, environmental projects, social impact investments, governance initiatives, and impact measurement standards',
  'RAC-ASSET',
  9,
  1500,
  5,
  24,
  10.0,
  60.0,
  true
),

-- 15. DeFi Integration DAO
(
  'RAC DeFi DAO',
  'Oversees DeFi integrations, DEX partnerships, liquidity management, yield farming strategies, and decentralized finance protocols',
  'RAC-DEFI',
  9,
  2500,
  5,
  24,
  15.0,
  60.0,
  true
),

-- =============================================================================
-- SECURITY & COMPLIANCE
-- =============================================================================

-- 16. Security & Compliance DAO
(
  'RAC Security DAO',
  'Manages security protocols, compliance requirements, audit processes, risk management policies, and security incident response',
  'RAC-SECURITY',
  9,
  5000,
  3,
  24,
  25.0,
  80.0,
  true
),

-- 17. Privacy & Data DAO
(
  'RAC Privacy DAO',
  'Governs data privacy policies, GDPR compliance, user data management, privacy settings, and data protection measures',
  'RAC-PRIVACY',
  9,
  2000,
  3,
  12,
  15.0,
  70.0,
  true
),

-- 18. Legal & Regulatory DAO
(
  'RAC Legal DAO',
  'Oversees legal compliance, regulatory requirements, terms of service updates, legal partnerships, and regulatory reporting',
  'RAC-LEGAL',
  9,
  3000,
  7,
  72,
  20.0,
  75.0,
  true
),

-- =============================================================================
-- TECHNOLOGY & INFRASTRUCTURE
-- =============================================================================

-- 19. Blockchain & Web3 DAO
(
  'RAC Blockchain DAO',
  'Manages blockchain integrations, Web3 protocols, smart contract deployments, cross-chain bridges, and blockchain infrastructure',
  'RAC-BLOCKCHAIN',
  9,
  3000,
  5,
  24,
  15.0,
  60.0,
  true
),

-- 20. API & Integration DAO
(
  'RAC API DAO',
  'Governs API development, third-party integrations, webhook management, API rate limiting, and integration standards',
  'RAC-API',
  9,
  2000,
  3,
  12,
  10.0,
  50.0,
  true
),

-- 21. Infrastructure & DevOps DAO
(
  'RAC Infrastructure DAO',
  'Oversees server infrastructure, deployment processes, monitoring systems, backup strategies, and operational excellence',
  'RAC-INFRA',
  9,
  2500,
  3,
  12,
  12.0,
  60.0,
  true
),

-- =============================================================================
-- ECOSYSTEM & GROWTH
-- =============================================================================

-- 22. Ecosystem Development DAO
(
  'RAC Ecosystem DAO',
  'Drives ecosystem growth, strategic partnerships, integrations, expansion into new markets, and ecosystem sustainability',
  'RAC-ECOSYSTEM',
  9,
  3000,
  7,
  72,
  20.0,
  70.0,
  true
),

-- 23. Research & Development DAO
(
  'RAC R&D DAO',
  'Manages research initiatives, innovation projects, experimental features, technology exploration, and future roadmap development',
  'RAC-RESEARCH',
  9,
  2000,
  7,
  48,
  15.0,
  60.0,
  true
),

-- 24. Education & Training DAO
(
  'RAC Education DAO',
  'Oversees user education programs, documentation development, training materials, webinars, and knowledge sharing initiatives',
  'RAC-EDUCATION',
  9,
  1000,
  5,
  24,
  8.0,
  50.0,
  true
),

-- =============================================================================
-- SPECIALIZED DOMAINS
-- =============================================================================

-- 25. Environmental Impact DAO
(
  'RAC Environment DAO',
  'Manages environmental impact initiatives, carbon offset programs, green technology investments, and sustainability metrics',
  'RAC-ENVIRONMENT',
  9,
  1500,
  5,
  24,
  10.0,
  60.0,
  true
),

-- 26. Social Impact DAO
(
  'RAC Social DAO',
  'Oversees social impact projects, community development initiatives, social responsibility programs, and social metrics tracking',
  'RAC-SOCIAL',
  9,
  1500,
  5,
  24,
  10.0,
  60.0,
  true
),

-- 27. Governance Innovation DAO
(
  'RAC Governance DAO',
  'Manages governance innovation, voting mechanisms, proposal systems, governance token economics, and democratic processes',
  'RAC-GOVERNANCE',
  9,
  2000,
  7,
  48,
  15.0,
  60.0,
  true
);

-- =============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.dao_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. CREATE RLS POLICIES
-- =============================================================================

-- DAO Organizations policies
DROP POLICY IF EXISTS "Anyone can view active DAO organizations" ON public.dao_organizations;
DROP POLICY IF EXISTS "Admins can manage DAO organizations" ON public.dao_organizations;

CREATE POLICY "Anyone can view active DAO organizations" 
ON public.dao_organizations FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage DAO organizations" 
ON public.dao_organizations FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- DAO Members policies
DROP POLICY IF EXISTS "Anyone can view DAO members" ON public.dao_members;
DROP POLICY IF EXISTS "Members can view own membership" ON public.dao_members;
DROP POLICY IF EXISTS "Admins can manage DAO members" ON public.dao_members;

CREATE POLICY "Anyone can view DAO members" 
ON public.dao_members FOR SELECT 
USING (true);

CREATE POLICY "Members can view own membership" 
ON public.dao_members FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage DAO members" 
ON public.dao_members FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- DAO Proposals policies
DROP POLICY IF EXISTS "Anyone can view DAO proposals" ON public.dao_proposals;
DROP POLICY IF EXISTS "Members can create proposals" ON public.dao_proposals;
DROP POLICY IF EXISTS "Proposers can edit their proposals" ON public.dao_proposals;
DROP POLICY IF EXISTS "Admins can manage all proposals" ON public.dao_proposals;

CREATE POLICY "Anyone can view DAO proposals" 
ON public.dao_proposals FOR SELECT 
USING (true);

CREATE POLICY "Members can create proposals" 
ON public.dao_proposals FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dao_members 
    WHERE dao_id = dao_proposals.dao_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Proposers can edit their proposals" 
ON public.dao_proposals FOR UPDATE 
USING (proposer_id = auth.uid() AND status = 'draft');

CREATE POLICY "Admins can manage all proposals" 
ON public.dao_proposals FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- DAO Votes policies
DROP POLICY IF EXISTS "Anyone can view DAO votes" ON public.dao_votes;
DROP POLICY IF EXISTS "Members can cast votes" ON public.dao_votes;
DROP POLICY IF EXISTS "Admins can manage DAO votes" ON public.dao_votes;

CREATE POLICY "Anyone can view DAO votes" 
ON public.dao_votes FOR SELECT 
USING (true);

CREATE POLICY "Members can cast votes" 
ON public.dao_votes FOR INSERT 
WITH CHECK (
  auth.uid() = voter_id AND
  EXISTS (
    SELECT 1 FROM public.dao_members dm
    JOIN public.dao_proposals dp ON dm.dao_id = dp.dao_id
    WHERE dp.id = proposal_id 
    AND dm.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage DAO votes" 
ON public.dao_votes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- 5. ADD INITIAL DAO MEMBERS
-- =============================================================================

-- Add admin users as members of all DAOs
INSERT INTO public.dao_members (
  dao_id,
  user_id,
  role,
  governance_tokens,
  voting_power,
  is_active
)
SELECT 
  dao.id as dao_id,
  p.id as user_id,
  'admin' as role,
  1000000 as governance_tokens,
  1000000 as voting_power,
  true as is_active
FROM public.dao_organizations dao
CROSS JOIN public.profiles p
WHERE p.role = 'admin'
ON CONFLICT (dao_id, user_id) DO NOTHING;

-- =============================================================================
-- 6. CREATE INDEXES
-- =============================================================================

-- DAO Organizations indexes
CREATE INDEX IF NOT EXISTS idx_dao_organizations_active ON public.dao_organizations (is_active);
CREATE INDEX IF NOT EXISTS idx_dao_organizations_created_by ON public.dao_organizations (created_by);

-- DAO Members indexes
CREATE INDEX IF NOT EXISTS idx_dao_members_dao_id ON public.dao_members (dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_user_id ON public.dao_members (user_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_active ON public.dao_members (is_active);
CREATE INDEX IF NOT EXISTS idx_dao_members_role ON public.dao_members (role);

-- DAO Proposals indexes
CREATE INDEX IF NOT EXISTS idx_dao_proposals_dao_id ON public.dao_proposals (dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_proposer_id ON public.dao_proposals (proposer_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status ON public.dao_proposals (status);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_category ON public.dao_proposals (category);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_created_at ON public.dao_proposals (created_at);

-- DAO Votes indexes
CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal_id ON public.dao_votes (proposal_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_voter_id ON public.dao_votes (voter_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_choice ON public.dao_votes (choice);

-- =============================================================================
-- 7. VERIFY SETUP
-- =============================================================================

-- Show DAO organizations created
SELECT 
  name,
  description,
  governance_token_symbol,
  min_proposal_threshold,
  voting_period_days,
  quorum_percentage
FROM public.dao_organizations
ORDER BY name;

-- Show count of DAOs by category
SELECT 
  CASE 
    WHEN name LIKE '%Platform%' OR name LIKE '%Treasury%' OR name LIKE '%Tech%' THEN 'Core Platform'
    WHEN name LIKE '%Community%' OR name LIKE '%UX%' OR name LIKE '%Support%' THEN 'User Experience'
    WHEN name LIKE '%Merchant%' OR name LIKE '%Partnership%' OR name LIKE '%Business%' THEN 'Business & Partnerships'
    WHEN name LIKE '%NFT%' OR name LIKE '%Rewards%' OR name LIKE '%Economics%' THEN 'NFT & Loyalty'
    WHEN name LIKE '%Investment%' OR name LIKE '%Asset%' OR name LIKE '%DeFi%' THEN 'Investment & Financial'
    WHEN name LIKE '%Security%' OR name LIKE '%Privacy%' OR name LIKE '%Legal%' THEN 'Security & Compliance'
    WHEN name LIKE '%Blockchain%' OR name LIKE '%API%' OR name LIKE '%Infrastructure%' THEN 'Technology & Infrastructure'
    WHEN name LIKE '%Ecosystem%' OR name LIKE '%Research%' OR name LIKE '%Education%' THEN 'Ecosystem & Growth'
    WHEN name LIKE '%Environment%' OR name LIKE '%Social%' OR name LIKE '%Governance%' THEN 'Specialized Domains'
    ELSE 'Other'
  END as category,
  COUNT(*) as dao_count
FROM public.dao_organizations
GROUP BY category
ORDER BY dao_count DESC;

