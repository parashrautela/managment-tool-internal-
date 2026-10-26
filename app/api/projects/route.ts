import { NextResponse } from 'next/server';
import { getStore, upsertProject, findProject, syncSlice, deleteProjectFromStore, isProjectDeleted } from '../../../lib/workspace-store';
import type { Project } from '../../../types/workspace';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('key') || searchParams.get('query');
    const store = getStore();

    if (!id) {
      return NextResponse.json({ projects: store.projects });
    }

    const trimmed = id.trim();

    if (isProjectDeleted(trimmed)) {
      return NextResponse.json({ 
        error: 'This project has been deleted by an administrator and the link is no longer valid.',
        isDeleted: true 
      }, { status: 404 });
    }

    const matched = findProject(trimmed);
    if (matched) {
      return NextResponse.json({ project: matched });
    }

    // Fallback: If it's a valid project ID format (e.g. starts with 'proj-'),
    // register it so clients can seamlessly access their project (only if not deleted)
    if (!isProjectDeleted(trimmed) && (trimmed.toLowerCase().startsWith('proj-') || /^[A-Za-z0-9_-]{3,35}$/.test(trimmed))) {
      const cleanKey = trimmed.replace(/^proj-/, '').slice(0, 5).toUpperCase() || 'PROJ';
      const fallbackProject: Project = {
        id: trimmed,
        workspaceId: 'ws-studio',
        name: trimmed.startsWith('proj-') ? `Project ${cleanKey}` : trimmed,
        key: cleanKey,
        description: 'Client shared project workspace',
        color: 'purple',
        ownerId: 'user-admin',
        status: 'In progress',
        priority: 'Medium',
        health: 'On track',
        createdAt: new Date().toISOString().split('T')[0],
      };
      upsertProject(fallbackProject);
      return NextResponse.json({ project: fallbackProject });
    }

    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    if (body.projects && Array.isArray(body.projects)) {
      syncSlice('flowboard_projects', body.projects);
      return NextResponse.json({ success: true, count: body.projects.length });
    }

    if (body.project && typeof body.project === 'object') {
      const saved = upsertProject(body.project);
      return NextResponse.json({ success: true, project: saved });
    }

    if (body.id && body.name) {
      const saved = upsertProject(body as Project);
      return NextResponse.json({ success: true, project: saved });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      deleteProjectFromStore(id);
      return NextResponse.json({ success: true, deletedId: id });
    }
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

