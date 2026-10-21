'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (new URLSearchParams(location.search).get('error') === 'confirmation') {
      setError('That confirmation link could not be completed. Try signing in or request a new confirmation from your Supabase administrator.');
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); 
    setMessage(''); 
    setBusy(true);

    const values = new FormData(event.currentTarget);
    const email = String(values.get('email')).trim();

    try {
      const client = createClient();

      if (mode === 'forgot') {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback`,
        });
        if (error) throw error;
        setMessage('A password reset link has been dispatched to your email address.');
      } else if (mode === 'signup') {
        const pass = String(values.get('password'));
        const { data, error } = await client.auth.signUp({
          email,
          password: pass,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (data.session) {
          location.assign('/');
        } else {
          setMessage('Check your email to confirm your account, then sign in.');
        }
      } else {
        const pass = String(values.get('password'));
        const { error } = await client.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        location.assign('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please check credentials or try demo mode.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-[440px] border-border shadow-lg">
        <CardHeader className="gap-2">
          <Button asChild variant="ghost" size="sm" className="w-fit p-0 h-auto text-muted-foreground hover:text-foreground">
            <Link href="/" className="flex items-center gap-1.5 text-xs">
              <ArrowLeft data-icon="inline-start" className="size-3.5" /> Back to workspace
            </Link>
          </Button>

          <div className="flex items-center gap-2 pt-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              F
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              flowboard<span className="text-primary">.</span>
            </span>
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight">
            {mode === 'signup' 
              ? 'Great work starts here.' 
              : mode === 'forgot'
              ? 'Reset your password.'
              : 'Welcome back.'}
          </CardTitle>

          <CardDescription className="text-xs text-muted-foreground leading-relaxed">
            {mode === 'signup' 
              ? 'Create an account to start collaborating with your team.' 
              : mode === 'forgot'
              ? 'Enter your registered email and we’ll send you recovery instructions.'
              : 'Sign in to access your projects, roadmaps, and priorities.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Social Authentication Options */}
          {mode !== 'forgot' && (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2.5 text-xs font-medium"
                onClick={() => {
                  setMessage('Social authentication provider is enabled for production deployments.');
                }}
              >
                <svg className="size-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
                </svg>
                <span>Continue with Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2.5 text-xs font-medium"
                onClick={() => {
                  setMessage('GitHub single sign-on is enabled for enterprise accounts.');
                }}
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2Z" />
                </svg>
                <span>Continue with GitHub</span>
              </Button>

              <div className="relative my-2">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  or with email
                </span>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="text-xs font-medium text-foreground">
                Email address
              </label>
              <Input
                id="auth-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                autoFocus
                placeholder="alex.morgan@company.com"
                maxLength={254}
              />
            </div>

            {mode !== 'forgot' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="auth-password" className="text-xs font-medium text-foreground">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-xs text-primary"
                      onClick={() => {
                        setMode('forgot');
                        setError('');
                        setMessage('');
                      }}
                    >
                      Forgot password?
                    </Button>
                  )}
                </div>
                <Input
                  id="auth-password"
                  type="password"
                  name="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={mode === 'signup' ? 8 : 1}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {mode === 'signup' && (
                  <span className="text-xs text-muted-foreground">
                    Must be at least 8 characters with letters and numbers.
                  </span>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button disabled={busy} className="w-full mt-2 gap-1.5" type="submit">
              {busy ? 'Please wait...' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}
              {!busy && <ArrowRight data-icon="inline-end" />}
            </Button>
          </form>

          {/* Quick Demo Access Callout */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <Sparkles className="size-4 text-primary shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <strong className="text-xs font-semibold text-primary">Exploring as a guest?</strong>
              <p className="text-xs text-muted-foreground">Access the fully interactive workspace demo.</p>
            </div>
            <Button asChild size="sm" variant="default" className="shrink-0 text-xs gap-1">
              <Link href="/">
                Demo <ArrowRight data-icon="inline-end" className="size-3" />
              </Link>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-0 border-t border-border pt-4">
          <div className="flex flex-col items-center gap-1.5 text-center">
            {mode === 'signin' && (
              <Button
                type="button"
                variant="link"
                className="text-xs text-primary p-0 h-auto"
                onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
              >
                New to Flowboard? Create an account
              </Button>
            )}
            {mode === 'signup' && (
              <Button
                type="button"
                variant="link"
                className="text-xs text-primary p-0 h-auto"
                onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
              >
                Already have an account? Sign in
              </Button>
            )}
            {mode === 'forgot' && (
              <Button
                type="button"
                variant="link"
                className="text-xs text-primary p-0 h-auto"
                onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
              >
                Remembered your password? Back to sign in
              </Button>
            )}
          </div>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground text-center">
            <ShieldCheck className="size-3.5 text-muted-foreground/80 shrink-0" />
            Projects are private and scoped to verified workspace members.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
