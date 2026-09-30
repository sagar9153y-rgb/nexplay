create table if not exists public.game_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  game_type text not null check (
    game_type in ('tic-tac-toe', 'memory-match', 'reaction-rush', 'quick-quiz')
  ),
  game_mode text not null,
  ai_difficulty text check (
    ai_difficulty is null or ai_difficulty in ('easy', 'medium', 'hard')
  ),
  result text not null check (
    result in ('win', 'loss', 'draw', 'complete')
  ),
  score integer check (
    score is null or score between 0 and 1000000
  ),
  moves integer check (
    moves is null or moves between 0 and 10000
  ),
  accuracy numeric(5, 2) check (
    accuracy is null or accuracy between 0 and 100
  ),
  reaction_times integer[] check (
    reaction_times is null or cardinality(reaction_times) <= 5
  ),
  average_reaction_ms integer check (
    average_reaction_ms is null or average_reaction_ms between 1 and 10000
  ),
  best_reaction_ms integer check (
    best_reaction_ms is null or best_reaction_ms between 1 and 10000
  ),
  xp_awarded integer not null default 0 check (
    xp_awarded between 0 and 500
  ),
  played_at timestamptz not null default now(),
  unique (user_id, session_id)
);

alter table public.game_history
  add column if not exists id bigint generated always as identity;

alter table public.game_history
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.game_history
  add column if not exists session_id uuid;

alter table public.game_history
  add column if not exists game_type text;

alter table public.game_history
  add column if not exists game_mode text;

alter table public.game_history
  add column if not exists ai_difficulty text;

alter table public.game_history
  add column if not exists result text;

alter table public.game_history
  add column if not exists score integer;

alter table public.game_history
  add column if not exists moves integer;

alter table public.game_history
  add column if not exists accuracy numeric(5, 2);

alter table public.game_history
  add column if not exists reaction_times integer[];

alter table public.game_history
  add column if not exists average_reaction_ms integer;

alter table public.game_history
  add column if not exists best_reaction_ms integer;

alter table public.game_history
  add column if not exists xp_awarded integer not null default 0;

alter table public.game_history
  add column if not exists played_at timestamptz not null default now();

create index if not exists game_history_user_session_lookup_idx
  on public.game_history (user_id, session_id);

do $$
begin
  if not exists (
    select 1
    from public.game_history
    where user_id is not null
      and session_id is not null
    group by user_id, session_id
    having count(*) > 1
  ) then
    execute '
      create unique index if not exists game_history_user_session_unique_idx
      on public.game_history (user_id, session_id)
    ';
  else
    raise notice 'Existing duplicate game sessions were preserved; completion RPC prevents new duplicates.';
  end if;
end;
$$;

create index if not exists game_history_user_recent_idx
  on public.game_history (user_id, played_at desc, id desc);

create index if not exists game_history_leaderboard_stats_idx
  on public.game_history (user_id, result, game_type, game_mode);

alter table public.game_history enable row level security;
do $$
declare existing_policy record;
begin
  for existing_policy in select policyname from pg_policies where schemaname = 'public' and tablename = 'game_history' loop
    execute format('drop policy if exists %I on public.game_history', existing_policy.policyname);
  end loop;
end;
$$;
create policy "Users can read their own game history"
  on public.game_history for select using (auth.uid() = user_id);
revoke all on public.game_history from public, anon, authenticated;
grant select on public.game_history to authenticated;

create table if not exists public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete restrict,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.user_achievements add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.user_achievements add column if not exists achievement_id text;
alter table public.user_achievements add column if not exists unlocked_at timestamptz not null default now();
create index if not exists user_achievements_user_achievement_idx
  on public.user_achievements (user_id, achievement_id);
do $$
begin
  if not exists (
    select 1 from public.user_achievements
    where user_id is not null and achievement_id is not null
    group by user_id, achievement_id having count(*) > 1
  ) then
    execute 'create unique index if not exists user_achievements_user_achievement_unique_idx on public.user_achievements (user_id, achievement_id)';
  else
    raise notice 'Existing duplicate achievement rows were preserved; completion RPC prevents new duplicates.';
  end if;
end;
$$;

create index if not exists user_achievements_recent_idx
  on public.user_achievements (user_id, unlocked_at desc);

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
do $$
declare existing_policy record;
begin
  for existing_policy in select policyname from pg_policies where schemaname = 'public' and tablename = 'achievements' loop
    execute format('drop policy if exists %I on public.achievements', existing_policy.policyname);
  end loop;
  for existing_policy in select policyname from pg_policies where schemaname = 'public' and tablename = 'user_achievements' loop
    execute format('drop policy if exists %I on public.user_achievements', existing_policy.policyname);
  end loop;
end;
$$;
create policy "Anyone can read achievement definitions"
  on public.achievements for select using (true);
create policy "Users can read their own achievements"
  on public.user_achievements for select using (auth.uid() = user_id);
revoke all on public.achievements from public, anon, authenticated;
revoke all on public.user_achievements from public, anon, authenticated;
grant select on public.achievements to anon, authenticated;
grant select on public.user_achievements to authenticated;

insert into public.achievements (id, name, description, icon) values
  ('FIRST_WIN', 'First Win', 'Win your first game.', 'trophy'),
  ('TEN_GAMES', 'Getting Started', 'Play 10 games.', 'gamepad'),
  ('FIVE_WIN_STREAK', 'On Fire', 'Win five competitive games in a row.', 'flame'),
  ('XP_1000', 'XP Collector', 'Reach 1,000 total XP.', 'sparkles'),
  ('AI_CHALLENGER', 'AI Challenger', 'Win a game against an AI opponent.', 'bot'),
  ('QUIZ_MASTER', 'Quiz Master', 'Score at least 800 points in Quick Quiz.', 'brain'),
  ('REACTION_MASTER', 'Quick Reflexes', 'Win an AI Benchmark with a sub-350 ms average.', 'zap'),
  ('MEMORY_MASTER', 'Memory Master', 'Complete Memory Match in 18 moves or fewer.', 'layers'),
  ('LEVEL_5', 'Rising Star', 'Reach level 5.', 'award'),
  ('LEVEL_10', 'NEXPLAY Elite', 'Reach level 10.', 'crown')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon;

create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= current_streak),
  last_active_date date,
  updated_at timestamptz not null default now()
);

alter table public.user_streaks add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.user_streaks add column if not exists current_streak integer not null default 0;
alter table public.user_streaks add column if not exists best_streak integer not null default 0;
alter table public.user_streaks add column if not exists last_active_date date;
alter table public.user_streaks add column if not exists updated_at timestamptz not null default now();
create index if not exists user_streaks_user_id_idx on public.user_streaks (user_id);
do $$
begin
  if not exists (
    select 1 from public.user_streaks where user_id is not null
    group by user_id having count(*) > 1
  ) then
    execute 'create unique index if not exists user_streaks_user_id_unique_idx on public.user_streaks (user_id)';
  else
    raise notice 'Existing duplicate streak rows were preserved; completion RPC updates them under a user lock.';
  end if;
end;
$$;

alter table public.user_streaks enable row level security;
do $$
declare existing_policy record;
begin
  for existing_policy in select policyname from pg_policies where schemaname = 'public' and tablename = 'user_streaks' loop
    execute format('drop policy if exists %I on public.user_streaks', existing_policy.policyname);
  end loop;
end;
$$;
create policy "Users can read their own daily streak"
  on public.user_streaks for select using (auth.uid() = user_id);
revoke all on public.user_streaks from public, anon, authenticated;
grant select on public.user_streaks to authenticated;

-- Profile RLS remains user-scoped; column grants prevent direct XP/level edits.
revoke update on public.profiles from public, anon, authenticated;
grant update (username, avatar_url) on public.profiles to authenticated;

-- Rewards are now submitted through complete_game_session, which calculates XP
-- from the game metrics and writes the reward and history in one transaction.
revoke all on function public.award_game_reward(uuid, integer) from public, anon, authenticated;

create or replace function public.complete_game_session(
  p_session_id uuid,
  p_game_type text,
  p_game_mode text,
  p_ai_difficulty text,
  p_result text,
  p_score integer,
  p_moves integer,
  p_accuracy numeric,
  p_reaction_times integer[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  computed_xp integer;
  correct_count integer;
  average_reaction integer;
  best_reaction integer;
  win_streak integer;
  today_utc date := (now() at time zone 'UTC')::date;
  next_streak integer;
  next_best_streak integer;
  last_active_date date;
  was_inserted boolean;
  existing_history boolean;
  prior_reward_xp integer;
  history_xp integer;
  reward_result json;
  new_achievements jsonb := '[]'::jsonb;
  current_streak integer;
  current_best_streak integer;
begin
  if current_user_id is null then raise exception 'Not authenticated'; end if;
  if p_session_id is null then raise exception 'Invalid session'; end if;
  if p_game_type is null or p_game_mode is null or p_result is null then raise exception 'Missing game metadata'; end if;
  if p_game_type not in ('tic-tac-toe', 'memory-match', 'reaction-rush', 'quick-quiz') then raise exception 'Invalid game'; end if;
  if p_result not in ('win', 'loss', 'draw', 'complete') then raise exception 'Invalid result'; end if;
  if p_ai_difficulty is not null and p_ai_difficulty not in ('easy', 'medium', 'hard') then raise exception 'Invalid difficulty'; end if;
  if p_score is not null and (p_score < 0 or p_score > 1000000) then raise exception 'Invalid score'; end if;
  if p_moves is not null and (p_moves < 0 or p_moves > 10000) then raise exception 'Invalid moves'; end if;
  if p_accuracy is not null and (p_accuracy < 0 or p_accuracy > 100) then raise exception 'Invalid accuracy'; end if;

  if not (
    (p_game_type = 'tic-tac-toe' and p_game_mode in ('ai', 'pvp')) or
    (p_game_type = 'memory-match' and p_game_mode in ('solo', 'challenge')) or
    (p_game_type = 'reaction-rush' and p_game_mode in ('solo', 'benchmark')) or
    (p_game_type = 'quick-quiz' and p_game_mode in ('solo', 'battle'))
  ) then raise exception 'Invalid game mode'; end if;
  if p_game_mode <> 'pvp' and p_ai_difficulty is null then raise exception 'Difficulty required'; end if;
  if p_game_mode = 'pvp' and p_ai_difficulty is not null then raise exception 'PvP does not use AI difficulty'; end if;

  if p_game_type = 'tic-tac-toe' then
    if p_moves is null or p_score is null or p_moves <> p_score or p_moves < 5 or p_moves > 9 then raise exception 'Invalid Tic Tac Toe metrics'; end if;
    if (p_result = 'draw' and p_moves <> 9) or p_result = 'complete' then raise exception 'Invalid Tic Tac Toe result'; end if;
  elsif p_game_type = 'memory-match' then
    if p_moves is null or p_moves < 1 or p_score is null or p_score < 0 or p_score > 8 then raise exception 'Invalid Memory Match metrics'; end if;
    if (p_game_mode = 'solo' and (p_score <> 8 or p_result <> 'complete')) or (p_game_mode = 'challenge' and p_result = 'complete') then raise exception 'Invalid Memory Match result'; end if;
  elsif p_game_type = 'quick-quiz' then
    if p_score is null or p_score < 0 or p_score > 1000 or p_score % 100 <> 0 then raise exception 'Valid quiz score required'; end if;
    if p_accuracy is not null and p_accuracy <> p_score / 10.0 then raise exception 'Quiz accuracy does not match score'; end if;
  end if;

  if p_game_type = 'reaction-rush' then
    if p_reaction_times is null or cardinality(p_reaction_times) not between 1 and 5 then raise exception 'Invalid reaction rounds'; end if;
    if (p_game_mode = 'solo' and cardinality(p_reaction_times) <> 1) or (p_game_mode = 'benchmark' and cardinality(p_reaction_times) <> 5) then raise exception 'Invalid reaction rounds'; end if;
    if exists (select 1 from unnest(p_reaction_times) as reaction(ms) where reaction.ms < 1 or reaction.ms > 10000) then raise exception 'Invalid reaction time'; end if;
    select round(avg(reaction.ms))::integer, min(reaction.ms)
      into average_reaction, best_reaction
      from unnest(p_reaction_times) as reaction(ms);
    select least(500, sum(case
      when reaction.ms < 200 then 200
      when reaction.ms < 300 then 150
      when reaction.ms < 400 then 125
      when reaction.ms < 500 then 100
      else 75
    end))::integer
      into computed_xp
      from unnest(p_reaction_times) as reaction(ms);
  elsif p_reaction_times is not null and cardinality(p_reaction_times) > 0 then
    raise exception 'Reaction metrics are only valid for Reaction Rush';
  end if;

  if p_game_type = 'tic-tac-toe' then
    computed_xp := case p_result when 'win' then 50 when 'draw' then 20 else 10 end;
  elsif p_game_type = 'memory-match' then
    if p_moves is null then raise exception 'Moves required'; end if;
    computed_xp := 100 + case when p_moves < 20 then 100 when p_moves < 30 then 50 else 25 end;
  elsif p_game_type = 'quick-quiz' then
    if p_score is null or p_score % 100 <> 0 then raise exception 'Valid quiz score required'; end if;
    correct_count := p_score / 100;
    computed_xp := 50 + case when correct_count >= 8 then 200 when correct_count >= 5 then 150 when correct_count >= 1 then 100 else 50 end;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text || ':' || p_session_id::text, 0));
  select exists (
    select 1 from public.game_history
    where user_id = current_user_id and session_id = p_session_id
  ) into existing_history;
  select xp_awarded into prior_reward_xp
    from public.game_rewards where user_id = current_user_id and session_id = p_session_id;
  history_xp := coalesce(prior_reward_xp, computed_xp);

  if not existing_history then
    insert into public.game_history (
      user_id, session_id, game_type, game_mode, ai_difficulty, result,
      score, moves, accuracy, reaction_times, average_reaction_ms,
      best_reaction_ms, xp_awarded
    ) values (
      current_user_id, p_session_id, p_game_type, p_game_mode, p_ai_difficulty, p_result,
      p_score, p_moves, p_accuracy, p_reaction_times, average_reaction, best_reaction, history_xp
    );
    was_inserted := found;
  else
    was_inserted := false;
  end if;

  reward_result := public.award_game_reward(p_session_id, computed_xp);

  if was_inserted then
    perform pg_advisory_xact_lock(hashtextextended(current_user_id::text || ':streak', 0));
    select ds.current_streak, ds.best_streak, ds.last_active_date
      into next_streak, next_best_streak, last_active_date
      from public.user_streaks ds
      where ds.user_id = current_user_id
      order by ds.last_active_date desc nulls last
      limit 1 for update;

    if not found then
      next_streak := 1;
      next_best_streak := 1;
      last_active_date := today_utc;
      insert into public.user_streaks (user_id, current_streak, best_streak, last_active_date)
      values (current_user_id, next_streak, next_best_streak, last_active_date);
    elsif last_active_date is null or last_active_date < today_utc then
      if last_active_date = (now() at time zone 'UTC')::date - 1 then
        next_streak := next_streak + 1;
      else
        next_streak := 1;
      end if;
      next_best_streak := greatest(next_best_streak, next_streak);
      today_utc := (now() at time zone 'UTC')::date;
      update public.user_streaks
      set current_streak = next_streak,
          best_streak = next_best_streak,
          last_active_date = today_utc,
          updated_at = now()
      where user_id = current_user_id;
    end if;

    select count(*) into win_streak from (
      select result from public.game_history
      where user_id = current_user_id and result in ('win', 'loss', 'draw')
      order by played_at desc, id desc limit 5
    ) recent where result = 'win';

    perform pg_advisory_xact_lock(hashtextextended(current_user_id::text || ':achievements', 0));
    with eligible(achievement_id) as (
      select 'FIRST_WIN' where exists (select 1 from public.game_history where user_id = current_user_id and result = 'win')
      union all select 'TEN_GAMES' where exists (select 1 from public.profiles where id = current_user_id and games_played >= 10)
      union all select 'FIVE_WIN_STREAK' where win_streak >= 5
      union all select 'XP_1000' where exists (select 1 from public.profiles where id = current_user_id and xp >= 1000)
      union all select 'AI_CHALLENGER' where exists (select 1 from public.game_history where user_id = current_user_id and game_mode in ('ai', 'challenge', 'benchmark', 'battle') and result = 'win')
      union all select 'QUIZ_MASTER' where exists (select 1 from public.game_history where user_id = current_user_id and game_type = 'quick-quiz' and score >= 800)
      union all select 'REACTION_MASTER' where exists (select 1 from public.game_history where user_id = current_user_id and game_type = 'reaction-rush' and game_mode = 'benchmark' and result = 'win' and average_reaction_ms < 350)
      union all select 'MEMORY_MASTER' where exists (select 1 from public.game_history where user_id = current_user_id and game_type = 'memory-match' and moves <= 18 and result in ('win', 'complete'))
      union all select 'LEVEL_5' where exists (select 1 from public.profiles where id = current_user_id and level >= 5)
      union all select 'LEVEL_10' where exists (select 1 from public.profiles where id = current_user_id and level >= 10)
    ), unlocked as (
      insert into public.user_achievements (user_id, achievement_id)
      select current_user_id, eligible.achievement_id
      from eligible
      where not exists (
        select 1 from public.user_achievements ua
        where ua.user_id = current_user_id and ua.achievement_id = eligible.achievement_id
      )
      returning achievement_id
    )
    select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name, 'description', a.description, 'icon', a.icon)), '[]'::jsonb)
      into new_achievements
      from unlocked u join public.achievements a on a.id = u.achievement_id;
  end if;

  select ds.current_streak, ds.best_streak into current_streak, current_best_streak
    from public.user_streaks ds where ds.user_id = current_user_id;
  return reward_result::jsonb || jsonb_build_object(
    'new_achievements', new_achievements,
    'current_streak', coalesce(current_streak, 0),
    'best_streak', coalesce(current_best_streak, 0)
  );
end;
$$;

revoke all on function public.complete_game_session(uuid, text, text, text, text, integer, integer, numeric, integer[]) from public, anon;
grant execute on function public.complete_game_session(uuid, text, text, text, text, integer, integer, numeric, integer[]) to authenticated;

create or replace function public.get_global_leaderboard(p_limit integer default 100)
returns table (
  rank bigint,
  username text,
  avatar_url text,
  xp integer,
  level integer,
  is_current_user boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with ranked as (
    select row_number() over (order by p.xp desc, p.username asc, p.id) as player_rank,
           p.id, p.username, p.avatar_url, p.xp, p.level
    from public.profiles p
  )
  select r.player_rank, r.username, r.avatar_url, r.xp, r.level, r.id = auth.uid()
  from ranked r
    where r.player_rank <= greatest(1, least(coalesce(p_limit, 100), 100)) or r.id = auth.uid()
  order by r.player_rank;
$$;
revoke all on function public.get_global_leaderboard(integer) from public;
grant execute on function public.get_global_leaderboard(integer) to anon, authenticated;

create or replace function public.get_player_progression()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  profile_row public.profiles%rowtype;
  streak_row public.user_streaks%rowtype;
  games_count integer;
  wins_count integer;
  losses_count integer;
  draws_count integer;
  competitive_count integer;
  win_percent numeric(5, 2);
  global_rank bigint;
  recent_games jsonb;
  achievement_list jsonb;
  recent_unlocks jsonb;
  leaderboard_preview jsonb;
begin
  if current_user_id is null then raise exception 'Not authenticated'; end if;
  select * into profile_row from public.profiles where id = current_user_id;
  if not found then return jsonb_build_object('error', 'profile-not-found'); end if;
  select * into streak_row from public.user_streaks where user_id = current_user_id;

  select count(*)::integer,
         count(*) filter (where result = 'win')::integer,
         count(*) filter (where result = 'loss')::integer,
         count(*) filter (where result = 'draw')::integer
    into games_count, wins_count, losses_count, draws_count
    from public.game_history where user_id = current_user_id;
  competitive_count := wins_count + losses_count + draws_count;
  win_percent := case when competitive_count = 0 then 0 else round(wins_count * 100.0 / competitive_count, 2) end;

  select ranked.player_rank into global_rank from (
    select p.id, row_number() over (order by p.xp desc, p.username asc, p.id) as player_rank
    from public.profiles p
  ) ranked where ranked.id = current_user_id;

  select coalesce(jsonb_agg(to_jsonb(recent) order by recent.played_at desc, recent.id desc), '[]'::jsonb)
    into recent_games
    from (
      select id, game_type, game_mode, ai_difficulty, result, score, moves, accuracy,
             average_reaction_ms, best_reaction_ms, xp_awarded, played_at
      from public.game_history where user_id = current_user_id
      order by played_at desc, id desc limit 8
    ) recent;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'name', a.name, 'description', a.description, 'icon', a.icon,
    'unlocked_at', ua.unlocked_at
  ) order by a.id), '[]'::jsonb)
    into achievement_list
    from public.achievements a
    left join public.user_achievements ua on ua.achievement_id = a.id and ua.user_id = current_user_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'name', a.name, 'description', a.description, 'icon', a.icon, 'unlocked_at', ua.unlocked_at
  ) order by ua.unlocked_at desc), '[]'::jsonb)
    into recent_unlocks
    from (
      select * from public.user_achievements
      where user_id = current_user_id order by unlocked_at desc limit 4
    ) ua join public.achievements a on a.id = ua.achievement_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'rank', ranked.player_rank, 'username', ranked.username, 'avatar_url', ranked.avatar_url,
    'xp', ranked.xp, 'level', ranked.level, 'is_current_user', ranked.id = current_user_id
  ) order by ranked.player_rank), '[]'::jsonb)
    into leaderboard_preview
    from (
      select row_number() over (order by p.xp desc, p.username asc, p.id) as player_rank,
             p.id, p.username, p.avatar_url, p.xp, p.level
      from public.profiles p order by p.xp desc, p.username asc, p.id limit 5
    ) ranked;

  return jsonb_build_object(
    'profile', jsonb_build_object(
      'username', profile_row.username, 'avatar_url', profile_row.avatar_url,
      'xp', profile_row.xp, 'level', profile_row.level, 'games_played', profile_row.games_played,
      'created_at', profile_row.created_at
    ),
    'stats', jsonb_build_object(
      'games_played', profile_row.games_played, 'history_games', games_count,
      'wins', wins_count, 'losses', losses_count, 'draws', draws_count,
      'win_rate', win_percent, 'global_rank', global_rank
    ),
    'streak', jsonb_build_object(
      'current', coalesce(streak_row.current_streak, 0), 'best', coalesce(streak_row.best_streak, 0),
      'last_active_date', streak_row.last_active_date
    ),
    'recent_games', recent_games,
    'achievements', achievement_list,
    'recent_achievements', recent_unlocks,
    'leaderboard_preview', leaderboard_preview
  );
end;
$$;
revoke all on function public.get_player_progression() from public, anon;
grant execute on function public.get_player_progression() to authenticated;
