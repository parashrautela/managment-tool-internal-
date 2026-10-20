import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from './config';

export async function createClient() {
  const { url, key } = supabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: values => {
        // All authenticated calls currently run in route handlers, where cookies are writable.
        values.forEach(({name, value, options}) => cookieStore.set(name, value, options));
      },
    },
  });
}
