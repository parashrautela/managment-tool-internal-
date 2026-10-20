# Flowboard — Next.js + Supabase

A Jira-inspired project workspace built for **Vercel**, with **Supabase Auth and PostgreSQL**. Create projects, track issues on a kanban board, and assign project-specific roles.

## Deploy your Supabase project

The supplied `.env.example` uses the project URL shown in your screenshot:
`https://qfnutgdojkeopxbkqrjz.supabase.co`.

### 1. Create the database tables

Because this repository is connected to Supabase, set the integration's **Working directory** to `.` and enable **Deploy to production** for `main` if you want migrations applied on push. Check the Supabase deployment logs to confirm the migration succeeded.

The initial PostgreSQL schema is:

[`supabase/migrations/20261020070000_initial_workspace.sql`](supabase/migrations/20261020070000_initial_workspace.sql)

If automatic database deployment is disabled, apply it with the Supabase CLI (`supabase link --project-ref qfnutgdojkeopxbkqrjz` followed by `supabase db push`). The CLI records migration history. Do not also manually rerun the same migration in SQL Editor after it has been applied.

The migration creates `projects`, `members`, and `issues`, enables Row Level Security, and blocks direct table access from public browser keys. The Next.js API uses a server-only PostgreSQL connection and checks the signed-in user's project membership before every operation. Do not apply the old SQLite migrations under `drizzle/` to Supabase.

### 2. Set three Vercel environment variables

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qfnutgdojkeopxbkqrjz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase **Connect** or **Settings → API Keys**, publishable key |
| `DATABASE_URL` | Supabase **Connect → Transaction pooler**, PostgreSQL URI on port **6543** |

Use the transaction pooler URI exactly as supplied by Supabase, replace the database password placeholder, and URL-encode special password characters. The URI uses the `postgres.<project-ref>` user. Store it only as the server-side `DATABASE_URL`; never give it a `NEXT_PUBLIC_` prefix or commit it. No service-role key is needed.

Set the variables for the Vercel environments you use, then redeploy. Public environment variables are read during the build.

### 3. Configure Supabase sign-in

In **Authentication → URL Configuration**:

- Set **Site URL** to your production Vercel origin, such as `https://your-project.vercel.app`.
- Add `https://your-project.vercel.app/auth/callback` to **Redirect URLs**.
- For local development, also allow `http://localhost:3000/auth/callback`.

Keep the Email provider enabled and email confirmation enabled. The app supports email/password registration, confirmation, and sign-in. For production team usage, configure Supabase's email delivery as needed; the app uses Supabase Auth for account confirmation emails.

### 4. Deploy on Vercel

Import this GitHub repository. **Root Directory** is the repository root (leave blank or use `.`), **Framework Preset** is **Next.js**. The checked-in `vercel.json` sets:

- Install: `npm ci`
- Build: `npm run build` (`next build --webpack`)
- Output: `.next`

Remove stale Vercel overrides referencing Vinext, `dist`, or the old scripts. The app builds without credentials; database operations and sign-in require the variables above. The previous `[NEXT_NO_ROUTES_MANIFEST]` failure came from producing a Vinext build instead of a Next.js build.

## Working with your team

1. Register and confirm your email, then sign in.
2. Create a project. You become its Owner.
3. In **People**, add your teammate's email and choose a role.
4. Share your Vercel app URL. Teammates register with the exact same email; their verified sign-in claims the membership.

Adding project membership does not send an invitation email. Only account verification emails are sent by Supabase Auth. Project contents remain private to members; the app's login page can be visited by anyone. Sample projects are labeled and read-only.

| Role | View | Create/edit issues | Manage Members/Viewers | Manage Admins |
| --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | No |
| Member | Yes | Yes | No | No |
| Viewer | Yes | No | No | No |

Owner membership cannot be removed or demoted. Identity is verified with Supabase Auth; client-supplied identity headers are ignored.

## Local development

Requires Node.js 22.13 or newer.

```sh
npm ci
cp .env.example .env.local
# Fill in your publishable key and database pooler connection URI.
npm run dev
```

The development app uses your configured Supabase database. No mock login or local D1 database is used by the active Next.js runtime.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

Tests include a role matrix and real PostgreSQL queries in an isolated PGlite database. They exercise route permissions, membership claiming/removal, validation, cross-origin checks, issue updates, transactional numbering, and browser-role table restrictions. Auth sessions are injected in these database tests; real Supabase sign-up/sign-in must be checked after configuring your project credentials.

## Schema changes

Edit `db/schema.ts`, then run `npm run db:generate`. Review generated PostgreSQL migrations under `supabase/migrations/` and apply new migrations in order. Applied migrations must not be edited. Never use the retained Cloudflare/D1 scripts or SQLite migrations for this deployment.

The earlier Sites/Cloudflare helper files are retained for history; `package.json`, `next.config.ts`, `vercel.json`, `db/index.ts`, and `lib/supabase/` define the active runtime. There is no automatic data transfer from the earlier Sites database.

See [DESIGN.md](DESIGN.md) for the visual direction. References: [Supabase GitHub integration](https://supabase.com/docs/guides/deployment/branching/github-integration), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Vercel build configuration](https://vercel.com/docs/builds).
