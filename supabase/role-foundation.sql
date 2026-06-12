-- HandheldAtlas role foundation

alter table public.profiles
add column if not exists role text
not null
default 'user';

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (
  role in (
    'user',
    'benchmark_tester',
    'moderator',
    'atlas_editor',
    'admin'
  )
);

update public.profiles
set role = 'admin'
where is_admin = true
  and role = 'user';

create index if not exists profiles_role_idx
on public.profiles(role);

-- Preset moderation access.
drop policy if exists "Staff can view all preset submissions"
on public.preset_submissions;

create policy "Staff can view all preset submissions"
on public.preset_submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'moderator',
        'atlas_editor',
        'admin'
      )
  )
);

drop policy if exists "Staff can update all preset submissions"
on public.preset_submissions;

create policy "Staff can update all preset submissions"
on public.preset_submissions
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'moderator',
        'atlas_editor',
        'admin'
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'moderator',
        'atlas_editor',
        'admin'
      )
  )
);

-- Benchmark tester access.
grant select, insert, update, delete
on public.benchmarks
to authenticated;

drop policy if exists "Benchmark staff can read benchmarks"
on public.benchmarks;

create policy "Benchmark staff can read benchmarks"
on public.benchmarks
for select
to authenticated
using (
  status = 'published'
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'benchmark_tester',
        'atlas_editor',
        'admin'
      )
  )
);

drop policy if exists "Benchmark staff can insert benchmarks"
on public.benchmarks;

create policy "Benchmark staff can insert benchmarks"
on public.benchmarks
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    (
      status = 'draft'
      and exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'benchmark_tester'
      )
    )
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in (
          'atlas_editor',
          'admin'
        )
    )
  )
);

drop policy if exists "Benchmark staff can update benchmarks"
on public.benchmarks;

create policy "Benchmark staff can update benchmarks"
on public.benchmarks
for update
to authenticated
using (
  (
    created_by = auth.uid()
    and status = 'draft'
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'benchmark_tester'
    )
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'atlas_editor',
        'admin'
      )
  )
)
with check (
  (
    created_by = auth.uid()
    and status = 'draft'
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'benchmark_tester'
    )
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'atlas_editor',
        'admin'
      )
  )
);

drop policy if exists "Benchmark staff can delete benchmarks"
on public.benchmarks;

create policy "Benchmark staff can delete benchmarks"
on public.benchmarks
for delete
to authenticated
using (
  (
    created_by = auth.uid()
    and status = 'draft'
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'benchmark_tester'
    )
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
