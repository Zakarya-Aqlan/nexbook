# NexBook

NexBook is a frontend prototype for a smart campus resource booking system. It helps students browse campus spaces and equipment, check availability, create bookings, and manage reservations through a clean React and TypeScript interface.

The app uses mock campus resource data and browser `localStorage`, so the full booking flow can be demonstrated without a backend.

## Problem Statement

Students often need to book shared campus spaces and equipment such as study rooms, labs, presentation rooms, media kits, and sports facilities. Without a clear booking interface, it is easy to create overlapping reservations, miss availability rules, or lose track of active, cancelled, and completed bookings.

## Solution

NexBook provides a responsive web app where students can view available resources, choose a date and duration, select an available time slot, and manage bookings from one place. The app includes client-side validation and conflict prevention to keep the booking experience predictable in a demo environment.

## Key Features

- Dashboard overview with resource and booking statistics
- Campus resource listing with type filters
- Custom resource and date selectors
- Availability slots based on selected resource, date, and duration
- Booking duration selection for 1, 2, or 3 hours
- Resource availability labels for same-day bookings
- Required-field validation for booking forms
- Student name, student ID, and purpose input validation
- Conflict prevention for overlapping bookings
- Same-day booking edit restrictions
- Edit and cancel booking actions
- Two-edit limit for future bookings
- Active, Cancelled, and Completed booking filters
- Completed status calculated from booking end time
- Light and dark mode with saved theme preference
- Responsive Tailwind CSS interface
- Booking persistence with browser `localStorage`

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- localStorage for demo persistence

## How To Use

1. Browse available campus resources from the Resources page.
2. Choose a resource and booking date.
3. Select a booking duration.
4. Pick an available time slot.
5. Fill in the student name, student ID, and booking purpose.
6. Submit and confirm the booking.
7. Manage bookings from the My Bookings page.
8. Use the Active, Cancelled, and Completed filters to review booking history.

## Business Rules

- Same-day bookings cannot be edited after submission, but they can still be cancelled.
- Future bookings can be edited up to two times before the booking date.
- A booking duration must be between 1 and 3 hours.
- Bookings cannot overlap for the same resource on the same date.
- Past dates and past time slots for today are not bookable.
- Cancelled bookings do not block future availability.
- Completed bookings are calculated from the booking end date and time.
- Resources and slots follow each resource's opening and closing hours.
- If no valid slots are available for a selected duration, the user is guided to choose a shorter duration, another date, or another resource.

The overlap rule is:

```text
newStart < existingEnd && newEnd > existingStart
```

This allows back-to-back bookings such as `10:00-11:00` and `11:00-12:00`, while blocking bookings that overlap in time.

## Prototype Persistence

NexBook is a frontend prototype. Booking data is saved per browser and per device using `localStorage` under the key `nexbook-bookings`.

This means bookings remain after a page refresh in the same browser, but they are not shared across devices, users, or browsers. Clearing browser storage will remove saved demo bookings.

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
- `src/utils/availabilityUtils.ts` contains availability slot calculations.
- `src/utils/storage.ts` handles booking persistence in localStorage.
- `src/components/BookingForm.tsx` handles new booking creation.
- `src/pages/MyBookings.tsx` handles booking management.

## Future Improvements

- Replace `localStorage` with a backend database
- Add student and administrator authentication
- Add an admin approval workflow for booking requests
- Add email or in-app notifications
- Add calendar integration for availability and bookings
- Add unit tests for validation, availability, and conflict prevention

## Links

- Deployed demo: `TODO: Add deployed demo URL`
- GitHub repository: `TODO: Add GitHub repository URL`
