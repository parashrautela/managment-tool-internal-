'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Reply, 
  X, 
  MessageSquare, 
  User, 
  ShieldCheck, 
  Building2, 
  Briefcase, 
  ImageIcon, 
  FileText, 
  Film 
} from 'lucide-react';
import type { ProjectMessage, TaskAttachment, Project } from '../types/workspace';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ProjectChatProps {
  project: Project;
  messages: ProjectMessage[];
  currentUserName: string;
  currentUserEmail: string;
  currentUserRole: string;
  onSendMessage: (msg: {
    projectId: string;
    content: string;
    replyToId?: string;
    replyToSnippet?: string;
    attachments?: TaskAttachment[];
  }) => void;
  onOpenIssueByKey?: (key: string) => void;
}

const roleBadgeColor = {
  admin: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  owner: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  project_manager: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  employee: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  member: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  client: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  viewer: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
};

const roleLabel = {
  admin: 'Org Admin',
  owner: 'Org Owner',
  project_manager: 'PM',
  employee: 'Team',
  member: 'Team',
  client: 'Client',
  viewer: 'Viewer',
};

export function ProjectChat({
  project,
  messages,
  currentUserName,
  currentUserEmail,
  currentUserRole,
  onSendMessage,
  onOpenIssueByKey,
}: ProjectChatProps) {
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<ProjectMessage | null>(null);
  const [attachedFile, setAttachedFile] = useState<TaskAttachment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleFileSelect(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const att: TaskAttachment = {
        id: 'chat-att-' + Date.now(),
        projectId: project.id,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: reader.result as string,
        uploaderName: currentUserName,
        uploaderEmail: currentUserEmail,
        uploadedAt: new Date().toISOString(),
        isClientVisible: true,
      };
      setAttachedFile(att);
    };
    reader.readAsDataURL(file);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !attachedFile) return;

    onSendMessage({
      projectId: project.id,
      content: content.trim(),
      replyToId: replyingTo?.id,
      replyToSnippet: replyingTo ? `${replyingTo.senderName}: "${replyingTo.content.slice(0, 40)}..."` : undefined,
      attachments: attachedFile ? [attachedFile] : undefined,
    });

    setContent('');
    setReplyingTo(null);
    setAttachedFile(null);
  }

  // Parse text for #KEY-123 issue references
  function renderFormattedContent(text: string) {
    const parts = text.split(/(#[A-Z0-9]+-\d+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#') && part.includes('-')) {
        return (
          <span
            key={i}
            onClick={() => onOpenIssueByKey && onOpenIssueByKey(part.slice(1))}
            className="font-mono text-primary font-semibold cursor-pointer underline hover:text-primary/80"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }

  return (
    <Card className="border-border shadow-xs flex flex-col h-[700px] overflow-hidden">
      {/* Chat Header */}
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0 bg-card">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="size-4" />
          </span>
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <span>{project.name} Discussion Channel</span>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" title="Channel Active" />
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Real-time collaboration between internal project team and external client stakeholders.
            </CardDescription>
          </div>
        </div>

        <Badge variant="outline" className="text-xs hidden sm:inline-flex">
          {messages.length} messages
        </Badge>
      </CardHeader>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-muted/20">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <MessageSquare className="size-10 text-muted-foreground/30 mb-2" />
            <strong className="text-sm font-semibold text-foreground">Start the conversation</strong>
            <p className="text-xs max-w-sm mt-1">
              Share quick updates, reference links, and questions about {project.name}.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderEmail.toLowerCase() === currentUserEmail.toLowerCase();
            const badgeClass = roleBadgeColor[msg.senderRole as keyof typeof roleBadgeColor] || 'bg-muted text-foreground';
            const label = roleLabel[msg.senderRole as keyof typeof roleLabel] || 'Member';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                  {msg.senderName[0]}
                </span>

                <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Metadata */}
                  <div className="flex items-center gap-2 text-xs">
                    <strong className="font-semibold text-foreground">
                      {isMe ? 'You' : msg.senderName}
                    </strong>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${badgeClass}`}>
                      {label}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Reply Reference Bubble */}
                  {msg.replyToSnippet && (
                    <div className="text-[11px] text-muted-foreground border-l-2 border-primary/50 pl-2 py-0.5 bg-card/50 rounded-r">
                      Replying to {msg.replyToSnippet}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs flex flex-col gap-2 ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-xs'
                        : 'bg-card border border-border text-foreground rounded-tl-xs'
                    }`}
                  >
                    {msg.content && (
                      <p className="whitespace-pre-wrap">{renderFormattedContent(msg.content)}</p>
                    )}

                    {/* Attached files preview */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-1 pt-1.5 border-t border-border/40">
                        {msg.attachments.map((att) => (
                          <div
                            key={att.id}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                              isMe ? 'bg-primary-foreground/10 text-primary-foreground' : 'bg-muted text-foreground'
                            }`}
                          >
                            <Paperclip className="size-3.5 shrink-0" />
                            <span className="font-medium truncate flex-1">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons (Reply) */}
                  <div className="flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setReplyingTo(msg)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5"
                    >
                      <Reply className="size-3" /> Reply
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Reply Context Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-muted/60 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2 truncate">
            <Reply className="size-3.5 text-primary shrink-0" />
            <span>Replying to <strong>{replyingTo.senderName}</strong>: "{replyingTo.content.slice(0, 50)}..."</span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Attachment Staging Banner */}
      {attachedFile && (
        <div className="px-4 py-2 bg-primary/10 border-t border-primary/20 flex items-center justify-between text-xs text-primary">
          <div className="flex items-center gap-2">
            <Paperclip className="size-3.5 shrink-0" />
            <span className="font-medium truncate">Attached: {attachedFile.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedFile(null)}
            className="text-primary hover:text-primary/80"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Message Input Box */}
      <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => fileInputRef.current?.click()}
          title="Attach reference file or screenshot"
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <Paperclip className="size-4" />
        </Button>

        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Message ${project.name} team (use #WEB-1 to reference tasks)...`}
          className="flex-1 text-xs h-9 bg-background"
        />

        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() && !attachedFile}
          className="h-9 px-3 gap-1.5 shrink-0"
        >
          <Send className="size-3.5" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </form>
    </Card>
  );
}
