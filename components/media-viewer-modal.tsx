'use client';
import { 
  X, 
  Download, 
  FileText, 
  Film, 
  ImageIcon, 
  User, 
  Calendar, 
  Eye, 
  ShieldCheck 
} from 'lucide-react';
import type { TaskAttachment } from '../types/workspace';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MediaViewerModalProps {
  attachment: TaskAttachment | null;
  onClose: () => void;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function MediaViewerModal({ attachment, onClose }: MediaViewerModalProps) {
  if (!attachment) return null;

  const isImage = attachment.type.startsWith('image/');
  const isVideo = attachment.type.startsWith('video/') || attachment.name.endsWith('.mp4') || attachment.name.endsWith('.webm');
  const isPdf = attachment.type === 'application/pdf' || attachment.name.endsWith('.pdf');

  function handleDownload() {
    if (!attachment) return;
    const a = document.createElement('a');
    a.href = attachment.url;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <Dialog open={Boolean(attachment)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-background border-border shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0 bg-card">
          <div className="flex items-center gap-2.5 min-w-0 pr-6">
            <span className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              {isVideo ? <Film className="size-4" /> : isImage ? <ImageIcon className="size-4" /> : <FileText className="size-4" />}
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold truncate text-foreground">
                {attachment.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{formatBytes(attachment.size)}</span>
                <span>•</span>
                <span>Uploaded by {attachment.uploaderName}</span>
                {attachment.isClientVisible ? (
                  <Badge variant="outline" className="text-[11px] text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
                    Client Visible
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[11px]">
                    Internal Only
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 text-xs h-8"
            >
              <Download className="size-3.5" />
              Download
            </Button>
          </div>
        </DialogHeader>

        {/* Media Preview Stage */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-muted/30 min-h-[320px] max-h-[560px]">
          {isImage ? (
            <div className="relative max-h-full flex items-center justify-center">
              <img
                src={attachment.url}
                alt={attachment.caption || attachment.name}
                className="max-h-[500px] w-auto max-w-full rounded-lg object-contain shadow-sm border border-border/50"
              />
            </div>
          ) : isVideo ? (
            <div className="w-full max-w-[700px] flex flex-col items-center">
              <video
                src={attachment.url}
                controls
                playsInline
                autoPlay
                className="w-full max-h-[460px] rounded-xl shadow-lg bg-black border border-border"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center max-w-md bg-card rounded-2xl border border-border shadow-xs">
              <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                <FileText className="size-10" />
              </div>
              <strong className="text-base font-semibold text-foreground">{attachment.name}</strong>
              <p className="text-xs text-muted-foreground">
                Document preview is ready. Download this file to inspect complete specifications, spreadsheets, or slides.
              </p>
              <Button onClick={handleDownload} className="gap-2 mt-2">
                <Download className="size-4" /> Download Document ({formatBytes(attachment.size)})
              </Button>
            </div>
          )}
        </div>

        {/* Footer info & Caption */}
        {attachment.caption && (
          <div className="p-4 border-t border-border bg-card flex flex-col gap-1">
            <span className="text-xs font-semibold text-foreground">Caption & Reference Context:</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{attachment.caption}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
