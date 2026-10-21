'use client';
import { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Briefcase, 
  Building2, 
  Check, 
  ChevronDown, 
  Sparkles, 
  Eye, 
  Lock 
} from 'lucide-react';
import type { PersonaUser } from '../types/workspace';
import { initialPersonas } from '../lib/initial-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PersonaSwitcherProps {
  currentPersona: PersonaUser;
  onSelectPersona: (persona: PersonaUser) => void;
}

const roleMeta = {
  admin: {
    label: 'Org Admin',
    color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    icon: ShieldCheck,
    desc: 'Full administrative controls, project creation, employee & client management.',
  },
  project_manager: {
    label: 'Project Manager',
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    icon: Briefcase,
    desc: 'Oversees delivery, manages tasks, milestones, and client communications.',
  },
  employee: {
    label: 'Team Member',
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    icon: Users,
    desc: 'Updates task statuses, uploads files, reports issues, collaborates on tasks.',
  },
  client: {
    label: 'Client (Acme)',
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    icon: Building2,
    desc: 'Client portal: views assigned projects, submits feedback, shares references.',
  },
};

export function PersonaSwitcher({ currentPersona, onSelectPersona }: PersonaSwitcherProps) {
  const meta = roleMeta[currentPersona.role] || roleMeta.admin;
  const RoleIcon = meta.icon;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 px-2.5 text-xs border-border bg-card hover:bg-accent/50 shadow-xs"
            title="Switch User Role Persona"
          >
            <div className="flex items-center gap-1.5">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                {currentPersona.displayName.slice(0, 1)}
              </span>
              <span className="font-semibold text-foreground hidden sm:inline max-w-[110px] truncate">
                {currentPersona.displayName}
              </span>
            </div>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${meta.color}`}>
              {meta.label}
            </Badge>
            <ChevronDown className="size-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[300px] p-2 bg-popover border-border shadow-xl">
          <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground font-semibold flex items-center justify-between">
            <span>Switch Role / User Persona</span>
            <Sparkles className="size-3.5 text-primary" />
          </DropdownMenuLabel>
          <p className="px-2 pb-2 text-[11px] text-muted-foreground leading-normal">
            Test the application from different roles to verify permissions, client isolation, and collaboration workflows.
          </p>

          <DropdownMenuSeparator />

          <div className="flex flex-col gap-1 mt-1">
            {initialPersonas.map((persona) => {
              const isSelected = persona.id === currentPersona.id;
              const pMeta = roleMeta[persona.role];
              const PIcon = pMeta.icon;

              return (
                <DropdownMenuItem
                  key={persona.id}
                  onClick={() => onSelectPersona(persona)}
                  className={`flex flex-col items-start gap-1 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-muted font-bold text-xs text-foreground">
                        {persona.displayName[0]}
                      </span>
                      <strong className="text-xs font-semibold text-foreground">
                        {persona.displayName}
                      </strong>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${pMeta.color}`}>
                      {pMeta.label}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground pl-8 line-clamp-1">
                    {persona.title}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ClientPortalBanner({ currentPersona, onSwitchToAdmin }: { currentPersona: PersonaUser; onSwitchToAdmin: () => void }) {
  if (currentPersona.role !== 'client') return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
      <div className="flex items-center gap-2">
        <Lock className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Client Portal Mode:</strong> You are viewing Acme Corp authorized deliverables. Internal company notes, private discussions, and unassigned projects are strictly hidden.
        </span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={onSwitchToAdmin}
        className="h-6 text-[11px] border-amber-500/30 hover:bg-amber-500/20 self-start sm:self-auto shrink-0"
      >
        Switch to Admin / PM
      </Button>
    </div>
  );
}
