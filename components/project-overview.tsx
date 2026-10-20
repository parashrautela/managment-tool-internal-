'use client';
import { useState } from 'react';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ArrowUpRight, 
  Flag, 
  Activity,
} from 'lucide-react';
import type { Project, Member, Issue, ActivityItem } from '../types/workspace';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ProjectOverviewProps {
  project: Project;
  members: Member[];
  issues: Issue[];
  activities: ActivityItem[];
  onOpenIssue: (issue: Issue) => void;
  onCreateIssue: () => void;
  onInvite: () => void;
  onUpdateProject?: (updated: Partial<Project>) => void;
  canEdit: boolean;
}

export function ProjectOverview({
  project,
  members,
  issues,
  activities,
  onOpenIssue,
  onCreateIssue,
  onInvite,
  onUpdateProject,
  canEdit,
}: ProjectOverviewProps) {
  const total = issues.length;
  const completed = issues.filter((i) => i.status === 'Done').length;
  const inProgress = issues.filter((i) => i.status === 'In progress').length;
  const inReview = issues.filter((i) => i.status === 'In review').length;
  const backlog = issues.filter((i) => i.status === 'Backlog' || i.status === 'To do').length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const projectMembers = members.filter((m) => m.projectId === project.id);
  const projectActivities = activities
    .filter((a) => !a.projectId || a.projectId === project.id)
    .slice(0, 8);

  const [health, setHealth] = useState(project.health || 'On track');

  function handleHealthChange(newHealth: 'On track' | 'At risk' | 'Delayed') {
    setHealth(newHealth);
    if (onUpdateProject) {
      onUpdateProject({ health: newHealth });
    }
  }

  const healthVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    'On track': 'default',
    'At risk': 'secondary',
    'Delayed': 'destructive',
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Health & Progress Summary Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Project Health:
            </span>
            {canEdit ? (
              <Select value={health} onValueChange={(val) => handleHealthChange(val as 'On track' | 'At risk' | 'Delayed')}>
                <SelectTrigger size="sm" className="h-8 gap-2 min-w-[130px]">
                  <SelectValue placeholder="Health" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="On track">On track</SelectItem>
                    <SelectItem value="At risk">At risk</SelectItem>
                    <SelectItem value="Delayed">Delayed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant={healthVariant[health] || 'default'} className="text-xs">
                {health}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {project.startDate && (
              <Badge variant="outline" className="gap-1.5 font-normal text-xs text-muted-foreground">
                <Calendar className="size-3 text-muted-foreground" />
                Starts {project.startDate}
              </Badge>
            )}
            {project.dueDate && (
              <Badge variant="secondary" className="gap-1.5 font-medium text-xs">
                <Clock className="size-3 text-primary" />
                Target due {project.dueDate}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5 font-normal text-xs text-muted-foreground">
              <Flag className="size-3 text-muted-foreground" />
              {project.priority || 'Medium'} priority
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6 pt-0">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Overall completion</span>
              <strong className="font-semibold text-foreground">
                {percent}% complete ({completed} of {total} items)
              </strong>
            </div>
            <Progress value={percent} className="h-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col p-3 rounded-lg border border-border bg-card">
              <span className="text-xs text-muted-foreground">Completed</span>
              <strong className="text-2xl font-bold text-emerald-600 mt-1">{completed}</strong>
              <span className="text-[10px] text-muted-foreground">Shipped to done</span>
            </div>
            <div className="flex flex-col p-3 rounded-lg border border-border bg-card">
              <span className="text-xs text-muted-foreground">In flight</span>
              <strong className="text-2xl font-bold text-primary mt-1">{inProgress + inReview}</strong>
              <span className="text-[10px] text-muted-foreground">{inProgress} active · {inReview} review</span>
            </div>
            <div className="flex flex-col p-3 rounded-lg border border-border bg-card">
              <span className="text-xs text-muted-foreground">Backlog</span>
              <strong className="text-2xl font-bold text-foreground mt-1">{backlog}</strong>
              <span className="text-[10px] text-muted-foreground">Scheduled for later</span>
            </div>
            <div className="flex flex-col p-3 rounded-lg border border-border bg-card">
              <span className="text-xs text-muted-foreground">Team size</span>
              <strong className="text-2xl font-bold text-blue-600 mt-1">{projectMembers.length}</strong>
              <span className="text-[10px] text-muted-foreground">Active collaborators</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Active Issues & Mission */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Active Issues</CardTitle>
                <CardDescription className="text-xs">Top priorities currently in motion</CardDescription>
              </div>
              {canEdit && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={onCreateIssue}>
                  <Plus data-icon="inline-start" /> New issue
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {issues.slice(0, 5).map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/40 transition-colors text-left"
                  onClick={() => onOpenIssue(issue)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {issue.label}
                    </Badge>
                    <span className="text-xs font-medium text-foreground truncate">
                      {issue.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">
                      {issue.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Flag className="size-3" /> {issue.priority}
                    </span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground" />
                  </div>
                </button>
              ))}

              {issues.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="size-8 text-muted-foreground/60 mb-2" />
                  <p className="text-xs">No issues yet. Create one to kick off progress!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">About this project</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {project.description ||
                  'No detailed mission description yet. Keep your team aligned with clear project goals.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 span): Team & Activity */}
        <div className="flex flex-col gap-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Team</CardTitle>
                <CardDescription className="text-xs">{projectMembers.length} contributors</CardDescription>
              </div>
              {canEdit && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={onInvite}>
                  <Users data-icon="inline-start" /> Add
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 pt-0">
              {projectMembers.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className={cn('text-xs font-semibold', `av-${i % 5}`)}>
                      {m.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <strong className="text-xs font-medium text-foreground truncate">{m.name}</strong>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {m.role} · {m.title || m.email}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
              <CardDescription className="text-xs">Latest timeline updates</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {projectActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-foreground">
                      <strong>{act.actorName}</strong> {act.action}{' '}
                      <span className="font-medium text-primary">{act.target}</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground">{act.timestamp}</span>
                  </div>
                </div>
              ))}

              {projectActivities.length === 0 && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <Activity className="size-6 text-muted-foreground/60 mb-1" />
                  <p className="text-xs">Recent actions will show here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
