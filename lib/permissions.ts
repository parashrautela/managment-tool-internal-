export const roles = ['admin', 'member', 'viewer'] as const;
export const statuses = ['Backlog', 'To do', 'In progress', 'In review', 'Done'] as const;
export const priorities = ['Low', 'Medium', 'High', 'Urgent'] as const;
export function canManage(role: string) { return role === 'owner' || role === 'admin'; }
export function canEdit(role: string) { return canManage(role) || role === 'member'; }
export function canChangeMember(actor: string, target: string) { return canManage(actor) && target !== 'owner' && (actor === 'owner' || target !== 'admin'); }
