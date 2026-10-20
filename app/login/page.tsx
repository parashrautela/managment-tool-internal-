'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

export default function Login() {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (new URLSearchParams(location.search).get('error') === 'confirmation') {
      setError('That confirmation link could not be completed. Try signing in or request a new confirmation from your Supabase administrator.');
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setMessage(''); setBusy(true);
    const values = new FormData(event.currentTarget);
    const email = String(values.get('email')).trim();
    const password = String(values.get('password'));
    try {
      const client = createClient();
      if (signup) {
        const { data, error } = await client.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (data.session) location.assign('/');
        else setMessage('Check your email to confirm your account, then sign in.');
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        location.assign('/');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally { setBusy(false); }
  }

  return <main className="login-page"><section className="modal login-card">
    <a className="back-link" href="/"><ArrowLeft size={14}/>Back to workspace</a>
    <div className="brand"><span className="brand-mark"><span/><span/><span/></span>flowboard<span className="brand-dot">.</span></div>
    <h1>{signup ? 'Great work starts here.' : 'Welcome back.'}</h1>
    <p className="modal-subtitle">{signup ? 'Create an account to start working with your team.' : 'Sign in to your projects, people, and priorities.'}</p>
    <form onSubmit={submit}>
      <label>Email address<input type="email" name="email" autoComplete="email" required autoFocus placeholder="you@company.com" maxLength={254}/></label>
      <label>Password<input type="password" name="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={signup ? 8 : 1} placeholder={signup ? 'At least 8 characters' : 'Your password'}/></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="settings-note" role="status"><CheckCircle2 size={18}/>{message}</p>}
      <button disabled={busy} className="primary wide login-submit" type="submit">{busy ? 'Please wait...' : signup ? 'Create account' : 'Sign in'}<ArrowRight size={16}/></button>
    </form>
    <button className="login-switch" onClick={() => {setSignup(!signup);setError('');setMessage('');}}>{signup ? 'Already have an account? Sign in' : 'New to Flowboard? Create an account'}</button>
    <p className="login-security"><ShieldCheck size={14}/>Your projects are private to their members.</p>
  </section></main>;
}
