# Flowboard

A Jira-inspired project workspace with an original, responsive design. Create projects, organize issues on a kanban board, and give collaborators project-specific access.

## Features

- Project creation with names, keys, descriptions, and colors.
- Searchable project dashboard with grid/list views and ownership filters.
- Issues with status, priority, label, description, and assignee.
- Drag-and-drop kanban and issue list views.
- Project-level Owner, Admin, Member, and Viewer roles.
- Server-enforced authorization and persistent Cloudflare D1 records.
- Email-bound project membership, claimed on authenticated sign-in.
- Clearly labeled, read-only sample projects before your first project.
- Responsive sidebar and mobile layouts.

## Access model

| Role | Read project | Create/edit issues | Manage Members/Viewers | Manage Admins |
| --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | No |
| Member | Yes | Yes | No | No |
| Viewer | Yes | No | No | No |

The project creator is the immutable Owner. Project memberships are independent of hosting access. The hosted workspace starts private: grant teammates access through Sites sharing, then add their email in the project's People tab and share the workspace URL. They must sign in with the same email. This app does not send invitation emails.

Identity comes from Sites' authenticated dispatch headers. Production must run behind that authentication boundary; do not expose a standalone Worker that trusts user-supplied identity headers. Local development uses the starter's loopback-only mock sign-in, excluded from production builds.

## Development

Requires Node.js 22.13 or newer.

```sh
npm run install:ci
npm run db:generate  # only when changing db/schema.ts
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_minor_exiles.sql
npm run dev
```

Open the URL printed by the dev server. For local sign-in, visit `/signin-with-chatgpt?return_to=/`. Local databases are separate from the hosted database. Apply each migration once to a fresh local database; subsequent schema changes require new migrations.

## Checks

```sh
npm run typecheck
npm test
npm run build
# In another terminal, run the production Worker locally:
npm start -- --port 8787
# Then test API authorization with isolated local test identities:
npm run test:api
```

API tests deliberately run only on loopback and create local test projects. They verify authentication, project isolation, Viewer restrictions, Member/Admin boundaries, owner protection, validation, cross-origin rejection, and concurrent issue numbering.

## Deployment

The app uses Vinext, React, TypeScript, Drizzle, and Cloudflare D1. `.openai/hosting.json` contains the Sites project identity and DB binding. The Sites workflow builds and packages the Worker and applies database migrations during deployment. GitHub holds the source; pushing to GitHub alone does not deploy it.

See [DESIGN.md](DESIGN.md) for visual foundations and interaction flows. No credentials, runtime data, or build outputs are committed.
