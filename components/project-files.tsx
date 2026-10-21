'use client';
import { useState, useRef } from 'react';
import { 
  FolderKanban, 
  UploadCloud, 
  Film, 
  ImageIcon, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Lock, 
  Sparkles, 
  Check, 
  Filter, 
  Plus 
} from 'lucide-react';
import type { TaskAttachment, Project } from '../types/workspace';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ProjectFilesProps {
  project: Project;
  attachments: TaskAttachment[];
  canUpload: boolean;
  canManage: boolean;
  isClientUser: boolean;
  onUploadAttachment: (attachment: Omit<TaskAttachment, 'id'>) => void;
  onDeleteAttachment: (id: string) => void;
  onPreviewAttachment: (attachment: TaskAttachment) => void;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function ProjectFiles({
  project,
  attachments,
  canUpload,
  canManage,
  isClientUser,
  onUploadAttachment,
  onDeleteAttachment,
  onPreviewAttachment,
}: ProjectFilesProps) {
  const [filterType, setFilterType] = useState<'all' | 'media' | 'docs' | 'client'>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Upload form state
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isClientVisible, setIsClientVisible] = useState(true);
  const [fileSize, setFileSize] = useState(0);
  const [fileMime, setFileMime] = useState('image/png');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If user is a client, strictly filter out files where isClientVisible is false!
  const visibleAttachments = attachments.filter((att) => {
    if (isClientUser && !att.isClientVisible) return false;
    if (filterType === 'media') {
      return att.type.startsWith('image/') || att.type.startsWith('video/') || att.name.endsWith('.mp4');
    }
    if (filterType === 'docs') {
      return att.type === 'application/pdf' || att.name.endsWith('.pdf') || att.name.endsWith('.doc');
    }
    if (filterType === 'client') {
      return att.isClientVisible;
    }
    return true;
  });

  function handleFileSelected(file: File) {
    setFileName(file.name);
    setFileSize(file.size);
    setFileMime(file.type || 'application/octet-stream');
    
    // Read local file as data URL for instant working preview & download
    const reader = new FileReader();
    reader.onload = () => {
      setFileUrl(reader.result as string);
      setIsUploadModalOpen(true);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  function handleSaveUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!fileName || !fileUrl) return;

    onUploadAttachment({
      projectId: project.id,
      name: fileName,
      size: fileSize || 520000,
      type: fileMime,
      url: fileUrl,
      caption: caption.trim() || undefined,
      uploaderName: isClientUser ? 'Emma Watson (Acme)' : 'Team Member',
      uploaderEmail: isClientUser ? 'emma.watson@acmeclient.com' : 'alex.morgan@company.com',
      uploadedAt: new Date().toISOString(),
      isClientVisible: isClientUser ? true : isClientVisible,
    });

    setFileName('');
    setFileUrl('');
    setCaption('');
    setIsUploadModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Dropzone */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="size-5 text-primary" />
              <CardTitle className="text-base font-bold">Files, Media & Reference Gallery</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Upload designs, video walkthroughs, and specification documents for {project.name}.
            </CardDescription>
          </div>

          {canUpload && (
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
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <UploadCloud className="size-4" /> Upload Files
              </Button>
            </div>
          )}
        </CardHeader>

        {canUpload && (
          <div className="px-6 pb-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <UploadCloud className="size-6" />
              </div>
              <strong className="text-xs font-semibold text-foreground">
                Drag and drop files here, or click to browse
              </strong>
              <p className="text-[11px] text-muted-foreground">
                Supports PNG, JPG, MP4, WEBM, PDF, and documents up to 50MB
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="xs"
            onClick={() => setFilterType('all')}
            className="text-xs h-7"
          >
            All Files ({visibleAttachments.length})
          </Button>
          <Button
            type="button"
            variant={filterType === 'media' ? 'default' : 'outline'}
            size="xs"
            onClick={() => setFilterType('media')}
            className="text-xs h-7 gap-1"
          >
            <ImageIcon className="size-3" /> Images & Videos
          </Button>
          <Button
            type="button"
            variant={filterType === 'docs' ? 'default' : 'outline'}
            size="xs"
            onClick={() => setFilterType('docs')}
            className="text-xs h-7 gap-1"
          >
            <FileText className="size-3" /> Documents
          </Button>
          {!isClientUser && (
            <Button
              type="button"
              variant={filterType === 'client' ? 'default' : 'outline'}
              size="xs"
              onClick={() => setFilterType('client')}
              className="text-xs h-7 gap-1"
            >
              <Sparkles className="size-3" /> Client-Visible
            </Button>
          )}
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {visibleAttachments.length === 0 ? (
          <div className="col-span-full p-12 text-center flex flex-col items-center gap-3 bg-card border border-border rounded-xl">
            <FolderKanban className="size-10 text-muted-foreground/30" />
            <strong className="text-base font-semibold">No files match your filter</strong>
            <p className="text-xs text-muted-foreground max-w-sm">
              Upload design comps, video screen recordings, or project guidelines to get started.
            </p>
          </div>
        ) : (
          visibleAttachments.map((att) => {
            const isImage = att.type.startsWith('image/');
            const isVideo = att.type.startsWith('video/') || att.name.endsWith('.mp4');

            return (
              <Card
                key={att.id}
                className="group border-border shadow-xs overflow-hidden flex flex-col transition-all hover:border-primary/40 hover:shadow-sm"
              >
                {/* Media Preview Box */}
                <div
                  onClick={() => onPreviewAttachment(att)}
                  className="relative aspect-video w-full bg-muted/40 cursor-pointer overflow-hidden flex items-center justify-center border-b border-border"
                >
                  {isImage ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : isVideo ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-primary">
                      <div className="p-3 rounded-full bg-primary/20 backdrop-blur-xs">
                        <Film className="size-6" />
                      </div>
                      <span className="text-[11px] font-medium bg-black/60 text-white px-2 py-0.5 rounded-full">
                        Play Video
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
                      <FileText className="size-8 text-primary/80" />
                      <span className="text-[11px] font-mono font-medium">{att.name.split('.').pop()?.toUpperCase()}</span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {att.isClientVisible ? (
                      <Badge variant="outline" className="text-[10px] bg-background/90 backdrop-blur-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                        Client Visible
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] bg-background/90 backdrop-blur-xs">
                        <Lock className="size-2.5 mr-1" /> Internal
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Info Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <strong
                      onClick={() => onPreviewAttachment(att)}
                      className="text-xs font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                      title={att.name}
                    >
                      {att.name}
                    </strong>
                    {att.caption && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {att.caption}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border">
                    <div className="flex flex-col">
                      <span>{formatBytes(att.size)}</span>
                      <span className="text-[10px] text-muted-foreground/80 truncate max-w-[120px]">
                        By {att.uploaderName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onPreviewAttachment(att)}
                        title="Preview"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        asChild
                        title="Download"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <a href={att.url} download={att.name}>
                          <Download className="size-3.5" />
                        </a>
                      </Button>
                      {canManage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDeleteAttachment(att.id)}
                          title="Delete"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Upload Details Dialog */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">File Upload Details</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add metadata and configure client visibility for {fileName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveUpload} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="upl-name" className="text-xs font-medium text-foreground">
                File Name
              </label>
              <Input
                id="upl-name"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="upl-caption" className="text-xs font-medium text-foreground">
                Caption & Context (optional)
              </label>
              <Input
                id="upl-caption"
                placeholder="e.g. Approved mockup for client review"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            {!isClientUser && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex flex-col gap-0.5">
                  <strong className="text-xs font-medium text-foreground">Client Visibility</strong>
                  <span className="text-[11px] text-muted-foreground">
                    Allow external client stakeholders to view and download this file
                  </span>
                </div>
                <Switch
                  checked={isClientVisible}
                  onCheckedChange={setIsClientVisible}
                />
              </div>
            )}

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Complete Upload</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
