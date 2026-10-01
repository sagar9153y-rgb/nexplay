create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  xp integer not null default 0,
  level integer not null default 1,
  games_played integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, avatar_url) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  profile_username text;
begin
  profile_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  if profile_username is null then
    profile_username := 'Player-' || left(replace(new.id::text, '-', ''), 8);
  end if;

  insert into public.profiles (id, username)
  values (new.id, profile_username);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

with missing_profiles as (
  select
    u.id,
    nullif(trim(u.raw_user_meta_data ->> 'username'), '') as requested_username,
    count(*) over (
      partition by nullif(trim(u.raw_user_meta_data ->> 'username'), '')
    ) as username_count
  from auth.users u
  left join public.profiles p on p.id = u.id
  where p.id is null
)
insert into public.profiles (id, username)
select
  missing.id,
  case
    when missing.requested_username is not null
      and missing.username_count = 1
      and not exists (
        select 1 from public.profiles p where p.username = missing.requested_username
      )
    then missing.requested_username
    else 'Player-' || replace(missing.id::text, '-', '')
  end
from missing_profiles missing
on conflict (id) do nothing;