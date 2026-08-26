-- Atlas Score is the verified PC Metacritic critic score.
-- Keep the RPC output name for API compatibility, but derive it from the
-- canonical metacritic_critic_score column before removing legacy storage.

begin;

set local lock_timeout = '5s';

create or replace function public.get_monthly_top_games(
  p_month_start date default date_trunc('month', now() at time zone 'utc')::date,
  p_limit integer default 5,
  p_min_votes integer default 3
)
returns table (
  game_id uuid,
  name text,
  slug text,
  genre text,
  atlas_score integer,
  cover_image_url text,
  average_rating numeric,
  rating_count bigint,
  weighted_score numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with monthly_scores as (
    select
      game_rating_monthly.game_id,
      avg(game_rating_monthly.rating)::numeric as average_rating,
      count(*)::bigint as rating_count,
      (
        sum(game_rating_monthly.rating)::numeric + (3.5 * 5)
      ) / (
        count(*)::numeric + 5
      ) as weighted_score
    from public.game_rating_monthly
    where game_rating_monthly.rating_month = date_trunc('month', p_month_start::timestamp)::date
    group by game_rating_monthly.game_id
    having count(*) >= greatest(p_min_votes, 1)
  )
  select
    games.id as game_id,
    games.name::text,
    games.slug::text,
    games.genre::text,
    games.metacritic_critic_score::integer as atlas_score,
    games.cover_image_url::text,
    round(monthly_scores.average_rating, 2) as average_rating,
    monthly_scores.rating_count,
    round(monthly_scores.weighted_score, 4) as weighted_score
  from monthly_scores
  join public.games
    on games.id = monthly_scores.game_id
  where games.status = 'published'
  order by
    monthly_scores.weighted_score desc,
    monthly_scores.rating_count desc,
    games.metacritic_critic_score desc nulls last,
    games.name asc
  limit least(greatest(p_limit, 1), 20);
$$;

alter table public.games
  drop column if exists atlas_score;

commit;
