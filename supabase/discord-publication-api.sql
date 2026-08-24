begin;

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table public.website_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  url text,
  delivery_status text not null default 'pending',
  delivered_at timestamptz,
  last_error text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),

  constraint website_updates_title_length
    check (char_length(btrim(title)) between 1 and 256),
  constraint website_updates_summary_length
    check (char_length(btrim(summary)) between 1 and 1500),
  constraint website_updates_url_valid
    check (
      url is null
      or (
        left(url, 1) = '/'
        and left(url, 2) <> '//'
      )
      or url ~* '^https://(www\.)?handheldatlas\.com(/|$)'
    ),
  constraint website_updates_delivery_status_valid
    check (
      delivery_status in (
        'pending',
        'queued',
        'sent',
        'failed'
      )
    )
);

comment on table public.website_updates is
  'Immutable Atlas Workspace announcements routed to the Discord website-updates channel.';

alter table public.website_updates enable row level security;

revoke all on table public.website_updates from anon;
revoke all on table public.website_updates from authenticated;

grant select on table public.website_updates to authenticated;
grant insert (
  title,
  summary,
  url,
  created_by
) on table public.website_updates to authenticated;

drop policy if exists
  "Content editors can read website updates"
  on public.website_updates;

create policy
  "Content editors can read website updates"
  on public.website_updates
  for select
  to authenticated
  using (
    public.current_user_role() = any (
      array['atlas_editor'::text, 'admin'::text]
    )
  );

drop policy if exists
  "Content editors can create website updates"
  on public.website_updates;

create policy
  "Content editors can create website updates"
  on public.website_updates
  for insert
  to authenticated
  with check (
    public.current_user_role() = any (
      array['atlas_editor'::text, 'admin'::text]
    )
    and created_by = (select auth.uid())
    and delivery_status = 'pending'
    and delivered_at is null
    and last_error is null
  );

create table private.discord_publication_events (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id uuid not null,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'pending',
  attempts integer not null default 0,
  request_id bigint,
  discord_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  sent_at timestamptz,

  constraint discord_publication_content_type_valid
    check (
      content_type in (
        'news',
        'guide',
        'game',
        'preset',
        'website_update'
      )
    ),
  constraint discord_publication_event_type_valid
    check (event_type in ('published', 'announced')),
  constraint discord_publication_payload_object
    check (jsonb_typeof(payload) = 'object'),
  constraint discord_publication_status_valid
    check (
      status in (
        'pending',
        'queued',
        'sent',
        'failed'
      )
    ),
  constraint discord_publication_attempts_valid
    check (attempts between 0 and 3),
  constraint discord_publication_event_unique
    unique (content_type, content_id, event_type)
);

comment on table private.discord_publication_events is
  'Private idempotent outbox for automatic Discord publication notifications.';

revoke all on table private.discord_publication_events from public;
revoke all on table private.discord_publication_events from anon;
revoke all on table private.discord_publication_events from authenticated;

create index discord_publication_events_delivery_idx
  on private.discord_publication_events (
    status,
    last_attempt_at,
    created_at
  )
  where status <> 'sent';

create index website_updates_created_by_idx
  on public.website_updates (created_by);

create or replace function private.discord_safe_https_url(
  value text
)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select case
    when value ~* '^https://[^[:space:]]+$'
      then value
    else null
  end;
$$;

create or replace function private.discord_embed_field(
  field_name text,
  field_value text,
  inline_value boolean default true
)
returns jsonb
language sql
immutable
set search_path = pg_catalog
as $$
  select jsonb_build_object(
    'name', left(btrim(field_name), 256),
    'value', left(btrim(field_value), 1024),
    'inline', inline_value
  );
$$;

create or replace function private.discord_source_label(
  source_name text,
  source_url text
)
returns text
language plpgsql
immutable
set search_path = pg_catalog, private
as $$
declare
  clean_name text;
  clean_url text;
begin
  clean_name := left(
    replace(
      replace(
        replace(
          replace(
            coalesce(nullif(btrim(source_name), ''), 'Source'),
            '[',
            ''
          ),
          ']',
          ''
        ),
        '(',
        ''
      ),
      ')',
      ''
    ),
    120
  );
  clean_url := private.discord_safe_https_url(source_url);

  if clean_url is null then
    return clean_name;
  end if;

  return format('[%s](%s)', clean_name, clean_url);
end;
$$;

create or replace function private.build_discord_publication_payload(
  content_type text,
  content_record jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  atlas_url constant text := 'https://www.handheldatlas.com';
  embed_title text;
  embed_description text;
  embed_url text;
  embed_image text;
  embed_timestamp text;
  embed_color integer := 1628159;
  embed_fields jsonb := '[]'::jsonb;
  evidence_label text;
  performance_label text;
  game_name text;
  handheld_name text;
begin
  if content_type = 'news' then
    embed_title := content_record ->> 'title';
    embed_description := content_record ->> 'excerpt';
    embed_url := atlas_url || '/news/' || (content_record ->> 'slug');
    embed_image := private.discord_safe_https_url(
      content_record ->> 'cover_image_url'
    );

    if nullif(btrim(content_record ->> 'category'), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Category',
          content_record ->> 'category'
        )
      );
    end if;

    if nullif(btrim(content_record ->> 'reading_time'), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Reading time',
          (content_record ->> 'reading_time') || ' min'
        )
      );
    end if;
  elsif content_type = 'guide' then
    embed_title := content_record ->> 'title';
    embed_description := content_record ->> 'excerpt';
    embed_url := atlas_url || '/guides/' || (content_record ->> 'slug');
    embed_image := private.discord_safe_https_url(
      content_record ->> 'cover_image_url'
    );

    if nullif(btrim(content_record ->> 'category'), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Category',
          content_record ->> 'category'
        )
      );
    end if;

    if nullif(btrim(content_record ->> 'difficulty'), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Difficulty',
          content_record ->> 'difficulty'
        )
      );
    end if;

    if nullif(btrim(content_record ->> 'reading_time'), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Reading time',
          (content_record ->> 'reading_time') || ' min'
        )
      );
    end if;
  elsif content_type = 'game' then
    embed_title := content_record ->> 'name';
    embed_description := content_record ->> 'notes';
    embed_url := atlas_url || '/games/' || (content_record ->> 'slug');
    embed_image := private.discord_safe_https_url(
      content_record ->> 'cover_image_url'
    );
    embed_color := 2278750;

    if nullif(btrim(content_record ->> 'genre'), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Genre',
          content_record ->> 'genre'
        )
      );
    end if;

    if nullif(btrim(content_record ->> 'developer'), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Developer',
          content_record ->> 'developer'
        )
      );
    end if;

    if nullif(btrim(content_record ->> 'publisher'), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Publisher',
          content_record ->> 'publisher'
        )
      );
    end if;

    if nullif(btrim(content_record ->> 'release_date'), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Released',
          content_record ->> 'release_date'
        )
      );
    end if;
  elsif content_type = 'preset' then
    select g.name
      into game_name
      from public.games as g
      where g.id = (content_record ->> 'game_id')::uuid;

    select h.name
      into handheld_name
      from public.handhelds as h
      where h.id = (content_record ->> 'handheld_id')::uuid;

    embed_title := coalesce(game_name, 'New preset')
      || ' — '
      || coalesce(content_record ->> 'name', 'Handheld settings');
    embed_description := content_record ->> 'summary';
    embed_url := atlas_url || '/presets/' || (content_record ->> 'id');
    embed_color := 15672124;

    if nullif(btrim(handheld_name), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field('Handheld', handheld_name)
      );
    end if;

    if nullif(btrim(content_record ->> 'preset_type'), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Profile',
          content_record ->> 'preset_type'
        )
      );
    end if;

    if nullif(btrim(content_record ->> 'resolution'), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Resolution',
          content_record ->> 'resolution'
        )
      );
    end if;

    if nullif(btrim(content_record ->> 'tdp'), '') is not null then
      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Power target',
          content_record ->> 'tdp'
        )
      );
    end if;

    if nullif(btrim(content_record ->> 'fps_average'), '') is not null then
      performance_label := (content_record ->> 'fps_average')
        || ' FPS average';

      if nullif(btrim(content_record ->> 'one_percent_low'), '') is not null then
        performance_label := performance_label
          || ' • '
          || (content_record ->> 'one_percent_low')
          || ' FPS 1% low';
      end if;

      embed_fields := embed_fields || jsonb_build_array(
        private.discord_embed_field(
          'Measured performance',
          performance_label,
          false
        )
      );
    end if;

    evidence_label := case content_record ->> 'evidence_tier'
      when 'atlas_verified' then 'Atlas Verified'
      when 'community_verified' then 'Community Verified'
      when 'external_source' then 'External Source'
      when 'estimated' then 'Estimated'
      else 'Legacy / unclassified'
    end;

    if nullif(btrim(content_record ->> 'source_name'), '') is not null then
      evidence_label := evidence_label
        || ' • '
        || private.discord_source_label(
          content_record ->> 'source_name',
          content_record ->> 'source_url'
        );
    end if;

    embed_fields := embed_fields || jsonb_build_array(
      private.discord_embed_field(
        'Evidence',
        evidence_label,
        false
      )
    );
  elsif content_type = 'website_update' then
    embed_title := content_record ->> 'title';
    embed_description := content_record ->> 'summary';
    embed_color := 15672124;

    if nullif(btrim(content_record ->> 'url'), '') is null then
      embed_url := atlas_url;
    elsif left(content_record ->> 'url', 1) = '/' then
      embed_url := atlas_url || (content_record ->> 'url');
    else
      embed_url := private.discord_safe_https_url(
        content_record ->> 'url'
      );
    end if;
  else
    raise exception 'Unsupported publication content type';
  end if;

  embed_timestamp := coalesce(
    nullif(content_record ->> 'published_at', ''),
    nullif(content_record ->> 'created_at', ''),
    now()::text
  );

  return jsonb_build_object(
    'username', 'HandheldAtlas',
    'allowed_mentions', jsonb_build_object(
      'parse', jsonb_build_array()
    ),
    'embeds', jsonb_build_array(
      jsonb_strip_nulls(
        jsonb_build_object(
          'title', left(
            coalesce(nullif(btrim(embed_title), ''), 'HandheldAtlas update'),
            256
          ),
          'description', left(
            nullif(btrim(embed_description), ''),
            4096
          ),
          'url', private.discord_safe_https_url(embed_url),
          'color', embed_color,
          'timestamp', embed_timestamp,
          'fields', case
            when jsonb_array_length(embed_fields) > 0
              then embed_fields
            else null
          end,
          'image', case
            when embed_image is not null
              then jsonb_build_object('url', embed_image)
            else null
          end,
          'footer', jsonb_build_object(
            'text', 'HandheldAtlas • automatic publication'
          )
        )
      )
    )
  );
end;
$$;

create or replace function private.discord_webhook_secret_name(
  content_type text
)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select case content_type
    when 'news' then 'discord_webhook_website_news'
    when 'guide' then 'discord_webhook_website_news'
    when 'game' then 'discord_webhook_new_games'
    when 'preset' then 'discord_webhook_preset_news'
    when 'website_update' then 'discord_webhook_website_updates'
    else null
  end;
$$;

create or replace function private.dispatch_discord_publication_event(
  event_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public, private, vault, net
as $$
declare
  publication_event private.discord_publication_events%rowtype;
  webhook_secret_name text;
  webhook_url text;
  webhook_request_id bigint;
begin
  select *
    into publication_event
    from private.discord_publication_events
    where id = event_id
    for update;

  if not found
    or publication_event.status = 'sent'
    or publication_event.attempts >= 3
  then
    return publication_event.request_id;
  end if;

  webhook_secret_name := private.discord_webhook_secret_name(
    publication_event.content_type
  );

  select decrypted_secret
    into webhook_url
    from vault.decrypted_secrets
    where name = webhook_secret_name
    order by created_at desc
    limit 1;

  if webhook_url is null then
    update private.discord_publication_events
      set status = 'failed',
          attempts = attempts + 1,
          last_attempt_at = now(),
          last_error = 'Discord destination is not configured'
      where id = event_id;

    if publication_event.content_type = 'website_update' then
      update public.website_updates
        set delivery_status = 'failed',
            last_error = 'Discord destination is not configured'
        where id = publication_event.content_id;
    end if;

    return null;
  end if;

  begin
    select net.http_post(
      url := webhook_url || case
        when position('?' in webhook_url) > 0
          then '&wait=true'
        else '?wait=true'
      end,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'User-Agent', 'HandheldAtlas-Publisher/1.0'
      ),
      body := publication_event.payload,
      timeout_milliseconds := 10000
    )
      into webhook_request_id;

    update private.discord_publication_events
      set status = 'queued',
          attempts = attempts + 1,
          request_id = webhook_request_id,
          last_attempt_at = now(),
          last_error = null
      where id = event_id;

    if publication_event.content_type = 'website_update' then
      update public.website_updates
        set delivery_status = 'queued',
            last_error = null
        where id = publication_event.content_id;
    end if;

    return webhook_request_id;
  exception
    when others then
      update private.discord_publication_events
        set status = 'failed',
            attempts = attempts + 1,
            last_attempt_at = now(),
            last_error = format(
              'Database enqueue error (%s)',
              sqlstate
            )
        where id = event_id;

      if publication_event.content_type = 'website_update' then
        update public.website_updates
          set delivery_status = 'failed',
              last_error = 'Discord enqueue failed'
          where id = publication_event.content_id;
      end if;

      return null;
  end;
end;
$$;

create or replace function private.dispatch_new_discord_publication_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
begin
  perform private.dispatch_discord_publication_event(new.id);
  return new;
exception
  when others then
    update private.discord_publication_events
      set status = 'failed',
          last_error = format(
            'Publication trigger error (%s)',
            sqlstate
          )
      where id = new.id;
    return new;
end;
$$;

drop trigger if exists
  dispatch_new_discord_publication_event
  on private.discord_publication_events;

create trigger dispatch_new_discord_publication_event
  after insert
  on private.discord_publication_events
  for each row
  execute function private.dispatch_new_discord_publication_event();

create or replace function private.enqueue_content_publication()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  mapped_content_type text;
  event_id uuid;
begin
  if new.status::text <> 'published' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status::text = 'published' then
    return new;
  end if;

  mapped_content_type := case tg_table_name
    when 'news' then 'news'
    when 'guides' then 'guide'
    when 'games' then 'game'
    when 'presets' then 'preset'
    else null
  end;

  if mapped_content_type is null then
    return new;
  end if;

  insert into private.discord_publication_events (
    content_type,
    content_id,
    event_type,
    payload
  )
  values (
    mapped_content_type,
    new.id,
    'published',
    private.build_discord_publication_payload(
      mapped_content_type,
      to_jsonb(new)
    )
  )
  on conflict (
    content_type,
    content_id,
    event_type
  ) do nothing
  returning id into event_id;

  return new;
end;
$$;

drop trigger if exists enqueue_news_publication on public.news;
create trigger enqueue_news_publication
  after insert or update of status
  on public.news
  for each row
  execute function private.enqueue_content_publication();

drop trigger if exists enqueue_guide_publication on public.guides;
create trigger enqueue_guide_publication
  after insert or update of status
  on public.guides
  for each row
  execute function private.enqueue_content_publication();

drop trigger if exists enqueue_game_publication on public.games;
create trigger enqueue_game_publication
  after insert or update of status
  on public.games
  for each row
  execute function private.enqueue_content_publication();

drop trigger if exists enqueue_preset_publication on public.presets;
create trigger enqueue_preset_publication
  after insert or update of status
  on public.presets
  for each row
  execute function private.enqueue_content_publication();

create or replace function private.enqueue_website_update()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  insert into private.discord_publication_events (
    content_type,
    content_id,
    event_type,
    payload
  )
  values (
    'website_update',
    new.id,
    'announced',
    private.build_discord_publication_payload(
      'website_update',
      to_jsonb(new)
    )
  )
  on conflict (
    content_type,
    content_id,
    event_type
  ) do nothing;

  return new;
end;
$$;

drop trigger if exists enqueue_website_update on public.website_updates;
create trigger enqueue_website_update
  after insert
  on public.website_updates
  for each row
  execute function private.enqueue_website_update();

create or replace function private.try_discord_message_id(
  response_content text
)
returns text
language plpgsql
immutable
set search_path = pg_catalog
as $$
begin
  return response_content::jsonb ->> 'id';
exception
  when others then
    return null;
end;
$$;

create or replace function private.reconcile_discord_publication_events()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, net
as $$
declare
  response_record record;
  retry_record record;
  failure_reason text;
begin
  for response_record in
    select
      event.id as event_id,
      event.content_type,
      event.content_id,
      response.status_code,
      response.content,
      response.timed_out,
      response.error_msg
    from private.discord_publication_events as event
    join net._http_response as response
      on response.id = event.request_id
    where event.status = 'queued'
  loop
    if response_record.status_code between 200 and 299
      and coalesce(response_record.timed_out, false) = false
      and response_record.error_msg is null
    then
      update private.discord_publication_events
        set status = 'sent',
            discord_message_id = private.try_discord_message_id(
              response_record.content
            ),
            last_error = null,
            sent_at = now()
        where id = response_record.event_id;

      if response_record.content_type = 'website_update' then
        update public.website_updates
          set delivery_status = 'sent',
              delivered_at = now(),
              last_error = null
          where id = response_record.content_id;
      end if;
    else
      failure_reason := case
        when coalesce(response_record.timed_out, false)
          then 'Discord request timed out'
        when response_record.error_msg is not null
          then 'Discord network request failed'
        else 'Discord returned HTTP '
          || coalesce(response_record.status_code::text, 'unknown')
      end;

      update private.discord_publication_events
        set status = 'failed',
            last_error = failure_reason
        where id = response_record.event_id;
    end if;
  end loop;

  update private.discord_publication_events
    set status = 'failed',
        last_error = 'Discord response was not received in time'
    where status = 'queued'
      and last_attempt_at < now() - interval '5 minutes';

  for retry_record in
    select id
    from private.discord_publication_events
    where status = 'failed'
      and attempts < 3
      and coalesce(last_attempt_at, created_at)
        < now() - interval '30 seconds'
    order by created_at
    limit 25
    for update skip locked
  loop
    perform private.dispatch_discord_publication_event(
      retry_record.id
    );
  end loop;

  update public.website_updates as website_update
    set delivery_status = 'failed',
        last_error = event.last_error
    from private.discord_publication_events as event
    where event.content_type = 'website_update'
      and event.content_id = website_update.id
      and event.status = 'failed'
      and event.attempts >= 3;
end;
$$;

revoke all on function private.discord_safe_https_url(text) from public;
revoke all on function private.discord_embed_field(text, text, boolean) from public;
revoke all on function private.discord_source_label(text, text) from public;
revoke all on function private.build_discord_publication_payload(text, jsonb) from public;
revoke all on function private.discord_webhook_secret_name(text) from public;
revoke all on function private.dispatch_discord_publication_event(uuid) from public;
revoke all on function private.dispatch_new_discord_publication_event() from public;
revoke all on function private.enqueue_content_publication() from public;
revoke all on function private.enqueue_website_update() from public;
revoke all on function private.try_discord_message_id(text) from public;
revoke all on function private.reconcile_discord_publication_events() from public;

select cron.unschedule(jobid)
from cron.job
where jobname = 'reconcile-discord-publication-events';

select cron.schedule(
  'reconcile-discord-publication-events',
  '* * * * *',
  'select private.reconcile_discord_publication_events();'
);

commit;
