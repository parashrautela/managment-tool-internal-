'use client';
import { useState, useEffect, type FormEvent } from 'react';
import { 
  FolderKanban, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Calendar, 
  Flag, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { projectTemplates } from '../lib/initial-data';
import type { Project, PriorityLevel, ProjectStatus } from '../types/workspace';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { cn } from '@/lib/utils';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
  workspaceId: string;
  onSaveProject: (projectData: {
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
  }) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
}

export function ProjectModal({
  isOpen,
  onClose,
  projectToEdit,
  workspaceId: _workspaceId,
  onSaveProject,
  onDeleteProject,
}: ProjectModalProps) {
  const isEditing = Boolean(projectToEdit);
  const [tab, setTab] = useState<'scratch' | 'template'>('scratch');

  // Form states
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<'purple' | 'blue' | 'green' | 'orange'>('purple');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [status, setStatus] = useState<ProjectStatus>('Planned');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [health, setHealth] = useState<'On track' | 'At risk' | 'Delayed'>('On track');

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setKey(projectToEdit.key);
      setDescription(projectToEdit.description || '');
      setColor(projectToEdit.color || 'purple');
      setPriority(projectToEdit.priority || 'Medium');
      setStatus(projectToEdit.status || 'Planned');
      setStartDate(projectToEdit.startDate || '');
      setDueDate(projectToEdit.dueDate || '');
      setHealth(projectToEdit.health || 'On track');
      setTab('scratch');
      setConfirmDelete(false);
    } else {
      setName('');
      setKey('');
      setDescription('');
      setColor('purple');
      setPriority('Medium');
      setStatus('Planned');
      setStartDate('');
      setDueDate('');
      setHealth('On track');
      setSelectedTemplateId(null);
      setTab('scratch');
      setConfirmDelete(false);
    }
    setError('');
  }, [projectToEdit, isOpen]);

  function handleSelectTemplate(tplId: string) {
    setSelectedTemplateId(tplId);
    const tpl = projectTemplates.find((t) => t.id === tplId);
    if (tpl) {
      setName(tpl.name);
      setKey(tpl.key);
      setDescription(tpl.description);
      setColor(tpl.color);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a project name.');
      return;
    }
    if (!key.trim() || key.length < 2) {
      setError('Project key must be at least 2 characters.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await onSaveProject({
        id: projectToEdit?.id,
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim(),
        color,
        priority,
        status,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        health,
        templateId: selectedTemplateId || undefined,
        action: isEditing ? 'update' : 'create',
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save project.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!onDeleteProject || !projectToEdit) return;
    setBusy(true);
    setError('');
    try {
      await onDeleteProject(projectToEdit.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete project.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-[580px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderKanban className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">
                {isEditing ? 'Project Settings' : 'Create new project'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isEditing
                  ? 'Adjust project parameters, dates, or team configuration.'
                  : 'Organize your team’s deliverables, track milestones, and ship together.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!isEditing && (
          <Tabs
            value={tab}
            onValueChange={(val) => {
              setTab(val as 'scratch' | 'template');
              if (val === 'scratch') setSelectedTemplateId(null);
            }}
            className="w-full mt-1"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scratch">Start from scratch</TabsTrigger>
              <TabsTrigger value="template">
                <Sparkles data-icon="inline-start" className="size-3.5" />
                Use a template
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {tab === 'template' && !isEditing ? (
          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto py-2">
            {projectTemplates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  className={cn(
                    'flex flex-col gap-1 p-3 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'border-primary/60 bg-primary/5 shadow-xs'
                      : 'border-border bg-card hover:bg-accent/40'
                  )}
                  onClick={() => handleSelectTemplate(tpl.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`project-dot ${tpl.color}`} />
                      <strong className="text-sm font-semibold">{tpl.name}</strong>
                      <Badge variant="outline" className="text-[10px]">
                        {tpl.key}
                      </Badge>
                    </div>
                    {isSelected && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{tpl.description}</p>
                </button>
              );
            })}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="proj-name" className="text-xs font-medium text-foreground">
              Project name
            </label>
            <Input
              id="proj-name"
              required
              maxLength={80}
              placeholder="e.g. Mobile redesign, API Gateway v2"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!isEditing && !key) {
                  const suggested = e.target.value
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 4)
                    .toUpperCase();
                  if (suggested.match(/^[A-Z]+$/)) setKey(suggested);
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="proj-key" className="text-xs font-medium text-foreground">
                Project key
              </label>
              <Input
                id="proj-key"
                required
                maxLength={6}
                placeholder="PROJ"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="uppercase"
              />
              <span className="text-[10px] text-muted-foreground">Unique identifier prefix</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="proj-status" className="text-xs font-medium text-foreground">
                Project status
              </label>
              <Select value={status} onValueChange={(val) => setStatus(val as ProjectStatus)}>
                <SelectTrigger id="proj-status" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="proj-desc" className="text-xs font-medium text-foreground">
                Description
              </label>
              <span className="text-[11px] text-muted-foreground">optional</span>
            </div>
            <Textarea
              id="proj-desc"
              rows={2}
              maxLength={300}
              placeholder="What are the goals, target deliverables, or scope?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="proj-priority" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Flag className="size-3.5 text-muted-foreground" /> Priority
              </label>
              <Select value={priority} onValueChange={(val) => setPriority(val as PriorityLevel)}>
                <SelectTrigger id="proj-priority" className="w-full">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="proj-health" className="text-xs font-medium text-foreground">
                Project health
              </label>
              <Select value={health} onValueChange={(val) => setHealth(val as 'On track' | 'At risk' | 'Delayed')}>
                <SelectTrigger id="proj-health" className="w-full">
                  <SelectValue placeholder="Health" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="On track">On track</SelectItem>
                    <SelectItem value="At risk">At risk</SelectItem>
                    <SelectItem value="Delayed">Delayed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="proj-start" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" /> Start date
              </label>
              <Input
                id="proj-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="proj-due" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" /> Target completion
              </label>
              <Input
                id="proj-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Project badge color</span>
            <div className="flex gap-2">
              {(['purple', 'blue', 'green', 'orange'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    'size-7 rounded-full transition-transform flex items-center justify-center',
                    c,
                    color === c && 'ring-2 ring-primary ring-offset-2'
                  )}
                  onClick={() => setColor(c)}
                >
                  {color === c && <Check className="size-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving...' : isEditing ? 'Save project settings' : 'Create project'}
              {!busy && <ArrowRight data-icon="inline-end" />}
            </Button>
          </DialogFooter>
        </form>

        {isEditing && onDeleteProject && projectToEdit && (
          <div className="mt-6 pt-4 border-t border-destructive/20 flex flex-col gap-3">
            <div>
              <strong className="text-xs font-semibold text-destructive">Archive or delete project</strong>
              <p className="text-[11px] text-muted-foreground">
                Permanently remove {projectToEdit.name} and all its associated tasks and issues.
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
                Delete project
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
      </DialogContent>
    </Dialog>
  );
}
