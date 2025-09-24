-- ===========================================
-- INSERT SAMPLE DAO DATA
-- ===========================================
-- This script inserts sample data for DAO organizations
-- Run this AFTER the dao-tables-only.sql script

-- Insert DAO organizations
INSERT INTO public.dao_organizations (
    name, description, logo_url, website_url, discord_url, twitter_url, github_url,
    governance_token_address, governance_token_symbol, governance_token_decimals, min_proposal_threshold,
    voting_period_days, execution_delay_hours, quorum_percentage, super_majority_threshold,
    treasury_address, is_active
) VALUES
(
    'RAC Rewards DAO',
    'The official DAO for RAC Rewards platform governance',
    'https://example.com/rac-dao-logo.png',
    'https://openrac.io/dao',
    'https://x.com/RealAssetCoin',
    'https://t.me/RealAssetCoin',
    'https://github.com/rac-rewards',
    'RACTokenAddress123456789',
    'RAC',
    9,
    1000,
    7,
    24,
    10.0,
    66.67,
    'TreasuryWallet123456789',
    true
),
(
    'Community DAO',
    'Community-driven governance for platform decisions',
    'https://example.com/community-dao-logo.png',
    'https://community.rac-rewards.com',
    'https://discord.gg/rac-community',
    'https://twitter.com/rac_community',
    'https://github.com/rac-community',
    'COMMTokenAddress123456789',
    'COMM',
    9,
    500,
    5,
    12,
    15.0,
    60.0,
    'CommunityTreasury123456789',
    true
)
ON CONFLICT DO NOTHING;

-- Insert sample DAO proposals (using placeholder user ID)
INSERT INTO public.dao_proposals (
    dao_id, proposer_id, title, description, category, voting_type, status,
    start_time, end_time, total_votes, yes_votes, no_votes, abstain_votes
) VALUES
(
    (SELECT id FROM public.dao_organizations WHERE name = 'RAC Rewards DAO' LIMIT 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Increase NFT Rewards Rate',
    'Proposal to increase the rewards rate for NFT holders from 1% to 1.5%',
    'rewards',
    'simple_majority',
    'active',
    NOW(),
    NOW() + INTERVAL '7 days',
    0, 0, 0, 0
),
(
    (SELECT id FROM public.dao_organizations WHERE name = 'Community DAO' LIMIT 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Community Treasury Allocation',
    'Allocate 10,000 SOL from community treasury for marketing initiatives',
    'treasury',
    'super_majority',
    'draft',
    NULL,
    NULL,
    0, 0, 0, 0
)
ON CONFLICT DO NOTHING;

SELECT '✅ DAO SAMPLE DATA INSERTED!' as message;
