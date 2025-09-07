-- Fix Schema Issue for Solana Tables
-- This script ensures tables are properly accessible via the API

-- First, let's check if the tables exist in the public schema
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('rewards_config', 'user_rewards', 'notional_earnings', 'anonymous_users', 'anonymous_transactions', 'rewards_history', 'vesting_schedules', 'solana_program_state')
AND table_schema = 'public';

-- If tables don't exist, create them in the public schema
CREATE TABLE IF NOT EXISTS public.rewards_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id TEXT NOT NULL UNIQUE,
  admin_authority TEXT NOT NULL,
  reward_token_mint TEXT NOT NULL,
  distribution_interval INTEGER NOT NULL DEFAULT 86400,
  max_rewards_per_user BIGINT NOT NULL DEFAULT 1000000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solana_address TEXT NOT NULL,
  total_earned BIGINT NOT NULL DEFAULT 0,
  total_claimed BIGINT NOT NULL DEFAULT 0,
  pending_vesting BIGINT NOT NULL DEFAULT 0,
  last_claim_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, solana_address)
);

CREATE TABLE IF NOT EXISTS public.notional_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL,
  vesting_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vesting_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'vesting' CHECK (status IN ('vesting', 'vested', 'cancelled', 'claimed')),
  is_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(transaction_id)
);

CREATE TABLE IF NOT EXISTS public.anonymous_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anonymous_id TEXT NOT NULL UNIQUE,
  solana_address TEXT,
  user_type TEXT NOT NULL DEFAULT 'non_custodial' CHECK (user_type IN ('custodial', 'non_custodial')),
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_earned BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.anonymous_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  anonymous_user_id UUID NOT NULL REFERENCES public.anonymous_users(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  reward_amount BIGINT NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'refund', 'cancellation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  zero_knowledge_proof TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rewards_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_user_id UUID REFERENCES public.anonymous_users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('earned', 'vested', 'claimed', 'cancelled', 'distributed')),
  amount BIGINT NOT NULL,
  previous_balance BIGINT NOT NULL DEFAULT 0,
  new_balance BIGINT NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.solana_program_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_address TEXT NOT NULL UNIQUE,
  account_data JSONB NOT NULL,
  last_updated_slot BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rewards_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notional_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vesting_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solana_program_state ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active rewards config" 
ON public.rewards_config 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage rewards config" 
ON public.rewards_config 
FOR ALL 
USING (public.check_admin_access());

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

CREATE POLICY "Users can view their own notional earnings" 
ON public.notional_earnings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notional earnings" 
ON public.notional_earnings 
FOR SELECT 
USING (public.check_admin_access());

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

CREATE POLICY "Users can view their own rewards history" 
ON public.rewards_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all rewards history" 
ON public.rewards_history 
FOR SELECT 
USING (public.check_admin_access());

CREATE POLICY "Users can view their own vesting schedules" 
ON public.vesting_schedules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vesting schedules" 
ON public.vesting_schedules 
FOR SELECT 
USING (public.check_admin_access());

CREATE POLICY "Admins can manage solana program state" 
ON public.solana_program_state 
FOR ALL 
USING (public.check_admin_access());

-- Grant permissions to authenticated users
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

-- Insert default rewards configuration
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

-- Verify tables are accessible
SELECT 'rewards_config' as table_name, count(*) as record_count FROM public.rewards_config
UNION ALL
SELECT 'user_rewards' as table_name, count(*) as record_count FROM public.user_rewards
UNION ALL
SELECT 'notional_earnings' as table_name, count(*) as record_count FROM public.notional_earnings
UNION ALL
SELECT 'anonymous_users' as table_name, count(*) as record_count FROM public.anonymous_users
UNION ALL
SELECT 'anonymous_transactions' as table_name, count(*) as record_count FROM public.anonymous_transactions
UNION ALL
SELECT 'rewards_history' as table_name, count(*) as record_count FROM public.rewards_history
UNION ALL
SELECT 'vesting_schedules' as table_name, count(*) as record_count FROM public.vesting_schedules
UNION ALL
SELECT 'solana_program_state' as table_name, count(*) as record_count FROM public.solana_program_state;
