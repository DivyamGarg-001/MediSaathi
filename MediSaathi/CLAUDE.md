# CLAUDE.md - MediSaathi Project Guide

This file provides context for AI assistants working on this codebase.

## Project Overview

MediSaathi is a healthcare management platform built with Next.js 16 (App Router), React 19, TypeScript, and Supabase. It serves three user types: patients, doctors, and hospitals.

## Commands

```bash
npm run dev      # Start Next.js dev server (http://localhost:3000)
npm run build    # Production build (note: typescript.ignoreBuildErrors is true in next.config.mjs)
npm run lint     # ESLint

# AI Backend (FastAPI)
cd MediSaathi && fastapi_backend/venv/Scripts/activate   # Activate venv (Windows)
python -m fastapi_backend.main                            # Start FastAPI on port 8000
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
- **Email/password signup** uses a server-side API route (`pages/api/auth/signup.ts`) with Supabase service role key to bypass RLS. Flow: validate role-specific fields → `admin.createUser({ email_confirm: true })` → insert `users` row → insert role-specific row (`doctors` or `hospitals`) → client calls `signInWithPassword`. Rolls back all rows on failure.
- **Signup validation**: `license_number` required for doctor/hospital, `specialty` required for doctors, `address` required for hospitals.
- `SignUpData` in auth-context includes: email, password, full_name, user_type, phone, specialty, license_number, address, website.

### Database

- **Supabase PostgreSQL** with Row Level Security (RLS)
- Schema defined in `database/schema.sql`
- TypeScript types defined inline in `lib/supabase.ts` (Database interface)
- Key tables: `users`, `doctors`, `hospitals`, `family_members`, `health_records`, `vital_signs`, `appointments`, `prescriptions`, `health_wallet`, `ai_insights`, `notifications`
- `appointments.actual_start_time` / `actual_end_time` — TIMESTAMP columns for consultation time tracking
- `doctors.id` (auto-generated UUID) is different from `users.id`. Doctor pages must resolve via `DoctorService.getDoctorByUserId(user.id)` to get the actual `doctors.id` used in FK references.
- `prescriptions.medications` — JSONB array of `{name, dosage, frequency, ...}` (NOT flat columns)
- `health_wallet.transaction_type` / `date_occurred` (NOT `type` / `transaction_date`)
- `health_records` — has `content`, `ai_summary`, `is_critical` (NO `description` column)
- `ai_insights.insight_type` (NOT `type`), `action_required` is BOOLEAN (NOT text), `family_member_id` (nullable FK)
- `vital_signs` and `ai_insights` both have `family_member_id` FK — allows per-family-member data
- `appointments.family_member_id` UUID FK → `family_members(id)` ON DELETE SET NULL (nullable; NULL = self, populated = booking for a family member)
- `appointments.status`: scheduled/confirmed/in_progress/completed/cancelled/no_show
- `notifications`: user_id, type (appointment_cancelled/rescheduled/booked/prescription_created/general), title, message, related_appointment_id, is_read

### Service Layer

All business logic is in `lib/services/` as static class methods:
- `UserService` - Auth, profiles, search
- `DoctorService` - Doctor profiles, patients, stats, availability, patient timeline, analytics
- `HospitalService` - Hospital profiles, beds, departments, stats, doctor management (add/delete/schedule), report generation, system settings
- `AppointmentService` - Booking, scheduling, conflict detection, time tracking (start/end consultation)
- `HealthRecordService` - Records CRUD, file upload, analytics
- `VitalSignService` - Vitals tracking, abnormal detection, reminders
- `FamilyMemberService` - Family member CRUD
- `PrescriptionService` - Prescription CRUD, active/expired filtering, stats, search
- `HealthWalletService` - Medical expense tracking, transactions, wallet summary
- `ReminderService` - Auto-generated medication/checkup/trend reminders
- `PracticeInsightService` - Doctor KPIs, schedule utilization, recommendations
- `NotificationService` - createNotification, getUserNotifications, getUnreadCount, markAsRead, markAllAsRead

Services call Supabase directly via the admin client in `lib/supabase.ts` (bypasses RLS).

`app/api/profile/route.ts` contains helpers `ensureDoctorProfile` and `ensureHospitalProfile` that create the role-specific row if missing for a given userId (used as a safety net after OAuth signup).

### API Routes

All under `app/api/`. Each route handler uses the corresponding service class. Routes use query params for action dispatch (e.g., `?action=signup`, `?action=search`).

- `/api/appointments` — book, update, cancel, reschedule, get upcoming/by-doctor/by-hospital, time-tracking, start-consultation, end-consultation
- `/api/notifications` — GET (list, unread-count), PUT (mark-read, mark-all-read)
- `/api/doctors` — CRUD, search, stats, availability, specialties, patient-timeline, analytics
- `/api/doctors/insights` — practice insights (KPIs, utilization, recommendations)
- `/api/hospitals` — CRUD, search, stats, bed update, emergency hospitals, departments, settings, report, add-doctor, update-doctor-schedule, update-settings, delete-doctor
- `/api/health-records` — CRUD, analytics
- `/api/vital-signs` — CRUD, latest readings, analytics, reminders
- `/api/family-members` — CRUD, health-data (vitals + appointments + AI insights for a specific member)
- `/api/prescriptions` — CRUD, active/expired, stats, search
- `/api/health-wallet` — transactions CRUD, summary
- `/api/reminders` — get, generate-all, stats, create, dismiss
- `/api/ai/[...path]` — catch-all proxy to FastAPI backend

### AI Backend (FastAPI — `fastapi_backend/`)

Python microservice for AI-powered features. Uses Groq API (llama-3.1-8b-instant).

- **Architecture**: Next.js `/api/ai/[...path]` proxies to FastAPI at `localhost:8000`
- **Phase 1** (complete): Patient AI Health Insights — structured data aggregation → LLM → parsed insights → stored in `ai_insights` table
- **Phase 3** (complete): Doctor AI Practice Insights (via FastAPI + Groq)
- **Phase 5** (complete): Hospital AI Analytics (bed utilization, dept performance, doctor workload, appointment efficiency, revenue)
- **Family member AI insights**: `POST /insights/family/generate` + `GET /insights/family` — same pipeline filtered by family_member_id
- **Key services**: `insight_service.py` (patient pipeline), `doctor_insight_service.py` (doctor pipeline), `hospital_insight_service.py` (hospital pipeline), `data_aggregator.py` (Supabase queries), `llm_client.py` (Groq wrapper)
- **Key models**: `models/common.py`, `models/patient.py`, `models/doctor.py`, `models/hospital.py`
- **DB mapping**: `recommendation` appended to `description` as `\n\nRecommendation: ...`, `action_required` = BOOLEAN (true for high/critical)
- **Caching**: insights re-served if <1hr old
- **Future phases**: (2) Patient RAG chatbot, (4) Doctor scheduling, (6) Hospital reports

### Pages (23 total)

**Public:**
- `/` Landing, `/features`, `/pricing`, `/contact`
- `/auth/signin`, `/auth/signup`, `/auth/error`
- `/patient`, `/doctor`, `/hospital` — marketing/landing pages

**Patient (protected):**
- `/patient/dashboard` — Overview with vitals, appointments, quick actions; real wallet summary (expenses + transaction count)
- `/patient/prescriptions` — View, search, filter prescriptions (active/expired)
- `/patient/wallet` — Health wallet: expenses, income, claims, category breakdown, monthly trends
- `/patient/reminders` — Smart reminders: medication, checkup, health trend alerts

**Doctor (protected):**
- `/doctor/dashboard` — Schedule, patient management, e-prescription, real-time performance stats
- `/doctor/patients/[patientId]` — Patient history timeline (appointments, prescriptions, records, vitals)
- `/doctor/analytics` — Practice analytics (appointment breakdown, revenue trends, demographics)
- `/doctor/insights` — Practice insights (KPIs, schedule utilization, peak hours, recommendations)
- `/doctor/time-tracking` — Live consultation timer, session logs, duration analytics

**Hospital (protected):**
- `/hospital/dashboard` — Expanded hospital management: doctor management (add/remove/schedule), report generation, system settings

**Utility:**
- `/dashboard` — Auth check + role-based redirect hub

### UI Components

- `components/ui/` - 60+ shadcn/ui components (Radix UI + Tailwind)
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
- Feature pages: `app/{role}/{feature}/page.tsx` (protected)
- API routes: `app/api/{resource}/route.ts`
- Services: `lib/services/{resource}.service.ts`

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
GROQ_API_KEY                   # Groq API key (for AI backend)
FASTAPI_URL                    # FastAPI URL (optional, defaults to http://localhost:8000)
```

## Known Issues

- `typescript.ignoreBuildErrors: true` in `next.config.mjs` — TypeScript errors are suppressed during builds
- `/debug/oauth` page causes prerender error during build (not part of main app)

## Dependencies of Note

- `react-hook-form` + `zod` for form validation
- `recharts` for dashboard charts
- `react-dropzone` for file uploads to Supabase Storage
- `sonner` for toast notifications
- `date-fns` for date formatting
- `lucide-react` for icons

### Python (fastapi_backend)
- `fastapi` + `uvicorn` — API framework
- `supabase` — Python Supabase client (service role key, bypasses RLS)
- `groq` — Groq API client (LLM)
- `pydantic` — data models
- `python-dotenv` — env loading
