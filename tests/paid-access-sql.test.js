'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const migrationPath=path.join(__dirname,'..','supabase','migrations','202610250004_paid_specialist_entitlements.sql');
const sql=fs.existsSync(migrationPath)?fs.readFileSync(migrationPath,'utf8'):'';

test('paid specialist entitlements default to Anchor and Extract and expire closed',()=>{
  assert.match(sql,/create table(?: if not exists)? public\.user_agent_entitlements/i);
  assert.match(sql,/user_id uuid[^;]+references auth\.users/i);
  assert.match(sql,/agent_key text[^;]+references public\.agent_definitions/i);
  assert.match(sql,/status[^;]+active[^;]+revoked/i);
  assert.match(sql,/expires_at timestamptz/i);
  assert.match(sql,/create or replace function public\.has_fas_agent_access\s*\(p_agent_key text, p_user_id uuid default auth\.uid\(\)\)/i);
  assert.match(sql,/p_agent_key in\s*\('anchor',\s*'extract'\)/i);
  assert.match(sql,/status\s*=\s*'active'/i);
  assert.match(sql,/expires_at is null\s+or\s+[^)]*expires_at\s*>\s*now\(\)/i);
  assert.match(sql,/create or replace function public\.list_fas_agent_access\s*\(\)/i);
});

test('authenticated users can read only their entitlements and cannot mutate them',()=>{
  assert.match(sql,/alter table public\.user_agent_entitlements enable row level security/i);
  assert.match(sql,/create policy user_agent_entitlements_read[\s\S]*for select[\s\S]*user_id\s*=\s*auth\.uid\(\)/i);
  assert.match(sql,/revoke all on table public\.user_agent_entitlements from anon, authenticated/i);
  assert.match(sql,/grant select on table public\.user_agent_entitlements to authenticated/i);
  assert.doesNotMatch(sql,/grant\s+(?:insert|update|delete|all)\s+on table public\.user_agent_entitlements to authenticated/i);
});

test('catalog and project records enforce specialist access',()=>{
  for(const policy of ['agent_definitions_read','agent_chapters_read','agent_questions_read','sessions_read','interview_sessions_edit','answers_read','answers_edit','artifacts_read','artifacts_edit','artifact_versions_read','artifact_versions_edit']){
    assert.match(sql,new RegExp(`create policy ${policy}[\\s\\S]*?has_fas_agent_access`,'i'),`${policy} must check agent access`);
  }
  assert.match(sql,/create or replace function public\.bootstrap_fas_account[\s\S]*has_fas_agent_access\s*\(session\.agent_key,\s*v_user_id\)/i);
  assert.match(sql,/create or replace function public\.enforce_fas_row_agent_access[\s\S]*has_fas_agent_access/i);
  assert.match(sql,/create trigger answers_agent_access_guard[\s\S]*on public\.answers/i);
  assert.match(sql,/create trigger artifacts_agent_access_guard[\s\S]*on public\.artifacts/i);
});

test('access functions are executable only by authenticated callers',()=>{
  for(const signature of ['has_fas_agent_access\\(text, uuid\\)','list_fas_agent_access\\(\\)']){
    assert.match(sql,new RegExp(`revoke execute on function public\\.${signature} from public, anon`,'i'));
    assert.match(sql,new RegExp(`grant execute on function public\\.${signature} to authenticated`,'i'));
  }
});
