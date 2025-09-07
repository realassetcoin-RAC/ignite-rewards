-- Apply Solana Contract Integration Migration
-- Run this script in your Supabase SQL editor to create the required tables

-- 1. Rewards Configuration Table (maps to RewardsConfig account)
CREATE TABLE IF NOT EXISTS public.rewards_config (
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
CREATE TABLE IF NOT EXISTS public.user_rewards (
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
CREATE TABLE IF NOT EXISTS public.notional_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL, -- Unique transaction identifier
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
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
CREATE TABLE IF NOT EXISTS public.anonymous_users (
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
CREATE TABLE IF NOT EXISTS public.anonymous_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE, -- Unique transaction identifier
  anonymous_user_id UUID NOT NULL REFERENCES public.anonymous_users(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL, -- Transaction amount
  reward_amount BIGINT NOT NULL, -- Reward amount earned
  transaction_type TEXT NOT NULL DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'refund', 'cancellation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  zero_knowledge_proof TEXT, -- ZK proof for eligibility verification
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Rewards History Table (tracks all reward events)
CREATE TABLE IF NOT EXISTS public.rewards_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_user_id UUID REFERENCES public.anonymous_users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('earned', 'vested', 'claimed', 'cancelled', 'distributed')),
  amount BIGINT NOT NULL,
  previous_balance BIGINT NOT NULL DEFAULT 0,
  new_balance BIGINT NOT NULL DEFAULT 0,
  metadata JSONB, -- Additional event metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Vesting Schedule Table (tracks vesting periods and releases)
CREATE TABLE IF NOT EXISTS public.vesting_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notional_earning_id UUID NOT NULL REFERENCES public.notional_earnings(id) ON DELETE CASCADE,
  vesting_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  vesting_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_amount BIGINT NOT NULL,
  vested_amount BIGINT NOT NULL DEFAULT 0,
  is_fully_vested BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Solana Program State Table (tracks on-chain state)
CREATE TABLE IF NOT EXISTS public.solana_program_state (
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
ALTER TABLE public.rewards_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notional_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vesting_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solana_program_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rewards_config
CREATE POLICY "Anyone can view active rewards config" 
ON public.rewards_config 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage rewards config" 
ON public.rewards_config 
FOR ALL 
USING (public.check_admin_access());

-- RLS Policies for user_rewards
CREATE POLICY "Users can view their own rewards" 
ON public.user_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards" 
ON public.user_rewards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user rewards" 
ON public.user_rewards 
FOR SELECT 
USING (public.check_admin_access());

-- RLS Policies for notional_earnings
CREATE POLICY "Users can view their own notional earnings" 
ON public.notional_earnings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notional earnings" 
ON public.notional_earnings 
FOR SELECT 
USING (public.check_admin_access());

-- RLS Policies for anonymous_users
CREATE POLICY "Users can view their own anonymous profile" 
ON public.anonymous_users 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_rewards ur 
  WHERE ur.user_id = auth.uid() 
  AND ur.solana_address = anonymous_users.solana_address
));

CREATE POLICY "Admins can view all anonymous users" 
ON public.anonymous_users 
FOR SELECT 
USING (public.check_admin_access());

-- RLS Policies for anonymous_transactions
CREATE POLICY "Users can view their own anonymous transactions" 
ON public.anonymous_transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.anonymous_users au
  JOIN public.user_rewards ur ON ur.solana_address = au.solana_address
  WHERE ur.user_id = auth.uid() 
  AND au.id = anonymous_transactions.anonymous_user_id
));

CREATE POLICY "Merchants can view their transactions" 
ON public.anonymous_transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.merchants m
  WHERE m.user_id = auth.uid() 
  AND m.id = anonymous_transactions.merchant_id
));

CREATE POLICY "Admins can view all anonymous transactions" 
ON public.anonymous_transactions 
FOR SELECT 
USING (public.check_admin_access());

-- RLS Policies for rewards_history
CREATE POLICY "Users can view their own rewards history" 
ON public.rewards_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all rewards history" 
ON public.rewards_history 
FOR SELECT 
USING (public.check_admin_access());

-- RLS Policies for vesting_schedules
CREATE POLICY "Users can view their own vesting schedules" 
ON public.vesting_schedules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vesting schedules" 
ON public.vesting_schedules 
FOR SELECT 
USING (public.check_admin_access());

-- RLS Policies for solana_program_state
CREATE POLICY "Admins can manage solana program state" 
ON public.solana_program_state 
FOR ALL 
USING (public.check_admin_access());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON public.user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_solana_address ON public.user_rewards(solana_address);
CREATE INDEX IF NOT EXISTS idx_notional_earnings_user_id ON public.notional_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_notional_earnings_status ON public.notional_earnings(status);
CREATE INDEX IF NOT EXISTS idx_notional_earnings_vesting_end ON public.notional_earnings(vesting_end_date);
CREATE INDEX IF NOT EXISTS idx_anonymous_users_anonymous_id ON public.anonymous_users(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_transactions_anonymous_user_id ON public.anonymous_transactions(anonymous_user_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_transactions_merchant_id ON public.anonymous_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_rewards_history_user_id ON public.rewards_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_history_event_type ON public.rewards_history(event_type);
CREATE INDEX IF NOT EXISTS idx_vesting_schedules_user_id ON public.vesting_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_vesting_schedules_vesting_end ON public.vesting_schedules(vesting_end_date);

-- Grant necessary permissions
GRANT SELECT ON public.rewards_config TO authenticated;
GRANT SELECT, UPDATE ON public.user_rewards TO authenticated;
GRANT SELECT ON public.notional_earnings TO authenticated;
GRANT SELECT ON public.anonymous_users TO authenticated;
GRANT SELECT ON public.anonymous_transactions TO authenticated;
GRANT SELECT ON public.rewards_history TO authenticated;
GRANT SELECT ON public.vesting_schedules TO authenticated;

-- Grant admin permissions
GRANT ALL ON public.rewards_config TO authenticated;
GRANT ALL ON public.user_rewards TO authenticated;
GRANT ALL ON public.notional_earnings TO authenticated;
GRANT ALL ON public.anonymous_users TO authenticated;
GRANT ALL ON public.anonymous_transactions TO authenticated;
GRANT ALL ON public.rewards_history TO authenticated;
GRANT ALL ON public.vesting_schedules TO authenticated;
GRANT ALL ON public.solana_program_state TO authenticated;

-- Create functions for common operations

-- Function to calculate vested amount for a user
CREATE OR REPLACE FUNCTION public.calculate_vested_amount(user_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
  total_vested BIGINT := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_vested
  FROM public.notional_earnings
  WHERE user_id = user_uuid
    AND status = 'vested'
    AND vesting_end_date <= NOW();
  
  RETURN total_vested;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's total pending vesting
CREATE OR REPLACE FUNCTION public.calculate_pending_vesting(user_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
  total_pending BIGINT := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_pending
  FROM public.notional_earnings
  WHERE user_id = user_uuid
    AND status = 'vesting'
    AND vesting_end_date > NOW();
  
  RETURN total_pending;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update vesting status
CREATE OR REPLACE FUNCTION public.update_vesting_status()
RETURNS void AS $$
BEGIN
  -- Update notional earnings that have completed vesting
  UPDATE public.notional_earnings
  SET status = 'vested',
      updated_at = NOW()
  WHERE status = 'vesting'
    AND vesting_end_date <= NOW();
  
  -- Update vesting schedules
  UPDATE public.vesting_schedules
  SET is_fully_vested = true,
      updated_at = NOW()
  WHERE NOT is_fully_vested
    AND vesting_end_date <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.calculate_vested_amount(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_pending_vesting(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_vesting_status() TO authenticated;

-- Insert a default rewards configuration
INSERT INTO public.rewards_config (
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
