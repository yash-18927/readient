# Readient

Readient helps students review resume readiness and helps recruiters screen applicants against job-specific scoring criteria. AI-generated scores assist screening; they are not hiring decisions or guarantees.

**Live app:** https://readient.lovable.app  
**Repository:** https://github.com/yash-18927/readient

## Features

- Resume analysis, ATS feedback, skill gaps, and improvement suggestions.
- Optional LinkedIn profile import from PDF, ZIP, or CSV.
- GitHub and LeetCode evidence lookups, portfolio previews, and self-reported additional work.
- Recruiter job creation, custom scoring criteria, and shareable application links.
- Candidate reports, applicant rankings, and application standings.
- Supabase authentication and database row-level security.
- Light and dark themes.

## Technology

| Area                   | Technology                                      |
| ---------------------- | ----------------------------------------------- |
| Application            | React 19, TypeScript, TanStack Start and Router |
| Build                  | Vite, Bun                                       |
| Styling                | Tailwind CSS, Radix UI, semantic theme tokens   |
| Data                   | Supabase PostgreSQL and Auth, TanStack Query    |
| Server runtime         | Cloudflare-compatible Worker target             |
| Validation and imports | Zod, unpdf, fflate                              |
| Integrations           | AI providers, GitHub REST, LeetCode GraphQL     |

Provider configuration lives in the server-side analysis modules and may change independently of academic documents.

## Local development

Install [Bun](https://bun.sh/docs/installation) and a current Node.js LTS release.

```sh
git clone https://github.com/yash-18927/readient.git
cd readient
bun install --frozen-lockfile
bun run dev
```

The tracked `.env` contains public browser configuration required by the connected project. Private credentials belong in Lovable project secrets or your hosting provider's environment settings, never in source control. Use an ignored `.env.local` for private local configuration. Do not paste access tokens into chat or commit them.

AI analysis and external-service features require server credentials and a configured Supabase project. Installing dependencies does not provision those services. Database migrations are under `supabase/migrations/` and do not run automatically when GitHub receives a commit.

## Repository layout

```text
src/
  components/            Shared UI and feature views
  integrations/supabase/ Authentication, clients, and database types
  lib/                   Validation, analysis, imports, and server functions
  routes/                TanStack file-based pages and endpoints
  styles.css             Shared theme tokens
supabase/migrations/     Versioned database changes
.github/workflows/       Automated checks
```

Keep dependencies, generated build output, local caches, private environment files, and academic reports or presentations out of the app repository. Preserve platform configuration, migrations, and the text lockfile.

## Checks and deployment

GitHub Actions installs dependencies, checks TypeScript, runs lint, and builds the app on pushes and pull requests to `main`. This is **CI**, not automatic deployment: publishing remains separate unless a hosting deployment integration is configured.

```sh
bun run lint
bun run build
```

Develop in the [Lovable editor](https://lovable.dev/projects/7db6f922-d1b0-46fa-9aa3-be1c4a00f0b1) or locally. Check **Project settings → Git** for the active sync connection and branch. Preserve published Git history; do not force-push or rewrite synced commits.
