'use client';
import { useState } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Sparkles, 
  User, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  FolderKanban 
} from 'lucide-react';
import type { AppNotification } from '../types/workspace';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NotificationsPopoverProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onSelectNotification: (notif: AppNotification) => void;
}

const typeIcon = {
  client_feedback: Sparkles,
  task_assigned: User,
  status_changed: CheckCircle2,
  comment: MessageSquare,
  file_uploaded: FolderKanban,
  deadline_approaching: Clock,
  chat_message: MessageSquare,
};

const typeColor = {
  client_feedback: 'text-amber-500 bg-amber-500/10',
  task_assigned: 'text-blue-500 bg-blue-500/10',
  status_changed: 'text-emerald-500 bg-emerald-500/10',
  comment: 'text-purple-500 bg-purple-500/10',
  file_uploaded: 'text-indigo-500 bg-indigo-500/10',
  deadline_approaching: 'text-red-500 bg-red-500/10',
  chat_message: 'text-primary bg-primary/10',
};

export function NotificationsPopover({
  notifications,
  onMarkAllRead,
  onSelectNotification,
}: NotificationsPopoverProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[340px] sm:w-[380px] p-0 bg-popover border-border shadow-2xl">
        <div className="p-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <strong className="text-sm font-semibold text-foreground">Notifications</strong>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onMarkAllRead}
              className="text-xs text-primary hover:text-primary gap-1"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="py-8 px-4 text-center flex flex-col items-center gap-2">
              <Bell className="size-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">You are all caught up! No notifications.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = typeIcon[notif.type] || Bell;
              const colorClass = typeColor[notif.type] || 'text-primary bg-primary/10';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    onSelectNotification(notif);
                    setOpen(false);
                  }}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                    !notif.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className={`p-2 rounded-xl shrink-0 ${colorClass}`}>
                    <Icon className="size-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <strong className={`text-xs truncate ${!notif.read ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
                        {notif.title}
                      </strong>
                      {!notif.read && (
                        <span className="size-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <small className="text-[10px] text-muted-foreground/80 block mt-1">
                      {new Date(notif.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
