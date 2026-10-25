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
  Sparkles,
  MessageSquare,
  ArrowUpRight
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

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
  onOpenTaskChat?: (issue: Issue) => void;
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
  onOpenTaskChat,
}: IssueDrawerProps) {
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [selectedPreviewAttachment, setSelectedPreviewAttachment] = useState<TaskAttachment | null>(null);
  const [commentAttachments, setCommentAttachments] = useState<TaskAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentImageInputRef = useRef<HTMLInputElement>(null);

  if (!issue || isClientUser) return null;

  function handleFieldChange<K extends keyof Issue>(field: K, value: Issue[K]) {
    if (!canEdit || !issue) return;
    const updated = { ...issue, [field]: value };
    onUpdate(updated);
  }

  function handleSelectCommentImage(file: File) {
    if (!issue) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newAtt: TaskAttachment = {
        id: 'att-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        taskId: issue.id,
        projectId: issue.projectId,
        name: file.name,
        size: file.size,
        type: file.type || 'image/png',
        url: reader.result as string,
        caption: `Attached by ${currentUserName}`,
        uploaderName: currentUserName,
        uploaderEmail: currentUserEmail,
        uploadedAt: new Date().toISOString(),
        isClientVisible: true,
      };
      setCommentAttachments(prev => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if ((!commentText.trim() && commentAttachments.length === 0) || !issue) return;
    const newComment: IssueComment = {
      id: 'c-' + Date.now(),
      issueId: issue.id,
      authorName: currentUserName,
      authorEmail: currentUserEmail,
      authorRole: isClientUser ? 'client' : undefined,
      content: commentText.trim() || (commentAttachments.length > 0 ? '(Attached screenshot / image)' : ''),
      isInternal: isClientUser ? false : isInternalComment,
      attachments: commentAttachments.length > 0 ? commentAttachments : undefined,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...issue,
      comments: [...(issue.comments || []), newComment],
      attachments: commentAttachments.length > 0 
        ? [...(issue.attachments || []), ...commentAttachments]
        : (issue.attachments || []),
    };
    onUpdate(updated);
    setCommentText('');
    setCommentAttachments([]);
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
  const assignedMember = members.find((m) => m.id === issue.assignee);

  function getStatusColor(status: IssueStatus) {
    switch (status) {
      case 'Done': return 'bg-emerald-500';
      case 'In progress': return 'bg-blue-500';
      case 'In review': return 'bg-purple-500';
      case 'Blocked': return 'bg-rose-500';
      default: return 'bg-amber-500';
    }
  }

  return (
    <>
      <Sheet open={Boolean(issue)} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[540px] p-0 flex flex-col gap-0 overflow-y-auto bg-background"
        >
          {/* Drawer Header */}
          <SheetHeader className="px-5 py-3 border-b border-border flex flex-row items-center justify-between text-left space-y-0 bg-card/60 sticky top-0 z-10 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/70">
                {projectKey}-{issue.number}
              </span>
              <span className={`size-2 rounded-full ${getStatusColor(issue.status)}`} />
              <SheetTitle className="text-xs font-medium text-muted-foreground">{issue.status}</SheetTitle>
              {issue.status === 'Blocked' && (
                <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
                  Blocked
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5 mr-6">
              {onOpenTaskChat && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => onOpenTaskChat(issue)}
                  className="gap-1.5 h-7 text-xs border-primary/30 text-primary hover:bg-primary/10 font-medium"
                  title="Open live chat popover"
                >
                  <MessageSquare className="size-3.5" /> Task Chat
                </Button>
              )}

              {canManage && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                  onClick={() => setConfirmDelete(true)}
                  title="Delete task"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </SheetHeader>

          <SheetDescription className="sr-only">
            Issue details for {projectKey}-{issue.number}: {issue.title}
          </SheetDescription>

          <div className="p-5 flex flex-col gap-4 flex-1">
            {/* Title */}
            <Input
              value={issue.title}
              disabled={!canEdit}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Task title..."
              className="text-lg font-bold tracking-tight border-none shadow-none px-0 py-0.5 h-auto focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/50"
            />

            {/* Compact Linear-Style Properties Grid */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                {/* Status */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5 shrink-0 font-medium">
                    <Clock className="size-3.5 text-muted-foreground" /> Status
                  </span>
                  <Select
                    value={issue.status}
                    disabled={!canEdit}
                    onValueChange={(val) => handleFieldChange('status', val as IssueStatus)}
                  >
                    <SelectTrigger size="sm" className="h-7 text-xs font-medium bg-background border-border/70 rounded-md w-auto min-w-[105px] justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`size-1.5 rounded-full shrink-0 ${getStatusColor(issue.status)}`} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent align="end">
                      {['Backlog', 'To do', 'In progress', 'In review', 'Blocked', 'Done'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5 shrink-0 font-medium">
                    <Flag className="size-3.5 text-muted-foreground" /> Priority
                  </span>
                  <Select
                    value={issue.priority}
                    disabled={!canEdit}
                    onValueChange={(val) => handleFieldChange('priority', val as PriorityLevel)}
                  >
                    <SelectTrigger size="sm" className="h-7 text-xs font-medium bg-background border-border/70 rounded-md w-auto min-w-[105px] justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`size-1.5 rounded-full shrink-0 ${
                          issue.priority === 'Urgent' ? 'bg-rose-500' :
                          issue.priority === 'High' ? 'bg-amber-500' :
                          issue.priority === 'Medium' ? 'bg-blue-500' : 'bg-slate-400'
                        }`} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent align="end">
                      {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5 shrink-0 font-medium">
                    <User className="size-3.5 text-muted-foreground" /> Assignee
                  </span>
                  <Select
                    value={issue.assignee || 'unassigned'}
                    disabled={!canEdit}
                    onValueChange={(val) => handleFieldChange('assignee', val === 'unassigned' ? null : val)}
                  >
                    <SelectTrigger size="sm" className="h-7 text-xs font-medium bg-background border-border/70 rounded-md w-auto min-w-[105px] justify-between">
                      <span className="truncate">{assignedMember ? assignedMember.name : 'Unassigned'}</span>
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Label */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5 shrink-0 font-medium">
                    <Tag className="size-3.5 text-muted-foreground" /> Label
                  </span>
                  <Select
                    value={issue.label}
                    disabled={!canEdit}
                    onValueChange={(val) => handleFieldChange('label', val as IssueLabel)}
                  >
                    <SelectTrigger size="sm" className="h-7 text-xs font-medium bg-background border-border/70 rounded-md w-auto min-w-[105px] justify-between">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {['Feature', 'Design', 'Bug', 'Research', 'Task', 'Feedback'].map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5 shrink-0 font-medium">
                    <Calendar className="size-3.5 text-muted-foreground" /> Due Date
                  </span>
                  <Input
                    type="date"
                    value={issue.dueDate || ''}
                    disabled={!canEdit}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                    className="h-7 text-xs w-[125px] bg-background border-border/70 rounded-md"
                  />
                </div>

                {/* Client Visibility */}
                {!isClientUser && (
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-muted-foreground flex items-center gap-1.5 shrink-0 font-medium">
                      <Lock className="size-3.5 text-muted-foreground" /> Visibility
                    </span>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleFieldChange('isClientVisible', issue.isClientVisible === false)}
                      className={cn(
                        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-all border shrink-0",
                        issue.isClientVisible !== false
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      )}
                      title={issue.isClientVisible !== false ? 'Clients can view this task' : 'Internal task hidden from client'}
                    >
                      {issue.isClientVisible !== false ? (
                        <>
                          <Eye className="size-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Client visible</span>
                        </>
                      ) : (
                        <>
                          <Lock className="size-3" />
                          <span>Internal only</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Description</span>
              <Textarea
                rows={3}
                value={issue.description}
                disabled={!canEdit}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="What is this task about? Add details or acceptance criteria..."
                className="text-xs leading-relaxed resize-y min-h-[70px] bg-background border-border/70 rounded-lg focus:border-primary"
              />
            </div>

            {/* Clean, Segmented Content Tabs */}
            <Tabs defaultValue="discussion" className="w-full flex-1 flex flex-col gap-3">
              <TabsList className="w-full grid grid-cols-3 bg-muted/40 p-1 rounded-lg border border-border/60 h-9">
                <TabsTrigger value="discussion" className="text-xs font-medium gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                  <MessageSquare className="size-3.5" />
                  <span>Discussion</span>
                  {visibleComments.length > 0 && (
                    <span className="px-1.5 py-0 text-[10px] h-4 rounded-full bg-primary/10 text-primary font-semibold">
                      {visibleComments.length}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger value="checklist" className="text-xs font-medium gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                  <CheckSquare className="size-3.5" />
                  <span>Checklist</span>
                  {subtasks.length > 0 && (
                    <span className="px-1.5 py-0 text-[10px] h-4 rounded-full bg-primary/10 text-primary font-semibold">
                      {completedSubtasks}/{subtasks.length}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger value="attachments" className="text-xs font-medium gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                  <Paperclip className="size-3.5" />
                  <span>Files</span>
                  {(issue.attachments || []).length > 0 && (
                    <span className="px-1.5 py-0 text-[10px] h-4 rounded-full bg-primary/10 text-primary font-semibold">
                      {(issue.attachments || []).length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: DISCUSSION */}
              <TabsContent value="discussion" className="flex flex-col gap-3 mt-0 focus-visible:outline-hidden">
                <div className="flex flex-col gap-2">
                  {visibleComments.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                      No comments yet. Start the conversation with your team or client below.
                    </div>
                  ) : (
                    visibleComments.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 transition-all ${
                          c.isInternal
                            ? 'border-amber-500/30 bg-amber-500/5'
                            : c.authorRole === 'client'
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border/80 bg-card'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{c.authorName}</span>
                            {c.authorRole === 'client' && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-primary border-primary/40 bg-primary/10 font-semibold">
                                Client Feedback
                              </Badge>
                            )}
                            {c.isInternal && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-amber-700 dark:text-amber-300 border-amber-500/40 bg-amber-500/10">
                                <Lock className="size-2.5 mr-1" /> Internal
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{c.content}</p>

                        {/* Attached Images in Comment */}
                        {c.attachments && c.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50">
                            {c.attachments.map((att) => (
                              <div
                                key={att.id}
                                onClick={() => setSelectedPreviewAttachment(att)}
                                className="group relative cursor-pointer rounded-lg overflow-hidden border border-border/80 bg-muted/30 hover:border-primary transition-all max-w-[140px] shadow-2xs"
                                title={`Click to zoom ${att.name}`}
                              >
                                <div className="h-20 w-32 bg-black/5 flex items-center justify-center overflow-hidden">
                                  {att.type.startsWith('image/') ? (
                                    <img 
                                      src={att.url} 
                                      alt={att.name} 
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center gap-1 text-muted-foreground p-2">
                                      <FileText className="size-5 text-primary" />
                                      <span className="text-[10px] truncate max-w-[100px]">{att.name}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-medium gap-1 transition-opacity">
                                  <Eye className="size-3.5" /> Preview
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Composer */}
                <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-1">
                  {/* Hidden image file input */}
                  <input
                    ref={commentImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSelectCommentImage(e.target.files[0]);
                      }
                      e.target.value = '';
                    }}
                  />

                  {/* Attached images preview before sending */}
                  {commentAttachments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/70">
                      {commentAttachments.map((att) => (
                        <div key={att.id} className="relative group size-14 rounded-md overflow-hidden border border-border bg-black/10 shrink-0 shadow-2xs">
                          <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setCommentAttachments(prev => prev.filter(a => a.id !== att.id))}
                            className="absolute top-1 right-1 size-4 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-destructive transition-colors"
                            title="Remove attached image"
                          >
                            <X className="size-2.5" />
                          </button>
                        </div>
                      ))}
                      <span className="text-[11px] text-muted-foreground">
                        {commentAttachments.length} {commentAttachments.length === 1 ? 'image' : 'images'} attached
                      </span>
                    </div>
                  )}

                  <Textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      isInternalComment 
                        ? "Write an internal team note (hidden from client)..." 
                        : isClientUser
                        ? "Add client comment or report an issue..."
                        : "Write a comment or reply to this task..."
                    }
                    className="text-xs resize-none bg-background border-border/80 rounded-lg focus:border-primary"
                  />

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => commentImageInputRef.current?.click()}
                        className="h-7 text-xs gap-1.5 border-border/80 text-muted-foreground hover:text-foreground"
                        title="Attach image or screenshot to comment"
                      >
                        <ImageIcon className="size-3.5 text-primary" />
                        <span>Attach image</span>
                      </Button>

                      {!isClientUser && (
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground select-none">
                          <input
                            type="checkbox"
                            checked={isInternalComment}
                            onChange={(e) => setIsInternalComment(e.target.checked)}
                            className="rounded border-border text-amber-600 focus:ring-amber-500 size-3.5"
                          />
                          <span className="flex items-center gap-1">
                            <Lock className="size-3 text-amber-500" /> Internal note
                          </span>
                        </label>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      size="xs" 
                      disabled={!commentText.trim() && commentAttachments.length === 0} 
                      className="gap-1.5 h-7 px-3 text-xs"
                    >
                      <Send className="size-3" /> Send
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* TAB 2: CHECKLIST */}
              <TabsContent value="checklist" className="flex flex-col gap-3 mt-0 focus-visible:outline-hidden">
                {subtasks.length > 0 && (
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-card border border-border/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">Progress</span>
                      <span className="text-muted-foreground">{completedSubtasks} of {subtasks.length} ({subtasksPercent}%)</span>
                    </div>
                    <Progress value={subtasksPercent} className="h-1.5" />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  {subtasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                      No checklist items yet. Add subtasks to track deliverables step-by-step.
                    </div>
                  ) : (
                    subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-card hover:bg-muted/40 text-xs gap-2 group transition-colors"
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
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded-sm"
                            title="Remove subtask"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {canEdit && (
                  <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-1">
                    <Input
                      placeholder="Add an action item or subtask..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="text-xs h-8 bg-background border-border/80"
                    />
                    <Button type="submit" size="xs" disabled={!newSubtaskTitle.trim()} className="h-8 px-3 shrink-0 gap-1">
                      <Plus className="size-3.5" /> Add
                    </Button>
                  </form>
                )}
              </TabsContent>

              {/* TAB 3: FILES & ATTACHMENTS */}
              <TabsContent value="attachments" className="flex flex-col gap-3 mt-0 focus-visible:outline-hidden">
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

                {(!issue.attachments || issue.attachments.length === 0) ? (
                  (canEdit || isClientUser) ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <Paperclip className="size-6 text-muted-foreground/80" />
                      <span className="text-xs font-medium text-foreground">Click to upload files or media</span>
                      <span className="text-[11px] text-muted-foreground">Images, videos, or PDFs for review</span>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                      No attachments uploaded for this task yet.
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {(canEdit || isClientUser) && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-7 text-xs gap-1"
                        >
                          <Plus className="size-3" /> Add file
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {issue.attachments.map((att) => {
                        const isImg = att.type.startsWith('image/');
                        const isVid = att.type.startsWith('video/') || att.name.endsWith('.mp4');

                        return (
                          <div
                            key={att.id}
                            className="p-2.5 rounded-lg border border-border/80 bg-card flex flex-col gap-1.5 text-xs group relative hover:border-primary/50 transition-colors"
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
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
              Delete Task
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
