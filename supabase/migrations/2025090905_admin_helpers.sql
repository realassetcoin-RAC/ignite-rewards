create or replace function is_admin() returns boolean language plpgsql as $$
declare
  uid uuid;
begin
  select auth.uid() into uid;
  if uid is null then return false; end if;
  return exists (select 1 from profiles p where p.id = uid and lower(p.role) in ('admin','administrator'));
end $$;

create or replace function check_admin_access() returns boolean language sql as $$
  select is_admin();
$$;

create or replace function get_current_user_profile()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  totp_secret text,
  mfa_enabled boolean,
  backup_codes text[],
  mfa_setup_completed_at timestamptz
) language sql as $$
  select p.id, p.email, p.full_name, p.role, p.created_at, p.updated_at, p.totp_secret, coalesce(p.mfa_enabled,false), coalesce(p.backup_codes,'{}'::text[]), p.mfa_setup_completed_at
  from profiles p
  where p.id = auth.uid()
  limit 1;
$$;


