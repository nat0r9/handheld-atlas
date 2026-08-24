-- Controlled publication exceptions for sourced presets with incomplete metrics.
-- Approval is editorial and must point to visible frametime or performance proof.

alter table public.presets
  add column if not exists evidence_artifact_type text,
  add column if not exists evidence_artifact_url text,
  add column if not exists evidence_exception_approved boolean not null default false,
  add column if not exists evidence_exception_reason text,
  add column if not exists evidence_exception_approved_at timestamptz,
  add column if not exists evidence_exception_approved_by uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'presets_evidence_artifact_type_valid'
  ) then
    alter table public.presets
      add constraint presets_evidence_artifact_type_valid
      check (
        evidence_artifact_type is null
        or evidence_artifact_type in (
          'frametime_capture',
          'performance_screenshot',
          'performance_video'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'presets_evidence_exception_requires_proof'
  ) then
    alter table public.presets
      add constraint presets_evidence_exception_requires_proof
      check (
        not evidence_exception_approved
        or (
          atlas_verified = false
          and evidence_tier <> 'atlas_verified'
          and evidence_artifact_type in (
            'frametime_capture',
            'performance_screenshot',
            'performance_video'
          )
          and coalesce(length(btrim(evidence_artifact_url)), 0) > 0
          and coalesce(length(btrim(evidence_exception_reason)), 0) >= 20
          and evidence_exception_approved_at is not null
          and evidence_exception_approved_by is not null
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'presets_evidence_exception_approved_by_fkey'
  ) then
    alter table public.presets
      add constraint presets_evidence_exception_approved_by_fkey
      foreign key (evidence_exception_approved_by)
      references public.profiles(id)
      on delete restrict;
  end if;
end
$$;

create index if not exists presets_evidence_exception_approved_idx
  on public.presets (evidence_exception_approved)
  where evidence_exception_approved = true;

create index if not exists presets_evidence_exception_approved_by_idx
  on public.presets (evidence_exception_approved_by)
  where evidence_exception_approved_by is not null;

create or replace function public.enforce_preset_evidence_exception_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  approval_changed boolean;
begin
  approval_changed := new.evidence_exception_approved
    and (
      tg_op = 'INSERT'
      or not coalesce(old.evidence_exception_approved, false)
      or new.evidence_artifact_type is distinct from old.evidence_artifact_type
      or new.evidence_artifact_url is distinct from old.evidence_artifact_url
      or new.evidence_exception_reason is distinct from old.evidence_exception_reason
    );

  if approval_changed and actor_id is not null then
    if not exists (
      select 1
      from public.profiles
      where id = actor_id
        and role in ('atlas_editor', 'admin')
    ) then
      raise exception 'Only an Atlas editor or admin can approve an evidence exception';
    end if;

    if new.evidence_exception_approved_by is distinct from actor_id then
      raise exception 'Evidence exception approver must match the authenticated editor';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_preset_evidence_exception_approval
  on public.presets;

create trigger enforce_preset_evidence_exception_approval
before insert or update on public.presets
for each row
execute function public.enforce_preset_evidence_exception_approval();

revoke execute on function public.enforce_preset_evidence_exception_approval()
  from public, anon, authenticated;
