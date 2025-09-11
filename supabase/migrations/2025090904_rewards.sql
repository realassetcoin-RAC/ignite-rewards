create table if not exists rewards_config (
  id uuid primary key default gen_random_uuid(),
  program_id text,
  admin_authority text,
  reward_token_mint text,
  distribution_interval int not null default 86400,
  max_rewards_per_user int not null default 1000000,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists config_proposals (
  id uuid primary key default gen_random_uuid(),
  config_id uuid,
  proposed_distribution_interval int not null,
  proposed_max_rewards_per_user int not null,
  status text not null default 'pending',
  proposer_id text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  implemented_at timestamptz
);

create table if not exists anonymous_users (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null,
  solana_address text,
  user_type text not null,
  total_transactions int not null default 0,
  total_earned numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table rewards_config enable row level security;
alter table config_proposals enable row level security;
alter table anonymous_users enable row level security;


