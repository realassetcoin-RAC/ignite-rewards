create table if not exists issue_categories (
  id uuid primary key default gen_random_uuid(),
  category_key text unique not null,
  category_name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists issue_tags (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references issue_categories(id) on delete cascade,
  tag_key text not null,
  tag_name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists contact_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_id text unique not null,
  user_id uuid,
  user_email text not null,
  user_name text,
  category text not null,
  tag text,
  subject text,
  description text not null,
  status text not null default 'open',
  priority text not null default 'medium',
  assigned_to text,
  slack_message_ts text,
  slack_channel text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references contact_tickets(id) on delete cascade,
  file_name text not null,
  file_size bigint not null,
  file_type text not null,
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists chatbot_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid,
  user_email text,
  conversation_data jsonb not null default '{}'::jsonb,
  ticket_id uuid,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'active'
);

create table if not exists chatbot_interactions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references chatbot_conversations(id) on delete cascade,
  interaction_type text not null,
  message_content text,
  metadata jsonb,
  timestamp timestamptz not null default now()
);

create table if not exists slack_integration_settings (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  webhook_url text not null,
  channel_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function generate_ticket_id()
returns text
language sql
as $$
  select 'TCK-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((floor(random()*100000))::int::text, 5, '0');
$$;

alter table issue_categories enable row level security;
alter table issue_tags enable row level security;
alter table contact_tickets enable row level security;
alter table ticket_attachments enable row level security;
alter table chatbot_conversations enable row level security;
alter table chatbot_interactions enable row level security;
alter table slack_integration_settings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='contact_tickets' and policyname='allow_all_admin') then
    create policy allow_all_admin on contact_tickets for all using (true) with check (true);
  end if;
end $$;


