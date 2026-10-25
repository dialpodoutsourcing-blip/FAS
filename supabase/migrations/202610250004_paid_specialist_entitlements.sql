begin;

create table if not exists public.user_agent_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_key text not null references public.agent_definitions(key) on delete cascade,
  status text not null default 'active' check (status in ('active', 'revoked')),
  source text not null default 'payment' check (source in ('payment', 'manual', 'promotion')),
  external_reference text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, agent_key)
);

alter table public.user_agent_entitlements enable row level security;
drop policy if exists user_agent_entitlements_read on public.user_agent_entitlements;
create policy user_agent_entitlements_read on public.user_agent_entitlements
  for select to authenticated using (user_id = auth.uid());

revoke all on table public.user_agent_entitlements from anon, authenticated;
grant select on table public.user_agent_entitlements to authenticated;

create or replace function public.has_fas_agent_access(p_agent_key text, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when p_agent_key in ('anchor', 'extract') then true
    when p_agent_key not in ('radar', 'forge', 'architect', 'voice', 'launch') then false
    when p_user_id is null then false
    when p_user_id <> auth.uid() and coalesce(auth.role(), '') <> 'service_role' then false
    else exists (
      select 1
      from public.user_agent_entitlements entitlement
      where entitlement.user_id = p_user_id
        and entitlement.agent_key = p_agent_key
        and entitlement.status = 'active'
        and (entitlement.expires_at is null or entitlement.expires_at > now())
    )
  end;
$$;

create or replace function public.list_fas_agent_access()
returns text[]
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(array_agg(agent.key order by (agent.definition->>'step')::integer), array[]::text[])
  from public.agent_definitions agent
  where agent.active = true
    and public.has_fas_agent_access(agent.key, auth.uid());
$$;

revoke execute on function public.has_fas_agent_access(text, uuid) from public, anon;
grant execute on function public.has_fas_agent_access(text, uuid) to authenticated;
revoke execute on function public.list_fas_agent_access() from public, anon;
grant execute on function public.list_fas_agent_access() to authenticated;

drop policy if exists agent_definitions_read on public.agent_definitions;
create policy agent_definitions_read on public.agent_definitions for select to authenticated
  using (active = true and public.has_fas_agent_access(key));

drop policy if exists agent_chapters_read on public.agent_chapters;
create policy agent_chapters_read on public.agent_chapters for select to authenticated
  using (active = true and public.has_fas_agent_access(agent_key)
    and exists (select 1 from public.agent_definitions agent where agent.key = agent_key and agent.active = true));

drop policy if exists agent_questions_read on public.agent_questions;
create policy agent_questions_read on public.agent_questions for select to authenticated
  using (active = true and exists (
    select 1 from public.agent_chapters chapter
    join public.agent_definitions agent on agent.key = chapter.agent_key
    where chapter.id = chapter_id and chapter.active = true and agent.active = true
      and public.has_fas_agent_access(chapter.agent_key)
  ));

drop policy if exists sessions_read on public.interview_sessions;
create policy sessions_read on public.interview_sessions for select to authenticated
  using (public.can_access_project(project_id) and public.has_fas_agent_access(agent_key));
drop policy if exists interview_sessions_edit on public.interview_sessions;
create policy interview_sessions_edit on public.interview_sessions for all to authenticated
  using (public.can_edit_project(project_id) and public.has_fas_agent_access(agent_key))
  with check (public.can_edit_project(project_id) and public.has_fas_agent_access(agent_key));

drop policy if exists answers_read on public.answers;
create policy answers_read on public.answers for select to authenticated
  using (public.can_access_project(project_id) and public.has_fas_agent_access(agent_key));
drop policy if exists answers_edit on public.answers;
create policy answers_edit on public.answers for all to authenticated
  using (public.can_edit_project(project_id) and public.has_fas_agent_access(agent_key))
  with check (public.can_edit_project(project_id) and public.has_fas_agent_access(agent_key));

drop policy if exists artifacts_read on public.artifacts;
create policy artifacts_read on public.artifacts for select to authenticated
  using (public.can_access_project(project_id) and public.has_fas_agent_access(agent_key));
drop policy if exists artifacts_edit on public.artifacts;
create policy artifacts_edit on public.artifacts for all to authenticated
  using (public.can_edit_project(project_id) and public.has_fas_agent_access(agent_key))
  with check (public.can_edit_project(project_id) and public.has_fas_agent_access(agent_key));

drop policy if exists artifact_versions_read on public.artifact_versions;
create policy artifact_versions_read on public.artifact_versions for select to authenticated
  using (exists (
    select 1 from public.artifacts artifact
    where artifact.id = artifact_id
      and public.can_access_project(artifact.project_id)
      and public.has_fas_agent_access(artifact.agent_key)
  ));
drop policy if exists artifact_versions_edit on public.artifact_versions;
create policy artifact_versions_edit on public.artifact_versions for all to authenticated
  using (exists (
    select 1 from public.artifacts artifact
    where artifact.id = artifact_id
      and public.can_edit_project(artifact.project_id)
      and public.has_fas_agent_access(artifact.agent_key)
  ))
  with check (exists (
    select 1 from public.artifacts artifact
    where artifact.id = artifact_id
      and public.can_edit_project(artifact.project_id)
      and public.has_fas_agent_access(artifact.agent_key)
  ));

create or replace function public.enforce_fas_row_agent_access()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_agent_key text;
begin
  v_agent_key := case when tg_op = 'DELETE' then old.agent_key else new.agent_key end;
  if not public.has_fas_agent_access(v_agent_key, auth.uid()) then
    raise exception 'Specialist access denied' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists answers_agent_access_guard on public.answers;
create trigger answers_agent_access_guard before insert or update or delete on public.answers
  for each row execute function public.enforce_fas_row_agent_access();
drop trigger if exists artifacts_agent_access_guard on public.artifacts;
create trigger artifacts_agent_access_guard before insert or update or delete on public.artifacts
  for each row execute function public.enforce_fas_row_agent_access();

create or replace function public.bootstrap_fas_account(p_display_name text, p_project_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_workspace_id uuid;
  v_project_id uuid;
  v_project_name text := coalesce(nullif(btrim(p_project_name), ''), 'My Authority Project');
  v_sessions jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  insert into public.profiles(id, display_name, updated_at)
  values (v_user_id, nullif(left(btrim(p_display_name), 160), ''), now())
  on conflict (id) do update
    set display_name = coalesce(excluded.display_name, public.profiles.display_name), updated_at = now();

  insert into public.workspaces(name, created_by)
  values (left(v_project_name || ' Workspace', 180), v_user_id)
  on conflict (created_by) do update set name = public.workspaces.name
  returning id into v_workspace_id;

  insert into public.workspace_members(workspace_id, user_id, role)
  values (v_workspace_id, v_user_id, 'owner')
  on conflict (workspace_id, user_id) do update set role = 'owner';

  insert into public.projects(workspace_id, name, status, created_by)
  values (v_workspace_id, left(v_project_name, 180), 'active', v_user_id)
  on conflict (created_by) where status = 'active'
  do update set workspace_id = excluded.workspace_id, updated_at = now()
  returning id into v_project_id;

  insert into public.interview_sessions(project_id, agent_key, created_by)
  select v_project_id, agent.key, v_user_id
  from public.agent_definitions agent
  where agent.active = true
    and agent.key in ('anchor','extract','radar','forge','architect','voice','launch')
  on conflict (project_id, agent_key) where status in ('active', 'paused') do nothing;

  select coalesce(jsonb_object_agg(session.agent_key, session.id), '{}'::jsonb)
  into v_sessions
  from public.interview_sessions session
  where session.project_id = v_project_id
    and session.status in ('active', 'paused')
    and public.has_fas_agent_access(session.agent_key, v_user_id);

  if not (v_sessions ? 'anchor' and v_sessions ? 'extract') then
    raise exception 'Anchor and Extract sessions are required';
  end if;

  return jsonb_build_object('workspaceId', v_workspace_id, 'projectId', v_project_id, 'sessions', v_sessions);
end;
$$;

revoke execute on function public.bootstrap_fas_account(text, text) from public, anon;
grant execute on function public.bootstrap_fas_account(text, text) to authenticated;

commit;
