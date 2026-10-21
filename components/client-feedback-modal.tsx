'use client';
import { useState, useRef } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  Paperclip, 
  X, 
  Send, 
  MessageSquare, 
  Flag, 
  HelpCircle 
} from 'lucide-react';
import type { TaskAttachment, PriorityLevel, IssueLabel } from '../types/workspace';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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

interface ClientFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId: string;
  clientName: string;
  clientEmail: string;
  onSubmitFeedback: (data: {
    title: string;
    description: string;
    label: IssueLabel;
    priority: PriorityLevel;
    attachment?: TaskAttachment;
  }) => void;
}

export function ClientFeedbackModal({
  isOpen,
  onClose,
  projectName,
  projectId,
  clientName,
  clientEmail,
  onSubmitFeedback,
}: ClientFeedbackModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueLabel>('Feedback');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [attachedFile, setAttachedFile] = useState<TaskAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const att: TaskAttachment = {
        id: 'feed-att-' + Date.now(),
        projectId,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: reader.result as string,
        caption: 'Reference file attached with client feedback',
        uploaderName: clientName,
        uploaderEmail: clientEmail,
        uploadedAt: new Date().toISOString(),
        isClientVisible: true,
      };
      setAttachedFile(att);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmitFeedback({
      title: title.trim(),
      description: description.trim(),
      label: category,
      priority,
      attachment: attachedFile || undefined,
    });

    setTitle('');
    setDescription('');
    setAttachedFile(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold">
                Submit Client Feedback & Requests
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Directly notify the {projectName} team of ideas, bug reports, or change requests.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-title" className="text-xs font-medium text-foreground">
              Feedback Summary / Topic
            </label>
            <Input
              id="fb-title"
              required
              placeholder="e.g. Adjust checkout button color on mobile"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fb-cat" className="text-xs font-medium text-foreground">
                Category
              </label>
              <Select value={category} onValueChange={(val) => setCategory(val as IssueLabel)}>
                <SelectTrigger id="fb-cat" className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Feedback">Feedback</SelectItem>
                    <SelectItem value="Bug">Bug Report</SelectItem>
                    <SelectItem value="Feature">Change Request</SelectItem>
                    <SelectItem value="Design">Design Review</SelectItem>
                    <SelectItem value="Task">Question / Action</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="fb-prio" className="text-xs font-medium text-foreground">
                Urgency
              </label>
              <Select value={priority} onValueChange={(val) => setPriority(val as PriorityLevel)}>
                <SelectTrigger id="fb-prio" className="w-full">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Low">Low (Whenever possible)</SelectItem>
                    <SelectItem value="Medium">Medium (Standard)</SelectItem>
                    <SelectItem value="High">High (Impacting launch)</SelectItem>
                    <SelectItem value="Urgent">Urgent (Critical blocker)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-desc" className="text-xs font-medium text-foreground">
              Detailed Description & Context
            </label>
            <Textarea
              id="fb-desc"
              rows={4}
              placeholder="Describe what you observed, what you'd like to see changed, or relevant requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Reference attachment */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Attach Screenshot, Video, or Spec</span>
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

            {attachedFile ? (
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 text-xs text-foreground">
                <div className="flex items-center gap-2 truncate">
                  <Paperclip className="size-4 text-primary shrink-0" />
                  <span className="font-medium truncate">{attachedFile.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setAttachedFile(null)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 border-dashed border-border hover:border-primary text-xs h-9 justify-start"
              >
                <UploadCloud className="size-4 text-primary" />
                <span>Upload screenshot or reference file (PNG, JPG, MP4, PDF)</span>
              </Button>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="gap-1.5">
              <Send className="size-3.5" /> Submit Feedback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
