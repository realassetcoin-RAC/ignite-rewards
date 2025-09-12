-- Update DAO Test Data with Real User IDs
-- This script updates the test data to use actual user IDs from the auth.users table

-- First, let's see what users exist in the system
SELECT 
  id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Update DAO members with real user IDs
-- Replace the placeholder UUIDs with actual user IDs from auth.users

-- Example: If you have a user with email 'admin@rac.com', update like this:
-- UPDATE public.dao_members 
-- SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@rac.com' LIMIT 1)
-- WHERE user_email = 'admin@rac.com';

-- Example: If you have a user with email 'member1@rac.com', update like this:
-- UPDATE public.dao_members 
-- SET user_id = (SELECT id FROM auth.users WHERE email = 'member1@rac.com' LIMIT 1)
-- WHERE user_email = 'member1@rac.com';

-- Update proposals with real user IDs
-- UPDATE public.dao_proposals 
-- SET proposer_id = (SELECT id FROM auth.users WHERE email = 'admin@rac.com' LIMIT 1)
-- WHERE proposer_id = '750e8400-e29b-41d4-a716-446655440001';

-- Update votes with real user IDs
-- UPDATE public.dao_votes 
-- SET voter_id = (SELECT id FROM auth.users WHERE email = 'admin@rac.com' LIMIT 1)
-- WHERE voter_id = '750e8400-e29b-41d4-a716-446655440001';

-- Function to automatically update all test data with real user IDs
CREATE OR REPLACE FUNCTION update_dao_test_data_with_real_users()
RETURNS void AS $$
DECLARE
  admin_user_id uuid;
  member1_user_id uuid;
  member2_user_id uuid;
  member3_user_id uuid;
BEGIN
  -- Get real user IDs (you may need to adjust these email addresses)
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@rac.com' LIMIT 1;
  SELECT id INTO member1_user_id FROM auth.users WHERE email = 'member1@rac.com' LIMIT 1;
  SELECT id INTO member2_user_id FROM auth.users WHERE email = 'member2@rac.com' LIMIT 1;
  SELECT id INTO member3_user_id FROM auth.users WHERE email = 'member3@rac.com' LIMIT 1;
  
  -- If no users found with those emails, use the first available users
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  END IF;
  
  IF member1_user_id IS NULL THEN
    SELECT id INTO member1_user_id FROM auth.users ORDER BY created_at ASC OFFSET 1 LIMIT 1;
  END IF;
  
  IF member2_user_id IS NULL THEN
    SELECT id INTO member2_user_id FROM auth.users ORDER BY created_at ASC OFFSET 2 LIMIT 1;
  END IF;
  
  IF member3_user_id IS NULL THEN
    SELECT id INTO member3_user_id FROM auth.users ORDER BY created_at ASC OFFSET 3 LIMIT 1;
  END IF;
  
  -- Update DAO members
  UPDATE public.dao_members 
  SET user_id = admin_user_id
  WHERE user_email = 'admin@rac.com';
  
  UPDATE public.dao_members 
  SET user_id = member1_user_id
  WHERE user_email = 'member1@rac.com';
  
  UPDATE public.dao_members 
  SET user_id = member2_user_id
  WHERE user_email = 'member2@rac.com';
  
  UPDATE public.dao_members 
  SET user_id = member3_user_id
  WHERE user_email = 'member3@rac.com';
  
  -- Update proposals
  UPDATE public.dao_proposals 
  SET proposer_id = admin_user_id
  WHERE proposer_id = '750e8400-e29b-41d4-a716-446655440001';
  
  UPDATE public.dao_proposals 
  SET proposer_id = member1_user_id
  WHERE proposer_id = '750e8400-e29b-41d4-a716-446655440002';
  
  UPDATE public.dao_proposals 
  SET proposer_id = member2_user_id
  WHERE proposer_id = '750e8400-e29b-41d4-a716-446655440003';
  
  -- Update votes
  UPDATE public.dao_votes 
  SET voter_id = admin_user_id
  WHERE voter_id = '750e8400-e29b-41d4-a716-446655440001';
  
  UPDATE public.dao_votes 
  SET voter_id = member1_user_id
  WHERE voter_id = '750e8400-e29b-41d4-a716-446655440002';
  
  UPDATE public.dao_votes 
  SET voter_id = member2_user_id
  WHERE voter_id = '750e8400-e29b-41d4-a716-446655440003';
  
  RAISE NOTICE 'Updated DAO test data with real user IDs';
  RAISE NOTICE 'Admin user ID: %', admin_user_id;
  RAISE NOTICE 'Member1 user ID: %', member1_user_id;
  RAISE NOTICE 'Member2 user ID: %', member2_user_id;
  RAISE NOTICE 'Member3 user ID: %', member3_user_id;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to update test data
SELECT update_dao_test_data_with_real_users();

-- Display updated test data
SELECT 
  'Updated DAO Members' as info,
  dm.user_email,
  dm.user_id,
  dm.role,
  dm.governance_tokens,
  dm.voting_power
FROM public.dao_members dm
ORDER BY dm.role, dm.governance_tokens DESC;

-- Display active proposals that can be voted on
SELECT 
  'Active Proposals' as info,
  p.id,
  p.title,
  p.status,
  p.start_time,
  p.end_time,
  p.total_votes,
  p.yes_votes,
  p.no_votes,
  p.abstain_votes
FROM public.dao_proposals p
WHERE p.status = 'active'
ORDER BY p.created_at DESC;
