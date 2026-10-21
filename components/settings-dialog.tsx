'use client';
import { useState, useEffect, type FormEvent } from 'react';
import { 
  User, 
  Settings, 
  Bell, 
  ShieldCheck, 
  Moon, 
  Sun, 
  Laptop, 
  Check, 
  LogOut, 
  Trash2, 
  KeyRound, 
  Download,
  CheckCircle2,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import type { UserProfile, Workspace } from '../types/workspace';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  workspaces: Workspace[];
  onSaveProfile: (updated: UserProfile) => Promise<void>;
  onSignOut: () => void;
}

export function SettingsDialog({
  isOpen,
  onClose,
  profile: initialProfile,
  workspaces,
  onSaveProfile,
  onSignOut,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'security'>('profile');

  // Profile fields
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [email, setEmail] = useState(initialProfile.email);
  const [title, setTitle] = useState(initialProfile.title || '');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [avatarColor, setAvatarColor] = useState(initialProfile.avatarColor || 'purple');

  // Preferences
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(initialProfile.theme || 'system');
  const [language, setLanguage] = useState(initialProfile.language || 'en');
  const [defaultWorkspaceId, setDefaultWorkspaceId] = useState(initialProfile.defaultWorkspaceId || workspaces[0]?.id || '');

  // Notifications
  const [notifications, setNotifications] = useState(initialProfile.notifications || {
    taskAssigned: true,
    mentions: true,
    projectUpdates: true,
    weeklyDigest: false,
  });

  const [busy, setBusy] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [error, setError] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(initialProfile.displayName);
      setEmail(initialProfile.email);
      setTitle(initialProfile.title || '');
      setBio(initialProfile.bio || '');
      setAvatarColor(initialProfile.avatarColor || 'purple');
      setTheme(initialProfile.theme || 'system');
      setLanguage(initialProfile.language || 'en');
      setDefaultWorkspaceId(initialProfile.defaultWorkspaceId || workspaces[0]?.id || '');
      setNotifications(initialProfile.notifications || {
        taskAssigned: true,
        mentions: true,
        projectUpdates: true,
        weeklyDigest: false,
      });
      setSavedNotice('');
      setError('');
      setConfirmDeactivate(false);
    }
  }, [isOpen, initialProfile, workspaces]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSavedNotice('');

    try {
      const updated: UserProfile = {
        ...initialProfile,
        displayName: displayName.trim(),
        email: email.trim(),
        title: title.trim(),
        bio: bio.trim(),
        avatarColor,
        theme,
        language,
        defaultWorkspaceId,
        notifications,
      };

      await onSaveProfile(updated);
      setSavedNotice('Settings saved successfully.');
      setTimeout(() => setSavedNotice(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setBusy(false);
    }
  }

  function toggleNotification(key: keyof UserProfile['notifications']) {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-[620px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Settings className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">Preferences & Settings</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Manage your identity, theme appearance, notifications, and security.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col gap-4 mt-1">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as typeof activeTab)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">
                <User data-icon="inline-start" className="size-3.5" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Settings data-icon="inline-start" className="size-3.5" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell data-icon="inline-start" className="size-3.5" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="security">
                <ShieldCheck data-icon="inline-start" className="size-3.5" />
                Security
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Profile */}
            <TabsContent value="profile" className="flex flex-col gap-4 pt-3">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
                <Avatar className="size-14 ring-2 ring-primary/20">
                  <AvatarFallback className={cn('text-sm font-bold', avatarColor)}>
                    {displayName.slice(0, 2).toUpperCase() || 'FB'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1.5 flex-1">
                  <span className="text-xs font-semibold text-foreground">Avatar color accent</span>
                  <div className="flex gap-2">
                    {['purple', 'blue', 'green', 'orange'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={cn(
                          'size-6 rounded-full transition-transform flex items-center justify-center',
                          c,
                          avatarColor === c && 'ring-2 ring-primary ring-offset-2'
                        )}
                        onClick={() => setAvatarColor(c)}
                      >
                        {avatarColor === c && <Check className="size-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="user-name" className="text-xs font-medium text-foreground">
                  Full name
                </label>
                <Input
                  id="user-name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="user-email" className="text-xs font-medium text-foreground">
                  Email address
                </label>
                <Input
                  id="user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.morgan@company.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="user-title" className="text-xs font-medium text-foreground">
                  Role / Job title
                </label>
                <Input
                  id="user-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Staff Product Designer, Engineering Manager"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="user-bio" className="text-xs font-medium text-foreground">
                    Bio
                  </label>
                  <span className="text-xs text-muted-foreground">optional</span>
                </div>
                <Textarea
                  id="user-bio"
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short note about what you're working on..."
                />
              </div>
            </TabsContent>

            {/* TAB 2: Preferences */}
            <TabsContent value="preferences" className="flex flex-col gap-4 pt-3">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-foreground">Interface Theme</span>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                    onClick={() => setTheme('light')}
                  >
                    <Sun data-icon="inline-start" />
                    Light
                  </Button>
                  <Button
                    type="button"
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon data-icon="inline-start" />
                    Dark
                  </Button>
                  <Button
                    type="button"
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                    onClick={() => setTheme('system')}
                  >
                    <Laptop data-icon="inline-start" />
                    System
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="default-workspace" className="text-xs font-medium text-foreground">
                  Default workspace on login
                </label>
                <Select
                  value={defaultWorkspaceId}
                  onValueChange={(val) => setDefaultWorkspaceId(val)}
                >
                  <SelectTrigger id="default-workspace" className="w-full">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {workspaces.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="user-lang" className="text-xs font-medium text-foreground">
                  Language
                </label>
                <Select value={language} onValueChange={(val) => setLanguage(val)}>
                  <SelectTrigger id="user-lang" className="w-full">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="en">English (US)</SelectItem>
                      <SelectItem value="en-gb">English (UK)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-xs mt-2">
                <div>
                  <strong className="text-xs font-semibold text-foreground">Progressive Web App (PWA)</strong>
                  <p className="text-xs text-muted-foreground">
                    Install Flowboard to your home screen or dock for desktop offline access.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('flowboard:install'));
                    }
                  }}
                >
                  <Download data-icon="inline-start" /> Install App
                </Button>
              </div>
            </TabsContent>

            {/* TAB 3: Notifications */}
            <TabsContent value="notifications" className="flex flex-col gap-3 pt-3">
              {[
                {
                  key: 'taskAssigned' as const,
                  title: 'Task assigned',
                  desc: 'Receive updates when issues or action items are assigned to you.',
                },
                {
                  key: 'mentions' as const,
                  title: 'Mentions & comments',
                  desc: 'Alert me when teammates @mention me or reply to my comments.',
                },
                {
                  key: 'projectUpdates' as const,
                  title: 'Project milestone updates',
                  desc: 'Get notified when project statuses, health ratings, or delivery dates change.',
                },
                {
                  key: 'weeklyDigest' as const,
                  title: 'Weekly digest email',
                  desc: 'A summary of accomplished goals and upcoming sprint deliverables.',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-xs font-medium text-foreground">{item.title}</strong>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={() => toggleNotification(item.key)}
                  />
                </div>
              ))}
            </TabsContent>

            {/* TAB 4: Security */}
            <TabsContent value="security" className="flex flex-col gap-4 pt-3">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground">Active Sessions</span>
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <Laptop className="size-5 text-primary" />
                    <div>
                      <strong className="text-xs font-semibold">Mac OS · Chrome Browser</strong>
                      <p className="text-xs text-muted-foreground">Active now · IP: 192.168.1.1 (Current device)</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs">Current</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <Smartphone className="size-5 text-muted-foreground" />
                    <div>
                      <strong className="text-xs font-semibold">iOS · Flowboard Mobile PWA</strong>
                      <p className="text-xs text-muted-foreground">Last active 2 days ago · Cupertino, CA</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <span className="text-xs font-semibold text-foreground">Password & Authentication</span>
                <p className="text-xs text-muted-foreground">
                  To change your password or configure multi-factor authentication, request a secure reset link.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start gap-1.5"
                  onClick={() => {
                    setSavedNotice('Password reset email dispatched to ' + email);
                    setTimeout(() => setSavedNotice(''), 4000);
                  }}
                >
                  <KeyRound data-icon="inline-start" /> Send password reset email
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-destructive/20 flex flex-col gap-3">
                <div>
                  <strong className="text-xs font-semibold text-destructive">Deactivate Account</strong>
                  <p className="text-xs text-muted-foreground">
                    Temporarily deactivate your account and revoke active login tokens.
                  </p>
                </div>
                {!confirmDeactivate ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="self-start gap-1.5"
                    onClick={() => setConfirmDeactivate(true)}
                  >
                    <Trash2 data-icon="inline-start" /> Deactivate
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-destructive">Confirm deactivation?</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={onSignOut}
                    >
                      Yes, deactivate
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDeactivate(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {savedNotice && (
            <Alert className="border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <AlertDescription>{savedNotice}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4 flex items-center justify-between w-full">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onSignOut}
            >
              <LogOut data-icon="inline-start" /> Sign out
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
                Close
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving...' : 'Save preferences'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
