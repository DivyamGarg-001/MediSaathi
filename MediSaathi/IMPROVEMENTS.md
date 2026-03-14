# MediSaathi — Improvements & Bug Fixes Log

All issues identified and resolved across development sessions.

---

## Issue 1 — `user_type` Value Mismatch

**Problem:** The `User` interface in `auth-context.tsx` used `'admin'` as a valid `user_type` value, but the database schema and all other code used `'hospital'`. This caused type errors, broken role-based redirects, and silent failures in dashboard routing.

**Fix:** Standardized all interfaces, types, conditionals, and database references to consistently use `'hospital'`. Removed all traces of `'admin'`.

**Files changed:** `contexts/auth-context.tsx`, `app/dashboard/page.tsx`, `database/schema.sql`

---

## Issue 2 — Duplicate API Routes

**Problem:** Two sets of API routes existed for the same resources:
- `/api/vitals` and `/api/vital-signs` (both handling vital signs)
- `/api/family` and `/api/family-members` (both handling family members)

This caused inconsistency — some pages called one endpoint, others called the other, leading to data not being saved or retrieved correctly.

**Fix:** Consolidated to single canonical routes: `/api/vital-signs` and `/api/family-members`. Removed the duplicate legacy routes.

**Files changed:** Removed `app/api/vitals/route.ts`, `app/api/family/route.ts`

---

## Issue 3 — Dashboard Redirect Race Condition

**Problem:** The `/dashboard` routing hub page redirected to the role-specific dashboard before the auth state had fully loaded. This caused a flash where the page would briefly redirect to `/auth/signin` (because `user` was null during loading), then redirect again once auth resolved — or fail entirely.

**Fix:** Added proper `loading` state check — the redirect logic now waits for `loading === false` before evaluating `user`. Added a spinner shown during the loading state.

**Files changed:** `app/dashboard/page.tsx`

---

## Issue 4 — NextAuth Type Augmentation

**Problem:** Suspected missing TypeScript type augmentation for NextAuth session (custom fields `userType`, `userId`, `fullName` not typed).

**Resolution:** The augmentation already existed in the project. No changes needed.

---

## Issue 5 — Dual Auth User Collision (Google + Email)

**Problem:** When a user who had previously signed up with email/password tried to sign in with Google (same email), the NextAuth `signIn` callback tried to create a new Supabase Auth user. This resulted in a "user already registered" error which caused the Google login to silently fail and return `false`.

**Fix:** In the NextAuth `signIn` callback, when `admin.createUser()` returns an "already registered" error, the code now falls back to `listUsers()` to find the existing auth user by email and link the Google login to the existing profile instead of creating a duplicate.

**Files changed:** `pages/api/auth/[...nextauth].ts`

---

## Issue 6 — Hardcoded Foreign Key Constraint Names

**Problem:** The database schema SQL used `ALTER TABLE ... ADD CONSTRAINT constraint_name ...` without `IF NOT EXISTS`. Re-running the schema (during setup or migration) threw errors like `"constraint already exists"`.

**Fix:** Added `IF NOT EXISTS` guards on constraint definitions so the schema is idempotent — safe to run multiple times.

**Files changed:** `database/schema.sql`

---

## Issue 7 — `getDoctorPatients()` Wrong Table Alias

**Problem:** The `getDoctorPatients()` method in `DoctorService` had an incorrect table alias in its Supabase query join. This caused the query to fail with a database error when trying to fetch the list of patients for a doctor's dashboard.

**Fix:** Corrected the join alias to match the actual table name used in the query.

**Files changed:** `lib/services/doctor.service.ts`

---

## Issue 8 — Appointments API Field Names + Missing `is_urgent` Column

**Problem:** The appointments API route used field names that didn't match the actual database column names (e.g., `urgent` instead of `is_urgent`). Also, the `is_urgent` column was missing from the database schema entirely, causing insert errors when booking urgent appointments.

**Fix:** Corrected all field name references in the API route. Added the `is_urgent BOOLEAN DEFAULT false` column to the `appointments` table in the schema.

**Files changed:** `app/api/appointments/route.ts`, `database/schema.sql`

---

## Issue 9 — Site Header Not Auth-Aware

**Problem:** `site-header.tsx` always rendered the same Login and Get Started buttons regardless of whether the user was logged in. Logged-in users had no way to reach their dashboard or log out from the header.

**Fix:** Connected `useAuth()` hook to the header. When logged in, the header now shows a Dashboard link, user avatar with initials, the user's full name, and a logout button. When logged out, it shows Login and Get Started. Applied to both desktop nav and mobile menu.

**Files changed:** `components/site-header.tsx`

---

## Issue 10 — No Password Visibility Toggle on Auth Pages

**Problem:** Password input fields on the sign-in and sign-up pages had no way to reveal the typed password. Users couldn't verify what they were typing, leading to signup/login failures from typos.

**Fix:** Added an eye/eye-off toggle button inside each password field. Clicking it toggles between `type="password"` and `type="text"`. Applied to:
- Sign-in page (1 field)
- Sign-up page — all 3 tabs (Patient, Doctor, Hospital) (1 field each)

**Files changed:** `app/auth/signin/page.tsx`, `app/auth/signup/page.tsx`

---

## Issue 11 — RLS Blocking Email/Password Signup

**Problem:** After `supabase.auth.signUp()`, email confirmation is enabled by default in Supabase. This means the user is not yet fully authenticated — no session is created. Without a session, `auth.uid()` is `null`, and the RLS INSERT policy on the `users` table (`WITH CHECK (auth.uid() = id)`) blocked the profile insert. The result was a `42501` RLS violation error on every email signup.

**Fix:** Created a server-side API route (`pages/api/auth/signup.ts`) that uses the Supabase service role key (which bypasses RLS entirely). It uses `supabaseAdmin.auth.admin.createUser({ email_confirm: true })` to create and immediately confirm the user, then inserts the profile. The client then calls `signInWithPassword` to establish a session.

**Files changed:** `pages/api/auth/signup.ts` (created), `contexts/auth-context.tsx`

---

## Issue 12 — Patient Dashboard Crash for New Users (Null Vitals)

**Problem:** For newly created accounts with no recorded vital signs, the `/api/vital-signs?action=latest-readings` endpoint returns an array of 7 objects (one per vital type) where each object has `data: null`. The patient dashboard checked `.length > 0` as the condition to use API data vs dummy data — this was always `true` (7 items regardless), so it tried to render from the API data. Then `getLatestVitalValue()` accessed `vital.data.value` where `vital.data` was `null`, causing a `TypeError: Cannot read properties of null (reading 'value')` crash.

**Fix:** Two changes in `app/patient/dashboard/page.tsx`:
1. Changed fallback condition from `.length > 0` to `.some((v: any) => v.data)` — only use API data if at least one vital has an actual reading.
2. Changed accessor functions to use optional chaining: `vital?.data ?` instead of `vital ?`.

**Files changed:** `app/patient/dashboard/page.tsx`

---

## Issue 13 — RLS Blocking All API Route Write Operations

**Problem:** All App Router API routes (`app/api/*/route.ts`) used the Supabase anon client imported from `lib/supabase.ts`. Server-side API routes run without a browser session, so `auth.uid()` is always `null`. RLS policies block all INSERT, UPDATE, and DELETE operations when `auth.uid()` is null. This affected every write operation across the entire app: adding family members, recording vitals, uploading health records, booking appointments, creating doctor/hospital profiles, etc.

**Additionally**, the `profile/route.ts` had its own inline `supabaseAdmin` client but was incorrectly using `SUPABASE_JWT_SECRET` as the API key — JWT secret is not an API key and does not bypass RLS.

**Fix:**
1. Added `supabaseAdmin` export to `lib/supabase.ts` using `SUPABASE_SERVICE_ROLE_KEY` with `autoRefreshToken: false, persistSession: false`.
2. Changed all service files and API route files to import `supabaseAdmin as supabase` — a one-line change per file that makes all DB operations in server routes bypass RLS.
3. Fixed `profile/route.ts` to import `supabaseAdmin` from `lib/supabase` instead of its broken inline client.

**Files changed:**
- `lib/supabase.ts`
- `lib/services/vital-sign.service.ts`
- `lib/services/family-member.service.ts`
- `lib/services/appointment.service.ts`
- `lib/services/health-record.service.ts`
- `lib/services/doctor.service.ts`
- `lib/services/hospital.service.ts`
- `lib/services/user.service.ts`
- `app/api/family-members/route.ts`
- `app/api/health-records/route.ts`
- `app/api/appointments/route.ts`
- `app/api/users/route.ts`
- `app/api/doctors/patients/route.ts`
- `app/api/profile/route.ts`

---

## Issue 14 — `supabaseKey is required` Runtime Error on Client

**Problem:** After adding `supabaseAdmin` to `lib/supabase.ts`, the client bundle crashed with `"supabaseKey is required"`. The reason: `SUPABASE_SERVICE_ROLE_KEY` is a server-only environment variable (no `NEXT_PUBLIC_` prefix). When `lib/supabase.ts` is bundled for the browser (because `auth-context.tsx` imports `supabase` from it), `process.env.SUPABASE_SERVICE_ROLE_KEY` is `undefined`, and `createClient(url, undefined)` throws immediately.

**Fix:** Changed `supabaseAdmin` creation to use `SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey` as a fallback. On the server, the real service role key is used (bypasses RLS). On the client bundle, it falls back to the anon key — no crash — and the admin client is never actually invoked from the client anyway.

**Files changed:** `lib/supabase.ts`

---

## Issue 15 — Google OAuth Not Redirecting to Dashboard

**Problem:** After successful Google sign-in (user record confirmed created in Supabase), users were redirected back to the login page instead of their dashboard.

**Root cause:** `auth-context.tsx` called `fetchUserData(email)` when a NextAuth session was detected. `fetchUserData` queries `supabase.from('users').select()` using the anon client. For Google OAuth users, there is no Supabase Auth session in the browser — only a NextAuth JWT session. Without a Supabase session, `auth.uid()` is null, RLS SELECT policy returns no rows, `userData` is null, and `setUser(null)` is called. With `user === null`, the dashboard page immediately redirected to `/auth/signin`.

**Additionally**, `updateUserType()` used the same anon Supabase client for updates — also blocked by RLS for Google users.

**Fix 1 — `auth-context.tsx` session useEffect:** When a NextAuth session is available with enriched data (`userId` + `userType`, populated server-side by the NextAuth `session` callback using `supabaseAdmin`), use that data directly to set the user state instead of re-querying Supabase from the client.

**Fix 2 — `updateUserType`:** Changed to call the `/api/profile` PUT endpoint (which uses `supabaseAdmin` server-side and validates via `getServerSession`) instead of using the anon Supabase client directly.

**Files changed:** `contexts/auth-context.tsx`

---

## Issue 16 — React Hydration Mismatch in Site Header

**Problem:** Next.js pre-renders pages on the server. During SSR, `user` is always `null` (no auth state on the server), so the header renders Login/Get Started. After the client loads, the NextAuth session resolves and `user` becomes set — the header switches to Dashboard/Avatar/Logout. React detects that the server-rendered HTML and the client-rendered HTML don't match and throws a hydration mismatch warning. This can cause visual glitches and unpredictable UI state.

**Fix:** Added a `mounted` state (initialized to `false`) with a `useEffect(() => setMounted(true), [])`. Auth-dependent sections use `mounted && user` as the condition. Both server and initial client render consistently show the logged-out state (since `mounted` is `false`). After hydration completes, `mounted` flips to `true` and the correct auth state is rendered cleanly without any mismatch.

**Files changed:** `components/site-header.tsx`

---

## Summary Table

| # | Issue | Category | Files |
|---|-------|----------|-------|
| 1 | `user_type` value mismatch (`'admin'` vs `'hospital'`) | Data/Type | auth-context, dashboard, schema |
| 2 | Duplicate API routes | Architecture | Deleted legacy routes |
| 3 | Dashboard redirect race condition | Auth/UX | dashboard/page.tsx |
| 4 | NextAuth type augmentation | TypeScript | Already existed |
| 5 | Dual auth user collision (Google + email) | Auth | [...nextauth].ts |
| 6 | Hardcoded FK constraint names | Database | schema.sql |
| 7 | `getDoctorPatients()` wrong table alias | Database | doctor.service.ts |
| 8 | Appointments API field names + `is_urgent` column | API/DB | appointments route, schema |
| 9 | Site header not auth-aware | UX | site-header.tsx |
| 10 | No password visibility toggle | UX | signin/page, signup/page |
| 11 | RLS blocking email signup | Auth/Security | signup API route, auth-context |
| 12 | Patient dashboard crash on null vitals | Frontend | patient/dashboard/page.tsx |
| 13 | RLS blocking all API route writes (anon client) | Security/API | 14 service + route files |
| 14 | `supabaseKey is required` on client bundle | Runtime | lib/supabase.ts |
| 15 | Google OAuth not redirecting to dashboard | Auth | auth-context.tsx |
| 16 | React hydration mismatch in site header | SSR/Frontend | site-header.tsx |
