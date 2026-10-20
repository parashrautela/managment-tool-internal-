import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

// Exercise the real route and PostgreSQL queries; only verified auth and DB transport are injected.
const require = createRequire(import.meta.url);
function loadTypeScript(path, replacements = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  }}).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', js)(
    id => Object.hasOwn(replacements, id) ? replacements[id] : require(id), module, module.exports,
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
const actors = Object.fromEntries(['owner','admin','member','viewer','outsider'].map(role => [role, {
  userId: 'test-'+role, email: role+'@example.test', displayName: role,
}]));
let checks = 0;
async function call(actor, body, status = 200, origin = 'http://localhost:3000') {
  currentUser = actors[actor] || null;
  const req = new Request('http://localhost:3000/api/workspace', {
    method: body ? 'POST' : 'GET',
    headers: { origin, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const response = await (body ? route.POST : route.GET)(req);
  const data = await response.json();
  assert.equal(response.status, status, `${actor} ${body?.action || 'read'}: ${JSON.stringify(data)}`);
  checks++;
  return data;
}
try {
  await call('anonymous', null, 401);
  const { id: projectId } = await call('owner', {action:'createProject',name:'Verification',key:'QA',description:'',color:'purple'});
  for (const role of ['viewer','member','admin']) await call('owner', {action:'invite',projectId,email:actors[role].email,role});
  const viewer = await call('viewer', null);
  assert(viewer.projects.some(p => p.id === projectId)); checks++;
  const ownerData = await call('owner', null);
  const owner = ownerData.members.find(m => m.projectId === projectId && m.role === 'owner');
  const outsider = await call('outsider', null);
  assert.equal(outsider.projects.length, 0); checks++;
  assert.equal(outsider.members.length, 0); checks++;
  const issue = {action:'createIssue',projectId,title:'Verify authorization',description:'',status:'To do',priority:'Medium',label:'Task',assignee:''};
  await call('viewer', issue, 403);
  await call('outsider', issue, 403);
  await call('member', null);
  await call('member', issue);
  await call('member', {action:'invite',projectId,email:'denied@example.test',role:'viewer'}, 403);
  await call('admin', null);
  await call('admin', {action:'changeRole',projectId,memberId:owner.id,role:'viewer'}, 403);
  await call('owner', {action:'changeRole',projectId,memberId:owner.id,role:'viewer'}, 403);
  await call('admin', {action:'invite',projectId,email:'denied@example.test',role:'admin'}, 403);
  await call('owner', {...issue,assignee:'not-a-member'}, 400);
  await call('owner', {...issue,status:'Invalid'}, 400);
  await call('owner', issue, 403, 'https://untrusted.example');
  await call('owner', {action:'createProject',name:'Bad key',key:'!bad',color:'blue'}, 400);
  await Promise.all([call('owner', issue),call('owner', issue),call('owner', issue)]);
  const data = await call('owner', null);
  const numbers = data.issues.map(i => i.number);
  assert.equal(new Set(numbers).size, numbers.length); checks++;
  assert.deepEqual(numbers.sort(), [1,2,3,4]); checks++;
  const added = data.issues[0];
  await call('viewer', {...issue,action:'updateIssue',issueId:added.id,status:'Done'}, 403);
  await call('member', {...issue,action:'updateIssue',issueId:added.id,status:'Done'});
  const viewerMember = data.members.find(m => m.role === 'viewer');
  await call('owner', {action:'changeRole',projectId,memberId:viewerMember.id,role:'member'});
  await call('viewer', issue);
  await call('owner', {action:'removeMember',projectId,memberId:viewerMember.id});
  await call('viewer', null);
  await call('viewer', issue, 403);
  const rls = await pg.query("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'");
  assert(rls.rows.every(table => table.rowsecurity)); checks++;
  const privileges = await pg.query("SELECT has_table_privilege('authenticated','public.projects','SELECT') AS allowed");
  assert.equal(privileges.rows[0].allowed, false); checks++;
  let authResult = { data: { user: null }, error: null };
  const auth = loadTypeScript('../lib/auth.ts', {
    'server-only': {},
    './supabase/server': { createClient: async () => ({ auth: { getUser: async () => authResult } }) },
  });
  assert.equal(await auth.getUser(), null); checks++;
  authResult = {data:{user:{id:'verified',email:'PERSON@example.test',email_confirmed_at:null,user_metadata:{}}},error:null};
  assert.equal(await auth.getUser(), null); checks++;
  authResult.data.user.email_confirmed_at = '2026-10-20T00:00:00Z';
  authResult.data.user.user_metadata.full_name = {invalid:true};
  assert.deepEqual(await auth.getUser(), {userId:'verified',email:'person@example.test',displayName:'PERSON'}); checks++;
  authResult.error = {message:'Expired or invalid token'};
  assert.equal(await auth.getUser(), null); checks++;
  console.log(`PostgreSQL route integration: ${checks} checks passed. Auth sessions are mocked; Supabase login requires project credentials.`);
} finally { await pg.close(); }
