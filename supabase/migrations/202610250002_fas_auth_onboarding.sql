begin;

alter table public.answers add column if not exists client_ref text;

create unique index if not exists workspaces_one_per_creator
  on public.workspaces (created_by);
create unique index if not exists projects_one_active_per_creator
  on public.projects (created_by) where status = 'active';
create unique index if not exists interview_sessions_one_open_per_agent
  on public.interview_sessions (project_id, agent_key) where status in ('active', 'paused');
create unique index if not exists answers_project_client_ref_unique
  on public.answers (project_id, client_ref) where client_ref is not null;
create unique index if not exists artifacts_project_agent_type_unique
  on public.artifacts (project_id, agent_key, artifact_type);

create table public.local_imports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  payload_checksum text not null check (length(payload_checksum) between 16 and 128),
  status text not null default 'started' check (status in ('started', 'answers_imported', 'artifact_saved', 'complete', 'failed')),
  answer_map jsonb not null default '{}'::jsonb check (jsonb_typeof(answer_map) = 'object'),
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(project_id, payload_checksum)
);

alter table public.local_imports enable row level security;
create policy local_imports_read on public.local_imports for select
  using (public.can_access_project(project_id));
create policy local_imports_edit on public.local_imports for all
  using (created_by = auth.uid() and public.can_edit_project(project_id))
  with check (created_by = auth.uid() and public.can_edit_project(project_id));

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
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

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
  from public.agent_definitions as agent
  where agent.active = true
    and agent.key in ('anchor','extract','radar','forge','architect','voice','launch')
  on conflict (project_id, agent_key) where status in ('active', 'paused') do nothing;

  select coalesce(jsonb_object_agg(session.agent_key, session.id), '{}'::jsonb)
  into v_sessions
  from public.interview_sessions as session
  where session.project_id = v_project_id
    and session.status in ('active', 'paused')
    and session.agent_key in ('anchor','extract','radar','forge','architect','voice','launch');

  if (select count(*) from jsonb_object_keys(v_sessions)) <> 7 then
    raise exception 'Seven active agent sessions are required';
  end if;

  return jsonb_build_object('workspaceId', v_workspace_id, 'projectId', v_project_id, 'sessions', v_sessions);
end;
$$;

create or replace function public.begin_fas_local_import(p_project_id uuid, p_payload_checksum text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_import public.local_imports%rowtype;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not public.can_edit_project(p_project_id) then raise exception 'Project access denied' using errcode = '42501'; end if;
  if length(btrim(coalesce(p_payload_checksum, ''))) not between 16 and 128 then raise exception 'Invalid import checksum'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_project_id::text || ':' || p_payload_checksum, 0));
  insert into public.local_imports(project_id, created_by, payload_checksum)
  values (p_project_id, v_user_id, btrim(p_payload_checksum))
  on conflict (project_id, payload_checksum) do update set updated_at = now()
  returning * into v_import;

  return jsonb_build_object(
    'importId', v_import.id, 'projectId', v_import.project_id, 'checksum', v_import.payload_checksum,
    'status', v_import.status, 'answerMap', v_import.answer_map, 'lastErrorCode', v_import.last_error_code
  );
end;
$$;

create or replace function public.import_fas_local_answers(p_import_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_import public.local_imports%rowtype;
  v_item jsonb;
  v_answer_id uuid;
  v_local_id text;
  v_client_ref text;
  v_map jsonb;
  v_supersedes uuid;
  v_created_at timestamptz;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into v_import from public.local_imports where id = p_import_id for update;
  if not found or v_import.created_by <> v_user_id or not public.can_edit_project(v_import.project_id) then
    raise exception 'Import access denied' using errcode = '42501';
  end if;
  if v_import.status in ('answers_imported','artifact_saved','complete') then
    return jsonb_build_object('importId', v_import.id, 'projectId', v_import.project_id, 'status', v_import.status, 'answerMap', v_import.answer_map);
  end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) > 500 then raise exception 'Invalid answer batch'; end if;

  v_map := v_import.answer_map;
  for v_item in select value from jsonb_array_elements(p_answers) loop
    v_local_id := nullif(btrim(v_item->>'localId'), '');
    if v_local_id is null or nullif(btrim(v_item->>'text'), '') is null or nullif(btrim(v_item->>'field'), '') is null then
      raise exception 'Invalid imported answer';
    end if;
    if not exists (
      select 1 from public.interview_sessions s
      where s.id = (v_item->>'sessionId')::uuid and s.project_id = v_import.project_id
        and s.agent_key = v_item->>'agentKey' and s.status in ('active','paused')
    ) then raise exception 'Invalid imported answer session'; end if;

    v_client_ref := coalesce(nullif(v_item->>'clientRef',''), 'local:' || v_import.payload_checksum || ':' || v_local_id);
    v_supersedes := null;
    if nullif(v_item->>'supersedesLocalId','') is not null and v_map ? (v_item->>'supersedesLocalId') then
      v_supersedes := (v_map->>(v_item->>'supersedesLocalId'))::uuid;
    end if;
    begin
      v_created_at := coalesce(nullif(v_item->>'createdAt','')::timestamptz, clock_timestamp());
    exception when others then
      v_created_at := clock_timestamp();
    end;

    insert into public.answers(session_id, project_id, agent_key, field_path, value, basis, permission_status, supersedes_id, created_by, created_at, client_ref)
    values (
      (v_item->>'sessionId')::uuid, v_import.project_id, v_item->>'agentKey', left(v_item->>'field', 300),
      jsonb_build_object('text', left(v_item->>'text', 6000)),
      case when v_item->>'basis' in ('user','import','suggestion') then v_item->>'basis' else 'import' end,
      case when v_item->>'permissionStatus' in ('not_required','pending','private','public') then v_item->>'permissionStatus' else 'not_required' end,
      v_supersedes, v_user_id, v_created_at, left(v_client_ref, 300)
    )
    on conflict (project_id, client_ref) where client_ref is not null
    do update set client_ref = excluded.client_ref
    returning id into v_answer_id;
    v_map := v_map || jsonb_build_object(v_local_id, v_answer_id);
  end loop;

  update public.local_imports
  set status = 'answers_imported', answer_map = v_map, last_error_code = null, updated_at = now()
  where id = v_import.id
  returning * into v_import;
  return jsonb_build_object('importId', v_import.id, 'projectId', v_import.project_id, 'status', v_import.status, 'answerMap', v_import.answer_map);
end;
$$;

create or replace function public.update_fas_local_import(p_import_id uuid, p_status text, p_answer_map jsonb default null, p_error_code text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_import public.local_imports%rowtype;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_status not in ('started','answers_imported','artifact_saved','complete','failed') then raise exception 'Invalid import status'; end if;
  select * into v_import from public.local_imports where id = p_import_id for update;
  if not found or v_import.created_by <> v_user_id or not public.can_edit_project(v_import.project_id) then
    raise exception 'Import access denied' using errcode = '42501';
  end if;
  if v_import.status = 'complete' and p_status <> 'complete' then raise exception 'Completed imports are immutable'; end if;
  if p_answer_map is not null and jsonb_typeof(p_answer_map) <> 'object' then raise exception 'Invalid answer map'; end if;

  update public.local_imports set
    status = p_status,
    answer_map = coalesce(p_answer_map, answer_map),
    last_error_code = case when p_status = 'failed' then left(coalesce(p_error_code, 'import_failed'), 120) else null end,
    completed_at = case when p_status = 'complete' then coalesce(completed_at, now()) else completed_at end,
    updated_at = now()
  where id = p_import_id
  returning * into v_import;
  return jsonb_build_object(
    'importId', v_import.id, 'projectId', v_import.project_id, 'checksum', v_import.payload_checksum,
    'status', v_import.status, 'answerMap', v_import.answer_map, 'lastErrorCode', v_import.last_error_code,
    'completedAt', v_import.completed_at
  );
end;
$$;

create or replace function public.save_fas_artifact(p_project_id uuid, p_agent_key text, p_content jsonb, p_expected_version integer default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_artifact public.artifacts%rowtype;
  v_version integer;
  v_type text := nullif(btrim(p_content->>'type'), '');
  v_title text := nullif(btrim(p_content->>'title'), '');
  v_theme text;
  v_content jsonb;
  v_source_ids jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not public.can_edit_project(p_project_id) then raise exception 'Project access denied' using errcode = '42501'; end if;
  if not exists (select 1 from public.agent_definitions where key = p_agent_key and active = true) then raise exception 'Invalid agent'; end if;
  if v_type is null or v_title is null or jsonb_typeof(p_content) <> 'object' then raise exception 'Invalid artifact'; end if;
  v_theme := case when p_content->>'exportTheme' in ('editorial-strategy','luxury-editorial','boardroom-consultancy') then p_content->>'exportTheme' else 'editorial-strategy' end;

  perform pg_advisory_xact_lock(hashtextextended(p_project_id::text || ':' || p_agent_key || ':' || v_type, 0));
  select * into v_artifact from public.artifacts
  where project_id = p_project_id and agent_key = p_agent_key and artifact_type = v_type for update;

  if not found then
    if p_expected_version is not null and p_expected_version <> 0 then raise exception 'Artifact version changed' using errcode = '40001'; end if;
    insert into public.artifacts(project_id, agent_key, artifact_type, title, current_version, status, export_theme, created_by)
    values (p_project_id, p_agent_key, left(v_type, 160), left(v_title, 240), 1, 'draft', v_theme, v_user_id)
    returning * into v_artifact;
    v_version := 1;
  else
    if p_expected_version is not null and v_artifact.current_version <> p_expected_version then raise exception 'Artifact version changed' using errcode = '40001'; end if;
    v_version := v_artifact.current_version + 1;
    update public.artifacts set title = left(v_title, 240), current_version = v_version, status = 'draft', export_theme = v_theme, updated_at = now()
    where id = v_artifact.id returning * into v_artifact;
  end if;

  select coalesce(jsonb_agg(source->>'id'), '[]'::jsonb) into v_source_ids
  from jsonb_array_elements(case when jsonb_typeof(p_content->'sources') = 'array' then p_content->'sources' else '[]'::jsonb end) source
  where nullif(source->>'id','') is not null;
  v_content := p_content || jsonb_build_object('artifactId', v_artifact.id, 'version', v_version, 'status', 'draft');
  insert into public.artifact_versions(artifact_id, version, content, input_snapshot, status, created_by)
  values (v_artifact.id, v_version, v_content, jsonb_build_object('source_ids', v_source_ids), 'draft', v_user_id);

  return jsonb_build_object('id', v_artifact.id, 'projectId', v_artifact.project_id, 'agentKey', v_artifact.agent_key, 'currentVersion', v_version, 'status', v_artifact.status, 'exportTheme', v_artifact.export_theme);
end;
$$;

create or replace function public.approve_fas_artifact(p_artifact_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_artifact public.artifacts%rowtype;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into v_artifact from public.artifacts where id = p_artifact_id for update;
  if not found or not public.can_edit_project(v_artifact.project_id) then raise exception 'Artifact access denied' using errcode = '42501'; end if;
  if v_artifact.status = 'user_approved' then
    return jsonb_build_object('id', v_artifact.id, 'projectId', v_artifact.project_id, 'currentVersion', v_artifact.current_version, 'status', v_artifact.status);
  end if;

  update public.artifacts set status = 'user_approved', updated_at = now() where id = v_artifact.id returning * into v_artifact;
  update public.artifact_versions set status = 'user_approved'
  where artifact_id = v_artifact.id and version = v_artifact.current_version;
  insert into public.approvals(project_id, entity_type, entity_id, version, decision, decided_by)
  values (v_artifact.project_id, 'artifact', v_artifact.id, v_artifact.current_version, 'approved', v_user_id);
  return jsonb_build_object('id', v_artifact.id, 'projectId', v_artifact.project_id, 'currentVersion', v_artifact.current_version, 'status', v_artifact.status);
end;
$$;

revoke execute on function public.bootstrap_fas_account(text, text) from public, anon;
grant execute on function public.bootstrap_fas_account(text, text) to authenticated;
revoke execute on function public.begin_fas_local_import(uuid, text) from public, anon;
grant execute on function public.begin_fas_local_import(uuid, text) to authenticated;
revoke execute on function public.import_fas_local_answers(uuid, jsonb) from public, anon;
grant execute on function public.import_fas_local_answers(uuid, jsonb) to authenticated;
revoke execute on function public.update_fas_local_import(uuid, text, jsonb, text) from public, anon;
grant execute on function public.update_fas_local_import(uuid, text, jsonb, text) to authenticated;
revoke execute on function public.save_fas_artifact(uuid, text, jsonb, integer) from public, anon;
grant execute on function public.save_fas_artifact(uuid, text, jsonb, integer) to authenticated;
revoke execute on function public.approve_fas_artifact(uuid) from public, anon;
grant execute on function public.approve_fas_artifact(uuid) to authenticated;

commit;
