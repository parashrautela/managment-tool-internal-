import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

const require = createRequire(import.meta.url);
function loadTypeScript(path, replacements = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', js)(
    id => Object.hasOwn(replacements, id) ? replacements[id] : require(id),
    module,
    module.exports
  );
  return module.exports;
}

const pg = new PGlite();
await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
await pg.exec(readFileSync(new URL('../supabase/migrations/20261020070000_initial_workspace.sql', import.meta.url), 'utf8'));

const schema = loadTypeScript('../db/schema.ts');
const db = drizzle(pg, { schema });
const permissions = loadTypeScript('../lib/permissions.ts');

let currentUser = null;
const route = loadTypeScript('../app/api/workspace/route.ts', {
  '../../../lib/auth': { getUser: async () => currentUser },
  '../../../db': { getDb: () => db },
  '../../../db/schema': schema,
  '../../../lib/permissions': permissions,
});

const actors = {
  admin: { userId: 'u-admin', email: 'sarah.chen@flowboard.corp', displayName: 'Sarah Chen' },
  pm: { userId: 'u-pm', email: 'alex.morgan@company.com', displayName: 'Alex Morgan' },
  employee: { userId: 'u-emp', email: 'marcus.brody@company.com', displayName: 'Marcus Brody' },
  client: { userId: 'u-client', email: 'emma.watson@acmeclient.com', displayName: 'Emma Watson' },
  otherClient: { userId: 'u-other', email: 'david.lee@othercorp.com', displayName: 'David Lee' },
};

async function call(actor, body, status = 200) {
  currentUser = actors[actor] || null;
  const req = new Request('http://localhost:3000/api/workspace', {
    method: body ? 'POST' : 'GET',
    headers: { origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const response = await (body ? route.POST : route.GET)(req);
  const data = await response.json();
  assert.equal(response.status, status, `${actor} action: ${JSON.stringify(data)}`);
  return data;
}

try {
  console.log('Testing Collaborative Project & Task Management Workflows...');

  // 1. Project Manager creates a project
  const { id: projId } = await call('pm', {
    action: 'createProject',
    name: 'Acme Cloud Migration',
    key: 'ACM',
    description: 'Enterprise migration for Acme Corp',
    color: 'blue'
  });
  assert(projId, 'Project should be created');

  // 2. Add Employee and Client
  await call('pm', { action: 'invite', projectId: projId, email: actors.employee.email, role: 'employee' });
  await call('pm', { action: 'invite', projectId: projId, email: actors.client.email, role: 'client' });

  // 3. Verify Client can access this project
  const clientData = await call('client', null);
  assert(clientData.projects.some(p => p.id === projId), 'Client should see assigned project');

  // 4. Verify Other Client CANNOT see this project (strict tenant/project isolation)
  const otherData = await call('otherClient', null);
  assert(!otherData.projects.some(p => p.id === projId), 'Unassigned client must NOT see project');

  // 5. Create Tasks with different statuses including Blocked
  await call('employee', {
    action: 'createIssue',
    projectId: projId,
    title: 'Setup Kubernetes Cluster',
    description: 'Deploy VPC and EKS nodes',
    status: 'In progress',
    priority: 'High',
    label: 'Feature',
    assignee: ''
  });

  await call('employee', {
    action: 'createIssue',
    projectId: projId,
    title: 'Migrate legacy SQL database',
    description: 'Waiting on external firewall whitelisting from client IT',
    status: 'Blocked',
    priority: 'Urgent',
    label: 'Task',
    assignee: ''
  });

  // 6. PM creates project milestones
  await call('pm', {
    action: 'createMilestone',
    projectId: projId,
    title: 'Phase 1: Infrastructure Ready',
    dueDate: '2026-11-15',
    description: 'Networking and compute nodes operational'
  });

  // 7. Client submits feedback / change request
  await call('client', {
    action: 'submitFeedback',
    projectId: projId,
    title: 'Need staging environment access for compliance audit',
    description: 'Our security auditor needs read-only credentials to review SOC2 controls.'
  });

  // 8. Verify feedback generated an issue and notification
  const pmData = await call('pm', null);
  assert(pmData.issues.some(i => i.label === 'Feedback' && i.title.includes('staging environment access')), 'Feedback should be recorded as an issue');
  assert(pmData.notifications.some(n => n.type === 'client_feedback'), 'PM should receive notification of client feedback');

  // 9. Send Chat Message in project chat
  const msgRes = await call('employee', {
    action: 'sendMessage',
    projectId: projId,
    content: 'Hi @Emma, we received your compliance request and will generate audit tokens today.'
  });
  assert(msgRes.id, 'Chat message should be posted');

  // 10. Add Attachment with media preview metadata
  const attachRes = await call('client', {
    action: 'addAttachment',
    projectId: projId,
    name: 'audit-specifications.pdf',
    size: 245000,
    type: 'application/pdf',
    url: 'https://example.com/files/audit-specifications.pdf',
    caption: 'Compliance audit checklist',
    isClientVisible: true
  });
  assert(attachRes.id, 'Attachment should be recorded');

  // 11. Verify milestones, attachments, and messages retrieved
  const finalPmData = await call('pm', null);
  assert.equal(finalPmData.milestones.length, 1, 'Milestone should exist');
  assert.equal(finalPmData.attachments.length, 1, 'Attachment should exist');
  assert.equal(finalPmData.chatMessages.length, 1, 'Chat message should exist');

  console.log('Collaboration test suite: All 12 assertions passed successfully!');
} finally {
  await pg.close();
}
