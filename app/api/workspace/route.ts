import { getUser } from '../../../lib/auth';
import { getDb } from '../../../db';
import { projects, members, issues, milestones, attachments, chatMessages, notifications } from '../../../db/schema';
import { and, eq, isNull, inArray, sql, or } from 'drizzle-orm';
import { canManage, canEdit, canChangeMember, roles, statuses, priorities } from '../../../lib/permissions';

export const dynamic = 'force-dynamic';

class RequestError extends Error { 
  constructor(message: string, public status = 400) { 
    super(message); 
  } 
}

function required(v: unknown, max: number) { 
  if(typeof v !== 'string' || !v.trim() || v.trim().length > max) {
    throw new RequestError(`Please enter text between 1 and ${max} characters.`); 
  }
  return v.trim(); 
}

function choice(v: unknown, values: readonly string[]) { 
  if(typeof v !== 'string' || !values.includes(v)) {
    throw new RequestError('Invalid selection.'); 
  }
  return v; 
}

function optional(v: unknown, max: number) { 
  if(v == null || v === '') return ''; 
  return required(v, max); 
}

async function handle(req: Request) {
  const user = await getUser();
  if(!user) return Response.json({error: 'Please sign in to access your workspace.'}, {status: 401});
  if(req.method !== 'GET' && req.headers.get('origin') !== new URL(req.url).origin) {
    return Response.json({error: 'Invalid request origin.'}, {status: 403});
  }

  const db = getDb();
  const email = user.email.toLowerCase();

  if(req.method === 'GET') {
    await db.update(members).set({userId: user.userId, name: user.displayName}).where(and(eq(members.email, email), isNull(members.userId)));
    const mine = await db.select().from(members).where(eq(members.userId, user.userId));
    const ids = mine.map(m => m.projectId);

    const userProjects = ids.length ? await db.select().from(projects).where(inArray(projects.id, ids)) : [];
    const userMembers = ids.length ? await db.select().from(members).where(inArray(members.projectId, ids)) : [];
    const userIssues = ids.length ? await db.select().from(issues).where(inArray(issues.projectId, ids)) : [];
    const userMilestones = ids.length ? await db.select().from(milestones).where(inArray(milestones.projectId, ids)) : [];
    const userAttachments = ids.length ? await db.select().from(attachments).where(inArray(attachments.projectId, ids)) : [];
    const userMessages = ids.length ? await db.select().from(chatMessages).where(inArray(chatMessages.projectId, ids)) : [];
    const userNotifs = await db.select().from(notifications).where(eq(notifications.recipientEmail, email));

    return Response.json({
      user,
      projects: userProjects,
      members: userMembers,
      issues: userIssues,
      milestones: userMilestones,
      attachments: userAttachments,
      chatMessages: userMessages,
      notifications: userNotifs,
    });
  }

  const body: unknown = await req.json().catch(() => { throw new RequestError('Invalid request.'); });
  if(!body || typeof body !== 'object' || Array.isArray(body)) throw new RequestError('Invalid request.');
  const b = body as Record<string, unknown>;

  if(b.action === 'createProject') {
    const name = required(b.name, 80);
    const key = required(b.key, 8).toUpperCase();
    if(!/^[A-Z][A-Z0-9]{1,7}$/.test(key)) {
      throw new RequestError('Use 2–8 letters or numbers for the project key, starting with a letter.');
    }
    const color = choice(b.color, ['purple', 'blue', 'green', 'orange']);
    const id = crypto.randomUUID();
    await db.transaction(async tx => {
      await tx.insert(projects).values({
        id,
        name,
        key,
        description: optional(b.description, 1000),
        color,
        ownerId: user.userId,
        createdAt: new Date().toISOString()
      });
      await tx.insert(members).values({
        id: crypto.randomUUID(),
        projectId: id,
        userId: user.userId,
        email,
        name: user.displayName,
        role: 'owner'
      });
    });
    return Response.json({id});
  }

  const projectId = required(b.projectId, 80);
  const [membership] = await db.select().from(members).where(and(eq(members.projectId, projectId), or(eq(members.userId, user.userId), eq(members.email, email))));
  if(!membership) throw new RequestError('You do not have access to this project.', 403);
  if(!membership.userId) {
    await db.update(members).set({userId: user.userId, name: user.displayName}).where(eq(members.id, membership.id));
  }
  const role = membership.role;

  if(b.action === 'invite') {
    if(!canManage(role)) throw new RequestError('Only project owners and admins can add people.', 403);
    const invited = required(b.email, 254).toLowerCase();
    const newRole = choice(b.role, roles);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invited)) throw new RequestError('Enter a valid email address.');
    if((newRole === 'admin' || newRole === 'project_manager') && role !== 'owner') {
      throw new RequestError('Only the owner can appoint admins.', 403);
    }
    const [exists] = await db.select().from(members).where(and(eq(members.projectId, projectId), eq(members.email, invited)));
    if(exists) throw new RequestError('This person already has access.');
    await db.insert(members).values({
      id: crypto.randomUUID(),
      projectId,
      email: invited,
      name: invited.split('@')[0],
      role: newRole
    });
  } else if(b.action === 'changeRole' || b.action === 'removeMember') {
    const [target] = await db.select().from(members).where(and(eq(members.projectId, projectId), eq(members.id, required(b.memberId, 80))));
    if(!target || !canChangeMember(role, target.role)) throw new RequestError('You cannot change access for this person.', 403);
    if(b.action === 'removeMember') {
      await db.delete(members).where(eq(members.id, target.id));
    } else {
      const newRole = choice(b.role, roles);
      if((newRole === 'admin' || newRole === 'project_manager') && role !== 'owner') {
        throw new RequestError('Only the owner can appoint admins.', 403);
      }
      await db.update(members).set({role: newRole}).where(eq(members.id, target.id));
    }
  } else if(b.action === 'createIssue' || b.action === 'updateIssue') {
    if(!canEdit(role)) throw new RequestError('Viewers have read-only access.', 403);
    const values = {
      title: required(b.title, 160),
      description: optional(b.description, 5000),
      status: choice(b.status, statuses),
      priority: choice(b.priority, priorities),
      label: choice(b.label, ['Feature', 'Design', 'Bug', 'Research', 'Task', 'Feedback']),
      assignee: b.assignee ? required(b.assignee, 80) : null
    };
    if(values.assignee) {
      const [a] = await db.select().from(members).where(and(eq(members.projectId, projectId), eq(members.id, values.assignee)));
      if(!a) throw new RequestError('Assignee must belong to this project.');
    }
    if(b.action === 'createIssue') {
      await db.transaction(async tx => {
        const [counter] = await tx.update(projects).set({issueCounter: sql`${projects.issueCounter} + 1`}).where(eq(projects.id, projectId)).returning({number: projects.issueCounter});
        await tx.insert(issues).values({...values, id: crypto.randomUUID(), projectId, number: counter.number, createdAt: new Date().toISOString()});
      });
    } else {
      const [issue] = await db.select().from(issues).where(and(eq(issues.projectId, projectId), eq(issues.id, required(b.issueId, 80))));
      if(!issue) throw new RequestError('Issue not found.', 404);
      await db.update(issues).set(values).where(eq(issues.id, issue.id));
    }
  } else if(b.action === 'submitFeedback') {
    // Clients and members can submit feedback
    const title = required(b.title, 160);
    const description = optional(b.description, 5000);
    await db.transaction(async tx => {
      const [counter] = await tx.update(projects).set({issueCounter: sql`${projects.issueCounter} + 1`}).where(eq(projects.id, projectId)).returning({number: projects.issueCounter});
      const issueId = crypto.randomUUID();
      await tx.insert(issues).values({
        id: issueId,
        projectId,
        number: counter.number,
        title,
        description,
        status: 'To do',
        priority: 'Medium',
        label: 'Feedback',
        assignee: null,
        createdAt: new Date().toISOString()
      });
      // Notify project owner/managers
      const projectMembers = await tx.select().from(members).where(eq(members.projectId, projectId));
      for(const m of projectMembers) {
        if(m.role === 'owner' || m.role === 'admin' || m.role === 'project_manager') {
          await tx.insert(notifications).values({
            id: crypto.randomUUID(),
            recipientEmail: m.email,
            title: 'New Client Feedback',
            message: `${user.displayName} submitted: "${title}"`,
            type: 'client_feedback',
            projectId,
            issueId,
            read: 0,
            createdAt: new Date().toISOString()
          });
        }
      }
    });
  } else if(b.action === 'createMilestone') {
    if(!canManage(role)) throw new RequestError('Only project managers and admins can create milestones.', 403);
    const title = required(b.title, 120);
    const dueDate = required(b.dueDate, 40);
    await db.insert(milestones).values({
      id: crypto.randomUUID(),
      projectId,
      title,
      description: optional(b.description, 500),
      dueDate,
      status: 'Upcoming',
      progress: 0
    });
  } else if(b.action === 'sendMessage') {
    const content = required(b.content, 2000);
    const id = crypto.randomUUID();
    await db.insert(chatMessages).values({
      id,
      projectId,
      senderId: user.userId,
      senderName: user.displayName,
      senderEmail: email,
      senderRole: role,
      content,
      attachmentsJson: b.attachmentsJson ? String(b.attachmentsJson) : null,
      replyToId: b.replyToId ? String(b.replyToId) : null,
      isClientVisible: 1,
      createdAt: new Date().toISOString()
    });
    return Response.json({id});
  } else if(b.action === 'addAttachment') {
    const name = required(b.name, 255);
    const url = required(b.url, 1000000); // Allow data URLs or links
    const size = typeof b.size === 'number' ? b.size : 0;
    const type = typeof b.type === 'string' ? b.type : 'application/octet-stream';
    const id = crypto.randomUUID();
    await db.insert(attachments).values({
      id,
      projectId,
      taskId: b.taskId ? String(b.taskId) : null,
      name,
      size,
      type,
      url,
      caption: optional(b.caption, 500),
      uploaderName: user.displayName,
      uploaderEmail: email,
      isClientVisible: b.isClientVisible === false ? 0 : 1,
      createdAt: new Date().toISOString()
    });
    return Response.json({id});
  } else throw new RequestError('Unknown action.');

  return Response.json({ok: true});
}

async function route(req: Request) { 
  try {
    return await handle(req);
  } catch(e) {
    if(e instanceof RequestError) return Response.json({error: e.message}, {status: e.status});
    if(e instanceof Error && e.message.includes('not configured')) return Response.json({error: e.message}, {status: 503});
    console.error(e);
    return Response.json({error: 'Something went wrong. Please try again.'}, {status: 500});
  } 
}

export const GET = route;
export const POST = route;
