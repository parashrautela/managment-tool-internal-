export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'guest';

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  color: string;
  ownerId: string;
  memberCount: number;
  createdAt: string;
};

export type ProjectStatus = 'Planned' | 'In progress' | 'On hold' | 'Completed' | 'Archived';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';
export type IssueLabel = 'Feature' | 'Design' | 'Bug' | 'Research' | 'Task';

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description: string;
  color: 'purple' | 'blue' | 'green' | 'orange';
  ownerId: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  startDate?: string;
  dueDate?: string;
  health: 'On track' | 'At risk' | 'Delayed';
  createdAt: string;
};

export type Member = {
  id: string;
  workspaceId?: string;
  projectId: string;
  userId: string | null;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  title?: string;
  avatarColor?: string;
  status?: 'active' | 'pending';
  joinedAt?: string;
};

export type IssueComment = {
  id: string;
  issueId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
};

export type Issue = {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string;
  status: 'Backlog' | 'To do' | 'In progress' | 'In review' | 'Done';
  priority: PriorityLevel;
  label: IssueLabel;
  assignee: string | null;
  dueDate?: string;
  comments?: IssueComment[];
  createdAt: string;
};

export type ActivityItem = {
  id: string;
  workspaceId: string;
  projectId?: string;
  actorName: string;
  actorEmail: string;
  action: string;
  target: string;
  timestamp: string;
};

export type Invitation = {
  id: string;
  workspaceId: string;
  projectId?: string;
  email: string;
  role: WorkspaceRole;
  status: 'pending' | 'accepted' | 'expired';
  invitedAt: string;
};

export type UserProfile = {
  userId: string;
  displayName: string;
  email: string;
  title: string;
  bio: string;
  avatarColor: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultWorkspaceId: string;
  notifications: {
    taskAssigned: boolean;
    mentions: boolean;
    projectUpdates: boolean;
    weeklyDigest: boolean;
  };
};
