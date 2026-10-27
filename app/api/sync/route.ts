import { NextResponse } from 'next/server';
import { getStore, syncSlice, saveStore } from '../../../lib/workspace-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const since = searchParams.get('since');
    const store = getStore();

    if (since && Number(since) >= store.lastModified) {
      return NextResponse.json({ upToDate: true, lastModified: store.lastModified });
    }

    if (projectId) {
      const pid = projectId.toLowerCase();
      return NextResponse.json({
        projects: store.projects.filter(p => p.id.toLowerCase() === pid || p.key.toLowerCase() === pid),
        issues: store.issues.filter(i => i.projectId.toLowerCase() === pid),
        milestones: store.milestones.filter(m => m.projectId.toLowerCase() === pid),
        attachments: store.attachments.filter(a => a.projectId.toLowerCase() === pid),
        messages: store.messages.filter(m => m.projectId.toLowerCase() === pid),
        members: store.members.filter(m => m.projectId.toLowerCase() === pid),
        deletedProjectIds: store.deletedProjectIds || [],
        lastModified: store.lastModified,
      });
    }

    return NextResponse.json({
      projects: store.projects,
      deletedProjectIds: store.deletedProjectIds || [],
      issues: store.issues,
      milestones: store.milestones,
      attachments: store.attachments,
      messages: store.messages,
      members: store.members,
      workspaces: store.workspaces,
      notifications: store.notifications,
      lastModified: store.lastModified,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Handle key-value slice sync from persist(key, data, meta)
    if (body.key && body.data !== undefined) {
      syncSlice(body.key, body.data, { projectId: body.projectId, deleteId: body.deleteId });
      const store = getStore();
      return NextResponse.json({ success: true, key: body.key, lastModified: store.lastModified });
    }

    // Handle batch sync of multiple collections
    let updated = false;

    if (Array.isArray(body.projects)) {
      syncSlice('flowboard_projects', body.projects, { deleteId: body.deleteProjectId });
      updated = true;
    }
    if (Array.isArray(body.issues)) {
      syncSlice('flowboard_issues', body.issues, { projectId: body.projectId });
      updated = true;
    }
    if (Array.isArray(body.milestones)) {
      syncSlice('flowboard_milestones', body.milestones, { projectId: body.projectId });
      updated = true;
    }
    if (Array.isArray(body.members)) {
      syncSlice('flowboard_members', body.members, { projectId: body.projectId });
      updated = true;
    }
    if (Array.isArray(body.attachments)) {
      syncSlice('flowboard_attachments', body.attachments, { projectId: body.projectId });
      updated = true;
    }
    if (Array.isArray(body.messages)) {
      syncSlice('flowboard_messages', body.messages, { projectId: body.projectId });
      updated = true;
    }

    const store = getStore();
    return NextResponse.json({ success: true, updated, lastModified: store.lastModified });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

