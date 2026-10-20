'use client';
import { useEffect, useState, useMemo, type FormEvent } from 'react';
import { 
  ArrowUpRight, 
  ArrowRight, 
  ArrowLeft, 
  Search, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  Bell, 
  CircleHelp, 
  Settings, 
  ChevronsUpDown, 
  MoreHorizontal, 
  Users, 
  Layers, 
  CheckCheck, 
  SlidersHorizontal, 
  X, 
  Check, 
  CalendarDays, 
  Flag, 
  Circle, 
  CheckCircle2, 
  Clock3, 
  Link2, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  PanelLeftClose, 
  FolderKanban, 
  BarChart3, 
  Inbox,
  Filter,
  Eye,
  Activity,
  Compass
} from 'lucide-react';
import { canManage, canEdit, canChangeMember, statuses, priorities } from '../lib/permissions';
import type { 
  Workspace, 
  Project, 
  Member, 
  Issue, 
  ActivityItem, 
  Invitation, 
  UserProfile, 
  PriorityLevel, 
  ProjectStatus 
} from '../types/workspace';
import { 
  initialWorkspaces, 
  initialProjects, 
  initialMembers, 
  initialIssues, 
  initialActivities, 
  initialInvitations, 
  initialUserProfile, 
  projectTemplates 
} from '../lib/initial-data';
import { CommandMenu } from '../components/command-menu';
import { OnboardingWizard } from '../components/onboarding-wizard';
import { IssueDrawer } from '../components/issue-drawer';
import { ProjectOverview } from '../components/project-overview';
import { ProjectModal } from '../components/project-modal';
import { WorkspaceModal } from '../components/workspace-modal';
import { SettingsDialog } from '../components/settings-dialog';
import { InstallButton } from '../components/install-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


type ApiData = {
  user: { userId: string; displayName: string; email: string };
  projects: Project[];
  members: Member[];
  issues: Issue[];
};

const roleText: Record<string, string> = {
  owner: 'Full control of this project, workspace settings, and its people.',
  admin: 'Manage issues, configure project settings, and invite team members.',
  member: 'Create, update, and collaborate on issues and boards.',
  guest: 'View explicitly shared project issues with read-only permissions.',
  viewer: 'View explicitly shared project issues with read-only permissions.'
};

function initials(name: string) {
  return name.split(/[\s@.]+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
}

function Avatar({ name, index = 0, small = false }: { name: string; index?: number; small?: boolean }) {
  return <span title={name} className={`avatar av-${index % 5} ${small ? 'small' : ''}`}>{initials(name)}</span>;
}

function ProjectIcon({ color = 'purple', size = '' }: { color?: string; size?: string }) {
  return (
    <span className={`project-icon ${color} ${size}`}>
      <FolderKanban size={size === 'mini' ? 15 : 22} />
    </span>
  );
}

export default function WorkspaceApp() {
  // Backend sync state
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Primary navigation & view state
  const [page, setPage] = useState<'projects' | 'my-issues' | 'people'>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [tab, setTab] = useState<'Overview' | 'Board' | 'List' | 'People' | 'Settings'>('Board');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sidebar, setSidebar] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'owned' | 'shared'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('All priorities');
  const [statusFilter, setStatusFilter] = useState<string>('All statuses');

  // Domain entities state with local persistence
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [currentWsId, setCurrentWsId] = useState<string>(initialWorkspaces[0].id);
  const [allProjects, setAllProjects] = useState<Project[]>(initialProjects);
  const [allMembers, setAllMembers] = useState<Member[]>(initialMembers);
  const [allIssues, setAllIssues] = useState<Issue[]>(initialIssues);
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);

  // Modals & Panels state
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [wsModalMode, setWsModalMode] = useState<'switch' | 'create' | 'settings' | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [activeDrawerIssue, setActiveDrawerIssue] = useState<Issue | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickIssueModalOpen, setIsQuickIssueModalOpen] = useState(false);
  const [quickIssueInitialStatus, setQuickIssueInitialStatus] = useState<string>('To do');
  const [qiTitle, setQiTitle] = useState('');
  const [qiDescription, setQiDescription] = useState('');
  const [qiStatus, setQiStatus] = useState('To do');
  const [qiPriority, setQiPriority] = useState<PriorityLevel>('Medium');
  const [qiAssignee, setQiAssignee] = useState('unassigned');
  const [qiLabel, setQiLabel] = useState<string>('Task');

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');


  // Hydrate local storage once on mount
  useEffect(() => {
    try {
      const savedWs = localStorage.getItem('flowboard_workspaces');
      if (savedWs) setWorkspaces(JSON.parse(savedWs));
      const savedCurWs = localStorage.getItem('flowboard_current_ws');
      if (savedCurWs) setCurrentWsId(savedCurWs);
      const savedProjects = localStorage.getItem('flowboard_projects');
      if (savedProjects) setAllProjects(JSON.parse(savedProjects));
      const savedMembers = localStorage.getItem('flowboard_members');
      if (savedMembers) setAllMembers(JSON.parse(savedMembers));
      const savedIssues = localStorage.getItem('flowboard_issues');
      if (savedIssues) setAllIssues(JSON.parse(savedIssues));
      const savedActivities = localStorage.getItem('flowboard_activities');
      if (savedActivities) setActivities(JSON.parse(savedActivities));
      const savedProfile = localStorage.getItem('flowboard_profile');
      if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    } catch {
      // LocalStorage unavailable, use defaults
    }
  }, []);

  // Save changes to localStorage
  function persist<T>(key: string, data: T) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }

  // Refresh backend if Supabase is connected
  async function refreshBackend() {
    try {
      const r = await fetch('/api/workspace');
      const d = (await r.json()) as ApiData & { error?: string };
      if (!r.ok) throw new Error(d.error);
      setApiData(d);
      return d;
    } catch (e: any) {
      // Fallback to local demo mode silently
    }
  }

  useEffect(() => {
    refreshBackend().finally(() => setLoading(false));
  }, []);

  // Auto-dismiss notification toast
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  // Global Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandMenuOpen(false);
        setIsOnboardingOpen(false);
        setWsModalMode(null);
        setIsProjectModalOpen(false);
        setActiveDrawerIssue(null);
        setIsSettingsOpen(false);
        setIsQuickIssueModalOpen(false);
        setIsInviteModalOpen(false);
        setIsHelpModalOpen(false);
        setMenu(null);
        setSidebar(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Current Workspace Scoping
  const currentWorkspace = useMemo(() => {
    return workspaces.find(w => w.id === currentWsId) || workspaces[0] || initialWorkspaces[0];
  }, [workspaces, currentWsId]);

  // Projects scoped to workspace
  const workspaceProjects = useMemo(() => {
    return allProjects.filter(p => !p.workspaceId || p.workspaceId === currentWorkspace.id);
  }, [allProjects, currentWorkspace.id]);

  // Current Selected Project
  const currentProject = useMemo(() => {
    return workspaceProjects.find(p => p.id === selectedProjectId) || null;
  }, [workspaceProjects, selectedProjectId]);

  // Project Members & Issues
  const currentProjectMembers = useMemo(() => {
    if (!currentProject) return allMembers.filter(m => workspaceProjects.some(p => p.id === m.projectId));
    return allMembers.filter(m => m.projectId === currentProject.id);
  }, [allMembers, currentProject, workspaceProjects]);

  const currentProjectIssues = useMemo(() => {
    if (!currentProject) return allIssues.filter(i => workspaceProjects.some(p => p.id === i.projectId));
    return allIssues.filter(i => i.projectId === currentProject.id);
  }, [allIssues, currentProject, workspaceProjects]);

  // User Role calculation
  const isDemo = !apiData?.projects?.length;
  const userRole = useMemo(() => {
    if (!currentProject) return 'owner';
    const found = currentProjectMembers.find(m => m.email === userProfile.email || m.userId === apiData?.user?.userId);
    return (found?.role as string) || (isDemo ? 'owner' : 'viewer');
  }, [currentProject, currentProjectMembers, userProfile.email, apiData?.user?.userId, isDemo]);

  // Log activity helper
  function addActivity(action: string, target: string) {
    const act: ActivityItem = {
      id: 'act-' + Date.now(),
      workspaceId: currentWorkspace.id,
      projectId: currentProject?.id,
      actorName: userProfile.displayName,
      actorEmail: userProfile.email,
      action,
      target,
      timestamp: 'Just now',
    };
    const updated = [act, ...activities];
    setActivities(updated);
    persist('flowboard_activities', updated);
  }

  // Navigation helpers
  function navigateToProject(projectId: string | null, nextTab: typeof tab = 'Board') {
    setSelectedProjectId(projectId);
    setTab(nextTab);
    setQuery('');
    setPriorityFilter('All priorities');
    setStatusFilter('All statuses');
    setSidebar(false);
  }

  function navigateToPage(targetPage: typeof page) {
    setSelectedProjectId(null);
    setPage(targetPage);
    setQuery('');
    setPriorityFilter('All priorities');
    setStatusFilter('All statuses');
    setSidebar(false);
  }

  // Workspace Actions (Flow 2)
  async function handleSelectWorkspace(wsId: string) {
    setCurrentWsId(wsId);
    setSelectedProjectId(null);
    setPage('projects');
    localStorage.setItem('flowboard_current_ws', wsId);
    setNotice(`Switched to ${workspaces.find(w => w.id === wsId)?.name || 'workspace'}.`);
  }

  async function handleCreateWorkspace(data: { name: string; slug: string; description: string; color: string }) {
    const newWs: Workspace = {
      id: 'ws-' + Date.now(),
      name: data.name,
      slug: data.slug,
      description: data.description,
      logo: data.name.slice(0, 1).toUpperCase(),
      color: data.color,
      ownerId: 'user-current',
      memberCount: 1,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [...workspaces, newWs];
    setWorkspaces(updated);
    persist('flowboard_workspaces', updated);
    setCurrentWsId(newWs.id);
    localStorage.setItem('flowboard_current_ws', newWs.id);
    addActivity('created workspace', newWs.name);
    setNotice(`Workspace ${newWs.name} created!`);
  }

  async function handleUpdateWorkspace(wsId: string, patch: Partial<Workspace>) {
    const updated = workspaces.map(w => w.id === wsId ? { ...w, ...patch } : w);
    setWorkspaces(updated);
    persist('flowboard_workspaces', updated);
    addActivity('updated workspace settings for', currentWorkspace.name);
    setNotice('Workspace settings updated.');
  }

  async function handleDeleteWorkspace(wsId: string) {
    if (workspaces.length <= 1) return;
    const remaining = workspaces.filter(w => w.id !== wsId);
    setWorkspaces(remaining);
    persist('flowboard_workspaces', remaining);
    setCurrentWsId(remaining[0].id);
    localStorage.setItem('flowboard_current_ws', remaining[0].id);
    setNotice('Workspace deleted.');
  }

  // Project Actions (Flow 3)
  async function handleSaveProject(data: {
    id?: string;
    name: string;
    key: string;
    description: string;
    color: 'purple' | 'blue' | 'green' | 'orange';
    priority?: PriorityLevel;
    status?: ProjectStatus;
    startDate?: string;
    dueDate?: string;
    health?: 'On track' | 'At risk' | 'Delayed';
    templateId?: string;
    action?: 'create' | 'update' | 'archive' | 'delete';
  }) {
    if (data.id) {
      // Update existing
      const updated = allProjects.map(p => {
        if (p.id === data.id) {
          return {
            ...p,
            name: data.name,
            key: data.key,
            description: data.description,
            color: data.color,
            priority: data.priority || p.priority,
            status: data.status || p.status,
            startDate: data.startDate,
            dueDate: data.dueDate,
            health: data.health || p.health,
          };
        }
        return p;
      });
      setAllProjects(updated);
      persist('flowboard_projects', updated);
      addActivity('updated project details for', data.name);
      setNotice(`Project ${data.name} updated.`);
    } else {
      // Create new
      const newProjectId = 'proj-' + Date.now();
      const newProject: Project = {
        id: newProjectId,
        workspaceId: currentWorkspace.id,
        name: data.name,
        key: data.key,
        description: data.description,
        color: data.color,
        ownerId: 'user-current',
        status: data.status || 'In progress',
        priority: data.priority || 'Medium',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        dueDate: data.dueDate,
        health: data.health || 'On track',
        createdAt: new Date().toISOString().split('T')[0],
      };

      // Add self as owner
      const newMember: Member = {
        id: 'm-' + Date.now(),
        projectId: newProjectId,
        workspaceId: currentWorkspace.id,
        userId: 'user-current',
        email: userProfile.email,
        name: userProfile.displayName,
        role: 'owner',
        title: userProfile.title,
        status: 'active',
        joinedAt: new Date().toISOString().split('T')[0],
      };

      // If template was selected, pre-populate default issues
      let starterIssues: Issue[] = [];
      if (data.templateId) {
        const tpl = projectTemplates.find(t => t.id === data.templateId);
        if (tpl) {
          starterIssues = tpl.defaultIssues.map((di, idx) => ({
            id: `iss-${newProjectId}-${idx}`,
            projectId: newProjectId,
            number: idx + 1,
            title: di.title,
            description: `Deliverable generated from template: ${tpl.name}`,
            status: idx === 0 ? 'In progress' : 'To do',
            priority: di.priority,
            label: di.label,
            assignee: newMember.id,
            createdAt: new Date().toISOString().split('T')[0],
          }));
        }
      }

      const updatedProjects = [newProject, ...allProjects];
      const updatedMembers = [...allMembers, newMember];
      const updatedIssues = [...allIssues, ...starterIssues];

      setAllProjects(updatedProjects);
      setAllMembers(updatedMembers);
      setAllIssues(updatedIssues);

      persist('flowboard_projects', updatedProjects);
      persist('flowboard_members', updatedMembers);
      persist('flowboard_issues', updatedIssues);

      addActivity('created project', newProject.name);
      setNotice(`Project ${newProject.name} is ready!`);
      navigateToProject(newProjectId, 'Board');
    }
  }

  async function handleDeleteProject(projectId: string) {
    const p = allProjects.find(item => item.id === projectId);
    const updated = allProjects.filter(item => item.id !== projectId);
    setAllProjects(updated);
    persist('flowboard_projects', updated);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
    if (p) addActivity('deleted project', p.name);
    setNotice('Project removed.');
  }

  // Issue Actions
  function handleSaveDrawerIssue(updated: Issue) {
    const isNew = !allIssues.some(i => i.id === updated.id);
    let newIssues: Issue[];
    if (isNew) {
      newIssues = [updated, ...allIssues];
      addActivity('created issue', `${currentProject?.key || 'TASK'}-${updated.number}`);
    } else {
      newIssues = allIssues.map(i => i.id === updated.id ? updated : i);
      addActivity('updated issue', `${currentProject?.key || 'TASK'}-${updated.number}`);
    }
    setAllIssues(newIssues);
    persist('flowboard_issues', newIssues);
    setActiveDrawerIssue(updated);
    setNotice(isNew ? 'Issue created.' : 'Issue updated.');
  }

  function handleDeleteDrawerIssue(issueId: string) {
    const issue = allIssues.find(i => i.id === issueId);
    const updated = allIssues.filter(i => i.id !== issueId);
    setAllIssues(updated);
    persist('flowboard_issues', updated);
    setActiveDrawerIssue(null);
    if (issue) addActivity('deleted issue', `${currentProject?.key || 'TASK'}-${issue.number}`);
    setNotice('Issue deleted.');
  }

  function handleMoveIssue(issue: Issue, newStatus: string) {
    if (!canEdit(userRole)) return;
    const updated: Issue = { ...issue, status: newStatus as any };
    const list = allIssues.map(i => i.id === issue.id ? updated : i);
    setAllIssues(list);
    persist('flowboard_issues', list);
    addActivity(`moved ${currentProject?.key}-${issue.number} to`, newStatus);
    setNotice(`Issue moved to ${newStatus}.`);
  }

  // Team & Member Actions (Flow 4)
  function handleMemberAction(m: Member, action: 'changeRole' | 'removeMember', newRole?: string) {
    if (action === 'removeMember') {
      if (!confirm(`Remove ${m.name} from this project?`)) return;
      const updated = allMembers.filter(item => item.id !== m.id);
      setAllMembers(updated);
      persist('flowboard_members', updated);
      addActivity('removed member', m.name);
      setNotice('Member removed.');
    } else if (action === 'changeRole' && newRole) {
      const updated = allMembers.map(item => item.id === m.id ? { ...item, role: newRole as any } : item);
      setAllMembers(updated);
      persist('flowboard_members', updated);
      addActivity(`updated role for ${m.name} to`, newRole);
      setNotice('Member role updated.');
    }
  }

  function handleInviteSubmit(e: FormEvent) {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    const role = inviteRole;

    if (!email) return;

    const newMember: Member = {
      id: 'm-' + Date.now(),
      projectId: currentProject ? currentProject.id : workspaceProjects[0]?.id || 'ws-proj',
      workspaceId: currentWorkspace.id,
      userId: null,
      email,
      name: email.split('@')[0].replace(/[._-]/g, ' '),
      role: role as any,
      status: 'pending',
      joinedAt: new Date().toISOString().split('T')[0],
    };

    const newInv: Invitation = {
      id: 'inv-' + Date.now(),
      workspaceId: currentWorkspace.id,
      projectId: currentProject?.id,
      email,
      role: role as any,
      status: 'pending',
      invitedAt: new Date().toISOString().split('T')[0],
    };

    const updatedMembers = [...allMembers, newMember];
    const updatedInvs = [newInv, ...invitations];

    setAllMembers(updatedMembers);
    setInvitations(updatedInvs);

    persist('flowboard_members', updatedMembers);
    persist('flowboard_invitations', updatedInvs);

    addActivity('invited teammate', email);
    setNotice(`Invitation granted to ${email}.`);
    setInviteEmail('');
    setIsInviteModalOpen(false);
  }

  // Onboarding Wizard Complete (Flow 1)
  function handleOnboardingComplete(data: {
    profile: { name: string; title: string };
    workspace: { name: string; slug: string; color: string; size: string };
    project: { name: string; key: string; color: 'purple' | 'blue' | 'green' | 'orange'; templateId?: string };
    invites: string[];
  }) {
    // 1. Update Profile
    const updatedProfile: UserProfile = {
      ...userProfile,
      displayName: data.profile.name,
      title: data.profile.title,
    };
    setUserProfile(updatedProfile);
    persist('flowboard_profile', updatedProfile);

    // 2. Create Workspace
    const newWsId = 'ws-' + Date.now();
    const newWs: Workspace = {
      id: newWsId,
      name: data.workspace.name,
      slug: data.workspace.slug,
      description: 'Primary team workspace',
      logo: data.workspace.name.slice(0, 1).toUpperCase(),
      color: data.workspace.color,
      ownerId: 'user-current',
      memberCount: 1 + data.invites.length,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const nextWsList = [...workspaces, newWs];
    setWorkspaces(nextWsList);
    persist('flowboard_workspaces', nextWsList);
    setCurrentWsId(newWsId);
    localStorage.setItem('flowboard_current_ws', newWsId);

    // 3. Create Project & Template Issues
    handleSaveProject({
      name: data.project.name,
      key: data.project.key,
      description: 'First project setup via Flowboard onboarding wizard',
      color: data.project.color,
      templateId: data.project.templateId,
    });

    // 4. Add Invites
    const newInvMembers: Member[] = data.invites.map((email, idx) => ({
      id: `m-inv-${Date.now()}-${idx}`,
      projectId: 'proj-new',
      workspaceId: newWsId,
      userId: null,
      email,
      name: email.split('@')[0].replace(/[._-]/g, ' '),
      role: 'member',
      status: 'pending',
    }));
    const nextMembers = [...allMembers, ...newInvMembers];
    setAllMembers(nextMembers);
    persist('flowboard_members', nextMembers);

    setNotice('Welcome! Your workspace and project are ready to roll.');
  }

  // Profile Settings Save (Flow 6)
  async function handleSaveProfile(updated: UserProfile) {
    setUserProfile(updated);
    persist('flowboard_profile', updated);
    addActivity('updated personal profile and preferences', updated.displayName);
  }

  // Quick Issue Creation from Kanban Column
  function handleQuickIssueSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentProject) return;
    const title = qiTitle.trim();
    if (!title) return;

    const nextNum = currentProjectIssues.length + 1;
    const newIssue: Issue = {
      id: `iss-${currentProject.id}-${Date.now()}`,
      projectId: currentProject.id,
      number: nextNum,
      title,
      description: qiDescription.trim(),
      status: (qiStatus as any) || quickIssueInitialStatus,
      priority: qiPriority,
      label: (qiLabel as any) || 'Task',
      assignee: qiAssignee && qiAssignee !== 'unassigned' ? qiAssignee : null,
      createdAt: new Date().toISOString().split('T')[0],
      comments: [],
    };

    const nextIssues = [newIssue, ...allIssues];
    setAllIssues(nextIssues);
    persist('flowboard_issues', nextIssues);
    addActivity('created issue', `${currentProject.key}-${nextNum}`);
    setNotice(`Issue ${currentProject.key}-${nextNum} created!`);
    setQiTitle('');
    setQiDescription('');
    setQiAssignee('unassigned');
    setIsQuickIssueModalOpen(false);
  }

  // Filtered views calculation
  const visibleProjects = useMemo(() => {
    return workspaceProjects.filter(p => {
      const matchQuery = (p.name + ' ' + p.description + ' ' + p.key).toLowerCase().includes(query.toLowerCase());
      const matchFilter = filter === 'all' || (filter === 'owned' ? p.ownerId === 'user-current' : p.ownerId !== 'user-current');
      return matchQuery && matchFilter;
    });
  }, [workspaceProjects, query, filter]);

  const visibleIssues = useMemo(() => {
    const pool = currentProject 
      ? currentProjectIssues 
      : allIssues.filter(i => {
          const m = allMembers.find(mem => mem.id === i.assignee);
          return m && (m.email === userProfile.email || m.userId === apiData?.user?.userId);
        });

    return pool.filter(i => {
      const matchText = (i.title + ' ' + i.number + ' ' + (i.description || '')).toLowerCase().includes(query.toLowerCase());
      const matchPriority = priorityFilter === 'All priorities' || i.priority === priorityFilter;
      const matchStatus = statusFilter === 'All statuses' || i.status === statusFilter;
      return matchText && matchPriority && matchStatus;
    });
  }, [currentProject, currentProjectIssues, allIssues, allMembers, userProfile.email, apiData?.user?.userId, query, priorityFilter, statusFilter]);

  const isFiltering = query.trim() !== '' || priorityFilter !== 'All priorities' || statusFilter !== 'All statuses';

  const completedIssuesCount = currentProjectIssues.filter(i => i.status === 'Done').length;
  const inProgressIssuesCount = currentProjectIssues.filter(i => i.status === 'In progress').length;

  return (
    <div className="app-shell">
      {/* GLOBAL SEARCH COMMAND MENU (Cmd+K) */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        projects={workspaceProjects}
        onSelectProject={id => navigateToProject(id, 'Board')}
        issues={visibleIssues}
        onSelectIssue={issue => {
          navigateToProject(issue.projectId, 'Board');
          setActiveDrawerIssue(issue);
        }}
        members={currentProjectMembers}
        onSelectMember={() => navigateToPage('people')}
        onAction={act => {
          if (act === 'createProject') {
            setProjectToEdit(null);
            setIsProjectModalOpen(true);
          } else if (act === 'createIssue') {
            if (currentProject) {
              setQuickIssueInitialStatus('To do');
              setIsQuickIssueModalOpen(true);
            } else if (workspaceProjects[0]) {
              navigateToProject(workspaceProjects[0].id, 'Board');
              setIsQuickIssueModalOpen(true);
            }
          } else if (act === 'invite') {
            setIsInviteModalOpen(true);
          } else if (act === 'settings') {
            setIsSettingsOpen(true);
          } else if (act === 'onboarding') {
            setIsOnboardingOpen(true);
          }
        }}
      />

      {/* CONTEXTUAL ISSUE DRAWER */}
      <IssueDrawer
        issue={activeDrawerIssue}
        onClose={() => setActiveDrawerIssue(null)}
        onUpdate={handleSaveDrawerIssue}
        onDelete={handleDeleteDrawerIssue}
        members={currentProjectMembers}
        projectKey={currentProject?.key || 'TASK'}
        canEdit={canEdit(userRole)}
      />

      {/* FIRST TIME ONBOARDING WIZARD */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={handleOnboardingComplete}
        initialWorkspace={currentWorkspace}
      />

      {/* WORKSPACE SWITCHER & SETTINGS MODAL */}
      {wsModalMode && (
        <WorkspaceModal
          isOpen={Boolean(wsModalMode)}
          onClose={() => setWsModalMode(null)}
          mode={wsModalMode}
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          onSelectWorkspace={handleSelectWorkspace}
          onCreateWorkspace={handleCreateWorkspace}
          onUpdateWorkspace={handleUpdateWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          invitations={invitations.filter(inv => inv.workspaceId === currentWorkspace.id)}
          onCancelInvitation={invId => {
            setInvitations(invitations.filter(i => i.id !== invId));
            setNotice('Invitation revoked.');
          }}
          onResendInvitation={() => {
            setNotice('Invitation email re-sent.');
          }}
        />
      )}

      {/* PROJECT CREATOR & SETTINGS MODAL */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projectToEdit={projectToEdit}
        workspaceId={currentWorkspace.id}
        onSaveProject={handleSaveProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* PERSONAL PROFILE & PREFERENCES DIALOG */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={userProfile}
        workspaces={workspaces}
        onSaveProfile={handleSaveProfile}
        onSignOut={() => {
          location.assign('/login');
        }}
      />

      {/* SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${sidebar ? 'show' : ''}`}>
        <a 
          className="brand" 
          href="/" 
          onClick={e => { e.preventDefault(); navigateToPage('projects'); }}
        >
          <span className="brand-mark"><span /><span /><span /></span>
          flowboard<span className="brand-dot">.</span>
        </a>

        {/* Workspace Switcher Button */}
        <button 
          className="workspace-switch" 
          onClick={() => setWsModalMode('switch')}
          title="Switch workspace"
        >
          <span className={`workspace-logo ${currentWorkspace.color || 'purple'}`}>
            {currentWorkspace.logo || currentWorkspace.name.slice(0, 1).toUpperCase()}
          </span>
          <span>
            <strong>{currentWorkspace.name}</strong>
            <small>{currentWorkspace.slug}.flowboard.io</small>
          </span>
          <ChevronsUpDown size={15} />
        </button>

        <div className="nav-caption">WORKSPACE</div>
        <nav>
          <button 
            className={!selectedProjectId && page === 'projects' ? 'active' : ''} 
            onClick={() => navigateToPage('projects')}
          >
            <LayoutGrid size={18} />
            Projects
            <span className="nav-count">{workspaceProjects.length}</span>
          </button>
          <button 
            className={!selectedProjectId && page === 'my-issues' ? 'active' : ''} 
            onClick={() => navigateToPage('my-issues')}
          >
            <CheckCheck size={19} />
            My issues
          </button>
          <button 
            className={!selectedProjectId && page === 'people' ? 'active' : ''} 
            onClick={() => navigateToPage('people')}
          >
            <Users size={19} />
            People & access
          </button>
        </nav>

        {/* Project Navigation Section */}
        <div className="nav-caption project-caption">
          YOUR PROJECTS
          <button 
            aria-label="Create project" 
            onClick={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
          >
            <Plus size={15} />
          </button>
        </div>
        <nav className="project-nav">
          {workspaceProjects.map(p => (
            <button 
              key={p.id} 
              className={selectedProjectId === p.id ? 'selected' : ''} 
              onClick={() => navigateToProject(p.id, 'Board')}
            >
              <span className={`project-dot ${p.color}`} />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Bottom Cards */}
        <div className="sidebar-bottom">
          <div className="team-callout">
            <span className="callout-icon"><Sparkles size={17} /></span>
            <strong>Great work is a team sport.</strong>
            <p>Bring your people and roadmaps<br />together in one place.</p>
            <button onClick={() => {
              if (currentProject && canManage(userRole)) setIsInviteModalOpen(true);
              else { setProjectToEdit(null); setIsProjectModalOpen(true); }
            }}>
              Collaborate <ArrowUpRight size={14} />
            </button>
          </div>

          <InstallButton variant="sidebar" />

          <button className="sidebar-help" onClick={() => setIsOnboardingOpen(true)}>
            <CircleHelp size={17} />
            Product tour & guide
            <ArrowUpRight size={13} />
          </button>

          {/* User Profile Footer */}
          <div className="profile">
            <Avatar name={userProfile.displayName} />
            <span>
              <strong>{userProfile.displayName}</strong>
              <small>{userProfile.title || currentWorkspace.name}</small>
            </span>
            <button 
              type="button" 
              aria-label="Personal settings"
              onClick={() => setIsSettingsOpen(true)}
              style={{ padding: '4px', color: '#a69db0' }}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </aside>

      {sidebar && <div className="sidebar-scrim" onClick={() => setSidebar(false)} />}

      {/* MAIN VIEWPORT */}
      <main className="main">
        {/* TOP BAR */}
        <header className="topbar">
          <div className="breadcrumbs">
            <button 
              className="mobile-toggle" 
              aria-label="Toggle navigation" 
              onClick={() => setSidebar(!sidebar)}
            >
              <PanelLeftClose size={19} />
            </button>

            <button 
              className="topbar-ws-pill" 
              onClick={() => setWsModalMode('switch')}
            >
              <span>{currentWorkspace.name}</span>
              <ChevronDown size={12} />
            </button>

            <ChevronRight size={14} />

            <strong>
              {currentProject 
                ? currentProject.name 
                : page === 'my-issues' 
                ? 'My issues' 
                : page === 'people' 
                ? 'People & access' 
                : 'Projects'}
            </strong>

            {currentProject && <span className="breadcrumb-key">{currentProject.key}</span>}
          </div>

          {/* Centered Wide Global Search Bar */}
          <div className="topbar-center">
            <div 
              className="global-search-bar" 
              role="button"
              tabIndex={0}
              aria-label="Search workspaces, projects, tasks, or jump to command"
              onClick={() => setIsCommandMenuOpen(true)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsCommandMenuOpen(true);
                }
              }}
            >
              <Search size={15} className="global-search-icon" />
              <span className="global-search-placeholder">
                Search workspaces, projects, issues, or commands...
              </span>
              <kbd className="global-search-kbd">⌘ K</kbd>
            </div>
          </div>

          <div className="top-actions">
            <span className="today">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="divider" />

            <button 
              aria-label="Activity Feed" 
              className="notification-button" 
              onClick={() => setMenu(menu === 'activity' ? null : 'activity')}
            >
              <Bell size={19} />
              <i />
            </button>

            <button 
              aria-label="Workspace Settings" 
              onClick={() => setWsModalMode('settings')}
            >
              <Settings size={18} />
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)} 
              style={{ padding: 0 }}
            >
              <Avatar name={userProfile.displayName} small />
            </button>
          </div>

          {/* Activity Dropdown Popover */}
          {menu === 'activity' && (
            <div className="activity-popover">
              <strong>Workspace Activity</strong>
              <p>Latest timeline updates in {currentWorkspace.name}:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', maxHeight: '220px', overflowY: 'auto' }}>
                {activities.slice(0, 6).map(act => (
                  <div key={act.id} style={{ fontSize: '10px', borderBottom: '1px solid #f1ecf5', paddingBottom: '6px' }}>
                    <strong style={{ color: '#554167' }}>{act.actorName}</strong> {act.action} <span style={{ color: '#8867cb' }}>{act.target}</span>
                    <small style={{ display: 'block', color: '#b6a6c4', fontSize: '8px' }}>{act.timestamp}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* CONTENT AREA */}
        <div className="page-content">
          {error && (
            <div className="error-banner">
              {error} 
              <a href="/login">Sign in <ArrowRight size={14} /></a>
              <Button variant="outline" size="xs" onClick={() => { setError(''); refreshBackend(); }}>Retry</Button>
            </div>
          )}

          {/* VIEW: ALL PROJECTS OVERVIEW (When no project selected) */}
          {!currentProject && page === 'projects' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">A LITTLE CLARITY. A LOT OF POSSIBILITY.</div>
                  <h1>Good work starts here<span className="heading-dot">.</span></h1>
                  <p>A central home for {currentWorkspace.name}’s roadmaps, sprints, and deliverables.</p>
                </div>
                <Button 
                  onClick={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
                  className="gap-2 shadow-xs"
                >
                  <Plus data-icon="inline-start" /> Create project
                </Button>
              </div>

              {/* High-level Workspace Metrics */}
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-icon purple"><FolderKanban size={21} /></span>
                  <div>
                    <span>Total projects</span>
                    <strong>{workspaceProjects.length}<small>Active roadmaps</small></strong>
                  </div>
                  <span className="stat-spark"><i/><i/><i/><i/><i/><i/></span>
                </div>

                <div className="stat">
                  <span className="stat-icon blue"><Clock3 size={21} /></span>
                  <div>
                    <span>In progress issues</span>
                    <strong>{inProgressIssuesCount}<small>Moving forward</small></strong>
                  </div>
                  <span className="stat-tag">Active velocity <ArrowUpRight size={12} /></span>
                </div>

                <div className="stat">
                  <span className="stat-icon green"><CheckCircle2 size={21} /></span>
                  <div>
                    <span>Completed deliverables</span>
                    <strong>{completedIssuesCount}<small>Shipped to done</small></strong>
                  </div>
                  <span className="mini-chart">
                    <svg viewBox="0 0 80 36">
                      <path d="M1 30L15 24L25 28L40 15L51 19L65 7L79 4" fill="none" stroke="#58a58a" strokeWidth="2"/>
                    </svg>
                  </span>
                </div>
              </div>

              {/* Section Header & Toolbar */}
              <div className="section-heading">
                <div>
                  <h2>Your projects <span>{workspaceProjects.length}</span></h2>
                  <p>Organize sprints, track cross-team work, and ship on time.</p>
                </div>
                <span className="private-note">
                  <ShieldCheck size={14} /> Scoped to {currentWorkspace.name}
                </span>
              </div>

              <div className="toolbar">
                <div className="project-filters">
                  {[
                    ['all', 'All projects'],
                    ['owned', 'Owned by me'],
                    ['shared', 'Shared with me'],
                  ].map(([v, l]) => (
                    <button 
                      key={v} 
                      className={filter === v ? 'current' : ''} 
                      onClick={() => setFilter(v as any)}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <div className="toolbar-right">
                  <div className="search-field">
                    <Search size={16} />
                    <input 
                      aria-label="Search projects" 
                      placeholder="Search projects..." 
                      value={query} 
                      onChange={e => setQuery(e.target.value)}
                    />
                    <kbd>⌘ K</kbd>
                  </div>

                  <div className="view-toggle">
                    <button 
                      aria-label="Grid view" 
                      className={view === 'grid' ? 'current' : ''} 
                      onClick={() => setView('grid')}
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button 
                      aria-label="List view" 
                      className={view === 'list' ? 'current' : ''} 
                      onClick={() => setView('list')}
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Chips Bar */}
              {query && (
                <div className="filter-chips-bar">
                  <span className="filter-chip">
                    Search: &quot;{query}&quot;
                    <button onClick={() => setQuery('')}><X size={12} /></button>
                  </span>
                  <button className="filter-clear-all" onClick={() => setQuery('')}>
                    Clear filters
                  </button>
                </div>
              )}

              {/* Projects Grid / List View */}
              <div className={`projects-grid ${view === 'list' ? 'list-view' : ''}`}>
                {visibleProjects.map(p => {
                  const tasks = allIssues.filter(i => i.projectId === p.id);
                  const completed = tasks.filter(i => i.status === 'Done').length;
                  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
                  const team = allMembers.filter(m => m.projectId === p.id);

                  return (
                    <article className="project-card" key={p.id}>
                      <div className="card-top">
                        <ProjectIcon color={p.color} />
                        <span className={`status-pill ${tasks.length && completed === tasks.length ? 'complete' : ''}`}>
                          <i />
                          {tasks.length && completed === tasks.length ? 'Completed' : p.status || 'In progress'}
                        </span>
                        <div className="card-more">
                          <button 
                            aria-label={`Options for ${p.name}`} 
                            onClick={() => setMenu(menu === p.id ? null : p.id)}
                          >
                            <MoreHorizontal size={20} />
                          </button>
                          {menu === p.id && (
                            <div className="dropdown">
                              <button onClick={() => { navigateToProject(p.id, 'Overview'); setMenu(null); }}>
                                Project overview <Eye size={14} />
                              </button>
                              <button onClick={() => { navigateToProject(p.id, 'Board'); setMenu(null); }}>
                                Kanban board <LayoutGrid size={14} />
                              </button>
                              <button onClick={() => { navigateToProject(p.id, 'People'); setMenu(null); }}>
                                People & access <Users size={14} />
                              </button>
                              <button onClick={() => { 
                                setProjectToEdit(p); 
                                setIsProjectModalOpen(true); 
                                setMenu(null); 
                              }}>
                                Edit settings <Settings size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <button className="card-title" onClick={() => navigateToProject(p.id, 'Board')}>
                        {p.name}
                        <ArrowUpRight size={17} />
                      </button>

                      <p className="card-description">
                        {p.description || 'A new space for your team’s next big idea.'}
                      </p>

                      <div className="card-tags">
                        <span>{p.key}</span>
                        <span><Layers size={12} /> {tasks.length} issues</span>
                        <span style={{ textTransform: 'capitalize' }}>{p.priority || 'Medium'}</span>
                      </div>

                      <div className="progress-label">
                        <span>Progress</span>
                        <strong>{percent}%</strong>
                      </div>
                      <div className="progress-track">
                        <span className={p.color} style={{ width: percent + '%' }} />
                      </div>

                      <div className="card-bottom">
                        <div className="avatar-group">
                          {team.slice(0, 3).map((m, i) => (
                            <Avatar name={m.name} key={m.id} index={i} small />
                          ))}
                          {team.length > 3 && (
                            <span className="avatar extra">+{team.length - 3}</span>
                          )}
                          <span className="team-size">
                            {team.length} {team.length === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                        <button 
                          className="open-project" 
                          aria-label={`Open ${p.name}`} 
                          onClick={() => navigateToProject(p.id, 'Board')}
                        >
                          <ArrowUpRight size={17} />
                        </button>
                      </div>
                    </article>
                  );
                })}

                {/* Add New Project Card */}
                <button 
                  className="new-project-card" 
                  onClick={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
                >
                  <span><Plus size={23} /></span>
                  <strong>Make room for your next big idea</strong>
                  <p>Blank slate or kick off with a ready-to-use template.</p>
                  <small>Create a project <ArrowRight size={14} /></small>
                </button>
              </div>

              {visibleProjects.length === 0 && (
                <div className="empty">
                  <Search size={25} />
                  <h3>No projects found</h3>
                  <p>Try refining your search or create a new project in this workspace.</p>
                </div>
              )}

              <div className="workspace-footer">
                <span>
                  <span className="live-dot" /> 
                  Connected to {currentWorkspace.name} · Local state persisted
                </span>
                <span>
                  Made for the way your team works <Sparkles size={13} />
                </span>
              </div>
            </>
          )}

          {/* VIEW: PROJECT DETAILS & BOARD/LIST/OVERVIEW/PEOPLE */}
          {currentProject && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1.5 px-2 text-muted-foreground hover:text-foreground self-start h-8 mb-4 -ml-2" 
                onClick={() => navigateToPage('projects')}
              >
                <ArrowLeft data-icon="inline-start" /> Back to all projects
              </Button>

              <div className="page-heading project-heading">
                <div className="project-heading-left">
                  <ProjectIcon color={currentProject.color} />
                  <div>
                    <div className="project-title-line">
                      <h1>{currentProject.name}</h1>
                      <span className="project-key">{currentProject.key}</span>
                      <span className="status-pill" style={{ marginLeft: 0 }}>
                        <i /> {currentProject.status}
                      </span>
                    </div>
                    <p>{currentProject.description || 'Your next big milestone starts here.'}</p>
                  </div>
                </div>

                <div className="heading-actions">
                  {canManage(userRole) && (
                    <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}>
                      <Users data-icon="inline-start" /> Add people
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      setQuickIssueInitialStatus('To do');
                      setIsQuickIssueModalOpen(true);
                    }}
                    disabled={!canEdit(userRole)}
                  >
                    <Plus data-icon="inline-start" /> Create issue
                  </Button>
                </div>
              </div>

              {/* 5 Project Navigation Tabs */}
              <div className="project-tabs">
                {[
                  { id: 'Overview', label: 'Overview', icon: BarChart3 },
                  { id: 'Board', label: 'Board', icon: FolderKanban },
                  { id: 'List', label: 'List', icon: List },
                  { id: 'People', label: 'People', icon: Users, badge: currentProjectMembers.length },
                  { id: 'Settings', label: 'Settings', icon: Settings },
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button 
                      key={t.id} 
                      className={tab === t.id ? 'current' : ''} 
                      onClick={() => setTab(t.id as any)}
                    >
                      <Icon size={16} />
                      {t.label}
                      {t.badge !== undefined && <span>{t.badge}</span>}
                    </button>
                  );
                })}

                <span className="access-chip">
                  <ShieldCheck size={13} />
                  {userRole[0].toUpperCase() + userRole.slice(1)} access
                </span>
              </div>

              {/* TAB 1: OVERVIEW */}
              {tab === 'Overview' && (
                <ProjectOverview
                  project={currentProject}
                  members={allMembers}
                  issues={currentProjectIssues}
                  activities={activities}
                  onOpenIssue={issue => setActiveDrawerIssue(issue)}
                  onCreateIssue={() => {
                    setQuickIssueInitialStatus('To do');
                    setIsQuickIssueModalOpen(true);
                  }}
                  onInvite={() => setIsInviteModalOpen(true)}
                  onUpdateProject={patch => handleSaveProject({ ...currentProject, ...patch, action: 'update' })}
                  canEdit={canEdit(userRole)}
                />
              )}

              {/* TAB 2 & 3: BOARD & LIST */}
              {(tab === 'Board' || tab === 'List') && (
                <>
                  <div className="board-toolbar">
                    <div className="search-field">
                      <Search size={16} />
                      <input 
                        aria-label="Search issues" 
                        placeholder="Search issues..." 
                        value={query} 
                        onChange={e => setQuery(e.target.value)}
                      />
                    </div>

                    <select 
                      aria-label="Filter by priority" 
                      value={priorityFilter} 
                      onChange={e => setPriorityFilter(e.target.value)}
                    >
                      <option>All priorities</option>
                      {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <select 
                      aria-label="Filter by status" 
                      value={statusFilter} 
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option>All statuses</option>
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <span className="issue-total">{visibleIssues.length} issues</span>

                    <div className="avatar-group">
                      {currentProjectMembers.slice(0, 4).map((m, i) => (
                        <Avatar key={m.id} name={m.name} index={i} small />
                      ))}
                    </div>
                  </div>

                  {/* Filter chips if active */}
                  {isFiltering && (
                    <div className="filter-chips-bar">
                      {query && (
                        <span className="filter-chip">
                          Keyword: &quot;{query}&quot;
                          <button onClick={() => setQuery('')}><X size={12} /></button>
                        </span>
                      )}
                      {priorityFilter !== 'All priorities' && (
                        <span className="filter-chip">
                          Priority: {priorityFilter}
                          <button onClick={() => setPriorityFilter('All priorities')}><X size={12} /></button>
                        </span>
                      )}
                      {statusFilter !== 'All statuses' && (
                        <span className="filter-chip">
                          Status: {statusFilter}
                          <button onClick={() => setStatusFilter('All statuses')}><X size={12} /></button>
                        </span>
                      )}
                      <button 
                        className="filter-clear-all" 
                        onClick={() => {
                          setQuery('');
                          setPriorityFilter('All priorities');
                          setStatusFilter('All statuses');
                        }}
                      >
                        Clear all
                      </button>
                    </div>
                  )}

                  {tab === 'Board' ? (
                    <div className="kanban">
                      {statuses.map(status => {
                        const colIssues = visibleIssues.filter(i => i.status === status);
                        return (
                          <section 
                            className="kanban-column" 
                            key={status}
                            onDragOver={e => {
                              if (canEdit(userRole)) e.preventDefault();
                            }}
                            onDrop={e => {
                              e.preventDefault();
                              const issueId = e.dataTransfer.getData('text/plain');
                              const issue = allIssues.find(i => i.id === issueId);
                              if (issue && canEdit(userRole)) {
                                handleMoveIssue(issue, status);
                              }
                            }}
                          >
                            <div className="column-heading">
                              <span className={`status-dot ${status.toLowerCase().replace(/\s+/g, '-')}`} />
                              <strong>{status}</strong>
                              <span>{colIssues.length}</span>
                              {canEdit(userRole) && (
                                <button 
                                  aria-label={`Add issue to ${status}`} 
                                  onClick={() => {
                                    setQuickIssueInitialStatus(status);
                                    setIsQuickIssueModalOpen(true);
                                  }}
                                >
                                  <Plus size={15} />
                                </button>
                              )}
                            </div>

                            {colIssues.map(issue => (
                              <button 
                                key={issue.id} 
                                className="issue-card"
                                draggable={canEdit(userRole)}
                                onDragStart={e => e.dataTransfer.setData('text/plain', issue.id)}
                                onClick={() => setActiveDrawerIssue(issue)}
                              >
                                <span className={`issue-label ${issue.label.toLowerCase()}`}>
                                  {issue.label}
                                </span>
                                <strong>{issue.title}</strong>
                                <span className="issue-card-bottom">
                                  <span>{currentProject.key}-{issue.number}</span>
                                  <span className={`priority ${issue.priority.toLowerCase()}`}>
                                    <Flag size={12} /> {issue.priority}
                                  </span>
                                  {issue.assignee && (
                                    <Avatar 
                                      name={currentProjectMembers.find(m => m.id === issue.assignee)?.name || 'Unassigned'} 
                                      small 
                                    />
                                  )}
                                </span>
                              </button>
                            ))}

                            {colIssues.length === 0 && (
                              <div className="empty-column">
                                Space for what&apos;s next.
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  ) : (
                    <IssueTable 
                      items={visibleIssues} 
                      projects={workspaceProjects} 
                      members={allMembers} 
                      onOpen={issue => setActiveDrawerIssue(issue)} 
                    />
                  )}
                </>
              )}

              {/* TAB 4: PEOPLE & ACCESS */}
              {tab === 'People' && (
                <>
                  <div className="section-heading">
                    <div>
                      <h2>Good people. Great possibilities.</h2>
                      <p>Control roles and access for {currentProject.name}.</p>
                    </div>
                    {canManage(userRole) && (
                      <Button onClick={() => setIsInviteModalOpen(true)}>
                        <Plus data-icon="inline-start" /> Add people
                      </Button>
                    )}
                  </div>

                  <div className="people-table">
                    <div className="people-row table-header">
                      <span>Name</span>
                      <span>Project role</span>
                      <span>Status</span>
                      <span />
                    </div>

                    {currentProjectMembers.map((m, i) => (
                      <div className="people-row" key={m.id}>
                        <div className="person">
                          <Avatar name={m.name} index={i} />
                          <span>
                            <strong>
                              {m.name}
                              {(m.email === userProfile.email || m.userId === apiData?.user?.userId) && (
                                <small> (you)</small>
                              )}
                            </strong>
                            <small>{m.email}</small>
                          </span>
                        </div>

                        <div>
                          {canChangeMember(userRole, m.role) ? (
                            <select 
                              aria-label={`Role for ${m.name}`}
                              value={m.role}
                              onChange={e => handleMemberAction(m, 'changeRole', e.target.value)}
                            >
                              {(userRole === 'owner' ? ['admin', 'member', 'viewer'] : ['member', 'viewer']).map(r => (
                                <option key={r} value={r}>
                                  {r[0].toUpperCase() + r.slice(1)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`role-badge ${m.role}`}>
                              <ShieldCheck size={13} /> {m.role}
                            </span>
                          )}
                        </div>

                        <span className={`member-status ${m.status === 'pending' ? 'pending' : ''}`}>
                          <i /> {m.status === 'pending' ? 'Pending invite' : 'Active'}
                        </span>

                        <div>
                          {canChangeMember(userRole, m.role) && (
                            <Button 
                              variant="ghost" 
                              size="icon-xs"
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={`Remove ${m.name}`}
                              onClick={() => handleMemberAction(m, 'removeMember')}
                            >
                              <X data-icon="inline-start" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="roles-grid">
                    {Object.entries(roleText).map(([r, t]) => (
                      <div key={r}>
                        <ShieldCheck size={17} />
                        <strong>{r}</strong>
                        <p>{t}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* TAB 5: PROJECT SETTINGS */}
              {tab === 'Settings' && (
                <div className="settings-panel">
                  <h2>Project details & visibility</h2>
                  <p>Configuration and workspace permissions for {currentProject.name}.</p>

                  <dl>
                    <dt>Project name</dt>
                    <dd>{currentProject.name}</dd>
                    <dt>Project key</dt>
                    <dd>{currentProject.key}</dd>
                    <dt>Description</dt>
                    <dd>{currentProject.description || 'No description provided.'}</dd>
                    <dt>Priority level</dt>
                    <dd>{currentProject.priority || 'Medium'}</dd>
                    <dt>Project health</dt>
                    <dd>{currentProject.health || 'On track'}</dd>
                    <dt>Target dates</dt>
                    <dd>
                      {currentProject.startDate || 'Started'} — {currentProject.dueDate || 'Ongoing'}
                    </dd>
                    <dt>Your permissions</dt>
                    <dd className="capitalize">{userRole} access</dd>
                  </dl>

                  <div className="settings-note">
                    <ShieldCheck size={19} />
                    <p>
                      Project access is verified across all flows. Owners and admins can manage membership in the People tab.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button 
                      onClick={() => {
                        setProjectToEdit(currentProject);
                        setIsProjectModalOpen(true);
                      }}
                    >
                      <Settings data-icon="inline-start" /> Edit project details
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        navigator.clipboard.writeText(location.origin);
                        setNotice('Workspace link copied.');
                      }}
                    >
                      <Link2 data-icon="inline-start" /> Copy workspace link
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* VIEW: MY ISSUES */}
          {!currentProject && page === 'my-issues' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR FOCUS, FOUND.</div>
                  <h1>My issues<span className="heading-dot">.</span></h1>
                  <p>Everything assigned to you, across all active projects.</p>
                </div>
              </div>

              <div className="board-toolbar">
                <div className="search-field">
                  <Search size={16} />
                  <input 
                    placeholder="Search your assigned issues..." 
                    value={query} 
                    onChange={e => setQuery(e.target.value)}
                  />
                </div>
              </div>

              <IssueTable 
                items={visibleIssues} 
                projects={workspaceProjects} 
                members={allMembers} 
                onOpen={issue => {
                  navigateToProject(issue.projectId, 'Board');
                  setActiveDrawerIssue(issue);
                }}
              />

              {!visibleIssues.length && (
                <div className="empty">
                  <CheckCheck size={32} />
                  <h3>All caught up</h3>
                  <p>No open issues are currently assigned to your account.</p>
                </div>
              )}
            </>
          )}

          {/* VIEW: WORKSPACE PEOPLE & ACCESS */}
          {!currentProject && page === 'people' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">BETTER, TOGETHER.</div>
                  <h1>People & access<span className="heading-dot">.</span></h1>
                  <p>Manage team membership, roles, and project-level scopes.</p>
                </div>
                <Button onClick={() => setIsInviteModalOpen(true)}>
                  <Plus data-icon="inline-start" /> Invite teammate
                </Button>
              </div>

              <div className="project-access-grid">
                {workspaceProjects.map(p => {
                  const mCount = allMembers.filter(m => m.projectId === p.id).length;
                  return (
                    <button 
                      key={p.id} 
                      onClick={() => navigateToProject(p.id, 'People')}
                    >
                      <ProjectIcon color={p.color} />
                      <span>
                        <strong>{p.name}</strong>
                        <small>{mCount} members · Click to manage project team</small>
                      </span>
                      <ArrowUpRight size={20} />
                    </button>
                  );
                })}
              </div>

              <div className="roles-grid">
                {Object.entries(roleText).map(([r, t]) => (
                  <div key={r}>
                    <ShieldCheck size={19} />
                    <strong>{r}</strong>
                    <p>{t}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* FLOATING TOAST NOTIFICATION */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2" role="status">
          <Alert className="border-primary/30 bg-card shadow-lg flex items-center gap-3 pr-2 py-3">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <AlertDescription className="text-xs font-medium text-foreground flex-1">
              {notice}
            </AlertDescription>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={() => setNotice('')}
              aria-label="Dismiss notification"
            >
              <X className="size-3.5" />
            </Button>
          </Alert>
        </div>
      )}

      {/* QUICK ISSUE CREATION DIALOG */}
      <Dialog
        open={Boolean(isQuickIssueModalOpen && currentProject)}
        onOpenChange={(open) => {
          if (!open) setIsQuickIssueModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[500px] p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="gap-2">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layers className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold">Create an issue</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Add a new deliverable to {currentProject?.name} ({currentProject?.key}).
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleQuickIssueSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="qi-title" className="text-xs font-medium text-foreground">
                Issue title
              </label>
              <Input
                id="qi-title"
                autoFocus
                required
                maxLength={160}
                placeholder="What needs to happen?"
                value={qiTitle}
                onChange={(e) => setQiTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="qi-description" className="text-xs font-medium text-foreground">
                  Description
                </label>
                <span className="text-[11px] text-muted-foreground">optional</span>
              </div>
              <Textarea
                id="qi-description"
                rows={3}
                maxLength={5000}
                placeholder="Add context, acceptance criteria, or relevant links..."
                value={qiDescription}
                onChange={(e) => setQiDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qi-status" className="text-xs font-medium text-foreground">
                  Status
                </label>
                <Select
                  value={qiStatus}
                  onValueChange={(val) => setQiStatus(val)}
                >
                  <SelectTrigger id="qi-status" className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="qi-priority" className="text-xs font-medium text-foreground">
                  Priority
                </label>
                <Select
                  value={qiPriority}
                  onValueChange={(val) => setQiPriority(val as PriorityLevel)}
                >
                  <SelectTrigger id="qi-priority" className="w-full">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {priorities.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qi-assignee" className="text-xs font-medium text-foreground">
                  Assignee
                </label>
                <Select
                  value={qiAssignee}
                  onValueChange={(val) => setQiAssignee(val)}
                >
                  <SelectTrigger id="qi-assignee" className="w-full">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {currentProjectMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="qi-label" className="text-xs font-medium text-foreground">
                  Label
                </label>
                <Select
                  value={qiLabel}
                  onValueChange={(val) => setQiLabel(val)}
                >
                  <SelectTrigger id="qi-label" className="w-full">
                    <SelectValue placeholder="Label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {['Feature', 'Design', 'Bug', 'Research', 'Task'].map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickIssueModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create issue <ArrowRight data-icon="inline-end" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* INVITE TEAMMATE DIALOG */}
      <Dialog
        open={isInviteModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsInviteModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[480px] p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="gap-2">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold">Invite Teammates</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Add collaborators to {currentProject ? currentProject.name : currentWorkspace.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inv-email" className="text-xs font-medium text-foreground">
                Teammate Email Address
              </label>
              <Input
                id="inv-email"
                type="email"
                required
                autoFocus
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="inv-role" className="text-xs font-medium text-foreground">
                Role & Permissions
              </label>
              <Select
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val as typeof inviteRole)}
              >
                <SelectTrigger id="inv-role" className="w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="admin">Admin — Manage issues & team access</SelectItem>
                    <SelectItem value="member">Member — Create and edit issues</SelectItem>
                    <SelectItem value="viewer">Viewer — Read-only access</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground leading-relaxed">
              <Link2 className="size-4 text-primary shrink-0 mt-0.5" />
              <p>Teammates will receive access immediately. Share this workspace URL so they can sign in.</p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Grant access <ArrowRight data-icon="inline-end" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IssueTable({
  items,
  projects,
  members,
  onOpen,
}: {
  items: Issue[];
  projects: Project[];
  members: Member[];
  onOpen: (i: Issue) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/40 border-b border-border">
            <TableHead className="w-[48%] text-xs font-semibold text-muted-foreground py-3">Issue</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground py-3">Status</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground py-3">Priority</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground py-3 text-right pr-4">Assignee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((i) => {
            const project = projects.find((p) => p.id === i.projectId);
            const assignee = members.find((m) => m.id === i.assignee);
            return (
              <TableRow
                key={i.id}
                className="cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => onOpen(i)}
              >
                <TableCell className="py-3 font-medium">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                      {project?.key || 'ISSUE'}-{i.number}
                    </Badge>
                    <span className="text-xs font-medium text-foreground truncate max-w-[340px]">
                      {i.title}
                    </span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {i.label}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`status-dot ${i.status.toLowerCase().replace(/\s+/g, '-')}`} />
                    <span>{i.status}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span className={`priority ${i.priority.toLowerCase()} text-xs flex items-center gap-1`}>
                    <Flag className="size-3" />
                    {i.priority}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-right pr-4">
                  {assignee ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-xs text-muted-foreground">{assignee.name}</span>
                      <Avatar name={assignee.name} small />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

