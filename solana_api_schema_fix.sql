-- Solana Tables in API Schema (Correct for this application)
-- This script creates Solana tables in the 'api' schema to match the existing application

-- 1. Rewards Configuration Table (maps to RewardsConfig account)
CREATE TABLE IF NOT EXISTS api.rewards_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id TEXT NOT NULL UNIQUE, -- Solana program ID
  admin_authority TEXT NOT NULL, -- Admin public key
  reward_token_mint TEXT NOT NULL, -- Token mint address
  distribution_interval INTEGER NOT NULL DEFAULT 86400, -- 24 hours in seconds
  max_rewards_per_user BIGINT NOT NULL DEFAULT 1000000, -- Maximum rewards per user
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. User Rewards Table (maps to UserRewards account)
CREATE TABLE IF NOT EXISTS api.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solana_address TEXT NOT NULL, -- User's Solana wallet address
  total_earned BIGINT NOT NULL DEFAULT 0, -- Total rewards earned (in smallest unit)
  total_claimed BIGINT NOT NULL DEFAULT 0, -- Total rewards claimed
  pending_vesting BIGINT NOT NULL DEFAULT 0, -- Rewards currently vesting
  last_claim_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, solana_address)
);

-- 3. Notional Earnings Table (maps to NotionalEarnings account)
CREATE TABLE IF NOT EXISTS api.notional_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL, -- Unique transaction identifier
  merchant_id UUID REFERENCES api.merchants(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL, -- Notional amount (in smallest unit)
  vesting_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vesting_end_date TIMESTAMP WITH TIME ZONE NOT NULL, -- 30 days from start
  status TEXT NOT NULL DEFAULT 'vesting' CHECK (status IN ('vesting', 'vested', 'cancelled', 'claimed')),
  is_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(transaction_id)
);

-- 4. Anonymous Users Table (maps to AnonymousUser account)
CREATE TABLE IF NOT EXISTS api.anonymous_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anonymous_id TEXT NOT NULL UNIQUE, -- Generated anonymous identifier
  solana_address TEXT, -- Optional Solana address for custodial users
  user_type TEXT NOT NULL DEFAULT 'non_custodial' CHECK (user_type IN ('custodial', 'non_custodial')),
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_earned BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Anonymous Transactions Table (maps to AnonymousTransaction account)
CREATE TABLE IF NOT EXISTS api.anonymous_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE, -- Unique transaction identifier
  anonymous_user_id UUID NOT NULL REFERENCES api.anonymous_users(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES api.merchants(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL, -- Transaction amount
  reward_amount BIGINT NOT NULL, -- Reward amount earned
  transaction_type TEXT NOT NULL DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'refund', 'cancellation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  zero_knowledge_proof TEXT, -- ZK proof for eligibility verification
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Rewards History Table (tracks all reward events)
CREATE TABLE IF NOT EXISTS api.rewards_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_user_id UUID REFERENCES api.anonymous_users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('earned', 'vested', 'claimed', 'cancelled', 'distributed')),
  amount BIGINT NOT NULL,
  previous_balance BIGINT NOT NULL DEFAULT 0,
  new_balance BIGINT NOT NULL DEFAULT 0,
  metadata JSONB, -- Additional event metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Vesting Schedule Table (tracks vesting periods and releases)
CREATE TABLE IF NOT EXISTS api.vesting_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notional_earning_id UUID NOT NULL REFERENCES api.notional_earnings(id) ON DELETE CASCADE,
  vesting_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  vesting_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_amount BIGINT NOT NULL,
  vested_amount BIGINT NOT NULL DEFAULT 0,
  is_fully_vested BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Solana Program State Table (tracks on-chain state)
CREATE TABLE IF NOT EXISTS api.solana_program_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id TEXT NOT NULL,
  account_type TEXT NOT NULL, -- 'rewards_config', 'user_rewards', 'notional_earnings', etc.
  account_address TEXT NOT NULL UNIQUE, -- Solana account address
  account_data JSONB NOT NULL, -- Serialized account data
  last_updated_slot BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for all tables
ALTER TABLE api.rewards_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.notional_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.anonymous_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.anonymous_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.rewards_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.vesting_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.solana_program_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rewards_config
CREATE POLICY "Anyone can view active rewards config" 
ON api.rewards_config 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage rewards config" 
ON api.rewards_config 
FOR ALL 
USING (public.check_admin_access());

-- RLS Policies for user_rewards
CREATE POLICY "Users can view their own rewards" 
ON api.user_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards" 
ON api.user_rewards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user rewards" 
ON api.user_rewards 
FOR SELECT 
USING (public.check_admin_access());

-- RLS Policies for notional_earnings
CREATE POLICY "Users can view their own notional earnings" 
ON api.notional_earnings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notional earnings" 
ON api.notional_earnings 
FOR SELECT 
USING (public.check_admin_access());

-- RLS Policies for anonymous_users
CREATE POLICY "Users can view their own anonymous profile" 
ON api.anonymous_users 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM api.user_rewards ur 
  WHERE ur.user_id = auth.uid() 
  AND ur.solana_address = anonymous_users.solana_address
));

CREATE POLICY "Admins can view all anonymous users" 
ON api.anonymous_users 
FOR SELECT 
USING (public.check_admin_access());

-- RLS Policies for anonymous_transactions
CREATE POLICY "Users can view their own anonymous transactions" 
ON api.anonymous_transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM api.anonymous_users au
  JOIN api.user_rewards ur ON ur.solana_address = au.solana_address
  WHERE ur.user_id = auth.uid() 
  AND au.id = anonymous_transactions.anonymous_user_id
));

CREATE POLICY "Merchants can view their transactions" 
ON api.anonymous_transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM api.merchants m
  WHERE m.user_id = auth.uid() 
  AND m.id = anonymous_transactions.merchant_id
));

CREATE POLICY "Admins can view all anonymous transactions" 
ON api.anonymous_transactions 
FOR SELECT 
USING (public.check_admin_access());

-- RLS Policies for rewards_history
CREATE POLICY "Users can view their own rewards history" 
ON api.rewards_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all rewards history" 
ON api.rewards_history 
FOR SELECT 
USING (public.check_admin_access());

-- RLS Policies for vesting_schedules
CREATE POLICY "Users can view their own vesting schedules" 
ON api.vesting_schedules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vesting schedules" 
ON api.vesting_schedules 
FOR SELECT 
USING (public.check_admin_access());

-- RLS Policies for solana_program_state
CREATE POLICY "Admins can manage solana program state" 
ON api.solana_program_state 
FOR ALL 
USING (public.check_admin_access());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_user_rewards_user_id ON api.user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_api_user_rewards_solana_address ON api.user_rewards(solana_address);
CREATE INDEX IF NOT EXISTS idx_api_notional_earnings_user_id ON api.notional_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_api_notional_earnings_status ON api.notional_earnings(status);
CREATE INDEX IF NOT EXISTS idx_api_notional_earnings_vesting_end ON api.notional_earnings(vesting_end_date);
CREATE INDEX IF NOT EXISTS idx_api_anonymous_users_anonymous_id ON api.anonymous_users(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_api_anonymous_transactions_anonymous_user_id ON api.anonymous_transactions(anonymous_user_id);
CREATE INDEX IF NOT EXISTS idx_api_anonymous_transactions_merchant_id ON api.anonymous_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_api_rewards_history_user_id ON api.rewards_history(user_id);
CREATE INDEX IF NOT EXISTS idx_api_rewards_history_event_type ON api.rewards_history(event_type);
CREATE INDEX IF NOT EXISTS idx_api_vesting_schedules_user_id ON api.vesting_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_api_vesting_schedules_vesting_end ON api.vesting_schedules(vesting_end_date);

-- Grant necessary permissions
GRANT SELECT ON api.rewards_config TO authenticated;
GRANT SELECT, UPDATE ON api.user_rewards TO authenticated;
GRANT SELECT ON api.notional_earnings TO authenticated;
GRANT SELECT ON api.anonymous_users TO authenticated;
GRANT SELECT ON api.anonymous_transactions TO authenticated;
GRANT SELECT ON api.rewards_history TO authenticated;
GRANT SELECT ON api.vesting_schedules TO authenticated;

-- Grant admin permissions
GRANT ALL ON api.rewards_config TO authenticated;
GRANT ALL ON api.user_rewards TO authenticated;
GRANT ALL ON api.notional_earnings TO authenticated;
GRANT ALL ON api.anonymous_users TO authenticated;
GRANT ALL ON api.anonymous_transactions TO authenticated;
GRANT ALL ON api.rewards_history TO authenticated;
GRANT ALL ON api.vesting_schedules TO authenticated;
GRANT ALL ON api.solana_program_state TO authenticated;

-- Create functions for common operations

-- Function to calculate vested amount for a user
CREATE OR REPLACE FUNCTION api.calculate_vested_amount(user_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
  total_vested BIGINT := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_vested
  FROM api.notional_earnings
  WHERE user_id = user_uuid
    AND status = 'vested'
    AND vesting_end_date <= NOW();
  
  RETURN total_vested;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's total pending vesting
CREATE OR REPLACE FUNCTION api.calculate_pending_vesting(user_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
  total_pending BIGINT := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_pending
  FROM api.notional_earnings
  WHERE user_id = user_uuid
    AND status = 'vesting'
    AND vesting_end_date > NOW();
  
  RETURN total_pending;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update vesting status
CREATE OR REPLACE FUNCTION api.update_vesting_status()
RETURNS void AS $$
BEGIN
  -- Update notional earnings that have completed vesting
  UPDATE api.notional_earnings
  SET status = 'vested',
      updated_at = NOW()
  WHERE status = 'vesting'
    AND vesting_end_date <= NOW();
  
  -- Update vesting schedules
  UPDATE api.vesting_schedules
  SET is_fully_vested = true,
      updated_at = NOW()
  WHERE NOT is_fully_vested
    AND vesting_end_date <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION api.calculate_vested_amount(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION api.calculate_pending_vesting(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION api.update_vesting_status() TO authenticated;

-- Insert a default rewards configuration
INSERT INTO api.rewards_config (
  program_id,
  admin_authority,
  reward_token_mint,
  distribution_interval,
  max_rewards_per_user,
  is_active
) VALUES (
  'default_program_id',
  'default_admin_authority',
  'default_token_mint',
  86400,
  1000000,
  true
) ON CONFLICT (program_id) DO NOTHING;

-- Verify tables are accessible
SELECT 'rewards_config' as table_name, count(*) as record_count FROM api.rewards_config
UNION ALL
SELECT 'user_rewards' as table_name, count(*) as record_count FROM api.user_rewards
UNION ALL
SELECT 'notional_earnings' as table_name, count(*) as record_count FROM api.notional_earnings
UNION ALL
SELECT 'anonymous_users' as table_name, count(*) as record_count FROM api.anonymous_users
UNION ALL
SELECT 'anonymous_transactions' as table_name, count(*) as record_count FROM api.anonymous_transactions
UNION ALL
SELECT 'rewards_history' as table_name, count(*) as record_count FROM api.rewards_history
UNION ALL
SELECT 'vesting_schedules' as table_name, count(*) as record_count FROM api.vesting_schedules
UNION ALL
SELECT 'solana_program_state' as table_name, count(*) as record_count FROM api.solana_program_state;
