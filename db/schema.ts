import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {
 id: text('id').primaryKey(), name: text('name').notNull(), key: text('key').notNull(), description: text('description').notNull(), color: text('color').notNull(), ownerId: text('owner_id').notNull(), createdAt: text('created_at').notNull(),
});
export const members = sqliteTable('members', {
 id: text('id').primaryKey(), projectId: text('project_id').notNull().references(()=>projects.id), userId: text('user_id'), email: text('email').notNull(), name: text('name').notNull(), role: text('role').notNull(),
}, t=>[uniqueIndex('member_email').on(t.projectId,t.email)]);
export const issues = sqliteTable('issues', {
 id: text('id').primaryKey(), projectId: text('project_id').notNull().references(()=>projects.id), number: integer('number').notNull(), title: text('title').notNull(), description: text('description').notNull(), status: text('status').notNull(), priority: text('priority').notNull(), label: text('label').notNull(), assignee: text('assignee'), createdAt: text('created_at').notNull(),
}, t=>[uniqueIndex('issue_number').on(t.projectId,t.number)]);
