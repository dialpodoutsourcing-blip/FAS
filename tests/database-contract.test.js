'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '202610250001_fas_production.sql');

test('production migration defines the canonical project record and security policies', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  for (const table of ['profiles','workspaces','workspace_members','projects','agent_definitions','agent_chapters','agent_questions','interview_sessions','answers','facts','evidence_sources','approvals','gaps','conflicts','artifacts','artifact_versions','exports','artifact_dependencies','event_log','launch_tasks','sales_records']) {
    assert.match(sql, new RegExp(`create table(?: if not exists)? public\\.${table}\\b`, 'i'), `missing ${table}`);
  }
  assert.match(sql, /check\s*\(status in \('draft', 'user_approved', 'retired'\)\)/i);
  assert.match(sql, /check\s*\(basis in \('user', 'import', 'suggestion'\)\)/i);
  assert.match(sql, /permission_status/i);
  assert.match(sql, /enable row level security/ig);
  assert.match(sql, /create policy/ig);
  assert.match(sql, /event_log[\s\S]*metadata jsonb/i);
  assert.doesNotMatch(sql, /event_log[\s\S]{0,500}(conversation|answer_text|document_text)/i);
  for (const agent of ['anchor','extract','radar','forge','architect','voice','launch']) {
    assert.match(sql, new RegExp(`'${agent}'`, 'i'), `missing ${agent} seed data`);
  }
  assert.match(sql, /insert into public\.agent_questions/i, 'guided questions must be database seeded');
  assert.match(sql, /agent_questions_read/i, 'authenticated users can read active questions');
  assert.match(sql, /export_theme\s+text\s+not null\s+default\s+'editorial-strategy'/i);
  assert.match(sql, /export_theme\s+in\s*\('editorial-strategy',\s*'luxury-editorial',\s*'boardroom-consultancy'\)/i);
});

