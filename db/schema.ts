import { pgTable, text, integer, uniqueIndex } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  key: text('key').notNull(),
  description: text('description').notNull(),
  color: text('color').notNull(),
  ownerId: text('owner_id').notNull(),
  issueCounter: integer('issue_counter').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

export const members = pgTable('members', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  userId: text('user_id'),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
}, table => [uniqueIndex('member_email').on(table.projectId, table.email)]);

export const issues = pgTable('issues', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  number: integer('number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull(),
  priority: text('priority').notNull(),
  label: text('label').notNull(),
  assignee: text('assignee'),
  createdAt: text('created_at').notNull(),
}, table => [uniqueIndex('issue_number').on(table.projectId, table.number)]);

export const milestones = pgTable('milestones', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: text('due_date').notNull(),
  status: text('status').notNull(),
  progress: integer('progress').notNull().default(0),
});

export const attachments = pgTable('attachments', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  taskId: text('task_id'),
  name: text('name').notNull(),
  size: integer('size').notNull(),
  type: text('type').notNull(),
  url: text('url').notNull(),
  caption: text('caption'),
  uploaderName: text('uploader_name').notNull(),
  uploaderEmail: text('uploader_email').notNull(),
  isClientVisible: integer('is_client_visible').notNull().default(1),
  createdAt: text('created_at').notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  senderEmail: text('sender_email').notNull(),
  senderRole: text('sender_role').notNull(),
  content: text('content').notNull(),
  attachmentsJson: text('attachments_json'),
  replyToId: text('reply_to_id'),
  isClientVisible: integer('is_client_visible').notNull().default(1),
  createdAt: text('created_at').notNull(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  recipientEmail: text('recipient_email').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  projectId: text('project_id'),
  issueId: text('issue_id'),
  read: integer('read').notNull().default(0),
  createdAt: text('created_at').notNull(),
});
