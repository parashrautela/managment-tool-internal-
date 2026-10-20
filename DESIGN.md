# Flowboard design

A calm workspace for projects, issues, and people. Inspired by Jira’s project organization with an original visual identity.

## Foundations
- Canvas: #fafafb; surfaces: white; borders: #eeedf2.
- Primary accent: #7760da. Project accents: purple, blue, green, orange.
- Typography: Manrope for headings, DM Sans for interface text; system sans-serif fallback.
- Fixed sidebar, workspace breadcrumb, spacious project dashboard, compact kanban cards.
- Rounded 6–10px controls and surfaces, subtle shadows, restrained color.
- Responsive navigation drawer below 650px; project grids adapt from three columns to one.

## Main flows
1. Create project: name, key, description, color. Creator becomes Owner.
2. Open a project: Board, List, People, Settings.
3. Create issues: title, description, status, priority, label, assignee.
4. Move work: drag issue cards or edit the status in the issue dialog.
5. Grant project membership by email, then share the workspace URL. No email is sent by the app. Teammates must register with the same email and confirm it through Supabase Auth.

## Access
- Owner: all project operations; appoint admins; manage everyone except the immutable owner membership.
- Admin: edit issues; add Members/Viewers; manage Member/Viewer memberships.
- Member: view project, create and edit issues.
- Viewer: read-only project access.
- Every server operation verifies authenticated identity and project membership.
- Sample projects are clearly identified and read-only. No sample records are stored in the database.
