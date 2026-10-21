export const roles = ['admin', 'member', 'viewer', 'project_manager', 'employee', 'client'] as const;
export const statuses = ['Backlog', 'To do', 'In progress', 'In review', 'Blocked', 'Done'] as const;
export const priorities = ['Low', 'Medium', 'High', 'Urgent'] as const;

export function canManage(role: string) {
  return role === 'owner' || role === 'admin' || role === 'project_manager';
}

export function canEdit(role: string) {
  return canManage(role) || role === 'member' || role === 'employee';
}

export function canChangeMember(actor: string, target: string) {
  return canManage(actor) && target !== 'owner' && (actor === 'owner' || (target !== 'admin' && target !== 'project_manager'));
}

export function isClient(role: string) {
  return role === 'client' || role === 'viewer' || role === 'guest';
}

export function canViewInternal(role: string) {
  return !isClient(role);
}

export function canCreateProject(role: string) {
  return role === 'owner' || role === 'admin' || role === 'project_manager';
}
