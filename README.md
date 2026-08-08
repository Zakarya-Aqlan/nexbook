# NexBook

NexBook is a full-stack smart campus resource booking system. Students can browse campus resources, check availability, create and manage bookings, and review booking activity through a responsive web interface.

## Live Application

- Frontend: https://nexbook-campus.vercel.app
- Backend API: https://nexbook-api.vercel.app
- API health check: https://nexbook-api.vercel.app/api/health
- GitHub repository: https://github.com/Zakarya-Aqlan/nexbook

## Overview

Shared campus rooms, labs, equipment, and sports facilities need clear availability rules and reliable reservation records. NexBook provides a date-first booking workflow, validates resource hours and booking details, prevents overlapping reservations, and keeps booking lifecycle and activity data in a central PostgreSQL database.

## Architecture

NexBook uses a separately deployed frontend and backend:

- **Frontend:** React, TypeScript, and Vite
- **Backend:** Express and TypeScript
- **ORM:** Prisma
- **Database:** Supabase PostgreSQL
- **Hosting:** Separate Vercel projects for the frontend and backend
- **Browser fallback:** `localStorage` mirrors bookings and activity and supports limited local-only fallback behavior

```text
Frontend (Vercel)
      |
      | HTTPS REST API
      v
Express Backend (Vercel)
      |
      | Prisma
      v
Supabase PostgreSQL
```

Supabase PostgreSQL is the authoritative online data store. Browser storage is not the primary database.

## Key Features

- Dashboard statistics for Active, Upcoming, Cancelled, and Completed bookings
- Persistent Recent Activity for booked, updated, cancelled, and completed events
- Resource browsing and category filtering
- Backend resource loading with local sample-data fallback
- Date-aware resource availability and duration-based time slots
- Backend API booking creation, editing, and cancellation
- PostgreSQL persistence for bookings and booking activity
- Browser booking and activity mirrors with fallback notices
- Idempotent import of legacy local activity
- Overlap prevention with back-to-back booking support
- Resource opening-hours and same-day time validation
- One-, two-, and three-hour booking durations
- Two-edit limit for eligible future bookings
- Same-day edit restrictions and final-edit confirmation
- Cancellation for active bookings and protection for completed bookings
- Booking lifecycle calculations in `Asia/Kuala_Lumpur`
- Responsive desktop, tablet, and mobile layouts
- Saved light and dark theme preference
- Separate Vercel frontend and Express backend deployments

## Booking Lifecycle

Booking lifecycle calculations use the campus timezone `Asia/Kuala_Lumpur`.

- **upcoming:** Before the booking start date and time.
- **active:** From the start time until immediately before the end time.
- **completed:** At or after the booking end date and time.
- **cancelled:** An authoritative terminal state that takes priority over time-based lifecycle calculations.

Future bookings begin with two available edits. Same-day bookings begin with zero edits and cannot be edited after submission. Completed bookings cannot be edited or cancelled, while active bookings may still be cancelled. Cancelled and completed bookings do not block future availability.

## Business Rules

- Student name is required and accepts letters and spaces.
- Student ID must be `TP` followed by exactly six digits.
- Booking dates must be today or later.
- Today's start time cannot be in the past.
- A booking must use a valid resource and remain within its opening hours.
- Duration must be 60, 120, or 180 minutes.
- Same-day bookings cannot be edited after submission.
- Eligible future bookings have at most two edits.
- Cancelled and completed bookings cannot be edited.
- Completed bookings cannot be cancelled.
- Active and upcoming bookings may be cancelled.
- An edited booking is excluded from its own conflict check.
- Only upcoming and active bookings block availability.

The overlap rule is:

```text
newStart < existingEnd && newEnd > existingStart
```

This rejects overlapping reservations for the same resource and date. Back-to-back bookings remain valid because a booking ending at `11:00` does not overlap one beginning at `11:00`.

## Persistent Activity

NexBook stores four activity event types in PostgreSQL:

- `booked`
- `updated`
- `cancelled`
- `completed`

Each activity is an immutable snapshot of the booking at the time of the event. For example, if a booking is created for `18:00-19:00` and later changed to `17:00-18:00`, the Booked activity retains `18:00-19:00`, while the Updated activity records `17:00-18:00`.

Database-backed activity can be loaded in another browser because it is stored centrally. Local activity remains available as a browser mirror, and legacy local activity can be imported to the backend in bounded batches. Database uniqueness rules and frontend deduplication make repeated imports idempotent and prevent duplicate activity records.

## Offline and localStorage Behavior

Supabase PostgreSQL is the authoritative persistence layer when the backend is available. The browser uses `localStorage` for:

- Cached and mirrored bookings
- Cached and mirrored activity
- Local-only booking fallback records
- Booking source metadata
- Booking form drafts
- Theme preference

When backend requests fail, cached data can remain visible and the interface displays a fallback notice. Local-only fallback bookings can still use the local edit and cancel flow. Offline-created data is not guaranteed to synchronize automatically to the backend later, so local fallback should not be treated as universal cross-device persistence.

## API

The public REST API is hosted at `https://nexbook-api.vercel.app`.

### Health

- `GET /api/health`

### Resources

- `GET /api/resources`
- `GET /api/resources/:id`

### Bookings

- `GET /api/bookings`
- `POST /api/bookings`
- `PUT /api/bookings/:id`
- `PATCH /api/bookings/:id/cancel`

Successful booking create, update, and cancellation responses can include the persistent activity snapshot produced by that mutation.

### Activities

- `GET /api/activities`
- `POST /api/activities/import`

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

### Backend

- Node.js
- Express
- TypeScript
- Prisma 6.19.3

### Database

- PostgreSQL
- Supabase

### Deployment

- Vercel frontend
- Native Vercel Express backend

### Browser Persistence

- `localStorage` mirror and fallback

## Project Structure

```text
nexbook/
|-- src/
|   |-- assets/
|   |-- components/
|   |-- data/
|   |-- pages/
|   |-- services/
|   |-- types/
|   `-- utils/
|-- server/
|   |-- prisma/
|   |   |-- migrations/
|   |   |-- schema.prisma
|   |   `-- seed.ts
|   `-- src/
|       |-- controllers/
|       |-- lib/
|       |-- middleware/
|       |-- routes/
|       |-- services/
|       |-- utils/
|       |-- app.ts
|       `-- index.ts
|-- public/
|-- .env.example
|-- package.json
`-- vercel.json
```

## Important Files

### Frontend

- `src/services/apiConfig.ts` builds API URLs and provides the local development fallback.
- `src/services/bookingApi.ts` loads, validates, maps, mirrors, and merges backend bookings.
- `src/services/activityApi.ts` loads backend activity and imports eligible legacy local activity.
- `src/pages/Dashboard.tsx` renders lifecycle statistics and persistent Recent Activity.
- `src/pages/MyBookings.tsx` handles booking groups and backend/local edit and cancel flows.
- `src/components/BookingForm.tsx` validates and submits new bookings and manages form drafts.
- `src/utils/dateUtils.ts` provides browser-side campus lifecycle calculations.

### Backend

- `server/src/app.ts` configures Express middleware, CORS, routes, and error handling.
- `server/src/index.ts` starts the traditional Node server and handles graceful shutdown.
- `server/src/lib/prisma.ts` exports the shared Prisma client.
- `server/src/services/bookingService.ts` applies booking validation, conflicts, lifecycle rules, and transactions.
- `server/src/services/activityService.ts` persists, deduplicates, imports, and loads activity snapshots.
- `server/src/utils/campusTime.ts` provides server-side `Asia/Kuala_Lumpur` lifecycle calculations.
- `server/prisma/schema.prisma` defines Resource, Booking, and Activity persistence.

## Local Development

### Prerequisite

Use Node.js 24, matching the backend `engines` declaration.

### Frontend

From the repository root:

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default. During Vite development, API requests fall back to `http://localhost:4000` when `VITE_API_BASE_URL` is not configured. To set a different backend, create a local environment file from `.env.example` and provide `VITE_API_BASE_URL`.

### Backend

From a second terminal:

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env`, then configure:

- Required: `DATABASE_URL`, `DIRECT_URL`
- Optional/local: `PORT`, `NODE_ENV`, `CORS_ALLOWED_ORIGINS`

Do not commit real database credentials.

Start the backend:

```bash
npm run dev
```

The local API runs at `http://localhost:4000` by default.

## Build and Validation

Build the frontend from the repository root:

```bash
npm run build
```

Generate Prisma Client and build the backend:

```bash
cd server
npm run prisma:generate
npm run build
```

Apply pending production migrations only as a deliberate release operation:

```bash
npm run prisma:migrate:deploy
```

`prisma:migrate:deploy` applies existing pending migrations. It is not part of `npm start` and should not run automatically every time the backend starts.

## Deployment

### Frontend Vercel Project

- Repository root: repository root
- Framework: Vite
- Production environment variable:
  - `VITE_API_BASE_URL=https://nexbook-api.vercel.app`

The root `vercel.json` sends client-side routes to `index.html` so React Router pages can be refreshed directly.

### Backend Vercel Project

- Repository: the same Git repository
- Root Directory: `server`
- Runtime: native Vercel Express deployment
- Required environment variables:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `NODE_ENV`
  - `CORS_ALLOWED_ORIGINS`

`CORS_ALLOWED_ORIGINS` includes the production frontend origin `https://nexbook-campus.vercel.app`. Vercel manages the request execution environment, so `PORT` normally does not need to be configured for the deployed backend.

The production database is Supabase PostgreSQL. Prisma migrations are managed as a separate, controlled release step and are not run automatically when the backend starts.

## Environment Variables

| Scope | Variable | Required | Secret | Purpose / public production value |
| --- | --- | --- | --- | --- |
| Frontend | `VITE_API_BASE_URL` | Production | No | `https://nexbook-api.vercel.app` |
| Backend | `DATABASE_URL` | Yes | Yes | Pooled PostgreSQL connection used by the running API |
| Backend | `DIRECT_URL` | Yes | Yes | Direct PostgreSQL connection used for controlled Prisma operations |
| Backend | `PORT` | Local/host-dependent | No | Local server port; defaults to `4000` |
| Backend | `NODE_ENV` | Production | No | Use `production` for the deployed backend |
| Backend | `CORS_ALLOWED_ORIGINS` | Production | No | `https://nexbook-campus.vercel.app` |

Secret values belong in local ignored environment files or hosting-provider settings. They must never be committed to the repository.

## Known Limitations

- Authentication is not implemented.
- Student-specific or user-specific data isolation is not implemented.
- Backend booking and activity records are shared demo data visible through the public API.
- The legacy activity import endpoint is not authenticated.
- Local development and deployed demo workflows may use the same Supabase database when configured with the same connection settings.
- Booking GET requests normalize lifecycle statuses and may persist transitions such as upcoming to active or completed.
- Automated unit and integration test files are not currently included in the repository.
- Local fallback data is browser-specific and is not guaranteed to synchronize automatically after connectivity returns.

These limitations reflect the current project scope and should be addressed before treating NexBook as a secure multi-user campus service.

## Future Improvements

- Student authentication
- User-specific booking and activity isolation
- Role-based authorization
- Admin dashboard for resource management
- Booking approval workflow
- Email or in-app notifications
- Calendar integration
- Booking quota limits per student
- Automated unit and integration tests
- Separate development and production database environments
- Monitoring, observability, and rate limiting

## Status

The current version provides a deployed full-stack booking workflow with PostgreSQL persistence, booking lifecycle management, persistent activity history, and browser fallback support. Authentication, user isolation, and administrative workflows remain planned improvements.
