import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  }
  const client = await createClient();
  await client.auth.signOut();
  return NextResponse.redirect(new URL('/login', request.url), 303);
}
