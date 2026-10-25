'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '202610250001_fas_production.sql');

test('production migration defines the canonical project record and security policies', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  for (const table of ['profiles','workspaces','workspace_members','projects','agent_definitions','interview_sessions','answers','facts','evidence_sources','approvals','gaps','conflicts','artifacts','artifact_versions','exports','artifact_dependencies','event_log','launch_tasks','sales_records']) {
    assert.match(sql, new RegExp(`create table(?: if not exists)? public\\.${table}\\b`, 'i'), `missing ${table}`);
  }
  assert.match(sql, /check\s*\(status in \('draft', 'user_approved', 'retired'\)\)/i);
  assert.match(sql, /check\s*\(basis in \('user', 'import', 'suggestion'\)\)/i);
  assert.match(sql, /permission_status/i);
  assert.match(sql, /enable row level security/ig);
  assert.match(sql, /create policy/ig);
  assert.match(sql, /event_log[\s\S]*metadata jsonb/i);
  assert.doesNotMatch(sql, /event_log[\s\S]{0,500}(conversation|answer_text|document_text)/i);
});

