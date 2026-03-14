# CLAUDE.md - MediSaathi Project Guide

This file provides context for AI assistants working on this codebase.

## Project Overview

MediSaathi is a healthcare management platform built with Next.js 16 (App Router), React 19, TypeScript, and Supabase. It serves three user types: patients, doctors, and hospitals/admins.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build (note: typescript.ignoreBuildErrors is true in next.config.mjs)
npm run lint     # ESLint
```

## Architecture

### Routing

- **App Router** (`app/`) - Main pages, API routes, dashboards
- **Pages Router** (`pages/api/auth/`) - NextAuth.js config only (Google OAuth)
- Both routers coexist — NextAuth requires Pages Router

### Auth System (Dual)

- **NextAuth.js** (`pages/api/auth/[...nextauth].ts`) - Google OAuth only
- **Supabase Auth** (`contexts/auth-context.tsx`) - Email/password signup/signin
- Both create users in the same `users` table
- `useAuth()` hook provides: `login`, `logout`, `signInWithGoogle`, `signInWithEmail`, `signUpWithEmail`, `updateUserType`
- Google OAuth flow stores `pendingUserType` in localStorage, resolved in `/dashboard`
- **Email/password signup** uses a server-side API route (`pages/api/auth/signup.ts`) with Supabase service role key to bypass RLS. Uses `admin.createUser({ email_confirm: true })` to auto-confirm users (no email verification needed), then the client signs in with `signInWithPassword`.

### Database

- **Supabase PostgreSQL** with Row Level Security (RLS)
- Schema defined in `database/schema.sql`
- TypeScript types defined inline in `lib/supabase.ts` (Database interface)
- Key tables: `users`, `doctors`, `hospitals`, `family_members`, `health_records`, `vital_signs`, `appointments`, `prescriptions`, `health_wallet`, `ai_insights`

### Service Layer

All business logic is in `lib/services/` as static class methods:
- `UserService` - Auth, profiles, search
- `DoctorService` - Doctor profiles, patients, stats, availability
- `HospitalService` - Hospital profiles, beds, departments, stats
- `AppointmentService` - Booking, scheduling, conflict detection
- `HealthRecordService` - Records CRUD, file upload, analytics
- `VitalSignService` - Vitals tracking, abnormal detection, reminders
- `FamilyMemberService` - Family member CRUD

Services call Supabase directly via the client in `lib/supabase.ts`.

### API Routes

All under `app/api/`. Each route handler uses the corresponding service class. Routes use query params for action dispatch (e.g., `?action=signup`, `?action=search`).

### UI Components

- `components/ui/` - 30+ shadcn/ui components (Radix UI + Tailwind)
- `components/site-header.tsx` - Auth-aware global nav (shows Dashboard/avatar/logout when logged in, Login/Get Started when logged out). Both desktop and mobile menu.
- `components/site-footer.tsx` - Global footer
- `components/protected-route.tsx` - Auth guard wrapper

## Key Patterns

### User Types

```typescript
type UserType = 'patient' | 'doctor' | 'hospital'
```

All interfaces, database schema, and code consistently use `'hospital'` (not `'admin'`).

### Dashboard Routing

`/dashboard` acts as a routing hub:
1. Checks if user is authenticated
2. Handles Google OAuth `pendingUserType` from localStorage
3. Redirects to role-specific dashboard (`/patient/dashboard`, `/doctor/dashboard`, `/hospital/dashboard`)

### File Structure Convention

- Landing pages: `app/{role}/page.tsx` (public marketing pages)
- Dashboard pages: `app/{role}/dashboard/page.tsx` (protected)
- API routes: `app/api/{resource}/route.ts`

### Styling

- Tailwind CSS 4 with CSS variables for theming
- Dark mode via `next-themes`
- Component variants via `class-variance-authority`
- Class merging via `tailwind-merge` + `clsx` (utility in `lib/utils.ts`)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY      # Supabase service role key (server-side signup API)
SUPABASE_JWT_SECRET            # Supabase JWT secret
GOOGLE_CLIENT_ID               # Google OAuth client ID
GOOGLE_CLIENT_SECRET           # Google OAuth client secret
NEXTAUTH_URL                   # App URL (http://localhost:3000)
NEXTAUTH_SECRET                # NextAuth session secret
```

## Known Issues

- `typescript.ignoreBuildErrors: true` in `next.config.mjs` — TypeScript errors are suppressed during builds

## Resolved Issues

1. **user_type mismatch** — `User` interface used `'admin'` instead of `'hospital'`. Fixed across `auth-context.tsx`, dashboard, and all related code.
2. **Duplicate API routes** — Consolidated `/api/vitals` → `/api/vital-signs`, `/api/family` → `/api/family-members`.
3. **Dashboard redirect race condition** — `/dashboard` page had timing issues with auth state. Fixed with proper loading/session checks.
4. **Dual auth collision** — NextAuth (Google) and Supabase Auth (email/password) could create conflicting user records. Fixed in `[...nextauth].ts` signIn callback to detect and merge existing auth users.
5. **Hardcoded FK constraint names** — Schema used `IF NOT EXISTS` for constraints to avoid conflicts on re-runs.
6. **getDoctorPatients() wrong table alias** — Fixed Supabase query join alias in `doctor.service.ts`.
7. **Appointments API field names** — Fixed mismatched field names between API and database (`is_urgent` column).
8. **Severity alerts wiring** — Connected severity/abnormal alerts in vital signs service.
9. **Site header not auth-aware** — `site-header.tsx` always showed Login/Signup. Fixed to show Dashboard/avatar/logout when logged in.
10. **Password visibility toggle** — Added eye/eye-off toggle to all password fields on signin and signup pages.
11. **RLS blocking email/password signup** — `signUp()` couldn't insert into `users` table because Supabase email confirmation prevented session creation (`auth.uid()` was null). Fixed by creating server-side API route (`pages/api/auth/signup.ts`) using service role key.
12. **Patient dashboard null crash** — New users with no vitals data caused `Cannot read properties of null` error. Fixed null safety in `getLatestVitalValue`/`getLatestVitalDate` and vitals fallback condition.

## Dependencies of Note

- `react-hook-form` + `zod` for form validation
- `recharts` for dashboard charts
- `react-dropzone` for file uploads to Supabase Storage
- `sonner` for toast notifications
- `date-fns` for date formatting
- `lucide-react` for icons
