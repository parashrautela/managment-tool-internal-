'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  X, 
  Reply, 
  Lock, 
  ShieldCheck, 
  Building2, 
  Users, 
  Briefcase, 
  FileText, 
  Film, 
  ImageIcon, 
  ArrowUpRight, 
  Sparkles,
  Check,
  Eye,
  Flag
} from 'lucide-react';
import type { 
  Issue, 
  Project, 
  Member, 
  PersonaUser, 
  TaskAttachment, 
  IssueComment 
} from '../types/workspace';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface TaskGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  project: Project | null;
  members: Member[];
  currentPersona: PersonaUser;
  onSendMessage: (
    issueId: string, 
    content: string, 
    attachments?: TaskAttachment[], 
    replyToId?: string, 
    replyToSnippet?: string, 
    isInternal?: boolean
  ) => void;
  onPreviewAttachment?: (attachment: TaskAttachment) => void;
  onOpenTaskDetails?: (issue: Issue) => void;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function TaskGroupChatModal({
  isOpen,
  onClose,
  issue,
  project,
  members,
  currentPersona,
  onSendMessage,
  onPreviewAttachment,
  onOpenTaskDetails,
}: TaskGroupChatModalProps) {
  const [inputText, setInputText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyingTo, setReplyingTo] = useState<IssueComment | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<TaskAttachment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat on new messages or open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, issue?.comments?.length]);

  if (!issue) return null;

  const isClientUser = currentPersona.role === 'client';

  // Filter messages: Client never sees internal notes
  const visibleMessages = (issue.comments || []).filter((c) => {
    if (isClientUser && (c.isInternal || c.isInternalOnly)) return false;
    return true;
  });

  const projectKey = project?.key || 'TASK';
  const assigneeMember = members.find((m) => m.id === issue.assignee);
  const clientMember = members.find((m) => m.role === 'client') || {
    name: project?.clientContactName || 'Acme Stakeholder',
    email: project?.clientEmail || 'client@acme.com',
    role: 'client' as const
  };

  function handleFileSelected(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const newAtt: TaskAttachment = {
        id: 'att-' + Date.now(),
        taskId: issue?.id,
        projectId: project?.id || '',
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: reader.result as string,
        uploaderName: currentPersona.displayName,
        uploaderEmail: currentPersona.email,
        uploadedAt: new Date().toISOString(),
        isClientVisible: !isInternalNote,
      };
      setPendingAttachment(newAtt);
    };
    reader.readAsDataURL(file);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = inputText.trim();
    if (!content && !pendingAttachment) return;

    onSendMessage(
      issue!.id,
      content,
      pendingAttachment ? [pendingAttachment] : undefined,
      replyingTo?.id,
      replyingTo ? `${replyingTo.authorName}: ${replyingTo.content.slice(0, 80)}` : undefined,
      isClientUser ? false : isInternalNote
    );

    setInputText('');
    setReplyingTo(null);
    setPendingAttachment(null);
    setIsInternalNote(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] p-0 gap-0 overflow-hidden rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-5 pb-3.5 border-b border-border bg-card">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-mono font-bold px-2 py-0.5 border-primary/40 text-primary bg-primary/5">
                {projectKey}-{issue.number}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {issue.status}
              </Badge>
              <span className={`priority ${issue.priority.toLowerCase()} text-xs flex items-center gap-1`}>
                <Flag className="size-3" /> {issue.priority}
              </span>
            </div>

            {!isClientUser && onOpenTaskDetails && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  onClose();
                  onOpenTaskDetails(issue);
                }}
                className="text-xs text-muted-foreground hover:text-foreground gap-1 h-7"
              >
                Task Details <ArrowUpRight className="size-3.5" />
              </Button>
            )}
          </div>

          <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="size-5 text-primary shrink-0" />
            <span className="truncate">{issue.title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Dedicated group discussion between client stakeholders and project team.
          </DialogDescription>

          {/* Group Participants Bar */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60 text-xs overflow-x-auto pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
              In this chat:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20 text-[11px]">
                <Building2 className="size-3" />
                <strong>Client:</strong> {clientMember.name}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-800 dark:text-blue-200 border border-blue-500/20 text-[11px]">
                <Users className="size-3" />
                <strong>Team:</strong> {assigneeMember ? assigneeMember.name : 'Unassigned'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-800 dark:text-purple-200 border border-purple-500/20 text-[11px]">
                <Briefcase className="size-3" />
                <strong>PM:</strong> {project?.projectManagerName || 'Alex Morgan'}
              </span>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-muted/20 min-h-[260px] max-h-[380px]">
          {visibleMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-border bg-card/60 my-4">
              <span className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                <Sparkles className="size-5" />
              </span>
              <strong className="text-sm font-semibold text-foreground">No messages in this task chat yet</strong>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                Start the group conversation! Share progress updates, request client feedback, or post attachments specifically for <strong>{projectKey}-{issue.number}</strong>.
              </p>
            </div>
          ) : (
            visibleMessages.map((msg) => {
              const isMine = msg.authorEmail === currentPersona.email;
              const isClientMsg = msg.authorRole === 'client' || msg.authorName.toLowerCase().includes('client') || msg.authorName.toLowerCase().includes('acme');
              const isInternal = Boolean(msg.isInternal || msg.isInternalOnly);

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col gap-1 text-xs group ${
                    isInternal ? 'p-3 rounded-xl bg-amber-500/5 border border-amber-500/30' : ''
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                        {msg.authorName.slice(0, 2).toUpperCase()}
                      </span>
                      <strong className="font-semibold text-foreground text-xs">{msg.authorName}</strong>
                      
                      {/* Role Pill */}
                      {isClientMsg ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                          Client
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
                          Team
                        </Badge>
                      )}

                      {isInternal && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40 font-medium">
                          <Lock className="size-2.5 mr-1" /> Team Only
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(msg)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted"
                        title="Reply to message"
                      >
                        <Reply className="size-3" /> Reply
                      </button>
                    </div>
                  </div>

                  {/* Quoted Snippet if replying */}
                  {msg.replyToSnippet && (
                    <div className="ml-8 pl-2.5 border-l-2 border-primary/40 text-[11px] text-muted-foreground italic bg-muted/30 py-0.5 px-2 rounded-r">
                      {msg.replyToSnippet}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`ml-8 p-3 rounded-xl border leading-relaxed whitespace-pre-wrap ${
                    isMine 
                      ? 'bg-primary/5 border-primary/20 text-foreground' 
                      : 'bg-card border-border text-foreground'
                  }`}>
                    {msg.content}

                    {/* Attachments if any */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-border/60 flex flex-wrap gap-2">
                        {msg.attachments.map((att) => {
                          const isImg = att.type.startsWith('image/');
                          const isVid = att.type.startsWith('video/') || att.name.endsWith('.mp4');

                          return (
                            <button
                              key={att.id}
                              type="button"
                              onClick={() => onPreviewAttachment && onPreviewAttachment(att)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background hover:border-primary/50 text-xs text-foreground transition-all group/att"
                            >
                              {isImg ? (
                                <ImageIcon className="size-3.5 text-primary shrink-0" />
                              ) : isVid ? (
                                <Film className="size-3.5 text-primary shrink-0" />
                              ) : (
                                <FileText className="size-3.5 text-primary shrink-0" />
                              )}
                              <span className="font-medium max-w-[150px] truncate">{att.name}</span>
                              <span className="text-[10px] text-muted-foreground">({formatBytes(att.size)})</span>
                              <Eye className="size-3 text-muted-foreground group-hover/att:text-primary ml-1" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Composer */}
        <div className="p-4 border-t border-border bg-card flex flex-col gap-2">
          {/* Active Reply Banner */}
          {replyingTo && (
            <div className="flex items-center justify-between text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <span className="flex items-center gap-1.5 truncate">
                <Reply className="size-3 shrink-0" />
                Replying to <strong>{replyingTo.authorName}</strong>: &quot;{replyingTo.content.slice(0, 60)}&quot;
              </span>
              <button 
                type="button" 
                onClick={() => setReplyingTo(null)}
                className="hover:opacity-80 p-0.5"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Pending Attachment Preview */}
          {pendingAttachment && (
            <div className="flex items-center justify-between text-xs px-2.5 py-1 rounded-lg bg-muted border border-border">
              <span className="flex items-center gap-1.5 truncate text-foreground">
                <Paperclip className="size-3.5 text-primary shrink-0" />
                <span className="font-medium">{pendingAttachment.name}</span>
                <span className="text-muted-foreground">({formatBytes(pendingAttachment.size)})</span>
              </span>
              <button 
                type="button" 
                onClick={() => setPendingAttachment(null)}
                className="text-muted-foreground hover:text-destructive p-0.5"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex flex-col gap-2">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message task group chat as ${currentPersona.displayName} (Shift+Enter for newline)...`}
              rows={2}
              className="resize-none text-xs"
              autoFocus
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="size-3.5" /> Attach File
                </Button>

                {!isClientUser && (
                  <div className="flex items-center gap-1.5">
                    <Switch
                      id="internal-note-toggle"
                      checked={isInternalNote}
                      onCheckedChange={setIsInternalNote}
                      className="scale-75"
                    />
                    <label 
                      htmlFor="internal-note-toggle" 
                      className="text-[11px] text-muted-foreground cursor-pointer select-none flex items-center gap-1"
                    >
                      <Lock className="size-3" /> Internal team note
                    </label>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="xs"
                disabled={!inputText.trim() && !pendingAttachment}
                className="h-7 px-3 gap-1.5 font-medium"
              >
                Send <Send className="size-3" />
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
