-- DAO Test Data Setup
-- This script adds comprehensive test data for the DAO system

-- First, ensure we have a DAO organization
INSERT INTO dao_organizations (
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

-- Add test members (assuming we have some users in the system)
-- Note: These will reference actual user IDs from auth.users
INSERT INTO dao_members (
  id,
  dao_id,
  user_id,
  wallet_address,
  role,
  governance_tokens,
  voting_power,
  joined_at,
  last_active_at,
  is_active,
  user_email,
  user_full_name
) VALUES 
-- Admin member
(
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM auth.users LIMIT 1), -- Get first user as admin
  'Admin123...',
  'admin',
  10000,
  10.0,
  now() - interval '30 days',
  now(),
  true,
  'admin@rac-rewards.com',
  'DAO Admin'
),
-- Regular members
(
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 1), -- Get second user
  'Member456...',
  'member',
  5000,
  5.0,
  now() - interval '20 days',
  now() - interval '1 day',
  true,
  'member1@rac-rewards.com',
  'Active Member'
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 2), -- Get third user
  'Member789...',
  'member',
  3000,
  3.0,
  now() - interval '15 days',
  now() - interval '2 days',
  true,
  'member2@rac-rewards.com',
  'Community Member'
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 3), -- Get fourth user
  'Member012...',
  'member',
  2000,
  2.0,
  now() - interval '10 days',
  now() - interval '3 days',
  true,
  'member3@rac-rewards.com',
  'New Member'
)
ON CONFLICT (id) DO UPDATE SET
  governance_tokens = EXCLUDED.governance_tokens,
  voting_power = EXCLUDED.voting_power,
  last_active_at = now();

-- Add test proposals
INSERT INTO dao_proposals (
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
  participation_rate
) VALUES 
-- Active proposal
(
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM auth.users LIMIT 1),
  'Increase Reward Multiplier for Premium Members',
  'Proposal to increase the reward multiplier for premium loyalty card holders from 2x to 3x.',
  'This proposal aims to enhance the value proposition for premium members by increasing their reward multiplier from 2x to 3x. This change would apply to all premium loyalty card holders and would take effect 30 days after approval. The change is expected to increase user engagement and retention while maintaining platform sustainability.',
  'governance',
  'simple_majority',
  'active',
  now() - interval '2 days',
  now() + interval '5 days',
  3,
  2,
  1,
  0,
  75.0
),
-- Passed proposal
(
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 1),
  'Add New Merchant Category: Eco-Friendly Businesses',
  'Proposal to create a new merchant category for eco-friendly businesses with special rewards.',
  'This proposal introduces a new merchant category specifically for eco-friendly businesses. Merchants in this category would receive enhanced visibility and customers would earn bonus rewards when shopping at these establishments. This aligns with our commitment to sustainability and environmental responsibility.',
  'governance',
  'simple_majority',
  'passed',
  now() - interval '10 days',
  now() - interval '3 days',
  4,
  3,
  1,
  0,
  100.0
),
-- Rejected proposal
(
  '550e8400-e29b-41d4-a716-446655440012',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 2),
  'Reduce Vesting Period to 15 Days',
  'Proposal to reduce the reward vesting period from 30 days to 15 days.',
  'This proposal suggests reducing the reward vesting period from 30 days to 15 days to make rewards more immediately accessible to users. However, this change could impact the platform''s tokenomics and long-term sustainability.',
  'governance',
  'super_majority',
  'rejected',
  now() - interval '15 days',
  now() - interval '8 days',
  4,
  1,
  3,
  0,
  100.0
),
-- Draft proposal
(
  '550e8400-e29b-41d4-a716-446655440013',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 3),
  'Implement NFT Marketplace Integration',
  'Proposal to integrate with major NFT marketplaces for loyalty card trading.',
  'This proposal outlines the integration with major NFT marketplaces to allow users to trade their loyalty cards. This would create a secondary market for loyalty cards and increase their utility and value.',
  'governance',
  'simple_majority',
  'draft',
  null,
  null,
  0,
  0,
  0,
  0,
  0.0
),
-- Upcoming proposal
(
  '550e8400-e29b-41d4-a716-446655440014',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM auth.users LIMIT 1),
  'Launch Mobile App Beta Program',
  'Proposal to launch a beta program for the RAC Rewards mobile application.',
  'This proposal introduces a beta program for the upcoming RAC Rewards mobile application. Selected community members would have early access to test features and provide feedback before the public release.',
  'governance',
  'simple_majority',
  'upcoming',
  now() + interval '1 day',
  now() + interval '8 days',
  0,
  0,
  0,
  0,
  0.0
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  total_votes = EXCLUDED.total_votes,
  yes_votes = EXCLUDED.yes_votes,
  no_votes = EXCLUDED.no_votes,
  abstain_votes = EXCLUDED.abstain_votes,
  participation_rate = EXCLUDED.participation_rate;

-- Add test votes for the active proposal
INSERT INTO dao_votes (
  id,
  proposal_id,
  voter_id,
  choice,
  voting_power,
  reason,
  created_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440010',
  (SELECT id FROM auth.users LIMIT 1),
  'yes',
  10.0,
  'This will increase user engagement and retention.',
  now() - interval '1 day'
),
(
  '550e8400-e29b-41d4-a716-446655440021',
  '550e8400-e29b-41d4-a716-446655440010',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 1),
  'yes',
  5.0,
  'Premium members deserve better rewards.',
  now() - interval '12 hours'
),
(
  '550e8400-e29b-41d4-a716-446655440022',
  '550e8400-e29b-41d4-a716-446655440010',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 2),
  'no',
  3.0,
  'This might impact platform sustainability.',
  now() - interval '6 hours'
)
ON CONFLICT (id) DO NOTHING;

-- Add test votes for the passed proposal
INSERT INTO dao_votes (
  id,
  proposal_id,
  voter_id,
  choice,
  voting_power,
  reason,
  created_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440023',
  '550e8400-e29b-41d4-a716-446655440011',
  (SELECT id FROM auth.users LIMIT 1),
  'yes',
  10.0,
  'Great for sustainability and community values.',
  now() - interval '8 days'
),
(
  '550e8400-e29b-41d4-a716-446655440024',
  '550e8400-e29b-41d4-a716-446655440011',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 1),
  'yes',
  5.0,
  'Supports eco-friendly businesses.',
  now() - interval '7 days'
),
(
  '550e8400-e29b-41d4-a716-446655440025',
  '550e8400-e29b-41d4-a716-446655440011',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 2),
  'yes',
  3.0,
  'Good for the environment.',
  now() - interval '6 days'
),
(
  '550e8400-e29b-41d4-a716-446655440026',
  '550e8400-e29b-41d4-a716-446655440011',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 3),
  'no',
  2.0,
  'Might be too complex to implement.',
  now() - interval '5 days'
)
ON CONFLICT (id) DO NOTHING;

-- Add test votes for the rejected proposal
INSERT INTO dao_votes (
  id,
  proposal_id,
  voter_id,
  choice,
  voting_power,
  reason,
  created_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440027',
  '550e8400-e29b-41d4-a716-446655440012',
  (SELECT id FROM auth.users LIMIT 1),
  'no',
  10.0,
  'Could impact platform sustainability.',
  now() - interval '12 days'
),
(
  '550e8400-e29b-41d4-a716-446655440028',
  '550e8400-e29b-41d4-a716-446655440012',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 1),
  'no',
  5.0,
  '30 days is a good balance.',
  now() - interval '11 days'
),
(
  '550e8400-e29b-41d4-a716-446655440029',
  '550e8400-e29b-41d4-a716-446655440012',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 2),
  'no',
  3.0,
  'Might encourage gaming of the system.',
  now() - interval '10 days'
),
(
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440012',
  (SELECT id FROM auth.users LIMIT 1 OFFSET 3),
  'yes',
  2.0,
  'Faster access to rewards would be nice.',
  now() - interval '9 days'
)
ON CONFLICT (id) DO NOTHING;

-- Update the proposals with correct vote counts
UPDATE dao_proposals 
SET 
  total_votes = (
    SELECT COUNT(*) 
    FROM dao_votes 
    WHERE proposal_id = dao_proposals.id
  ),
  yes_votes = (
    SELECT COUNT(*) 
    FROM dao_votes 
    WHERE proposal_id = dao_proposals.id AND choice = 'yes'
  ),
  no_votes = (
    SELECT COUNT(*) 
    FROM dao_votes 
    WHERE proposal_id = dao_proposals.id AND choice = 'no'
  ),
  abstain_votes = (
    SELECT COUNT(*) 
    FROM dao_votes 
    WHERE proposal_id = dao_proposals.id AND choice = 'abstain'
  ),
  participation_rate = (
    CASE 
      WHEN (
        SELECT COUNT(*) 
        FROM dao_members 
        WHERE dao_id = dao_proposals.dao_id AND is_active = true
      ) > 0 THEN
        (
          SELECT COUNT(*) 
          FROM dao_votes 
          WHERE proposal_id = dao_proposals.id
        ) * 100.0 / (
          SELECT COUNT(*) 
          FROM dao_members 
          WHERE dao_id = dao_proposals.dao_id AND is_active = true
        )
      ELSE 0
    END
  )
WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440012'
);

-- Add some loyalty change requests
INSERT INTO loyalty_change_requests (
  id,
  area,
  payload,
  dao_proposal_id,
  status,
  created_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440040',
  'reward_multiplier',
  '{"multiplier": 3, "card_type": "premium", "effective_date": "2024-02-01"}',
  '550e8400-e29b-41d4-a716-446655440010',
  'pending',
  now() - interval '2 days'
),
(
  '550e8400-e29b-41d4-a716-446655440041',
  'merchant_categories',
  '{"new_category": "eco_friendly", "bonus_multiplier": 1.5, "requirements": ["sustainability_certification"]}',
  '550e8400-e29b-41d4-a716-446655440011',
  'approved',
  now() - interval '10 days'
);

-- Create a function to get user's voting power for a proposal
CREATE OR REPLACE FUNCTION get_user_voting_power(user_id_param UUID, proposal_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
  voting_power NUMERIC;
BEGIN
  SELECT COALESCE(dm.voting_power, 0)
  INTO voting_power
  FROM dao_members dm
  JOIN dao_proposals dp ON dm.dao_id = dp.dao_id
  WHERE dm.user_id = user_id_param 
    AND dp.id = proposal_id_param
    AND dm.is_active = true;
  
  RETURN COALESCE(voting_power, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user has already voted
CREATE OR REPLACE FUNCTION has_user_voted(user_id_param UUID, proposal_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  vote_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO vote_count
  FROM dao_votes
  WHERE voter_id = user_id_param 
    AND proposal_id = proposal_id_param;
  
  RETURN vote_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to cast a vote
CREATE OR REPLACE FUNCTION cast_vote(
  user_id_param UUID,
  proposal_id_param UUID,
  choice_param TEXT,
  reason_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_voting_power NUMERIC;
  proposal_status TEXT;
  proposal_end_time TIMESTAMPTZ;
BEGIN
  -- Check if proposal exists and is active
  SELECT status, end_time
  INTO proposal_status, proposal_end_time
  FROM dao_proposals
  WHERE id = proposal_id_param;
  
  IF proposal_status IS NULL THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;
  
  IF proposal_status != 'active' THEN
    RAISE EXCEPTION 'Proposal is not active for voting';
  END IF;
  
  IF proposal_end_time < NOW() THEN
    RAISE EXCEPTION 'Voting period has ended';
  END IF;
  
  -- Check if user has already voted
  IF has_user_voted(user_id_param, proposal_id_param) THEN
    RAISE EXCEPTION 'User has already voted on this proposal';
  END IF;
  
  -- Get user's voting power
  user_voting_power := get_user_voting_power(user_id_param, proposal_id_param);
  
  IF user_voting_power <= 0 THEN
    RAISE EXCEPTION 'User has no voting power for this proposal';
  END IF;
  
  -- Insert the vote
  INSERT INTO dao_votes (proposal_id, voter_id, choice, voting_power, reason)
  VALUES (proposal_id_param, user_id_param, choice_param, user_voting_power, reason_param);
  
  -- Update proposal vote counts
  UPDATE dao_proposals
  SET 
    total_votes = total_votes + 1,
    yes_votes = CASE WHEN choice_param = 'yes' THEN yes_votes + 1 ELSE yes_votes END,
    no_votes = CASE WHEN choice_param = 'no' THEN no_votes + 1 ELSE no_votes END,
    abstain_votes = CASE WHEN choice_param = 'abstain' THEN abstain_votes + 1 ELSE abstain_votes END,
    participation_rate = (
      SELECT COUNT(*) * 100.0 / (
        SELECT COUNT(*) 
        FROM dao_members 
        WHERE dao_id = dao_proposals.dao_id AND is_active = true
      )
      FROM dao_votes 
      WHERE proposal_id = proposal_id_param
    )
  WHERE id = proposal_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_voting_power(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_user_voted(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cast_vote(UUID, UUID, TEXT, TEXT) TO authenticated;

-- Add RLS policies for the new functions
-- Note: These functions are SECURITY DEFINER so they run with elevated privileges
-- but they include proper checks for user permissions

COMMENT ON FUNCTION get_user_voting_power(UUID, UUID) IS 'Returns the voting power of a user for a specific proposal';
COMMENT ON FUNCTION has_user_voted(UUID, UUID) IS 'Checks if a user has already voted on a proposal';
COMMENT ON FUNCTION cast_vote(UUID, UUID, TEXT, TEXT) IS 'Casts a vote on a proposal with proper validation';

-- Final verification query
SELECT 
  'DAO Organization' as entity,
  COUNT(*) as count
FROM dao_organizations
WHERE is_active = true

UNION ALL

SELECT 
  'DAO Members' as entity,
  COUNT(*) as count
FROM dao_members
WHERE is_active = true

UNION ALL

SELECT 
  'DAO Proposals' as entity,
  COUNT(*) as count
FROM dao_proposals

UNION ALL

SELECT 
  'DAO Votes' as entity,
  COUNT(*) as count
FROM dao_votes

UNION ALL

SELECT 
  'Loyalty Change Requests' as entity,
  COUNT(*) as count
FROM loyalty_change_requests;
