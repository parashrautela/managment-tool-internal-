'use client';
import { useState } from 'react';
import { 
  Calendar, 
  Flag, 
  User, 
  Tag, 
  Trash2, 
  Send, 
  Clock, 
  ShieldCheck,
} from 'lucide-react';
import type { Issue, Member, PriorityLevel, IssueLabel } from '../types/workspace';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface IssueDrawerProps {
  issue: Issue | null;
  onClose: () => void;
  onUpdate: (updated: Issue) => void;
  onDelete: (issueId: string) => void;
  members: Member[];
  projectKey: string;
  canEdit: boolean;
}

export function IssueDrawer({
  issue,
  onClose,
  onUpdate,
  onDelete,
  members,
  projectKey,
  canEdit,
}: IssueDrawerProps) {
  const [commentText, setCommentText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!issue) return null;

  function handleFieldChange<K extends keyof Issue>(field: K, value: Issue[K]) {
    if (!canEdit || !issue) return;
    const updated = { ...issue, [field]: value };
    onUpdate(updated);
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !issue) return;
    const newComment = {
      id: 'c-' + Date.now(),
      issueId: issue.id,
      authorName: 'Alex Morgan',
      authorEmail: 'alex.morgan@company.com',
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...issue,
      comments: [...(issue.comments || []), newComment],
    };
    onUpdate(updated);
    setCommentText('');
  }

  return (
    <>
      <Sheet open={Boolean(issue)} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[520px] p-0 flex flex-col gap-0 overflow-y-auto"
        >
          {/* Drawer Header */}
          <SheetHeader className="p-5 border-b border-border flex flex-row items-center justify-between text-left space-y-0">
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="font-mono text-xs font-semibold">
                {projectKey}-{issue.number}
              </Badge>
              <span className={`status-dot ${issue.status.toLowerCase().replace(/\s+/g, '-')}`} />
              <SheetTitle className="text-sm font-semibold">{issue.status}</SheetTitle>
            </div>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 mr-7"
                onClick={() => setConfirmDelete(true)}
                title="Delete issue"
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </SheetHeader>

          <SheetDescription className="sr-only">
            Issue details for {projectKey}-{issue.number}: {issue.title}
          </SheetDescription>

          {!canEdit && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/50 border-b border-border text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>You have read-only access to this project.</span>
            </div>
          )}

          <div className="p-6 flex flex-col gap-6 flex-1">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <Input
                value={issue.title}
                disabled={!canEdit}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Issue title..."
                className="text-base font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:rounded-none"
              />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-card border border-border shadow-xs">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Clock className="size-3" /> Status
                </span>
                <Select
                  value={issue.status}
                  disabled={!canEdit}
                  onValueChange={(val) => handleFieldChange('status', val as Issue['status'])}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {['Backlog', 'To do', 'In progress', 'In review', 'Done'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Flag className="size-3" /> Priority
                </span>
                <Select
                  value={issue.priority}
                  disabled={!canEdit}
                  onValueChange={(val) => handleFieldChange('priority', val as PriorityLevel)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <User className="size-3" /> Assignee
                </span>
                <Select
                  value={issue.assignee || 'unassigned'}
                  disabled={!canEdit}
                  onValueChange={(val) => handleFieldChange('assignee', val === 'unassigned' ? null : val)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Tag className="size-3" /> Label
                </span>
                <Select
                  value={issue.label}
                  disabled={!canEdit}
                  onValueChange={(val) => handleFieldChange('label', val as IssueLabel)}
                >
                  <SelectTrigger size="sm" className="w-full">
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

              <div className="col-span-2 flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Calendar className="size-3" /> Due Date
                </span>
                <Input
                  type="date"
                  value={issue.dueDate || ''}
                  disabled={!canEdit}
                  onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </span>
              <Textarea
                rows={4}
                value={issue.description}
                disabled={!canEdit}
                placeholder="Add details, acceptance criteria, or context for this task..."
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="text-xs leading-relaxed"
              />
            </div>

            {/* Comments & Activity Feed */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Discussion & Activity
              </span>

              <div className="flex flex-col gap-2.5">
                {!issue.comments || issue.comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No comments yet. Start the conversation below.
                  </p>
                ) : (
                  issue.comments.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-xl border border-border bg-card shadow-xs text-xs flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <strong className="font-semibold text-foreground">{c.authorName}</strong>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-foreground/90 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {canEdit && (
                <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-2">
                  <Textarea
                    rows={2}
                    placeholder="Leave a comment or update..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!commentText.trim()}
                    className="self-end gap-1.5"
                  >
                    <Send data-icon="inline-start" /> Comment
                  </Button>
                </form>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this issue?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{projectKey}-{issue.number}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(issue.id);
                onClose();
              }}
            >
              Delete Issue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
