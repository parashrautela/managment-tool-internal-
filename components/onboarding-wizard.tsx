'use client';
import { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Building2, 
  User, 
  Users, 
  FolderKanban, 
  X,
  Check
} from 'lucide-react';
import { projectTemplates } from '../lib/initial-data';
import type { Workspace } from '../types/workspace';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    profile: { name: string; title: string };
    workspace: { name: string; slug: string; color: string; size: string };
    project: { name: string; key: string; color: 'purple' | 'blue' | 'green' | 'orange'; templateId?: string };
    invites: string[];
  }) => void;
  initialWorkspace?: Workspace;
}

export function OnboardingWizard({ isOpen, onClose, onComplete, initialWorkspace }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Form states
  const [name, setName] = useState('Alex Morgan');
  const [title, setTitle] = useState('Product Lead');

  const [wsName, setWsName] = useState(initialWorkspace?.name || 'Acme Studio');
  const [wsSlug, setWsSlug] = useState(initialWorkspace?.slug || 'acme-studio');
  const [wsColor] = useState(initialWorkspace?.color || 'purple');
  const [teamSize, setTeamSize] = useState('6-25');

  const [selectedTemplate, setSelectedTemplate] = useState('tpl-roadmap');
  const [projName, setProjName] = useState('Product Roadmap 2026');
  const [projKey, setProjKey] = useState('ROAD');
  const [projColor, setProjColor] = useState<'purple' | 'blue' | 'green' | 'orange'>('purple');

  const [inviteEmails, setInviteEmails] = useState(['jamie.chen@company.com', 'sam.taylor@company.com']);
  const [newEmail, setNewEmail] = useState('');

  if (!isOpen) return null;

  function addEmail() {
    if (newEmail.trim() && !inviteEmails.includes(newEmail.trim())) {
      setInviteEmails([...inviteEmails, newEmail.trim()]);
      setNewEmail('');
    }
  }

  function removeEmail(target: string) {
    setInviteEmails(inviteEmails.filter((e) => e !== target));
  }

  function handleSelectTemplate(tplId: string) {
    setSelectedTemplate(tplId);
    const tpl = projectTemplates.find((t) => t.id === tplId);
    if (tpl) {
      setProjName(tpl.name);
      setProjKey(tpl.key);
      setProjColor(tpl.color);
    }
  }

  function handleFinish() {
    onComplete({
      profile: { name, title },
      workspace: { name: wsName, slug: wsSlug, color: wsColor, size: teamSize },
      project: { name: projName, key: projKey, color: projColor, templateId: selectedTemplate },
      invites: inviteEmails,
    });
    onClose();
  }

  const progressPercent = Math.round((step / totalSteps) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] p-6 max-h-[90vh] overflow-y-auto">
        {/* Progress Header */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Onboarding Wizard</span>
            <span className="font-semibold text-foreground">Step {step} of {totalSteps}</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <DialogHeader className="gap-2 text-left">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="size-5" />
              </span>
              <DialogTitle className="text-lg font-bold">
                Welcome to Flowboard! Let’s set up your profile.
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Your teammates will see your name and role when collaborating on tasks.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ob-name" className="text-xs font-medium text-foreground">
                Your full name
              </label>
              <Input
                id="ob-name"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ob-title" className="text-xs font-medium text-foreground">
                Role or title
              </label>
              <Input
                id="ob-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Product Lead, Designer, Engineer"
              />
            </div>
          </div>
        )}

        {/* Step 2: Workspace */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <DialogHeader className="gap-2 text-left">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </span>
              <DialogTitle className="text-lg font-bold">Name your workspace</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Workspaces group your projects, team members, and settings together.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ob-ws-name" className="text-xs font-medium text-foreground">
                Workspace name
              </label>
              <Input
                id="ob-ws-name"
                autoFocus
                required
                value={wsName}
                onChange={(e) => {
                  setWsName(e.target.value);
                  setWsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                }}
                placeholder="e.g. Acme Studio"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ob-ws-slug" className="text-xs font-medium text-foreground">
                Workspace URL slug
              </label>
              <div className="flex items-center rounded-md border border-input bg-transparent px-3 shadow-xs">
                <span className="text-xs text-muted-foreground mr-1 select-none">flowboard.app/</span>
                <Input
                  id="ob-ws-slug"
                  value={wsSlug}
                  onChange={(e) => setWsSlug(e.target.value)}
                  placeholder="acme-studio"
                  className="border-0 shadow-none px-0 focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">How big is your team?</span>
              <ToggleGroup
                type="single"
                value={teamSize}
                onValueChange={(val) => {
                  if (val) setTeamSize(val);
                }}
                variant="outline"
                className="w-full justify-start"
              >
                {['1-5', '6-25', '26-100', '100+'].map((size) => (
                  <ToggleGroupItem key={size} value={size} className="flex-1 text-xs">
                    {size} people
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        )}

        {/* Step 3: Project Template */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <DialogHeader className="gap-2 text-left">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FolderKanban className="size-5" />
              </span>
              <DialogTitle className="text-lg font-bold">Create your first project</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pick a proven template to get started instantly, or customize details.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto">
              {projectTemplates.map((tpl) => {
                const isSelected = selectedTemplate === tpl.id;
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
                      <div className="flex items-center gap-1.5">
                        <span className={`project-dot ${tpl.color}`} />
                        <strong className="text-xs font-semibold">{tpl.name}</strong>
                      </div>
                      {isSelected ? (
                        <Check className="size-3.5 text-primary" />
                      ) : (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">{tpl.key}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                    <span className="text-xs text-primary mt-1 font-medium">
                      {tpl.defaultIssues.length} sample tasks included
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label htmlFor="ob-proj-name" className="text-xs font-medium text-foreground">
                  Project name
                </label>
                <Input
                  id="ob-proj-name"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ob-proj-key" className="text-xs font-medium text-foreground">
                  Key
                </label>
                <Input
                  id="ob-proj-key"
                  value={projKey}
                  onChange={(e) => setProjKey(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="uppercase font-mono"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Invite Teammates */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <DialogHeader className="gap-2 text-left">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </span>
              <DialogTitle className="text-lg font-bold">Invite your team</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Work management is better together. Add teammates or skip to invite later.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="teammate@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmail();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addEmail}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[48px] p-2 rounded-lg bg-muted/30 border border-border">
              {inviteEmails.map((email) => (
                <Badge key={email} variant="secondary" className="gap-1 py-1 px-2 text-xs">
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    aria-label={`Remove ${email}`}
                    className="hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary shrink-0" />
              You can always manage roles, invitations, and permissions in the People & Access tab.
            </p>
          </div>
        )}

        {/* Modal Footer Actions */}
        <DialogFooter className="mt-4 flex flex-row items-center justify-between w-full">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft data-icon="inline-start" /> Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Skip for now
            </Button>
          )}

          <div>
            {step < totalSteps ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep(step + 1)}
              >
                Continue <ArrowRight data-icon="inline-end" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleFinish}
              >
                Launch Workspace <Sparkles data-icon="inline-end" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
