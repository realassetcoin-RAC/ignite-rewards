create table if not exists marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  funding_goal numeric not null,
  min_investment numeric not null default 0,
  max_investment numeric,
  start_time timestamptz,
  end_time timestamptz,
  token_ticker text,
  token_supply numeric,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists marketplace_investments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references marketplace_listings(id) on delete cascade,
  user_id uuid not null,
  amount numeric not null,
  nft_multiplier numeric not null default 1.0,
  created_at timestamptz not null default now()
);

create table if not exists passive_income_distributions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references marketplace_listings(id) on delete cascade,
  distribution_time timestamptz not null,
  total_amount numeric not null
);

create table if not exists user_passive_earnings (
  id uuid primary key default gen_random_uuid(),
  distribution_id uuid references passive_income_distributions(id) on delete cascade,
  user_id uuid not null,
  amount numeric not null
);

create table if not exists nft_card_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  multiplier numeric not null,
  is_premium boolean not null default false
);

alter table marketplace_listings enable row level security;
alter table marketplace_investments enable row level security;
alter table passive_income_distributions enable row level security;
alter table user_passive_earnings enable row level security;
alter table nft_card_tiers enable row level security;


