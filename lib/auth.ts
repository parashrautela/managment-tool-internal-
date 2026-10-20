import 'server-only';
import { createClient } from './supabase/server';

export async function getUser() {
  const client = await createClient();
  // Validate with Supabase Auth; never trust identity headers or an unverified session cookie.
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user?.email || !user.email_confirmed_at) return null;
  const name = user.user_metadata?.full_name;
  return {
    userId: user.id,
    email: user.email.toLowerCase(),
    displayName: typeof name === 'string' && name.trim() ? name.trim().slice(0,100) : user.email.split('@')[0],
  };
}
