# Bethesda CBT

A computer-based testing (CBT) platform for ` Bethesda Home and School for the Blind ` — built for administrators to create and manage exams, question banks, and student records, and for students to sit exams online with offline resilience built in.

**Live demo:** [bethesda-cbt-app-ochre.vercel.app](https://bethesda-cbt-app-ochre.vercel.app)

## Overview

Bethesda CBT has two portals, each with its own authentication and route protection:

- **Admin portal** (`/admin`) — manage exams, question banks, student records, and view results.
- **Student portal** (`/student`) — log in with an admission number, take assigned exams, and view results.

Access to each portal is enforced by role-based middleware, so a student session can't reach admin routes and vice versa.

## Features

### Admin

- Secure admin login and password recovery
- Dashboard with summary stats and recent activity
- Exam management: create, edit, schedule, and configure scoring/behavior for exams
- Question bank: create questions individually, filter/search, or bulk-import via CSV
- Student management: create students individually or bulk-import via CSV, with pagination and filtering
- Results: view results by class and subject, with score bars, performance badges, and export to Excel/PDF
- Subject management

### Student

- Login with admission number and password
- View assigned/available exams
- Take exams with a live timer, objective and theory question types, and a submit confirmation dialog
- **Offline-resilient exam taking** — exam progress is persisted to IndexedDB (via `idb`) and synced back to the server, so a dropped connection mid-exam doesn't lose answers
- View results after submission

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, Lucide icons |
| Database | MongoDB with Mongoose |
| Auth | NextAuth (credentials-based, JWT sessions), bcryptjs |
| Offline storage | `idb` (IndexedDB wrapper) |
| Data import/export | `csv-parse` (bulk import), `exceljs` and `jspdf` / `jspdf-autotable` (result export) |

## Project Structure

```
app/
  admin/              Admin-facing pages (auth, dashboard, exams, questions, results, students)
  student/             Student-facing pages (login, exams, exam-taking)
  api/
    admin/             Admin REST endpoints (exams, questions, results, students, subjects, dashboard)
    student/           Student REST endpoints (exams, start/submit/sync, results)
    auth/[...nextauth] NextAuth route
components/            UI components, grouped by admin / student / questions / auth / shared ui
config/                Shared option lists and formatting helpers for exams
hooks/                 Data-fetching and state hooks (useExams, useStudents, useExamTaking, etc.)
lib/
  models/              Mongoose schemas (admin, student, exam, question, subject, submission)
  offline/             IndexedDB exam-taking store
  auth.ts              NextAuth configuration
  db.ts                MongoDB connection helper
types/                 Shared TypeScript types
proxy.ts               Route-protection middleware (admin/student session + redirect rules)
testing_API/           .http file for manually testing API routes
```

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB database (local or hosted, e.g. MongoDB Atlas)

### Installation

```bash
git clone https://github.com/Rengkat/bethesda-cbt.git
cd bethesda-cbt
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# MongoDB connection string
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_SECRET=a_long_random_secret
NEXTAUTH_URL=http://localhost:3000

# One-time secret used to bootstrap the very first admin account
# (only required until an admin exists — see "First-time Setup" below)
ADMIN_SETUP_SECRET=choose_a_temporary_secret
```

### First-time Setup

The `/api/admin/register` endpoint has two modes:

1. **Bootstrap mode** — when no admin exists yet, it accepts a request containing `setupSecret` matching `ADMIN_SETUP_SECRET` to create the first admin account, since there's no session to authenticate against.
2. **Normal mode** — once at least one admin exists, this endpoint requires an authenticated admin session, and `setupSecret` is ignored.

Use this endpoint once to create your first admin, then log in at `/admin/login`.

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Other scripts

```bash
npm run build   # Production build
npm run start   # Start the production server
npm run lint    # Run ESLint
```

## API Testing

A `testing_API/bethesda-cbt.http` file is included with sample requests for exercising the API routes directly (compatible with the REST Client extension in VS Code or similar HTTP client tools).

## Deployment

The app is deployed on [Vercel](https://vercel.com). To deploy your own instance, connect the repository to Vercel and configure the environment variables listed above in the project settings.

## License

No license has been specified for this project yet. Contact the repository owner for usage terms.
