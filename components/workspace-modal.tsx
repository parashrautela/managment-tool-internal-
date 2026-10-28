'use client';
import { useState, useEffect, type FormEvent } from 'react';
import { 
  Building2, 
  Plus, 
  Check, 
  ArrowRight, 
  Trash2, 
  Mail,
  RefreshCw,
  Ban,
  AlertCircle
} from 'lucide-react';
import type { Workspace, Invitation } from '../types/workspace';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'switch' | 'create' | 'settings';
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: (data: {
    name: string;
    slug: string;
    description: string;
    color: string;
  }) => Promise<void>;
  onUpdateWorkspace?: (workspaceId: string, data: Partial<Workspace>) => Promise<void>;
  onDeleteWorkspace?: (workspaceId: string) => Promise<void>;
  invitations?: Invitation[];
  onCancelInvitation?: (invitationId: string) => void;
  onResendInvitation?: (invitationId: string) => void;
  canManage?: boolean;
}

export function WorkspaceModal({
  isOpen,
  onClose,
  mode: initialMode,
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onUpdateWorkspace,
  onDeleteWorkspace,
  invitations = [],
  onCancelInvitation,
  onResendInvitation,
  canManage = true,
}: WorkspaceModalProps) {
  const effectiveMode = !canManage ? 'switch' : initialMode;
  const [activeTab, setActiveTab] = useState<'switch' | 'create' | 'settings'>(effectiveMode);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('purple');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const nextMode = !canManage ? 'switch' : initialMode;
    setActiveTab(nextMode);
    if (nextMode === 'settings') {
      setName(currentWorkspace.name);
      setSlug(currentWorkspace.slug);
      setDescription(currentWorkspace.description || '');
      setColor(currentWorkspace.color || 'purple');
    } else if (nextMode === 'create') {
      setName('');
      setSlug('');
      setDescription('');
      setColor('purple');
    }
    setConfirmDelete(false);
    setError('');
  }, [initialMode, currentWorkspace, isOpen, canManage]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a workspace name.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onCreateWorkspace({
        name: name.trim(),
        slug: (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: description.trim(),
        color,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace.');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!onUpdateWorkspace) return;
    setBusy(true);
    setError('');
    try {
      await onUpdateWorkspace(currentWorkspace.id, {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        color,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update workspace.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!onDeleteWorkspace) return;
    setBusy(true);
    setError('');
    try {
      await onDeleteWorkspace(currentWorkspace.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete workspace.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-[540px] p-6 max-h-[88vh] overflow-y-auto">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">
                {activeTab === 'switch' && 'Workspace Switcher'}
                {activeTab === 'create' && 'Create a Workspace'}
                {activeTab === 'settings' && 'Workspace Settings'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {activeTab === 'switch' && 'Switch between team workspaces or create a new one.'}
                {activeTab === 'create' && 'Set up a shared space for your projects, people, and roadmaps.'}
                {activeTab === 'settings' && `Manage configuration, invitations, and administrative control for ${currentWorkspace.name}.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Mode Navigation Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            const newTab = val as 'switch' | 'create' | 'settings';
            setActiveTab(newTab);
            setError('');
            if (newTab === 'settings') {
              setName(currentWorkspace.name);
              setSlug(currentWorkspace.slug);
              setDescription(currentWorkspace.description || '');
              setColor(currentWorkspace.color || 'purple');
            } else if (newTab === 'create') {
              setName('');
              setSlug('');
              setDescription('');
              setColor('purple');
            }
          }}
          className="w-full mt-2"
        >
          {canManage ? (
            <TabsList className="grid w-full grid-cols-3 p-1 h-auto min-w-0">
              <TabsTrigger value="switch" className="px-2 sm:px-3 text-xs">
                <span className="hidden sm:inline">All Workspaces</span>
                <span className="sm:hidden">Workspaces</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="px-2 sm:px-3 text-xs">Settings</TabsTrigger>
              <TabsTrigger value="create" className="px-2 sm:px-3 text-xs gap-1 sm:gap-1.5">
                <Plus data-icon="inline-start" className="size-3.5 shrink-0" />
                New
              </TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-1 p-1 h-auto min-w-0">
              <TabsTrigger value="switch" className="px-2 sm:px-3 text-xs">All Workspaces</TabsTrigger>
            </TabsList>
          )}

          {/* Tab 1: Switch Workspaces */}
          <TabsContent value="switch" className="flex flex-col gap-4 pt-3">
            <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
              {workspaces.map((ws) => {
                const isSelected = ws.id === currentWorkspace.id;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-all active:scale-[0.99]',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40'
                        : 'border-border bg-card hover:bg-muted/50 hover:border-border/80'
                    )}
                    onClick={() => {
                      onSelectWorkspace(ws.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn('ws-avatar-badge font-semibold', ws.color || 'purple')}>
                        {ws.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="flex flex-col">
                        <strong className="text-sm font-medium">{ws.name}</strong>
                        <span className="text-xs text-muted-foreground">
                          {ws.slug}.flowboard.io · {ws.memberCount} members
                        </span>
                      </div>
                    </div>
                    {isSelected ? (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    ) : (
                      <ArrowRight className="size-4 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>

            {canManage && (
              <Button
                variant="outline"
                className="w-full justify-center gap-2 mt-2"
                onClick={() => {
                  setActiveTab('create');
                  setName('');
                  setSlug('');
                }}
              >
                <Plus data-icon="inline-start" />
                Create a new workspace
              </Button>
            )}
          </TabsContent>

          {/* Tab 2: Create Workspace */}
          <TabsContent value="create" className="pt-3">
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ws-create-name" className="text-xs font-medium text-foreground">
                  Workspace name
                </label>
                <Input
                  id="ws-create-name"
                  required
                  autoFocus
                  placeholder="e.g. Acme Corp, Design Studio"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="ws-create-slug" className="text-xs font-medium text-foreground">
                  Workspace URL slug
                </label>
                <Input
                  id="ws-create-slug"
                  required
                  placeholder="acme-corp"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                />
                <span className="text-xs text-muted-foreground">
                  https://{slug || 'your-team'}.flowboard.app
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="ws-create-desc" className="text-xs font-medium text-foreground">
                    Description
                  </label>
                  <span className="text-xs text-muted-foreground">optional</span>
                </div>
                <Textarea
                  id="ws-create-desc"
                  rows={2}
                  placeholder="What is this workspace dedicated to?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-foreground">Workspace theme color</span>
                <div className="flex items-center gap-2.5">
                  {(['purple', 'blue', 'green', 'orange'] as const).map((c) => {
                    const hexColors: Record<typeof c, string> = {
                      purple: '#7760da',
                      blue: '#3b82f6',
                      green: '#10b981',
                      orange: '#f59e0b',
                    };
                    const isSelected = color === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Select ${c} color`}
                        title={c.charAt(0).toUpperCase() + c.slice(1)}
                        style={{ backgroundColor: hexColors[c] }}
                        className={cn(
                          'size-7 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-xs',
                          isSelected ? 'ring-2 ring-primary ring-offset-2 scale-110 shadow-sm' : 'opacity-90 hover:opacity-100 hover:scale-105'
                        )}
                        onClick={() => setColor(c)}
                      >
                        {isSelected && <Check className="size-4 text-white stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('switch')}
                >
                  Back
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Creating...' : 'Create workspace'}
                  {!busy && <ArrowRight data-icon="inline-end" />}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Tab 3: Workspace Settings */}
          <TabsContent value="settings" className="pt-3">
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ws-settings-name" className="text-xs font-medium text-foreground">
                  Workspace name
                </label>
                <Input
                  id="ws-settings-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="ws-settings-slug" className="text-xs font-medium text-foreground">
                  URL Slug
                </label>
                <Input
                  id="ws-settings-slug"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="ws-settings-desc" className="text-xs font-medium text-foreground">
                  Description
                </label>
                <Textarea
                  id="ws-settings-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-foreground">Workspace color</span>
                <div className="flex items-center gap-2.5">
                  {(['purple', 'blue', 'green', 'orange'] as const).map((c) => {
                    const hexColors: Record<typeof c, string> = {
                      purple: '#7760da',
                      blue: '#3b82f6',
                      green: '#10b981',
                      orange: '#f59e0b',
                    };
                    const isSelected = color === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Select ${c} color`}
                        title={c.charAt(0).toUpperCase() + c.slice(1)}
                        style={{ backgroundColor: hexColors[c] }}
                        className={cn(
                          'size-7 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-xs',
                          isSelected ? 'ring-2 ring-primary ring-offset-2 scale-110 shadow-sm' : 'opacity-90 hover:opacity-100 hover:scale-105'
                        )}
                        onClick={() => setColor(c)}
                      >
                        {isSelected && <Check className="size-4 text-white stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pending Invitations Section */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <h4 className="text-xs font-semibold text-foreground">Pending Invitations</h4>
                {invitations.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border shadow-xs text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="size-3.5 text-muted-foreground" />
                          <span className="font-medium">{inv.email}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {inv.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {onResendInvitation && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              title="Resend invitation"
                              onClick={() => onResendInvitation(inv.id)}
                            >
                              <RefreshCw className="size-3" />
                            </Button>
                          )}
                          {onCancelInvitation && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Revoke invitation"
                              onClick={() => onCancelInvitation(inv.id)}
                            >
                              <Ban className="size-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No pending invitations for this workspace.</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('switch')}
                >
                  Back
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Saving...' : 'Save workspace changes'}
                </Button>
              </DialogFooter>
            </form>

            {/* Danger Zone */}
            {onDeleteWorkspace && workspaces.length > 1 && (
              <div className="mt-6 pt-4 border-t border-destructive/20 flex flex-col gap-3">
                <div>
                  <strong className="text-xs font-semibold text-destructive">Archive or delete workspace</strong>
                  <p className="text-xs text-muted-foreground">
                    Permanently remove {currentWorkspace.name} and all associated projects.
                  </p>
                </div>
                {!confirmDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="self-start gap-1.5"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 data-icon="inline-start" />
                    Delete workspace
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-destructive">Are you sure?</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={busy}
                    >
                      Confirm delete
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
