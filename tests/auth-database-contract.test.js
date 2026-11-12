'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const migrationPath=path.join(__dirname,'..','supabase','migrations','202610250002_fas_auth_onboarding.sql');
const sql=fs.existsSync(migrationPath)?fs.readFileSync(migrationPath,'utf8'):'';
const resetMigrationPath=path.join(__dirname,'..','supabase','migrations','202611120001_agent_reset_hardening.sql');
const resetSql=fs.existsSync(resetMigrationPath)?fs.readFileSync(resetMigrationPath,'utf8'):'';

test('onboarding bootstrap is authenticated, serialized, and idempotent',()=>{
  assert.match(sql,/create or replace function public\.bootstrap_fas_account\s*\(p_display_name text, p_project_name text\)[\s\S]*security definer[\s\S]*set search_path\s*=\s*public,\s*pg_temp/i);
  assert.match(sql,/auth\.uid\(\)[\s\S]*raise exception/i);
  assert.match(sql,/pg_advisory_xact_lock/i);
  assert.match(sql,/workspaces\s*\(created_by\)/i);
  assert.match(sql,/projects\s*\(created_by\)[\s\S]*where status\s*=\s*'active'/i);
  assert.match(sql,/interview_sessions\s*\(project_id,\s*agent_key\)[\s\S]*where status in\s*\('active',\s*'paused'\)/i);
  for(const agent of ['anchor','extract','radar','forge','architect','voice','launch'])assert.match(sql,new RegExp(`'${agent}'`,'i'));
  assert.match(sql,/jsonb_build_object\s*\(\s*'workspaceId'[\s\S]*'projectId'[\s\S]*'sessions'/i);
  assert.doesNotMatch(sql,/jsonb_object_length/i,'PostgreSQL has no jsonb_object_length function');
  assert.match(sql,/jsonb_object_keys\s*\(v_sessions\)/i);
});

test('local imports are durable, project scoped, and answer-idempotent',()=>{
  assert.match(sql,/create table public\.local_imports/i);
  assert.match(sql,/status text[\s\S]*started[\s\S]*answers_imported[\s\S]*artifact_saved[\s\S]*complete[\s\S]*failed/i);
  assert.match(sql,/alter table public\.answers add column if not exists client_ref text/i);
  assert.match(sql,/answers\s*\(project_id,\s*client_ref\)[\s\S]*client_ref is not null/i);
  assert.match(sql,/create or replace function public\.import_fas_local_answers/i);
  assert.match(sql,/on conflict\s*\(project_id,\s*client_ref\)/i);
  assert.match(sql,/answer_map/i);
  assert.match(sql,/alter table public\.local_imports enable row level security/i);
  assert.match(sql,/can_edit_project\s*\(project_id\)/i);
  assert.match(sql,/update public\.interview_sessions[\s\S]*checkpoint/i,'imports rebuild resumable session checkpoints');
  assert.match(sql,/create or replace function public\.save_fas_import_artifact/i,'artifact save and import stage advance share one transaction');
});

test('artifact creation, versioning, and approval are atomic authenticated RPCs',()=>{
  assert.match(sql,/create or replace function public\.save_fas_artifact[\s\S]*insert into public\.artifact_versions/i);
  assert.match(sql,/create or replace function public\.approve_fas_artifact[\s\S]*update public\.artifacts[\s\S]*update public\.artifact_versions[\s\S]*insert into public\.approvals/i);
  assert.match(sql,/approve_fas_artifact\s*\(p_artifact_id uuid,\s*p_expected_version integer\)/i);
  assert.match(sql,/create or replace function public\.save_fas_answer_checkpoint/i);
  assert.match(sql,/created_by[\s\S]*v_user_id/i);
  assert.match(sql,/decided_by[\s\S]*v_user_id/i);
  assert.match(sql,/can_edit_project/i);
});

test('onboarding RPC execution is limited to authenticated users',()=>{
  for(const name of ['bootstrap_fas_account','begin_fas_local_import','import_fas_local_answers','update_fas_local_import','save_fas_import_artifact','save_fas_answer_checkpoint','save_fas_artifact','approve_fas_artifact']){
    assert.match(sql,new RegExp(`revoke execute on function public\\.${name}[\\s\\S]*?from public, anon`,'i'),`${name} must revoke public and anon`);
    assert.match(sql,new RegExp(`grant execute on function public\\.${name}[\\s\\S]*?to authenticated`,'i'),`${name} must grant authenticated`);
  }
});

test('specialist reset is authenticated, scoped, atomic, and preserves artifact versions',()=>{
  assert.match(resetSql,/status[^;]+(?:'retired'|retired)/i);
  assert.match(resetSql,/create or replace function public\.reset_fas_agent\s*\(p_project_id uuid,\s*p_session_id uuid,\s*p_agent_key text\)/i);
  assert.match(resetSql,/security definer[\s\S]*set search_path\s*=\s*public,\s*pg_temp/i);
  assert.match(resetSql,/auth\.uid\(\)[\s\S]*can_edit_project\s*\(p_project_id\)/i);
  assert.match(resetSql,/interview_sessions[\s\S]*id\s*=\s*p_session_id[\s\S]*project_id\s*=\s*p_project_id[\s\S]*agent_key\s*=\s*p_agent_key/i);
  assert.match(resetSql,/delete from public\.answers[\s\S]*project_id\s*=\s*p_project_id[\s\S]*agent_key\s*=\s*p_agent_key/i);
  assert.match(resetSql,/update public\.artifacts[\s\S]*status\s*=\s*'retired'[\s\S]*project_id\s*=\s*p_project_id[\s\S]*agent_key\s*=\s*p_agent_key/i);
  assert.doesNotMatch(resetSql,/delete from public\.artifact_versions|update public\.artifact_versions/i);
  assert.match(resetSql,/revoke execute on function public\.reset_fas_agent\(uuid, uuid, text\) from public, anon/i);
  assert.match(resetSql,/grant execute on function public\.reset_fas_agent\(uuid, uuid, text\) to authenticated/i);
});
