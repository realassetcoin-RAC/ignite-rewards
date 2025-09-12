-- Create RPC Functions for Automated Test Data Generation
-- This migration creates all necessary RPC functions for automated test data setup

-- Function to create DAO tables if they don't exist
CREATE OR REPLACE FUNCTION create_dao_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

  RAISE NOTICE 'DAO tables created successfully';
END;
$$;

-- Function to clear all test data
CREATE OR REPLACE FUNCTION clear_all_test_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clear in order due to foreign key constraints
  DELETE FROM public.dao_votes;
  DELETE FROM public.dao_proposals;
  DELETE FROM public.dao_members;
  DELETE FROM public.dao_organizations;
  
  -- Clear other test data tables if they exist
  DELETE FROM public.loyalty_transactions WHERE id::text LIKE 'test_%';
  DELETE FROM public.merchants WHERE id::text LIKE 'test_%';
  DELETE FROM public.marketplace_listings WHERE id::text LIKE 'test_%';
  
  RAISE NOTICE 'All test data cleared successfully';
END;
$$;

-- Function to create comprehensive DAO test data
CREATE OR REPLACE FUNCTION create_dao_test_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  dao_org_id uuid;
  member1_id uuid;
  member2_id uuid;
  member3_id uuid;
  member4_id uuid;
  proposal1_id uuid;
  proposal2_id uuid;
  proposal3_id uuid;
  proposal4_id uuid;
  proposal5_id uuid;
BEGIN
  -- Clear existing test data
  PERFORM clear_all_test_data();
  
  -- Create DAO organization
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
  ) RETURNING id INTO dao_org_id;

  -- Create DAO members
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
    dao_org_id,
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
    dao_org_id,
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
    dao_org_id,
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
    dao_org_id,
    '750e8400-e29b-41d4-a716-446655440004',
    'MemberWallet456789123',
    'member',
    2000,
    2000,
    true,
    'member3@rac.com',
    'DAO Member 3'
  ) RETURNING id INTO member1_id, member2_id, member3_id, member4_id;

  -- Create DAO proposals
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
    dao_org_id,
    '750e8400-e29b-41d4-a716-446655440001',
    'Increase Loyalty Point Rewards by 20%',
    'Proposal to increase the loyalty point multiplier from 1x to 1.2x for all merchants',
    'This proposal aims to increase customer engagement by boosting the loyalty point rewards. The change would affect all merchants on the platform and require updates to the reward calculation system. This would incentivize more customer participation and increase overall platform usage.',
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
    dao_org_id,
    '750e8400-e29b-41d4-a716-446655440002',
    'Add Solana USDC as Payment Option',
    'Enable USDC payments on Solana blockchain for loyalty transactions',
    'This proposal would integrate Solana USDC as a payment method, allowing users to pay for loyalty transactions using USDC. This would require integration with Solana wallet providers and USDC token handling. The integration would make the platform more accessible to users who prefer stablecoin payments.',
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
    dao_org_id,
    '750e8400-e29b-41d4-a716-446655440001',
    'Implement Quadratic Voting for Governance',
    'Change voting mechanism from simple majority to quadratic voting',
    'This proposal would implement quadratic voting to reduce the influence of large token holders and promote more democratic decision-making. The voting power would be calculated as the square root of token holdings, making the system more fair for smaller holders.',
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
    dao_org_id,
    '750e8400-e29b-41d4-a716-446655440003',
    'Increase Platform Fees by 50%',
    'Proposal to increase transaction fees to fund development',
    'This proposal would increase platform fees from 2% to 3% to provide additional funding for platform development and maintenance. The increased revenue would be used to hire more developers and improve platform features.',
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
    dao_org_id,
    '750e8400-e29b-41d4-a716-446655440002',
    'Add NFT Rewards for High-Value Customers',
    'Proposal to create NFT rewards for customers with high loyalty points',
    'This proposal would create a new NFT reward system for customers who accumulate high loyalty points. The NFTs would be unique and could provide additional benefits or be traded on secondary markets.',
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
  ) RETURNING id INTO proposal1_id, proposal2_id, proposal3_id, proposal4_id, proposal5_id;

  -- Create DAO votes
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
    proposal3_id,
    '750e8400-e29b-41d4-a716-446655440001',
    'yes',
    10000,
    'This will make our governance more democratic and fair for all members.'
  ),
  (
    '950e8400-e29b-41d4-a716-446655440002',
    proposal3_id,
    '750e8400-e29b-41d4-a716-446655440002',
    'yes',
    5000,
    'I support this change to reduce the influence of large holders.'
  ),
  (
    '950e8400-e29b-41d4-a716-446655440003',
    proposal3_id,
    '750e8400-e29b-41d4-a716-446655440003',
    'no',
    3000,
    'The current system works fine and this change might be too complex.'
  ),
  (
    '950e8400-e29b-41d4-a716-446655440004',
    proposal4_id,
    '750e8400-e29b-41d4-a716-446655440001',
    'yes',
    10000,
    'We need more funding for development and platform improvements.'
  ),
  (
    '950e8400-e29b-41d4-a716-446655440005',
    proposal4_id,
    '750e8400-e29b-41d4-a716-446655440002',
    'no',
    5000,
    'Higher fees will discourage users from using the platform.'
  ),
  (
    '950e8400-e29b-41d4-a716-446655440006',
    proposal4_id,
    '750e8400-e29b-41d4-a716-446655440003',
    'no',
    3000,
    'This will hurt small merchants and users.'
  );

  -- Update proposal vote counts
  UPDATE public.dao_proposals 
  SET 
    total_votes = 3,
    yes_votes = 2,
    no_votes = 1,
    abstain_votes = 0,
    participation_rate = 75.0
  WHERE id = proposal3_id;

  UPDATE public.dao_proposals 
  SET 
    total_votes = 3,
    yes_votes = 1,
    no_votes = 2,
    abstain_votes = 0,
    participation_rate = 75.0
  WHERE id = proposal4_id;

  -- Return summary
  result := json_build_object(
    'success', true,
    'message', 'DAO test data created successfully',
    'data', json_build_object(
      'organizations', 1,
      'members', 4,
      'proposals', 5,
      'votes', 6
    )
  );

  RETURN result;
END;
$$;

-- Function to create comprehensive test data for all subsystems
CREATE OR REPLACE FUNCTION create_comprehensive_test_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  dao_result json;
  merchant_count int := 0;
  transaction_count int := 0;
  listing_count int := 0;
BEGIN
  -- Create DAO test data
  SELECT create_dao_test_data() INTO dao_result;
  
  -- Create merchants test data
  INSERT INTO public.merchants (
    id,
    name,
    email,
    phone,
    business_type,
    address,
    city,
    state,
    country,
    postal_code,
    website,
    description,
    logo_url,
    is_active,
    created_at
  ) VALUES 
  (
    'test_merchant_1',
    'TechStore Pro',
    'contact@techstorepro.com',
    '+1-555-0101',
    'electronics',
    '123 Tech Street',
    'San Francisco',
    'CA',
    'USA',
    '94105',
    'https://techstorepro.com',
    'Premium electronics and gadgets store',
    'https://example.com/logo1.png',
    true,
    NOW()
  ),
  (
    'test_merchant_2',
    'Fashion Forward',
    'hello@fashionforward.com',
    '+1-555-0102',
    'fashion',
    '456 Fashion Ave',
    'New York',
    'NY',
    'USA',
    '10001',
    'https://fashionforward.com',
    'Trendy fashion and accessories',
    'https://example.com/logo2.png',
    true,
    NOW()
  ),
  (
    'test_merchant_3',
    'Green Grocer',
    'info@greengrocer.com',
    '+1-555-0103',
    'food',
    '789 Organic Lane',
    'Portland',
    'OR',
    'USA',
    '97201',
    'https://greengrocer.com',
    'Organic and sustainable food products',
    'https://example.com/logo3.png',
    true,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS merchant_count = ROW_COUNT;
  
  -- Create loyalty transactions test data
  INSERT INTO public.loyalty_transactions (
    id,
    user_id,
    merchant_id,
    transaction_type,
    points_earned,
    points_redeemed,
    transaction_amount,
    currency,
    description,
    status,
    created_at
  ) VALUES 
  (
    'test_transaction_1',
    '750e8400-e29b-41d4-a716-446655440001',
    'test_merchant_1',
    'purchase',
    100,
    0,
    50.00,
    'USD',
    'Electronics purchase',
    'completed',
    NOW() - INTERVAL '1 day'
  ),
  (
    'test_transaction_2',
    '750e8400-e29b-41d4-a716-446655440002',
    'test_merchant_2',
    'purchase',
    75,
    0,
    37.50,
    'USD',
    'Fashion purchase',
    'completed',
    NOW() - INTERVAL '2 days'
  ),
  (
    'test_transaction_3',
    '750e8400-e29b-41d4-a716-446655440001',
    'test_merchant_3',
    'purchase',
    50,
    0,
    25.00,
    'USD',
    'Grocery purchase',
    'completed',
    NOW() - INTERVAL '3 days'
  ),
  (
    'test_transaction_4',
    '750e8400-e29b-41d4-a716-446655440003',
    'test_merchant_1',
    'redemption',
    0,
    50,
    0,
    'USD',
    'Points redemption for discount',
    'completed',
    NOW() - INTERVAL '4 days'
  )
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS transaction_count = ROW_COUNT;
  
  -- Create marketplace listings test data
  INSERT INTO public.marketplace_listings (
    id,
    title,
    description,
    price,
    currency,
    category,
    condition,
    seller_id,
    images,
    is_active,
    created_at
  ) VALUES 
  (
    'test_listing_1',
    'Vintage Gaming Console',
    'Classic gaming console in excellent condition',
    299.99,
    'USD',
    'electronics',
    'excellent',
    '750e8400-e29b-41d4-a716-446655440001',
    ARRAY['https://example.com/image1.jpg'],
    true,
    NOW() - INTERVAL '1 day'
  ),
  (
    'test_listing_2',
    'Designer Handbag',
    'Luxury designer handbag, barely used',
    450.00,
    'USD',
    'fashion',
    'like_new',
    '750e8400-e29b-41d4-a716-446655440002',
    ARRAY['https://example.com/image2.jpg'],
    true,
    NOW() - INTERVAL '2 days'
  ),
  (
    'test_listing_3',
    'Organic Coffee Beans',
    'Premium organic coffee beans, 2lb bag',
    24.99,
    'USD',
    'food',
    'new',
    '750e8400-e29b-41d4-a716-446655440003',
    ARRAY['https://example.com/image3.jpg'],
    true,
    NOW() - INTERVAL '3 days'
  )
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS listing_count = ROW_COUNT;
  
  -- Return comprehensive result
  result := json_build_object(
    'success', true,
    'message', 'Comprehensive test data created successfully',
    'data', json_build_object(
      'dao', dao_result,
      'merchants', merchant_count,
      'transactions', transaction_count,
      'listings', listing_count
    )
  );

  RETURN result;
END;
$$;

-- Function to update test data with real user IDs
CREATE OR REPLACE FUNCTION update_test_data_with_real_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  current_user_id uuid;
  updated_count int := 0;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No authenticated user found'
    );
  END IF;
  
  -- Update DAO members with current user ID
  UPDATE public.dao_members 
  SET user_id = current_user_id
  WHERE id = '650e8400-e29b-41d4-a716-446655440001';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Update loyalty transactions with current user ID
  UPDATE public.loyalty_transactions 
  SET user_id = current_user_id
  WHERE id = 'test_transaction_1';
  
  -- Update marketplace listings with current user ID
  UPDATE public.marketplace_listings 
  SET seller_id = current_user_id
  WHERE id = 'test_listing_1';
  
  result := json_build_object(
    'success', true,
    'message', 'Test data updated with real user IDs',
    'data', json_build_object(
      'updated_members', updated_count,
      'user_id', current_user_id
    )
  );

  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_dao_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION clear_all_test_data() TO authenticated;
GRANT EXECUTE ON FUNCTION create_dao_test_data() TO authenticated;
GRANT EXECUTE ON FUNCTION create_comprehensive_test_data() TO authenticated;
GRANT EXECUTE ON FUNCTION update_test_data_with_real_users() TO authenticated;
