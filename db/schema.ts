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
