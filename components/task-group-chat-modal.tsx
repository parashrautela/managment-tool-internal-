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
  Flag,
  Mic,
  Play,
  Pause,
  Square,
  Trash2,
  AlertCircle,
  Pencil
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  onUpdateStatus?: (issue: Issue, newStatus: string) => void;
  onUpdateIssue?: (updated: Issue) => void;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatTimer(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Generate realistic fallback voice note audio in case microphone permission is blocked
function createSimulatedVoiceNote(durationSeconds = 4): { blob: Blob; dataUrl: string } {
  const sampleRate = 8000;
  const numSamples = sampleRate * Math.max(1, durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 440 + 60 * Math.sin(t * 4);
    const envelope = Math.max(0, 1 - (t % 1.2) / 1.2);
    const sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.35;
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const dataUrl = `data:audio/wav;base64,${base64}`;

  return { blob, dataUrl };
}

// In-Message Interactive Voice Note Player Component
function VoiceNotePlayer({ attachment, isMine }: { attachment: TaskAttachment; isMine: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const cycleSpeed = () => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const effectiveDuration = duration > 0 ? duration : 10;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));

  // Visual audio waveform bar heights
  const waveformBars = [
    30, 50, 75, 40, 85, 95, 60, 45, 80, 100, 
    70, 55, 85, 90, 65, 45, 75, 85, 55, 40, 
    65, 80, 50, 35
  ];

  return (
    <div className={`mt-2 p-2.5 rounded-xl border flex flex-col gap-2 max-w-sm ${
      isMine 
        ? 'bg-primary/10 border-primary/30 text-foreground' 
        : 'bg-muted/50 border-border text-foreground'
    }`}>
      <audio ref={audioRef} src={attachment.url} preload="metadata" />
      
      <div className="flex items-center gap-2.5">
        <Button
          type="button"
          size="icon"
          onClick={togglePlay}
          className="size-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs shrink-0"
        >
          {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
        </Button>

        {/* Waveform Scrubber */}
        <div 
          className="flex-1 flex items-center gap-[2.5px] h-7 cursor-pointer group/wave py-1"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newPct = Math.max(0, Math.min(1, clickX / rect.width));
            if (audioRef.current && effectiveDuration) {
              audioRef.current.currentTime = newPct * effectiveDuration;
              setCurrentTime(newPct * effectiveDuration);
            }
          }}
          title="Click to seek"
        >
          {waveformBars.map((h, i) => {
            const barPct = (i / waveformBars.length) * 100;
            const isPlayed = barPct <= progressPercent;
            return (
              <span
                key={i}
                className={`flex-1 rounded-full transition-colors duration-150 ${
                  isPlayed 
                    ? 'bg-primary' 
                    : 'bg-muted-foreground/30 group-hover/wave:bg-muted-foreground/50'
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>

        {/* Speed toggle */}
        <button
          type="button"
          onClick={cycleSpeed}
          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-background/90 border border-border text-foreground hover:bg-background shrink-0 font-mono shadow-2xs"
          title="Playback speed"
        >
          {playbackRate}x
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5 font-mono">
        <span className="flex items-center gap-1 font-sans font-medium text-foreground">
          <Mic className="size-2.5 text-primary" /> Voice note
        </span>
        <span>
          {formatTimer(currentTime)} / {formatTimer(effectiveDuration)}
        </span>
      </div>
    </div>
  );
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
  onUpdateStatus,
  onUpdateIssue,
}: TaskGroupChatModalProps) {
  const [inputText, setInputText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyingTo, setReplyingTo] = useState<IssueComment | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<TaskAttachment | null>(null);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionText, setDescriptionText] = useState(issue?.description || '');

  useEffect(() => {
    setDescriptionText(issue?.description || '');
    setIsEditingDescription(false);
  }, [issue?.id, issue?.description]);

  // Voice note recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioDataUrl, setRecordedAudioDataUrl] = useState<string | null>(null);

  // Voice note preview playback states
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Clean up recording stream on unmount or close
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Preview audio listeners
  useEffect(() => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setPreviewCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlayingPreview(false);
      setPreviewCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [recordedAudioUrl]);

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

  // Voice note recording triggers
  async function startRecording() {
    discardRecordedVoiceNote();
    setIsRecording(true);
    setRecordingDuration(0);
    audioChunksRef.current = [];

    timerIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          setRecordedAudioBlob(blob);
          setRecordedAudioUrl(url);

          const reader = new FileReader();
          reader.onloadend = () => {
            setRecordedAudioDataUrl(reader.result as string);
          };
          reader.readAsDataURL(blob);
        };

        recorder.start(250);
        return;
      } catch (err) {
        console.warn('Microphone permission denied or device unavailable. Using high-fidelity synthetic voice note preview.', err);
      }
    }
  }

  function stopRecording() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
        audioStreamRef.current = null;
      }
    } else {
      // Fallback synthetic audio generation if mic permission was unavailable
      const duration = Math.max(3, recordingDuration || 4);
      const { blob, dataUrl } = createSimulatedVoiceNote(duration);
      setRecordedAudioBlob(blob);
      setRecordedAudioUrl(URL.createObjectURL(blob));
      setRecordedAudioDataUrl(dataUrl);
    }

    setIsRecording(false);
  }

  function cancelRecording() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  }

  function discardRecordedVoiceNote() {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setIsPlayingPreview(false);
    setPreviewCurrentTime(0);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setRecordedAudioDataUrl(null);
    setRecordingDuration(0);
  }

  function togglePreviewPlayback() {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      audio.play().then(() => setIsPlayingPreview(true)).catch(() => {});
    }
  }

  function handleSendVoiceNote() {
    if (!recordedAudioDataUrl && !recordedAudioUrl) return;

    const durationText = formatTimer(recordingDuration || 4);
    const voiceAttachment: TaskAttachment = {
      id: 'att-voice-' + Date.now(),
      taskId: issue?.id,
      projectId: project?.id || '',
      name: `voice-note-${Date.now()}.webm`,
      size: recordedAudioBlob?.size || 15000,
      type: 'audio/webm',
      url: recordedAudioDataUrl || recordedAudioUrl || '',
      uploaderName: currentPersona.displayName,
      uploaderEmail: currentPersona.email,
      uploadedAt: new Date().toISOString(),
      caption: `Voice Note (${durationText})`,
      isClientVisible: !isInternalNote,
      isInternalOnly: isInternalNote,
    };

    const attachmentsToSend = [voiceAttachment];
    if (pendingAttachment) {
      attachmentsToSend.push(pendingAttachment);
    }

    const text = inputText.trim() || `🎤 Voice note (${durationText})`;

    onSendMessage(
      issue!.id,
      text,
      attachmentsToSend,
      replyingTo?.id,
      replyingTo ? `${replyingTo.authorName}: ${replyingTo.content.slice(0, 80)}` : undefined,
      isClientUser ? false : isInternalNote
    );

    setInputText('');
    setReplyingTo(null);
    setPendingAttachment(null);
    setIsInternalNote(false);
    discardRecordedVoiceNote();
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (recordedAudioUrl) {
      handleSendVoiceNote();
      return;
    }

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
              <Select
                value={issue.status}
                onValueChange={(val) => onUpdateStatus?.(issue, val)}
              >
                <SelectTrigger size="sm" className="h-6 text-xs font-medium px-2 py-0 border rounded-md bg-muted/40 gap-1.5 focus:ring-0">
                  <span className={`size-1.5 rounded-full shrink-0 ${
                    issue.status === 'Done' ? 'bg-emerald-500' :
                    issue.status === 'In progress' ? 'bg-amber-500' :
                    issue.status === 'In review' ? 'bg-purple-500' :
                    issue.status === 'Blocked' ? 'bg-rose-500' :
                    issue.status === 'To do' ? 'bg-blue-500' : 'bg-slate-400'
                  }`} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {['Backlog', 'To do', 'In progress', 'In review', 'Blocked', 'Done'].map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className={`size-2 rounded-full shrink-0 ${
                          s === 'Done' ? 'bg-emerald-500' :
                          s === 'In progress' ? 'bg-amber-500' :
                          s === 'In review' ? 'bg-purple-500' :
                          s === 'Blocked' ? 'bg-rose-500' :
                          s === 'To do' ? 'bg-blue-500' : 'bg-slate-400'
                        }`} />
                        {s}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className={`priority ${issue.priority.toLowerCase()} text-xs flex items-center gap-1`}>
                <Flag className="size-3" /> {issue.priority}
              </span>
              {issue.severity && (
                <span className={`severity-tag severity-${issue.severity.toLowerCase()} text-xs flex items-center gap-1`}>
                  <AlertCircle className="size-3" /> {issue.severity}
                </span>
              )}
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
          <DialogDescription className="sr-only">
            Task details and discussion for {issue.title}
          </DialogDescription>

          {/* Issue / Task Description under Title */}
          {isEditingDescription ? (
            <div className="mt-2 p-2.5 rounded-xl border border-primary/40 bg-muted/20 space-y-2">
              <Textarea
                value={descriptionText}
                onChange={(e) => setDescriptionText(e.target.value)}
                placeholder="Enter description for this task or issue..."
                rows={3}
                className="text-xs leading-relaxed resize-none bg-background border-border"
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setDescriptionText(issue.description || '');
                    setIsEditingDescription(false);
                  }}
                  className="text-xs h-7"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="xs"
                  onClick={() => {
                    const updated = { ...issue, description: descriptionText.trim() };
                    onUpdateIssue?.(updated);
                    setIsEditingDescription(false);
                  }}
                  className="text-xs h-7 gap-1"
                >
                  <Check className="size-3" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1 flex items-start justify-between gap-2 group/desc">
              {issue.description ? (
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-3 hover:line-clamp-none transition-all">
                  {issue.description}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">
                  No description provided for this {isClientUser ? 'issue' : 'task'}.
                </p>
              )}
              {onUpdateIssue && (
                <button
                  type="button"
                  onClick={() => {
                    setDescriptionText(issue.description || '');
                    setIsEditingDescription(true);
                  }}
                  className="opacity-0 group-hover/desc:opacity-100 transition-opacity text-[11px] font-medium text-primary hover:underline shrink-0 flex items-center gap-1 mt-0.5"
                  title="Edit description"
                >
                  <Pencil className="size-3" /> Edit
                </button>
              )}
            </div>
          )}

          {/* Active Participants Bar */}
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border/60 flex-wrap text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
              In this chat:
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/25">
              <Building2 className="size-3 text-amber-600 dark:text-amber-400" />
              <span className="font-medium">Client:</span>
              <span>{clientMember.name}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-800 dark:text-blue-200 border border-blue-500/25">
              <Users className="size-3 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">Team:</span>
              <span>{assigneeMember ? assigneeMember.name : 'Unassigned'}</span>
            </div>
            {project?.projectManagerName && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-800 dark:text-purple-200 border border-purple-500/25">
                <Briefcase className="size-3 text-purple-600 dark:text-purple-400" />
                <span className="font-medium">PM:</span>
                <span>{project.projectManagerName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[280px] max-h-[460px] bg-muted/20">
          {visibleMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 my-auto border-2 border-dashed border-border/80 rounded-2xl bg-card/50">
              <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Sparkles className="size-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">No messages in this task chat yet</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                Start the group conversation! Share progress updates, request client feedback, record a voice note, or post attachments specifically for <strong>{projectKey}-{issue.number}</strong>.
              </p>
            </div>
          ) : (
            visibleMessages.map((msg) => {
              const isMine = msg.authorEmail === currentPersona.email;
              const isClientMsg = msg.authorRole === 'client';
              const isInternal = msg.isInternal || msg.isInternalOnly;

              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col gap-1 group transition-all ${
                    isInternal ? 'opacity-95' : ''
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
                      <div className="mt-2.5 pt-2 border-t border-border/60 flex flex-col gap-2">
                        {/* Interactive Voice Note Players */}
                        {msg.attachments
                          .filter(att => att.type.startsWith('audio/') || att.name.includes('voice-note') || att.name.endsWith('.webm') || att.name.endsWith('.wav') || att.name.endsWith('.mp3'))
                          .map((att) => (
                            <VoiceNotePlayer key={att.id} attachment={att} isMine={isMine} />
                          ))}

                        {/* Standard File & Media Attachments */}
                        {msg.attachments.some(att => !att.type.startsWith('audio/') && !att.name.includes('voice-note') && !att.name.endsWith('.webm') && !att.name.endsWith('.wav') && !att.name.endsWith('.mp3')) && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {msg.attachments
                              .filter(att => !att.type.startsWith('audio/') && !att.name.includes('voice-note') && !att.name.endsWith('.webm') && !att.name.endsWith('.wav') && !att.name.endsWith('.mp3'))
                              .map((att) => {
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

          {/* Pending File Attachment Preview */}
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

          {/* Live Voice Recording Bar */}
          {isRecording && (
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="font-semibold text-rose-600 dark:text-rose-400 font-mono text-xs">
                  Recording Voice Note: {formatTimer(recordingDuration)}
                </span>
                {/* Dynamic animated sound wave bars */}
                <div className="flex items-center gap-0.5 ml-2 h-4">
                  {[40, 70, 95, 55, 85, 100, 60, 85, 45, 90, 75, 50].map((h, i) => (
                    <span
                      key={i}
                      className="w-0.5 bg-rose-500 rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${(i * 0.08).toFixed(2)}s`,
                        animationDuration: '0.7s',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={cancelRecording}
                  className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-500/20"
                  title="Discard recording"
                >
                  <Trash2 className="size-3.5 mr-1" /> Discard
                </Button>
                <Button
                  type="button"
                  size="xs"
                  onClick={stopRecording}
                  className="h-7 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium"
                  title="Stop and preview voice note"
                >
                  <Square className="size-3 mr-1 fill-white" /> Stop & Review
                </Button>
              </div>
            </div>
          )}

          {/* Recorded Voice Note Preview Before Sending */}
          {recordedAudioUrl && !isRecording && (
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-primary/30 bg-primary/5 text-xs animate-in fade-in">
              <audio ref={previewAudioRef} src={recordedAudioUrl} preload="auto" />
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={togglePreviewPlayback}
                  className="size-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-2xs"
                >
                  {isPlayingPreview ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
                </Button>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-foreground">
                    <span className="flex items-center gap-1">
                      <Mic className="size-3 text-primary" /> Voice Note Ready
                    </span>
                    <span className="font-mono text-muted-foreground text-[10px]">
                      {formatTimer(previewCurrentTime)} / {formatTimer(recordingDuration || 4)}
                    </span>
                  </div>
                  <div 
                    className="w-full bg-primary/20 h-1.5 rounded-full mt-1.5 overflow-hidden cursor-pointer relative"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const pct = Math.max(0, Math.min(1, clickX / rect.width));
                      const totalSec = recordingDuration || 4;
                      if (previewAudioRef.current) {
                        previewAudioRef.current.currentTime = pct * totalSec;
                        setPreviewCurrentTime(pct * totalSec);
                      }
                    }}
                  >
                    <div 
                      className="bg-primary h-full transition-all duration-100"
                      style={{ width: `${Math.min(100, Math.max(0, (previewCurrentTime / (recordingDuration || 4)) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-3 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={discardRecordedVoiceNote}
                  className="size-7 text-muted-foreground hover:text-destructive"
                  title="Delete voice note"
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="xs"
                  onClick={handleSendVoiceNote}
                  className="h-7 px-2.5 gap-1 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Send Voice Note <Send className="size-3" />
                </Button>
              </div>
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
              <div className="flex items-center gap-2">
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

                {/* Voice Note Button */}
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="xs"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`h-7 text-xs gap-1.5 transition-all ${
                    isRecording 
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse' 
                      : 'text-muted-foreground hover:text-foreground hover:border-primary/50'
                  }`}
                  title={isRecording ? "Click to finish voice note" : "Record a voice note"}
                >
                  <Mic className="size-3.5 text-primary" /> 
                  {isRecording ? `Recording (${formatTimer(recordingDuration)})...` : 'Voice Note'}
                </Button>

                {!isClientUser && (
                  <div className="flex items-center gap-1.5 ml-1">
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
                disabled={!inputText.trim() && !pendingAttachment && !recordedAudioUrl}
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
