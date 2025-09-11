create table if not exists user_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  solana_address text not null,
  encrypted_seed_phrase text,
  wallet_type text not null default 'connected',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  solana_address text,
  total_earned numeric not null default 0,
  total_claimed numeric not null default 0,
  pending_vesting numeric not null default 0,
  last_claim_timestamp timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notional_earnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  transaction_id text not null,
  merchant_id uuid,
  amount numeric not null,
  vesting_start_date timestamptz not null default now(),
  vesting_end_date timestamptz not null,
  status text not null default 'vesting',
  is_cancelled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rewards_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  anonymous_user_id uuid,
  transaction_id text not null,
  event_type text not null,
  amount numeric not null,
  previous_balance numeric not null default 0,
  new_balance numeric not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists vesting_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  notional_earning_id uuid references notional_earnings(id) on delete cascade,
  vesting_start_date timestamptz not null,
  vesting_end_date timestamptz not null,
  total_amount numeric not null,
  vested_amount numeric not null default 0,
  is_fully_vested boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_wallets enable row level security;
alter table user_rewards enable row level security;
alter table notional_earnings enable row level security;
alter table rewards_history enable row level security;
alter table vesting_schedules enable row level security;


