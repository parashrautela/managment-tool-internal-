'use client';
import { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Flag, 
  Plus, 
  AlertCircle, 
  Target, 
  ChevronRight, 
  Check 
} from 'lucide-react';
import type { ProjectMilestone, Issue, Project } from '../types/workspace';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ProjectMilestonesProps {
  project: Project;
  milestones: ProjectMilestone[];
  issues: Issue[];
  canManage: boolean;
  onAddMilestone: (milestone: Omit<ProjectMilestone, 'id'>) => void;
  onUpdateMilestone: (id: string, updates: Partial<ProjectMilestone>) => void;
  onOpenIssue: (issue: Issue) => void;
}

const statusBadgeVariant = {
  Completed: 'default' as const,
  'In progress': 'secondary' as const,
  Upcoming: 'outline' as const,
  Delayed: 'destructive' as const,
};

export function ProjectMilestones({
  project,
  milestones,
  issues,
  canManage,
  onAddMilestone,
  onUpdateMilestone,
  onOpenIssue,
}: ProjectMilestonesProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const completedCount = milestones.filter((m) => m.status === 'Completed').length;
  const overallMilestoneProgress = milestones.length > 0 
    ? Math.round((completedCount / milestones.length) * 100) 
    : 0;

  function handleCreateMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    onAddMilestone({
      projectId: project.id,
      title: title.trim(),
      description: description.trim(),
      dueDate,
      status: 'Upcoming',
      progress: 0,
    });
    setTitle('');
    setDescription('');
    setDueDate('');
    setIsAddOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Summary */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Target className="size-5 text-primary" />
              <CardTitle className="text-base font-bold">Project Milestones & Delivery Roadmap</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Track major phases, deliverables, and client review checkpoints for {project.name}.
            </CardDescription>
          </div>

          {canManage && (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="gap-1.5 self-start sm:self-auto"
            >
              <Plus className="size-4" /> Add Milestone
            </Button>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground">Total Milestones</span>
              <strong className="block text-xl font-bold text-foreground mt-0.5">{milestones.length}</strong>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200">
              <span className="text-xs">Completed</span>
              <strong className="block text-xl font-bold mt-0.5">{completedCount}</strong>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-200">
              <span className="text-xs">In Flight</span>
              <strong className="block text-xl font-bold mt-0.5">
                {milestones.filter((m) => m.status === 'In progress').length}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-200">
              <span className="text-xs">Overall Delivery</span>
              <strong className="block text-xl font-bold mt-0.5">{overallMilestoneProgress}%</strong>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-foreground">Roadmap Progress</span>
              <span className="text-primary">{overallMilestoneProgress}% Completed</span>
            </div>
            <Progress value={overallMilestoneProgress} className="h-2.5" />
          </div>
        </CardContent>
      </Card>

      {/* Milestones Timeline List */}
      <div className="flex flex-col gap-4">
        {milestones.length === 0 ? (
          <Card className="p-8 text-center flex flex-col items-center gap-3">
            <Target className="size-10 text-muted-foreground/40" />
            <strong className="text-base font-semibold">No milestones defined yet</strong>
            <p className="text-xs text-muted-foreground max-w-md">
              Milestones help align engineering velocity with client expectations. Add your first delivery milestone above.
            </p>
          </Card>
        ) : (
          milestones.map((milestone, idx) => {
            const isDone = milestone.status === 'Completed';

            return (
              <Card key={milestone.id} className="border-border shadow-xs overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span className={`flex size-8 items-center justify-center rounded-xl text-xs font-bold shrink-0 mt-0.5 ${
                      isDone 
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {isDone ? <Check className="size-4" /> : idx + 1}
                    </span>

                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm font-semibold text-foreground">
                          {milestone.title}
                        </strong>
                        <Badge variant={statusBadgeVariant[milestone.status]} className="text-xs">
                          {milestone.status}
                        </Badge>
                      </div>

                      {milestone.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {milestone.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-primary" />
                          Target Date: <strong className="text-foreground">{milestone.dueDate}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    {canManage && !isDone && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateMilestone(milestone.id, { status: 'Completed', progress: 100 })}
                        className="text-xs h-8 gap-1.5"
                      >
                        <Check className="size-3.5 text-emerald-600" /> Mark Complete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress bar inside card */}
                <div className="px-5 pb-4">
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground mb-1.5">
                    <span>Phase Completion</span>
                    <span className="font-semibold text-foreground">{milestone.progress || (isDone ? 100 : 0)}%</span>
                  </div>
                  <Progress value={milestone.progress || (isDone ? 100 : 0)} className="h-1.5" />
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Milestone Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add Project Milestone</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a key deliverable or signoff gate for {project.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMilestone} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ms-title" className="text-xs font-medium text-foreground">
                Milestone Title
              </label>
              <Input
                id="ms-title"
                required
                placeholder="e.g. Phase 2: Staging Beta Signoff"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ms-date" className="text-xs font-medium text-foreground">
                Target Delivery Date
              </label>
              <Input
                id="ms-date"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ms-desc" className="text-xs font-medium text-foreground">
                Description & Deliverables
              </label>
              <Textarea
                id="ms-desc"
                rows={3}
                placeholder="List acceptance criteria or key components included..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Milestone</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
