# MediSaathi

A comprehensive healthcare management platform connecting patients, doctors, and hospitals on one unified system. Built with Next.js, React, TypeScript, and Supabase.

## Overview

MediSaathi streamlines healthcare management by providing role-based dashboards for three user types:

- **Patients** - Manage family health records, track vitals, book appointments, and get AI health insights
- **Doctors** - Access patient histories, manage appointments, write e-prescriptions, and track practice performance
- **Hospitals** - Manage doctor rosters, track bed availability, monitor appointments, and view analytics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router + Pages Router) |
| Frontend | React 19, TypeScript 5 |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Auth | NextAuth.js v4 (Google OAuth) + Supabase Auth (email/password) |
| UI | shadcn/ui + Radix UI primitives |
| Styling | Tailwind CSS 4 |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| File Upload | React Dropzone + Supabase Storage |
| Notifications | Sonner (toast) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Cloud Console project (for OAuth)

### 1. Clone the repository

```bash
git clone https://github.com/Manav129/MediSaathi.git
cd MediSaathi
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Google OAuth (NextAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 4. Set up the database

Run the SQL schema in your Supabase SQL Editor:

```bash
# The schema file is located at:
database/schema.sql
```

This creates all required tables, indexes, RLS policies, and triggers.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
MediSaathi/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API route handlers
│   │   ├── appointments/         # Appointment CRUD
│   │   ├── doctors/              # Doctor profiles & search
│   │   ├── family-members/       # Family member management
│   │   ├── health-records/       # Health records & file uploads
│   │   ├── hospitals/            # Hospital profiles & search
│   │   ├── users/                # User auth & profile
│   │   ├── vital-signs/          # Vital signs tracking
│   │   └── profile/              # Profile management
│   ├── auth/                     # Auth pages (signin, signup, error)
│   ├── patient/                  # Patient landing + dashboard
│   ├── doctor/                   # Doctor landing + dashboard
│   ├── hospital/                 # Hospital landing + dashboard
│   ├── dashboard/                # Auth routing hub
│   ├── features/                 # Features showcase
│   ├── pricing/                  # Pricing plans
│   └── contact/                  # Contact page
├── components/
│   ├── ui/                       # 30+ shadcn/ui components
│   ├── site-header.tsx           # Navigation header
│   ├── site-footer.tsx           # Footer
│   ├── protected-route.tsx       # Auth guard wrapper
│   └── theme-provider.tsx        # Dark/light theme
├── contexts/
│   └── auth-context.tsx          # Global auth state (useAuth hook)
├── lib/
│   ├── supabase.ts               # Supabase client + DB type definitions
│   ├── api-client.ts             # Centralized HTTP client
│   ├── utils.ts                  # Utility functions
│   └── services/                 # Business logic layer
│       ├── user.service.ts
│       ├── doctor.service.ts
│       ├── hospital.service.ts
│       ├── appointment.service.ts
│       ├── health-record.service.ts
│       ├── vital-sign.service.ts
│       └── family-member.service.ts
├── database/
│   └── schema.sql                # Complete Supabase schema
├── pages/
│   └── api/auth/[...nextauth].ts # NextAuth config (Google OAuth)
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
└── public/                       # Static assets & images
```

## Features

### Patient Portal

- **Family Profiles** - Create health profiles for each family member
- **Health Records** - Upload and organize medical documents (lab reports, prescriptions, X-rays, scans)
- **Vital Signs Tracking** - Monitor blood pressure, heart rate, temperature, weight, blood sugar, oxygen saturation with trend analysis and abnormal reading alerts
- **Appointment Booking** - Search doctors by specialty, check availability, book appointments
- **AI Health Insights** - Personalized health recommendations and risk assessments
- **Health Wallet** - Track medical expenses and insurance claims
- **Smart Reminders** - Medication, appointment, and follow-up reminders
- **Emergency SOS** - Quick access to emergency contacts and critical health info

### Doctor Portal

- **Patient History Timeline** - Complete chronological patient medical history
- **AI Medical Summaries** - Auto-generated patient summaries highlighting key information
- **E-Prescription** - Digital prescriptions with drug interaction checks
- **Appointment Management** - Schedule management with status tracking (scheduled, confirmed, in-progress, completed, cancelled, no-show)
- **Lab Report Upload** - Upload and share lab reports with patients
- **Patient Analytics** - Track outcomes, treatment effectiveness, and practice metrics
- **Performance Dashboard** - Appointment stats, revenue, completion rates, patient ratings

### Hospital Admin Portal

- **Doctor Management** - Manage doctor roster across departments
- **Appointment System** - Hospital-wide appointment monitoring and management
- **Bed Management** - Track total and available beds, occupancy rates
- **Department Management** - Organize departments, OPDs, IPDs, and specialized units
- **Revenue Tracking** - Billing, payments, and financial reports
- **Analytics Dashboard** - Real-time operational insights, patient flow, departmental performance

## Database Schema

The database consists of 9 core tables:

| Table | Purpose |
|-------|---------|
| `users` | User profiles (extends Supabase auth) |
| `family_members` | Patient family member profiles |
| `doctors` | Doctor professional profiles |
| `hospitals` | Hospital profiles and resources |
| `health_records` | Medical documents and records |
| `vital_signs` | Patient vital sign readings |
| `appointments` | Appointment bookings |
| `prescriptions` | Digital prescriptions |
| `health_wallet` | Medical expense tracking |
| `ai_insights` | AI-generated health insights |

All tables use Row Level Security (RLS) for multi-tenant data isolation.

## Authentication

MediSaathi uses a dual authentication-system:

- **Google OAuth** via NextAuth.js - for social sign-in
- **Email/Password** via Supabase Auth - for direct registration

Both methods create a unified user profile in the `users` table. The `useAuth()` hook provides app-wide auth state management.

## API Endpoints

All API routes are under `/api/`:

- `POST /api/users` - Signup/Signin
- `GET/PUT /api/users` - Profile management
- `GET/POST /api/appointments` - Appointment CRUD
- `GET/POST /api/health-records` - Health records management
- `GET/POST /api/vital-signs` - Vital signs tracking
- `GET/POST /api/doctors` - Doctor profiles and search
- `GET/POST /api/hospitals` - Hospital profiles and search
- `GET/POST/PUT/DELETE /api/family-members` - Family member management

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

This project is open source.
