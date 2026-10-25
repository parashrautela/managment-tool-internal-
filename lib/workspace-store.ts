import fs from 'fs';
import path from 'path';
import {
  initialProjects,
  initialIssues,
  initialMilestones,
  initialMembers,
  initialAttachments,
  initialMessages,
  initialWorkspaces,
  initialNotifications,
} from './initial-data';
import { resolveProjectFromInvite } from './project-invite';
import type {
  Project,
  Issue,
  ProjectMilestone,
  TaskAttachment,
  ProjectMessage,
  Member,
  Workspace,
  AppNotification,
} from '../types/workspace';

export interface WorkspaceStoreData {
  projects: Project[];
  issues: Issue[];
  milestones: ProjectMilestone[];
  attachments: TaskAttachment[];
  messages: ProjectMessage[];
  members: Member[];
  workspaces: Workspace[];
  notifications: AppNotification[];
  lastModified: number;
}

const nextCacheDir = path.join(process.cwd(), '.next');
const LEGACY_STORE_PATH = path.join(process.cwd(), '.workspace_store.json');
const STORE_PATH = fs.existsSync(nextCacheDir)
  ? path.join(nextCacheDir, 'workspace_store.json')
  : LEGACY_STORE_PATH;

// Preload JewellIndia project into default seed
const defaultJewellIndia: Project = {
  id: 'proj-1792919942075',
  workspaceId: 'ws-studio',
  name: 'JewellIndia',
  key: 'JWELI',
  description: "A new space for your team's next big idea.",
  color: 'purple',
  ownerId: 'user-current',
  status: 'Planned',
  priority: 'Medium',
  health: 'On track',
  createdAt: '2026-10-25',
};

function getInitialStore(): WorkspaceStoreData {
  return {
    projects: [defaultJewellIndia, ...initialProjects.filter(p => p.id !== defaultJewellIndia.id)],
    issues: [...initialIssues],
    milestones: [...initialMilestones],
    attachments: [...initialAttachments],
    messages: [...initialMessages],
    members: [...initialMembers],
    workspaces: [...initialWorkspaces],
    notifications: [...initialNotifications],
    lastModified: Date.now(),
  };
}

let memoryStore: WorkspaceStoreData | null = null;

export function getStore(): WorkspaceStoreData {
  if (memoryStore) {
    return memoryStore;
  }

  try {
    const fileToRead = fs.existsSync(STORE_PATH)
      ? STORE_PATH
      : (fs.existsSync(LEGACY_STORE_PATH) ? LEGACY_STORE_PATH : null);

    if (fileToRead) {
      const content = fs.readFileSync(fileToRead, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.projects)) {
        // Ensure JewellIndia and initial projects are always present
        const pMap = new Map<string, Project>();
        initialProjects.forEach(p => pMap.set(p.id.toLowerCase(), p));
        pMap.set(defaultJewellIndia.id.toLowerCase(), defaultJewellIndia);
        parsed.projects.forEach((p: Project) => pMap.set(p.id.toLowerCase(), p));

        memoryStore = {
          projects: Array.from(pMap.values()),
          issues: Array.isArray(parsed.issues) ? parsed.issues : [...initialIssues],
          milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [...initialMilestones],
          attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [...initialAttachments],
          messages: Array.isArray(parsed.messages) ? parsed.messages : [...initialMessages],
          members: Array.isArray(parsed.members) ? parsed.members : [...initialMembers],
          workspaces: Array.isArray(parsed.workspaces) ? parsed.workspaces : [...initialWorkspaces],
          notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [...initialNotifications],
          lastModified: parsed.lastModified || Date.now(),
        };
        return memoryStore;
      }
    }
  } catch {
    // Fallback to initial
  }

  memoryStore = getInitialStore();
  saveStore(memoryStore);
  return memoryStore;
}

export function saveStore(store: WorkspaceStoreData) {
  memoryStore = {
    ...store,
    lastModified: Date.now(),
  };
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch {
    // Memory store remains updated
  }
}

export function findProject(query: string): Project | null {
  const store = getStore();
  return resolveProjectFromInvite(query, store.projects);
}

export function upsertProject(project: Project): Project {
  const store = getStore();
  const existingIdx = store.projects.findIndex(
    p => p.id.toLowerCase() === project.id.toLowerCase() || p.key.toLowerCase() === project.key.toLowerCase()
  );

  let updatedProjects: Project[];
  if (existingIdx >= 0) {
    updatedProjects = [...store.projects];
    updatedProjects[existingIdx] = { ...updatedProjects[existingIdx], ...project };
  } else {
    updatedProjects = [project, ...store.projects];
  }

  saveStore({
    ...store,
    projects: updatedProjects,
  });

  return project;
}

export function deleteProjectFromStore(id: string) {
  const store = getStore();
  const pid = id.toLowerCase();
  const updatedProjects = store.projects.filter(p => p.id.toLowerCase() !== pid && p.key.toLowerCase() !== pid);
  const updatedIssues = store.issues.filter(i => i.projectId.toLowerCase() !== pid);
  const updatedMilestones = store.milestones.filter(m => m.projectId.toLowerCase() !== pid);
  const updatedAttachments = store.attachments.filter(a => a.projectId.toLowerCase() !== pid);
  const updatedMessages = store.messages.filter(m => m.projectId.toLowerCase() !== pid);
  const updatedMembers = store.members.filter(m => m.projectId.toLowerCase() !== pid);

  saveStore({
    ...store,
    projects: updatedProjects,
    issues: updatedIssues,
    milestones: updatedMilestones,
    attachments: updatedAttachments,
    messages: updatedMessages,
    members: updatedMembers,
  });
}

export function syncSlice(key: string, data: unknown, meta?: { projectId?: string; deleteId?: string }) {
  const store = getStore();

  switch (key) {
    case 'flowboard_projects': {
      if (meta?.deleteId) {
        deleteProjectFromStore(meta.deleteId);
        break;
      }
      if (Array.isArray(data)) {
        const pMap = new Map<string, Project>();
        store.projects.forEach(p => pMap.set(p.id.toLowerCase(), p));
        (data as Project[]).forEach(p => pMap.set(p.id.toLowerCase(), p));
        saveStore({ ...store, projects: Array.from(pMap.values()) });
      }
      break;
    }
    case 'flowboard_issues': {
      if (Array.isArray(data)) {
        if (meta?.projectId) {
          const pid = meta.projectId.toLowerCase();
          const otherIssues = store.issues.filter(i => i.projectId.toLowerCase() !== pid);
          const incoming = (data as Issue[]).filter(i => i.projectId.toLowerCase() === pid);
          saveStore({ ...store, issues: [...otherIssues, ...incoming] });
        } else {
          const incoming = data as Issue[];
          const pids = new Set(incoming.map(i => i.projectId.toLowerCase()));
          const untouched = store.issues.filter(i => !pids.has(i.projectId.toLowerCase()));
          saveStore({ ...store, issues: [...untouched, ...incoming] });
        }
      }
      break;
    }
    case 'flowboard_milestones': {
      if (Array.isArray(data)) {
        if (meta?.projectId) {
          const pid = meta.projectId.toLowerCase();
          const other = store.milestones.filter(m => m.projectId.toLowerCase() !== pid);
          const incoming = (data as ProjectMilestone[]).filter(m => m.projectId.toLowerCase() === pid);
          saveStore({ ...store, milestones: [...other, ...incoming] });
        } else {
          const incoming = data as ProjectMilestone[];
          const pids = new Set(incoming.map(m => m.projectId.toLowerCase()));
          const untouched = store.milestones.filter(m => !pids.has(m.projectId.toLowerCase()));
          saveStore({ ...store, milestones: [...untouched, ...incoming] });
        }
      }
      break;
    }
    case 'flowboard_members': {
      if (Array.isArray(data)) {
        if (meta?.projectId) {
          const pid = meta.projectId.toLowerCase();
          const other = store.members.filter(m => m.projectId.toLowerCase() !== pid);
          const incoming = (data as Member[]).filter(m => m.projectId.toLowerCase() === pid);
          saveStore({ ...store, members: [...other, ...incoming] });
        } else {
          const incoming = data as Member[];
          const pids = new Set(incoming.map(m => m.projectId.toLowerCase()));
          const untouched = store.members.filter(m => !pids.has(m.projectId.toLowerCase()));
          saveStore({ ...store, members: [...untouched, ...incoming] });
        }
      }
      break;
    }
    case 'flowboard_attachments': {
      if (Array.isArray(data)) {
        if (meta?.projectId) {
          const pid = meta.projectId.toLowerCase();
          const other = store.attachments.filter(a => a.projectId.toLowerCase() !== pid);
          const incoming = (data as TaskAttachment[]).filter(a => a.projectId.toLowerCase() === pid);
          saveStore({ ...store, attachments: [...other, ...incoming] });
        } else {
          const incoming = data as TaskAttachment[];
          const pids = new Set(incoming.map(a => a.projectId.toLowerCase()));
          const untouched = store.attachments.filter(a => !pids.has(a.projectId.toLowerCase()));
          saveStore({ ...store, attachments: [...untouched, ...incoming] });
        }
      }
      break;
    }
    case 'flowboard_messages': {
      if (Array.isArray(data)) {
        if (meta?.projectId) {
          const pid = meta.projectId.toLowerCase();
          const other = store.messages.filter(m => m.projectId.toLowerCase() !== pid);
          const incoming = (data as ProjectMessage[]).filter(m => m.projectId.toLowerCase() === pid);
          saveStore({ ...store, messages: [...other, ...incoming] });
        } else {
          const incoming = data as ProjectMessage[];
          const pids = new Set(incoming.map(m => m.projectId.toLowerCase()));
          const untouched = store.messages.filter(m => !pids.has(m.projectId.toLowerCase()));
          saveStore({ ...store, messages: [...untouched, ...incoming] });
        }
      }
      break;
    }
    case 'flowboard_workspaces': {
      if (Array.isArray(data)) {
        saveStore({ ...store, workspaces: data as Workspace[] });
      }
      break;
    }
    case 'flowboard_notifications': {
      if (Array.isArray(data)) {
        saveStore({ ...store, notifications: data as AppNotification[] });
      }
      break;
    }
  }
}

