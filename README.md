# NexBook

NexBook is a smart campus resource booking system built with React, TypeScript, Vite, and Tailwind CSS. It helps students browse campus resources, create bookings, manage reservations, and avoid schedule conflicts through simple client-side validation.

## Problem Statement

Students often need to book shared campus spaces and equipment such as study rooms, labs, presentation rooms, and media kits. Without a clear booking interface, it is easy to create overlapping reservations, miss availability rules, or lose track of active and cancelled bookings.

## Solution

NexBook provides a clean web app where students can view available campus resources, submit booking requests, and manage their bookings from one place. The app uses mock campus data and browser localStorage so the full booking flow can be demonstrated without a backend.

## Key Features

- Dashboard with resource and booking statistics
- Resource listing with simple type filters
- Booking form with required-field validation
- Student name, student ID, and purpose input validation
- Availability slot selection based on resource opening hours
- Conflict prevention for overlapping bookings
- My Bookings page with Active, Cancelled, and Completed filters
- Edit and cancel booking actions
- Computed completed status for past bookings
- Light and dark mode with saved theme preference
- Responsive Tailwind CSS interface

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- localStorage for demo persistence

Note: Since this is a frontend prototype, booking data is saved in the browser's localStorage. Data is stored per browser/device and is used to demonstrate the full booking flow without a backend.

## How To Use

1. Browse campus resources from the Resources page.
2. Select a resource and choose a booking date.
3. Pick a duration and an available time slot.
4. Submit the booking form.
5. Manage active, cancelled, and completed bookings from My Bookings.

## How To Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the local Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

4. Build the project:

```bash
npm run build
```

## Conflict Prevention

NexBook prevents overlapping active bookings for the same resource on the same date.

A conflict exists when:

- The existing booking has the same `resourceId`
- The existing booking has the same `date`
- The existing booking is not cancelled
- The requested time overlaps the existing booking time

The overlap rule is:

```text
newStart < existingEnd && newEnd > existingStart
```

This allows back-to-back bookings such as `10:00-11:00` and `11:00-12:00`, while blocking bookings that overlap in time.

## Project Structure

```text
src/
  components/        Reusable UI components such as Navbar, cards, forms, and availability slots
  data/              Mock campus resource data
  pages/             Main app pages for dashboard, resources, booking, and user bookings
  types/             Shared TypeScript types and interfaces
  utils/             Booking validation, date helpers, and localStorage helpers
  assets/            Static assets used by the app
```

Important files:

- `src/App.tsx` defines the main routes.
- `src/data/resources.ts` stores mock campus resources.
- `src/utils/bookingUtils.ts` contains booking validation and conflict checks.
- `src/utils/storage.ts` handles booking persistence in localStorage.
- `src/components/BookingForm.tsx` handles new booking creation.
- `src/pages/MyBookings.tsx` handles booking management.

## Future Improvements

- Add user authentication for students and administrators
- Replace localStorage with a real backend database
- Add admin approval workflows for pending bookings
- Add email or in-app booking notifications
- Add calendar view for resource availability
- Add search and advanced filters for resources
- Add unit tests for booking validation and conflict prevention

## Demo Link

Deployed demo: Add your deployed link here

GitHub Repository: Add your GitHub repository link here
