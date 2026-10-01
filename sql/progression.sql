create table if not exists public.game_rewards (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  xp_awarded integer not null check (xp_awarded between 1 and 500),
  created_at timestamptz not null default now(),
  unique (user_id, session_id)
);

alter table public.game_rewards enable row level security;

drop policy if exists "Users can read their own game rewards" on public.game_rewards;
create policy "Users can read their own game rewards"
  on public.game_rewards for select
  using (auth.uid() = user_id);

revoke all on public.game_rewards from public, anon, authenticated;
grant select on public.game_rewards to authenticated;

create or replace function public.award_game_reward(p_session_id uuid, p_xp integer)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_xp integer;
  current_level integer;
  current_games integer;
  was_inserted boolean;
begin
  if current_user_id is null then raise exception 'Not authenticated'; end if;
  if p_xp is null or p_xp < 1 or p_xp > 500 then raise exception 'Invalid reward'; end if;

  insert into public.game_rewards (user_id, session_id, xp_awarded)
  values (current_user_id, p_session_id, p_xp)
  on conflict (user_id, session_id) do nothing;
  was_inserted := found;

  if was_inserted then
    update public.profiles
    set xp = xp + p_xp,
        level = floor(sqrt((xp + p_xp)::numeric / 100))::integer + 1,
        games_played = games_played + 1,
        updated_at = now()
    where id = current_user_id
    returning xp, level, games_played into current_xp, current_level, current_games;
  else
    select xp, level, games_played into current_xp, current_level, current_games from public.profiles where id = current_user_id;
  end if;

  if current_xp is null then raise exception 'Profile not found'; end if;
  return json_build_object('xp_awarded', case when was_inserted then p_xp else 0 end, 'total_xp', current_xp, 'level', current_level, 'games_played', current_games, 'level_up', false, 'already_awarded', not was_inserted);
end;
$$;

revoke all on function public.award_game_reward(uuid, integer) from public, anon, authenticated;