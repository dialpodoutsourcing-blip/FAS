begin;

create or replace function public.reset_fas_agent(p_project_id uuid, p_session_id uuid, p_agent_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.interview_sessions%rowtype;
  v_deleted_answers integer := 0;
  v_retired_artifacts integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not public.can_edit_project(p_project_id) then
    raise exception 'Project access denied' using errcode = '42501';
  end if;

  select * into v_session
  from public.interview_sessions
  where id = p_session_id
    and project_id = p_project_id
    and agent_key = p_agent_key
  for update;
  if not found then
    raise exception 'Interview session not found' using errcode = 'P0002';
  end if;

  delete from public.answers
  where project_id = p_project_id
    and agent_key = p_agent_key;
  get diagnostics v_deleted_answers = row_count;

  update public.interview_sessions
  set checkpoint = '{}'::jsonb,
      state = '{}'::jsonb,
      status = 'active',
      completed_at = null,
      updated_at = now()
  where id = p_session_id
    and project_id = p_project_id
    and agent_key = p_agent_key;

  update public.artifacts
  set status = 'retired', updated_at = now()
  where project_id = p_project_id
    and agent_key = p_agent_key
    and status <> 'retired';
  get diagnostics v_retired_artifacts = row_count;

  return jsonb_build_object(
    'projectId', p_project_id,
    'sessionId', p_session_id,
    'agentKey', p_agent_key,
    'deletedAnswers', v_deleted_answers,
    'retiredArtifacts', v_retired_artifacts
  );
end;
$$;

revoke execute on function public.reset_fas_agent(uuid, uuid, text) from public, anon;
grant execute on function public.reset_fas_agent(uuid, uuid, text) to authenticated;

commit;
