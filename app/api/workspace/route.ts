import { getUser } from '../../../lib/auth';
import { getDb } from '../../../db';
import { projects, members, issues } from '../../../db/schema';
import { and, eq, isNull, inArray, sql } from 'drizzle-orm';
import { canManage, canEdit, canChangeMember, roles, statuses, priorities } from '../../../lib/permissions';
export const dynamic = 'force-dynamic';
class RequestError extends Error { constructor(message: string, public status = 400) { super(message); } }
function required(v: unknown, max: number) { if(typeof v !== 'string' || !v.trim() || v.trim().length > max) throw new RequestError(`Please enter text between 1 and ${max} characters.`); return v.trim(); }
function choice(v: unknown, values: readonly string[]) { if(typeof v !== 'string'||!values.includes(v)) throw new RequestError('Invalid selection.'); return v; }
function optional(v: unknown, max: number) { if(v == null || v === '') return ''; return required(v,max); }
async function handle(req: Request) {
 const user = await getUser();
 if(!user) return Response.json({error:'Please sign in to access your workspace.'},{status:401});
 if(req.method !== 'GET' && req.headers.get('origin') !== new URL(req.url).origin) return Response.json({error:'Invalid request origin.'},{status:403});
 const db = getDb(), email = user.email.toLowerCase();
 if(req.method === 'GET') {
  await db.update(members).set({userId:user.userId,name:user.displayName}).where(and(eq(members.email,email),isNull(members.userId)));
  const mine = await db.select().from(members).where(eq(members.userId,user.userId));
  const ids = mine.map(m=>m.projectId);
  return Response.json({user, projects:ids.length?await db.select().from(projects).where(inArray(projects.id,ids)):[], members:ids.length?await db.select().from(members).where(inArray(members.projectId,ids)):[], issues:ids.length?await db.select().from(issues).where(inArray(issues.projectId,ids)):[]});
 }
 const body: unknown = await req.json().catch(()=>{throw new RequestError('Invalid request.');});
 if(!body || typeof body !== 'object' || Array.isArray(body)) throw new RequestError('Invalid request.');
 const b = body as Record<string, unknown>;
 if(b.action === 'createProject') {
  const name=required(b.name,80), key=required(b.key,8).toUpperCase();
  if(!/^[A-Z][A-Z0-9]{1,7}$/.test(key)) throw new RequestError('Use 2–8 letters or numbers for the project key, starting with a letter.');
  const color=choice(b.color,['purple','blue','green','orange']);
  const id=crypto.randomUUID();
  await db.transaction(async tx => {
   await tx.insert(projects).values({id,name,key,description:optional(b.description,1000),color,ownerId:user.userId,createdAt:new Date().toISOString()});
   await tx.insert(members).values({id:crypto.randomUUID(),projectId:id,userId:user.userId,email,name:user.displayName,role:'owner'});
  });
  return Response.json({id});
 }
 const projectId=required(b.projectId,80);
 const [membership]=await db.select().from(members).where(and(eq(members.projectId,projectId),eq(members.userId,user.userId)));
 if(!membership) throw new RequestError('You do not have access to this project.',403);
 const role=membership.role;
 if(b.action === 'invite') {
  if(!canManage(role)) throw new RequestError('Only project owners and admins can add people.',403);
  const invited=required(b.email,254).toLowerCase(), newRole=choice(b.role,roles);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invited)) throw new RequestError('Enter a valid email address.');
  if(newRole==='admin'&&role!=='owner') throw new RequestError('Only the owner can appoint admins.',403);
  const [exists]=await db.select().from(members).where(and(eq(members.projectId,projectId),eq(members.email,invited)));
  if(exists) throw new RequestError('This person already has access.');
  await db.insert(members).values({id:crypto.randomUUID(),projectId,email:invited,name:invited.split('@')[0],role:newRole});
 } else if(b.action === 'changeRole' || b.action === 'removeMember') {
  const [target]=await db.select().from(members).where(and(eq(members.projectId,projectId),eq(members.id,required(b.memberId,80))));
  if(!target||!canChangeMember(role,target.role)) throw new RequestError('You cannot change access for this person.',403);
  if(b.action==='removeMember') await db.delete(members).where(eq(members.id,target.id));
  else { const newRole=choice(b.role,roles); if(newRole==='admin'&&role!=='owner') throw new RequestError('Only the owner can appoint admins.',403); await db.update(members).set({role:newRole}).where(eq(members.id,target.id)); }
 } else if(b.action === 'createIssue' || b.action === 'updateIssue') {
  if(!canEdit(role)) throw new RequestError('Viewers have read-only access.',403);
  const values={title:required(b.title,160),description:optional(b.description,5000),status:choice(b.status,statuses),priority:choice(b.priority,priorities),label:choice(b.label,['Feature','Design','Bug','Research','Task']),assignee:b.assignee?required(b.assignee,80):null};
  if(values.assignee){const [a]=await db.select().from(members).where(and(eq(members.projectId,projectId),eq(members.id,values.assignee)));if(!a)throw new RequestError('Assignee must belong to this project.');}
  if(b.action==='createIssue') {
   await db.transaction(async tx => {
    const [counter] = await tx.update(projects).set({issueCounter:sql`${projects.issueCounter} + 1`}).where(eq(projects.id,projectId)).returning({number:projects.issueCounter});
    await tx.insert(issues).values({...values,id:crypto.randomUUID(),projectId,number:counter.number,createdAt:new Date().toISOString()});
   });
  }
  else {const [issue]=await db.select().from(issues).where(and(eq(issues.projectId,projectId),eq(issues.id,required(b.issueId,80))));if(!issue)throw new RequestError('Issue not found.',404);await db.update(issues).set(values).where(eq(issues.id,issue.id));}
 } else throw new RequestError('Unknown action.');
 return Response.json({ok:true});
}
async function route(req: Request) { try{return await handle(req);}catch(e){if(e instanceof RequestError)return Response.json({error:e.message},{status:e.status});if(e instanceof Error && e.message.includes('not configured'))return Response.json({error:e.message},{status:503});console.error(e);return Response.json({error:'Something went wrong. Please try again.'},{status:500});} }
export const GET=route;
export const POST=route;
