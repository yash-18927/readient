# Readient

Build the foundation of a full-stack web app called "AI Placement Readiness Platform" using Lovable + Supabase. This is Stage 1 of a 4-stage build — only build what's described below. Do not add extra features, extra pages, or "nice to have" additions beyond this spec. Keep the codebase clean and minimal: use standard, well-established libraries and patterns, avoid custom-rolled solutions where a standard one exists, and avoid unnecessary abstraction layers.

## 1. Landing Page

A professional, modern SaaS-style landing page (like a senior product designer would build), with:

- Hero section: app name, one-line value proposition, short paragraph explaining what the app does (AI-powered resume/readiness analysis for students, and AI-powered job posting + candidate ranking for recruiters), and a single "Get Started" call-to-action button

- Brief "How it works" section, presented differently for the two audiences (students / recruiters)

- Clean footer

## 2. Role Selection Page

After "Get Started," show a selection screen: "I'm a Student" vs "I'm a Recruiter". This choice determines which dashboard and role gets assigned to their account on signup.

## 3. Authentication (Real, Production-Grade)

Implement real authentication using Supabase Auth with:

- Google OAuth sign-in

- Email/password sign-up and sign-in

- Proper session persistence and refresh handling

- A working, correctly configured OAuth callback route (this is critical — verify the callback route actually exists and works, this has been a recurring bug in a previous version of this app)

- On first sign-up, store the user's chosen role (student or recruiter) in a Supabase `profiles` table linked to their auth user ID

## 4. Role-Based Access Control (RBAC)

- Authenticated students can only access the student dashboard

- Authenticated recruiters can only access the recruiter dashboard

- Unauthenticated users attempting to access either dashboard are redirected to sign-in

- Set this up using Supabase Row Level Security (RLS) policies on all tables from the start, not just frontend route guards

## 5. Dashboard Shells (empty for now — no analysis features yet)

- Student dashboard: authenticated shell page with navigation, ready to receive analysis features in a later stage. Include a placeholder area where results will go.

- Recruiter dashboard: authenticated shell page with navigation, ready to receive job-posting and candidate-ranking features in a later stage. Include a placeholder area where job listings will go.

## 6. Supabase Schema (Stage 1 scope only)

Set up these tables now, since later stages depend on them:

- `profiles` (id, user_id FK to auth.users, role enum: 'student' | 'recruiter', full_name, created_at)

- Enable RLS on all tables and write policies now, not later

## Explicitly OUT OF SCOPE for this stage (do not build yet):

- Resume upload or any AI analysis

- Job posting creation or candidate ranking

- PWA/offline support

- Custom domain setup

- Any payment/tier logic

Keep the design system (colors, typography, spacing) consistent and reusable, since Stage 2 and 3 will build on top of this UI foundation.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://readient.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7db6f922-d1b0-46fa-9aa3-be1c4a00f0b1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
