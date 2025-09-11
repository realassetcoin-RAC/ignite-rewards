create table if not exists dao_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  governance_token_symbol text not null,
  governance_token_decimals int not null default 9,
  min_proposal_threshold numeric not null default 0,
  voting_period_days int not null default 7,
  execution_delay_hours int not null default 24,
  quorum_percentage numeric not null default 10.0,
  super_majority_threshold numeric not null default 66.67,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dao_members (
  id uuid primary key default gen_random_uuid(),
  dao_id uuid references dao_organizations(id) on delete cascade,
  user_id uuid not null,
  wallet_address text,
  role text not null default 'member',
  governance_tokens numeric not null default 0,
  voting_power numeric not null default 0,
  joined_at timestamptz not null default now(),
  last_active_at timestamptz,
  is_active boolean not null default true,
  user_email text,
  user_full_name text
);

create table if not exists dao_proposals (
  id uuid primary key default gen_random_uuid(),
  dao_id uuid references dao_organizations(id) on delete cascade,
  proposer_id uuid,
  title text not null,
  description text,
  full_description text,
  category text,
  voting_type text not null default 'simple_majority',
  status text not null default 'draft',
  start_time timestamptz,
  end_time timestamptz,
  execution_time timestamptz,
  total_votes int not null default 0,
  yes_votes int not null default 0,
  no_votes int not null default 0,
  abstain_votes int not null default 0,
  participation_rate numeric not null default 0
);

create table if not exists dao_votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references dao_proposals(id) on delete cascade,
  voter_id uuid not null,
  choice text not null,
  voting_power numeric not null default 0,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists loyalty_change_requests (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  payload jsonb not null,
  dao_proposal_id uuid references dao_proposals(id) on delete set null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table dao_organizations enable row level security;
alter table dao_members enable row level security;
alter table dao_proposals enable row level security;
alter table dao_votes enable row level security;
alter table loyalty_change_requests enable row level security;


