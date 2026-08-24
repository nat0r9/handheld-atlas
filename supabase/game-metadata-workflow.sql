-- Structured source metadata required by the HandheldAtlas game workflow.
-- Games may be researched incrementally as drafts; publishing requirements
-- are enforced by the admin Server Actions once the supporting preset exists.

alter table public.games
  add column if not exists release_date date,
  add column if not exists publisher text,
  add column if not exists platforms text[] not null default '{}'::text[],
  add column if not exists steam_app_id bigint,
  add column if not exists metacritic_critic_score smallint,
  add column if not exists metacritic_user_score numeric(3, 1),
  add column if not exists metacritic_critic_reviews integer,
  add column if not exists metacritic_user_ratings integer,
  add column if not exists metacritic_url text,
  add column if not exists cover_source_name text,
  add column if not exists cover_source_url text;

create unique index if not exists games_steam_app_id_unique
  on public.games (steam_app_id)
  where steam_app_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'games_metacritic_critic_score_range'
  ) then
    alter table public.games
      add constraint games_metacritic_critic_score_range
      check (
        metacritic_critic_score is null
        or metacritic_critic_score between 0 and 100
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'games_metacritic_user_score_range'
  ) then
    alter table public.games
      add constraint games_metacritic_user_score_range
      check (
        metacritic_user_score is null
        or metacritic_user_score between 0 and 10
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'games_metacritic_critic_reviews_nonnegative'
  ) then
    alter table public.games
      add constraint games_metacritic_critic_reviews_nonnegative
      check (
        metacritic_critic_reviews is null
        or metacritic_critic_reviews >= 0
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'games_metacritic_user_ratings_nonnegative'
  ) then
    alter table public.games
      add constraint games_metacritic_user_ratings_nonnegative
      check (
        metacritic_user_ratings is null
        or metacritic_user_ratings >= 0
      );
  end if;
end
$$;
