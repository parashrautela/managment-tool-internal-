'use client';
import { useState, useRef } from 'react';
import { 
  Calendar, 
  Flag, 
  User, 
  Tag, 
  Trash2, 
  Send, 
  Clock, 
  ShieldCheck, 
  Lock, 
  CheckSquare, 
  Plus, 
  Paperclip, 
  X, 
  Eye, 
  Film, 
  ImageIcon, 
  FileText, 
  Check, 
  Sparkles 
} from 'lucide-react';
import type { 
  Issue, 
  Member, 
  PriorityLevel, 
  IssueLabel, 
  IssueStatus, 
  TaskAttachment, 
  Subtask, 
  IssueComment 
} from '../types/workspace';
import { MediaViewerModal } from './media-viewer-modal';
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
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
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
  canManage?: boolean;
  isClientUser?: boolean;
  currentUserName?: string;
  currentUserEmail?: string;
}

export function IssueDrawer({
  issue,
  onClose,
  onUpdate,
  onDelete,
  members,
  projectKey,
  canEdit,
  canManage = false,
  isClientUser = false,
  currentUserName = 'Alex Morgan',
  currentUserEmail = 'alex.morgan@company.com',
}: IssueDrawerProps) {
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [selectedPreviewAttachment, setSelectedPreviewAttachment] = useState<TaskAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!issue) return null;

  function handleFieldChange<K extends keyof Issue>(field: K, value: Issue[K]) {
    if (!canEdit || !issue) return;
    const updated = { ...issue, [field]: value };
    onUpdate(updated);
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !issue) return;
    const newComment: IssueComment = {
      id: 'c-' + Date.now(),
      issueId: issue.id,
      authorName: currentUserName,
      authorEmail: currentUserEmail,
      content: commentText.trim(),
      isInternal: isClientUser ? false : isInternalComment,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...issue,
      comments: [...(issue.comments || []), newComment],
    };
    onUpdate(updated);
    setCommentText('');
    setIsInternalComment(false);
  }

  function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !issue) return;
    const newSubtask: Subtask = {
      id: 'sub-' + Date.now(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    const updated = {
      ...issue,
      subtasks: [...(issue.subtasks || []), newSubtask],
    };
    onUpdate(updated);
    setNewSubtaskTitle('');
  }

  function handleToggleSubtask(subtaskId: string) {
    if (!issue) return;
    const updatedSubtasks = (issue.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    onUpdate({ ...issue, subtasks: updatedSubtasks });
  }

  function handleDeleteSubtask(subtaskId: string) {
    if (!issue) return;
    const updatedSubtasks = (issue.subtasks || []).filter((s) => s.id !== subtaskId);
    onUpdate({ ...issue, subtasks: updatedSubtasks });
  }

  function handleFileUpload(file: File) {
    if (!issue) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newAtt: TaskAttachment = {
        id: 'att-' + Date.now(),
        taskId: issue.id,
        projectId: issue.projectId,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: reader.result as string,
        caption: `Attached to ${projectKey}-${issue.number}`,
        uploaderName: currentUserName,
        uploaderEmail: currentUserEmail,
        uploadedAt: new Date().toISOString(),
        isClientVisible: issue.isClientVisible ?? true,
      };
      const updated = {
        ...issue,
        attachments: [...(issue.attachments || []), newAtt],
      };
      onUpdate(updated);
    };
    reader.readAsDataURL(file);
  }

  function handleDeleteAttachment(attId: string) {
    if (!issue) return;
    const updatedAttachments = (issue.attachments || []).filter((a) => a.id !== attId);
    onUpdate({ ...issue, attachments: updatedAttachments });
  }

  // Filter comments for clients
  const visibleComments = (issue.comments || []).filter((c) => {
    if (isClientUser && c.isInternal) return false;
    return true;
  });

  // Calculate subtasks completion
  const subtasks = issue.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtasksPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  return (
    <>
      <Sheet open={Boolean(issue)} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[560px] p-0 flex flex-col gap-0 overflow-y-auto bg-background"
        >
          {/* Drawer Header */}
          <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between text-left space-y-0 bg-card">
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="font-mono text-xs font-semibold">
                {projectKey}-{issue.number}
              </Badge>
              <span className={`status-dot ${issue.status.toLowerCase().replace(/\s+/g, '-')}`} />
              <SheetTitle className="text-sm font-semibold">{issue.status}</SheetTitle>
              {issue.status === 'Blocked' && (
                <Badge variant="destructive" className="text-[10px]">
                  Blocked
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mr-6">
              {canManage && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                  title="Delete task"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </SheetHeader>

          <SheetDescription className="sr-only">
            Issue details for {projectKey}-{issue.number}: {issue.title}
          </SheetDescription>

          {!canEdit && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/50 border-b border-border text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>You are viewing this task in read-only mode.</span>
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
              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Clock className="size-3" /> Status
                </span>
                <Select
                  value={issue.status}
                  disabled={!canEdit}
                  onValueChange={(val) => handleFieldChange('status', val as IssueStatus)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {['Backlog', 'To do', 'In progress', 'In review', 'Blocked', 'Done'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
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

              {/* Assignee */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
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

              {/* Label */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
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
                      {['Feature', 'Design', 'Bug', 'Research', 'Task', 'Feedback'].map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
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

              {/* Client Visibility Switch */}
              {!isClientUser && (
                <div className="flex flex-col gap-1.5 justify-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Lock className="size-3" /> Client Visible
                  </span>
                  <div className="flex items-center justify-between h-8 px-2 rounded-md border border-input bg-background">
                    <span className="text-xs">
                      {issue.isClientVisible !== false ? 'Visible to Client' : 'Internal Only'}
                    </span>
                    <Switch
                      checked={issue.isClientVisible !== false}
                      disabled={!canEdit}
                      onCheckedChange={(checked) => handleFieldChange('isClientVisible', checked)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Description
              </label>
              <Textarea
                rows={4}
                value={issue.description}
                disabled={!canEdit}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Detailed task description, acceptance criteria, context..."
                className="text-xs leading-relaxed"
              />
            </div>

            {/* Subtasks / Checklist */}
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CheckSquare className="size-3.5 text-primary" />
                  Checklist & Subtasks ({completedSubtasks}/{subtasks.length})
                </span>
                {subtasks.length > 0 && (
                  <span className="text-xs font-semibold text-primary">{subtasksPercent}%</span>
                )}
              </div>

              {subtasks.length > 0 && (
                <Progress value={subtasksPercent} className="h-1.5 my-1" />
              )}

              <div className="flex flex-col gap-1.5 mt-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-xs gap-2 group"
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        disabled={!canEdit}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="rounded border-border text-primary focus:ring-primary size-4"
                      />
                      <span className={`truncate ${st.completed ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                        {st.title}
                      </span>
                    </label>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {canEdit && (
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                  <Input
                    placeholder="Add an action item or subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Button type="submit" size="xs" disabled={!newSubtaskTitle.trim()} className="h-8 px-3">
                    <Plus className="size-3.5" /> Add
                  </Button>
                </form>
              )}
            </div>

            {/* Attachments Section */}
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Paperclip className="size-3.5 text-primary" />
                  Media & Attachments ({(issue.attachments || []).length})
                </span>

                {canEdit && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 text-xs gap-1"
                    >
                      <Plus className="size-3" /> Attach File
                    </Button>
                  </div>
                )}
              </div>

              {(!issue.attachments || issue.attachments.length === 0) ? (
                <p className="text-xs text-muted-foreground italic py-1">
                  No attachments yet. Upload images, reference videos, or spec PDFs above.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {issue.attachments.map((att) => {
                    const isImg = att.type.startsWith('image/');
                    const isVid = att.type.startsWith('video/') || att.name.endsWith('.mp4');

                    return (
                      <div
                        key={att.id}
                        className="p-2.5 rounded-lg border border-border bg-muted/30 flex flex-col gap-1.5 text-xs group relative hover:border-primary/50 transition-colors"
                      >
                        <div
                          onClick={() => setSelectedPreviewAttachment(att)}
                          className="flex items-center gap-2 cursor-pointer truncate"
                        >
                          {isImg ? <ImageIcon className="size-4 text-primary shrink-0" /> : isVid ? <Film className="size-4 text-primary shrink-0" /> : <FileText className="size-4 text-primary shrink-0" />}
                          <span className="font-semibold text-foreground truncate">{att.name}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{att.uploaderName}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedPreviewAttachment(att)}
                              className="text-primary hover:underline flex items-center gap-0.5"
                            >
                              <Eye className="size-3" /> View
                            </button>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(att.id)}
                                className="text-muted-foreground hover:text-destructive p-0.5"
                              >
                                <X className="size-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comments Thread */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Discussion & Activity ({visibleComments.length})
              </span>

              <div className="flex flex-col gap-3">
                {visibleComments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No comments yet. Start the conversation below.
                  </p>
                ) : (
                  visibleComments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border text-xs flex flex-col gap-1 shadow-xs ${
                        c.isInternal
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <strong className="font-semibold text-foreground">{c.authorName}</strong>
                          {c.isInternal && (
                            <Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-300 border-amber-500/40 bg-amber-500/10">
                              <Lock className="size-2.5 mr-1" /> Internal Note
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-2">
                <Textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    isInternalComment 
                      ? "Write an internal team note (hidden from clients)..." 
                      : "Write a comment or reply to this task..."
                  }
                  className="text-xs"
                />

                <div className="flex items-center justify-between">
                  {!isClientUser ? (
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded border-border text-amber-600 focus:ring-amber-500 size-3.5"
                      />
                      <span className="flex items-center gap-1">
                        <Lock className="size-3 text-amber-500" /> Internal note (team only)
                      </span>
                    </label>
                  ) : <div />}

                  <Button type="submit" size="xs" disabled={!commentText.trim()} className="gap-1.5 self-end">
                    <Send className="size-3" /> Post Comment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Task {projectKey}-{issue.number} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
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

      {/* Media Viewer Modal */}
      <MediaViewerModal
        attachment={selectedPreviewAttachment}
        onClose={() => setSelectedPreviewAttachment(null)}
      />
    </>
  );
}
