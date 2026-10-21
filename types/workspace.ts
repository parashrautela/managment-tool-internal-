export type WorkspaceRole = 'owner' | 'admin' | 'project_manager' | 'member' | 'employee' | 'client' | 'viewer' | 'guest';

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
export type IssueLabel = 'Feature' | 'Design' | 'Bug' | 'Research' | 'Task' | 'Feedback';
export type IssueStatus = 'Backlog' | 'To do' | 'In progress' | 'In review' | 'Blocked' | 'Done';

export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'Upcoming' | 'In progress' | 'Completed' | 'Delayed';
  progress?: number; // 0 to 100
};

export type TaskAttachment = {
  id: string;
  taskId?: string;
  projectId: string;
  name: string;
  size: number;
  type: string; // 'image/png', 'video/mp4', 'application/pdf', etc.
  url: string; // URL, data URL, or preview
  thumbnailUrl?: string;
  caption?: string;
  uploaderName: string;
  uploaderEmail: string;
  uploadedAt: string;
  isClientVisible: boolean;
  isInternalOnly?: boolean;
};

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description: string;
  color: 'purple' | 'blue' | 'green' | 'orange';
  ownerId: string;
  projectManagerId?: string;
  projectManagerName?: string;
  clientCompany?: string;
  clientContactName?: string;
  clientContactEmail?: string;
  clientEmail?: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  startDate?: string;
  dueDate?: string;
  health: 'On track' | 'At risk' | 'Delayed';
  objectives?: string[];
  milestones?: ProjectMilestone[];
  createdAt: string;
};

export type Member = {
  id: string;
  workspaceId?: string;
  projectId: string;
  userId: string | null;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'project_manager' | 'member' | 'employee' | 'client' | 'viewer';
  title?: string;
  avatarColor?: string;
  status?: 'active' | 'pending';
  joinedAt?: string;
};

export type IssueComment = {
  id: string;
  issueId?: string;
  authorName: string;
  authorEmail: string;
  authorRole?: string;
  content: string;
  isInternal?: boolean; // If true: visible only to internal team/admins, hidden from clients
  isInternalOnly?: boolean;
  attachments?: TaskAttachment[];
  createdAt: string;
};

export type Issue = {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string;
  status: IssueStatus;
  priority: PriorityLevel;
  label: IssueLabel;
  assignee: string | null;
  creatorName?: string;
  startDate?: string;
  dueDate?: string;
  isClientVisible?: boolean; // true = visible to clients, false = internal only
  subtasks?: Subtask[];
  attachments?: TaskAttachment[];
  comments?: IssueComment[];
  dependencies?: string[]; // IDs of tasks that block this task
  milestoneId?: string;
  createdAt: string;
};

export type ProjectMessage = {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'admin' | 'project_manager' | 'employee' | 'client';
  content: string;
  attachments?: TaskAttachment[];
  replyToId?: string;
  replyToSnippet?: string;
  createdAt: string;
  isClientVisible: boolean;
};

export type AppNotification = {
  id: string;
  recipientEmail: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'status_changed' | 'client_feedback' | 'comment' | 'file_uploaded' | 'deadline_approaching' | 'chat_message';
  projectId?: string;
  issueId?: string;
  read: boolean;
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

export type PersonaUser = {
  id: string;
  displayName: string;
  email: string;
  role: 'admin' | 'project_manager' | 'employee' | 'client';
  title: string;
  company?: string;
  avatarColor: string;
  assignedProjectIds: string[]; // Projects this persona is assigned to (especially critical for client isolation)
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
  role?: 'admin' | 'project_manager' | 'employee' | 'client';
  notifications: {
    taskAssigned: boolean;
    mentions: boolean;
    projectUpdates: boolean;
    weeklyDigest: boolean;
  };
};
