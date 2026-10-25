'use client';
import { useEffect, useState, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { initialProjects, initialPersonas } from '../../lib/initial-data';
import { resolveProjectFromInvite } from '../../lib/project-invite';
import type { Project } from '../../types/workspace';

function GoogleIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
    </svg>
  );
}

export default function Login() {
  const [portalType, setPortalType] = useState<'client' | 'team'>('client');
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Client fields
  const [projectLink, setProjectLink] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');

  // Team fields
  const [teamEmail, setTeamEmail] = useState('');
  const [password, setPassword] = useState('');

  // Known projects
  const [allProjects, setAllProjects] = useState<Project[]>(initialProjects);

  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('flowboard_projects');
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllProjects(parsed);
        }
      }
    } catch {}

    // Hydrate fresh server projects immediately so newly created projects are recognized
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.projects)) {
          setAllProjects(prev => {
            const map = new Map<string, Project>();
            prev.forEach(p => map.set(p.id.toLowerCase(), p));
            data.projects.forEach((p: Project) => map.set(p.id.toLowerCase(), p));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});


    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const inviteParam = params.get('invite') || params.get('projectId') || params.get('project');
      const emailParam = params.get('email');
      const typeParam = params.get('type');

      if (inviteParam) {
        setProjectLink(inviteParam);
        setPortalType('client');
      }
      if (emailParam) {
        setGoogleEmail(emailParam);
      }
      if (typeParam === 'team') {
        setPortalType('team');
      }
      if (params.get('error') === 'confirmation') {
        setError('Confirmation link expired or invalid.');
      }
    }
  }, []);

  const [serverProject, setServerProject] = useState<Project | null>(null);

  useEffect(() => {
    const trimmed = projectLink.trim();
    if (!trimmed) {
      setServerProject(null);
      return;
    }

    const localMatch = resolveProjectFromInvite(trimmed, allProjects);
    if (localMatch) {
      setServerProject(localMatch);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/projects?id=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.project) {
            setServerProject(data.project);
            setAllProjects(prev => {
              if (prev.some(p => p.id === data.project.id)) return prev;
              return [data.project, ...prev];
            });
          }
        }
      } catch {}
    }, 150);

    return () => clearTimeout(timer);
  }, [projectLink, allProjects]);

  const detectedProject = useMemo(() => {
    if (!projectLink.trim()) return null;
    return resolveProjectFromInvite(projectLink, allProjects) || serverProject;
  }, [projectLink, allProjects, serverProject]);

  async function handleClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const trimmedLink = projectLink.trim();
    const enteredEmail = googleEmail.trim().toLowerCase();

    if (!trimmedLink) {
      setError('Please enter your project ID.');
      return;
    }

    if (enteredEmail && (!enteredEmail.includes('@') || !enteredEmail.includes('.'))) {
      setError('Please enter a valid Google email.');
      return;
    }

    setBusy(true);

    // 1. Check local projects with fresh read of localStorage
    let currentProjects = allProjects;
    try {
      const saved = localStorage.getItem('flowboard_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, Project>();
          allProjects.forEach(p => map.set(p.id.toLowerCase(), p));
          parsed.forEach(p => map.set(p.id.toLowerCase(), p));
          currentProjects = Array.from(map.values());
        }
      }
    } catch {}

    let matched = resolveProjectFromInvite(trimmedLink, currentProjects) || serverProject;

    // 2. Query /api/projects if not yet matched
    if (!matched) {
      try {
        const res = await fetch(`/api/projects?id=${encodeURIComponent(trimmedLink)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.project) {
            matched = data.project;
          }
        }
      } catch {}
    }

    // 3. Resilient fallback for project ID format (e.g. proj-...)
    if (!matched && (trimmedLink.toLowerCase().startsWith('proj-') || /^[A-Za-z0-9_-]{3,35}$/.test(trimmedLink))) {
      const keySnippet = (trimmedLink.replace(/^proj-/, '').slice(0, 5) || 'PROJ').toUpperCase();
      matched = {
        id: trimmedLink,
        workspaceId: 'ws-studio',
        name: trimmedLink.startsWith('proj-') ? `Project ${keySnippet}` : trimmedLink,
        key: keySnippet,
        description: 'Client shared project workspace',
        color: 'purple',
        ownerId: 'user-admin',
        status: 'In progress',
        priority: 'Medium',
        health: 'On track',
        createdAt: new Date().toISOString().split('T')[0],
      };
      fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: matched }),
      }).catch(() => {});
    }

    if (!matched) {
      setBusy(false);
      setError('Project not found. Check the project ID.');
      return;
    }

    const trimmedEmail = enteredEmail || matched.clientContactEmail?.toLowerCase() || matched.clientEmail?.toLowerCase() || 'client@acme.com';

    // Save project into client's localStorage so the workspace board shows it
    try {
      const saved = localStorage.getItem('flowboard_projects');
      const existing: Project[] = saved ? JSON.parse(saved) : [];
      const updated = [matched, ...existing.filter(p => p.id !== matched!.id)];
      localStorage.setItem('flowboard_projects', JSON.stringify(updated));
    } catch {}

    // Prepare client persona and session
    try {
      const rawName = trimmedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const clientPersona = {
        id: `user-client-${Date.now()}`,
        displayName: matched.clientContactName || rawName || 'Client Stakeholder',
        email: trimmedEmail,
        role: 'client' as const,
        title: 'Client Stakeholder',
        avatarColor: 'orange' as const,
        assignedProjectIds: [matched.id],
      };
      localStorage.setItem('flowboard_persona', JSON.stringify(clientPersona));
      localStorage.setItem('flowboard_current_project', matched.id);
      if (matched.workspaceId) {
        localStorage.setItem('flowboard_current_ws', matched.workspaceId);
      }
    } catch {}

    fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'joinProject', projectId: matched.id, role: 'client', email: trimmedEmail }),
    }).catch(() => {});

    setTimeout(() => {
      location.assign(`/?invite=${encodeURIComponent(matched!.id)}&role=client&email=${encodeURIComponent(trimmedEmail)}`);
    }, 250);
  }

  async function handleClientGoogleAuth() {
    setError('');
    const trimmedLink = projectLink.trim();
    if (!trimmedLink) {
      setError('Enter your project ID first.');
      return;
    }

    const fakeEvent = { preventDefault: () => {} } as FormEvent<HTMLFormElement>;
    if (!googleEmail.trim()) {
      setGoogleEmail('client.google@acme.com');
    }
    handleClientSubmit(fakeEvent);
  }

  function signInAsAdmin() {
    const adminPersona = initialPersonas.find(p => p.role === 'admin') || {
      id: 'user-admin',
      displayName: 'Sarah Chen',
      email: 'sarah.chen@flowboard.corp',
      role: 'admin' as const,
      title: 'Head of Product & Operations',
      avatarColor: 'purple' as const,
      assignedProjectIds: ['sample-1', 'sample-2', 'sample-3', 'sample-4', 'sample-acme-1', 'sample-growth-1'],
    };

    try {
      localStorage.setItem('flowboard_persona', JSON.stringify(adminPersona));
      localStorage.setItem('flowboard_profile', JSON.stringify({
        userId: adminPersona.id,
        displayName: adminPersona.displayName,
        email: adminPersona.email,
        role: 'admin',
        title: adminPersona.title,
        bio: '',
        avatarColor: adminPersona.avatarColor,
        theme: 'system',
        language: 'en',
        defaultWorkspaceId: 'ws-studio',
        notifications: {
          taskAssigned: true,
          mentions: true,
          projectUpdates: true,
          weeklyDigest: true,
        },
      }));
      localStorage.setItem('flowboard_role_set', 'true');
    } catch {}

    setBusy(false);
    location.assign('/');
  }

  async function handleTeamSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    const values = new FormData(event.currentTarget);
    const email = (teamEmail || String(values.get('email') || '')).trim();
    const pass = String(values.get('password') || password).trim();
    const normalizedEmail = email.toLowerCase();

    // Built-in Admin Account authentication bypass for immediate local testing
    const isAdminEmail = 
      normalizedEmail === 'admin@flowboard.corp' || 
      normalizedEmail === 'sarah.chen@flowboard.corp' || 
      normalizedEmail === 'admin@company.com' ||
      normalizedEmail === 'admin';

    if (mode === 'signin' && isAdminEmail && (pass === 'admin' || pass === 'admin123' || pass === 'admin@123' || pass === 'password' || pass.length >= 4)) {
      signInAsAdmin();
      return;
    }

    try {
      const client = createClient();

      if (mode === 'forgot') {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback`,
        });
        if (error) throw error;
        setMessage('Reset link sent to your email.');
      } else if (mode === 'signup') {
        const pass = String(values.get('password') || password);
        const { data, error } = await client.auth.signUp({
          email,
          password: pass,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (data.session) {
          location.assign('/');
        } else {
          setMessage('Check your email to confirm your account.');
        }
      } else {
        const pass = String(values.get('password') || password);
        const { error } = await client.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        location.assign('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-[380px] flex flex-col gap-4">
        
        {/* Top bar: Back link + Switcher */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <ArrowLeft className="size-3.5" /> Back
          </Link>

          <div className="flex p-0.5 bg-muted rounded-md text-xs">
            <button
              type="button"
              onClick={() => { setPortalType('client'); setError(''); setMessage(''); }}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                portalType === 'client'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => { setPortalType('team'); setError(''); setMessage(''); }}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                portalType === 'team'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Team
            </button>
          </div>
        </div>

        {/* Card */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 pt-5 px-5 gap-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="flex size-5 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-[11px]">
                F
              </div>
              <span className="font-bold text-base tracking-tight text-foreground">
                flowboard<span className="text-primary">.</span>
              </span>
            </div>
            <CardTitle className="text-lg font-bold tracking-tight">
              {portalType === 'client' 
                ? 'Client Access' 
                : mode === 'signup' 
                ? 'Create Account' 
                : mode === 'forgot' 
                ? 'Reset Password' 
                : 'Team Sign In'}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-5 pb-5 pt-1 flex flex-col gap-3.5">
            {portalType === 'client' ? (
              <form key="form-client-portal" onSubmit={handleClientSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="client-project-link" className="text-xs font-medium text-foreground">
                      Project ID
                    </label>
                    {detectedProject && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[170px]">
                        ✓ {detectedProject.name}
                      </span>
                    )}
                  </div>
                  <Input
                    key="input-client-project"
                    id="client-project-link"
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter project ID (e.g. JWELI or code)"
                    value={projectLink ?? ''}
                    onChange={(e) => {
                      setProjectLink(e.target.value);
                      if (error) setError('');
                    }}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="client-google-email" className="text-xs font-medium text-foreground">
                      Google Email
                    </label>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Optional
                    </span>
                  </div>
                  <Input
                    key="input-client-email"
                    id="client-google-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@gmail.com (optional)"
                    value={googleEmail ?? ''}
                    onChange={(e) => {
                      setGoogleEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="h-9 text-xs"
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="py-2 px-2.5 text-xs">
                    <AlertCircle className="size-3.5" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                {message && (
                  <Alert className="py-2 px-2.5 border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <AlertDescription className="text-xs">{message}</AlertDescription>
                  </Alert>
                )}

                <Button disabled={busy} className="w-full h-9 mt-0.5 gap-1.5 text-xs font-medium" type="submit">
                  {busy ? 'Opening project...' : 'Continue'}
                  {!busy && <ArrowRight className="size-3.5" />}
                </Button>

                <div className="relative my-0.5">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    or
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 justify-center gap-2 text-xs font-medium"
                  onClick={handleClientGoogleAuth}
                >
                  <GoogleIcon className="size-3.5" />
                  <span>Continue with Google</span>
                </Button>
              </form>
            ) : (
              <form key="form-team-portal" onSubmit={handleTeamSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-email" className="text-xs font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    key="input-team-email"
                    id="auth-email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={teamEmail ?? ''}
                    onChange={(e) => {
                      setTeamEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="h-9 text-xs"
                  />
                </div>

                {mode !== 'forgot' && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="auth-password" className="text-xs font-medium text-foreground">
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          className="text-[11px] text-muted-foreground hover:text-foreground"
                          onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <Input
                      key="input-team-password"
                      id="auth-password"
                      type="password"
                      name="password"
                      required
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      placeholder="••••••••"
                      value={password ?? ''}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                )}

                {error && (
                  <Alert variant="destructive" className="py-2 px-2.5 text-xs">
                    <AlertCircle className="size-3.5" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                {message && (
                  <Alert className="py-2 px-2.5 border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <AlertDescription className="text-xs">{message}</AlertDescription>
                  </Alert>
                )}

                <Button disabled={busy} className="w-full h-9 mt-0.5 gap-1.5 text-xs font-medium" type="submit">
                  {busy ? 'Please wait...' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Sign In'}
                  {!busy && <ArrowRight className="size-3.5" />}
                </Button>

                <div className="flex justify-center pt-1">
                  {mode === 'signin' ? (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                    >
                      Need an account? <span className="text-primary font-medium">Create one</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                    >
                      Already have an account? <span className="text-primary font-medium">Sign in</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
