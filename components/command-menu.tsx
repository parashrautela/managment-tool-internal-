'use client';
import { 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Settings, 
  Plus, 
  Sparkles, 
  Building2, 
  ArrowRight,
  User
} from 'lucide-react';
import type { Workspace, Project, Issue, Member } from '../types/workspace';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onSelectWorkspace: (wsId: string) => void;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  members: Member[];
  onSelectMember: (member: Member) => void;
  onAction: (action: 'createProject' | 'createIssue' | 'invite' | 'settings' | 'onboarding') => void;
}

export function CommandMenu({
  isOpen,
  onClose,
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  projects,
  onSelectProject,
  issues,
  onSelectIssue,
  members,
  onSelectMember,
  onAction,
}: CommandMenuProps) {
  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Command Palette"
      description="Quickly navigate projects, tasks, team members, and actions"
    >
      <CommandInput placeholder="Type a command, project, task, or member..." />
      <CommandList className="max-h-[360px]">
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            value="create task issue new"
            onSelect={() => {
              onAction('createIssue');
              onClose();
            }}
          >
            <Plus className="text-primary" />
            <span className="flex-1">Create new task or issue</span>
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>

          <CommandItem
            value="create project new"
            onSelect={() => {
              onAction('createProject');
              onClose();
            }}
          >
            <FolderKanban className="text-blue-500" />
            <span className="flex-1">Create new project</span>
            <CommandShortcut>P</CommandShortcut>
          </CommandItem>

          <CommandItem
            value="invite teammate member people"
            onSelect={() => {
              onAction('invite');
              onClose();
            }}
          >
            <Users className="text-emerald-500" />
            <span className="flex-1">Invite teammate</span>
            <CommandShortcut>I</CommandShortcut>
          </CommandItem>

          <CommandItem
            value="settings profile personal preferences"
            onSelect={() => {
              onAction('settings');
              onClose();
            }}
          >
            <Settings className="text-amber-500" />
            <span className="flex-1">Personal & workspace settings</span>
            <CommandShortcut>S</CommandShortcut>
          </CommandItem>

          <CommandItem
            value="onboarding tour welcome help setup"
            onSelect={() => {
              onAction('onboarding');
              onClose();
            }}
          >
            <Sparkles className="text-purple-500" />
            <span className="flex-1">Start onboarding & workspace setup</span>
            <CommandShortcut>O</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Projects */}
        {projects.length > 0 && (
          <CommandGroup heading="Projects">
            {projects.map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.name} ${p.key}`}
                onSelect={() => {
                  onSelectProject(p.id);
                  onClose();
                }}
              >
                <span className={`project-dot ${p.color}`} />
                <span className="flex-1 font-medium">{p.name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {p.key}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Tasks & Issues */}
        {issues.length > 0 && (
          <CommandGroup heading="Tasks & Issues">
            {issues.map((i) => {
              const parentProj = projects.find((p) => p.id === i.projectId);
              return (
                <CommandItem
                  key={i.id}
                  value={`${i.title} ${parentProj?.key || ''}-${i.number} ${i.label}`}
                  onSelect={() => {
                    onSelectIssue(i);
                    onClose();
                  }}
                >
                  <CheckSquare className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {parentProj?.key || 'ISSUE'}-{i.number}
                  </span>
                  <span className="flex-1 truncate">{i.title}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {i.label}
                  </Badge>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Team Members */}
        {members.length > 0 && (
          <CommandGroup heading="Team Members">
            {members.map((m) => (
              <CommandItem
                key={m.id}
                value={`${m.name} ${m.email} ${m.role}`}
                onSelect={() => {
                  onSelectMember(m);
                  onClose();
                }}
              >
                <User className="text-muted-foreground" />
                <span className="flex-1 font-medium">{m.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[140px] mr-2">
                  {m.email}
                </span>
                <Badge variant="secondary" className="capitalize text-[10px]">
                  {m.role}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Workspaces */}
        {workspaces.length > 0 && (
          <CommandGroup heading="Workspaces">
            {workspaces.map((w) => {
              const isCurrent = w.id === currentWorkspace.id;
              return (
                <CommandItem
                  key={w.id}
                  value={`${w.name} ${w.slug} workspace`}
                  onSelect={() => {
                    onSelectWorkspace(w.id);
                    onClose();
                  }}
                >
                  <Building2 className="text-primary" />
                  <span className="flex-1 font-medium">{w.name}</span>
                  {isCurrent ? (
                    <Badge variant="default" className="text-[10px]">
                      Active
                    </Badge>
                  ) : (
                    <ArrowRight className="text-muted-foreground" />
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
