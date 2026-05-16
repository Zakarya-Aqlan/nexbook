# NexBook

NexBook is a smart campus resource booking system for students. It helps students browse shared campus resources, create bookings, manage reservations, and avoid schedule conflicts through a clean responsive interface.

The app is a frontend prototype built with React, TypeScript, Vite, Tailwind CSS, React Router, and browser `localStorage`.

## Live Links

- Deployed Demo: https://nexbook-campus.vercel.app
- GitHub Repository: https://github.com/Zakarya-Aqlan/nexbook

## Problem Statement

Students need to book shared campus spaces, labs, equipment, and sports facilities. Without a clear booking system, it is easy to miss availability rules, create overlapping reservations, or lose track of active, upcoming, cancelled, and completed bookings.

## Solution

NexBook brings campus resources into one place and guides students through a date-first booking flow. Students can filter resources, check available slots, choose a duration, confirm a booking, and manage reservations from the My Bookings page. The app uses client-side validation, conflict prevention, and `localStorage` persistence to demonstrate the full booking experience without a backend.

## Key Features

- Dashboard overview with Active, Upcoming, Cancelled, and Completed booking cards
- Rotating Dashboard hero subtitle and active-today campus snapshot
- Recent Activity feed with pagination for booking, update, cancel, and completed activity
- Resources page with filters for rooms, labs, equipment, and sports facilities
- Resource cards with location, capacity, hours, description, and Book Now actions
- Date-first booking flow on the Book Resource page
- Custom date picker with past-date protection
- Custom resource selector with date-aware availability labels
- Availability slots based on resource, date, duration, current time, and existing bookings
- Duration-based booking for 1, 2, or 3 hours
- Conflict prevention for overlapping bookings on the same resource and date
- Current-day availability handling that blocks past time slots
- Same-day booking confirmation modal and same-day edit restrictions
- Student ID format with fixed `TP` prefix and 6 digits
- Book form draft persistence with `localStorage`
- Booking confirmation summary with a confirmed status display
- My Bookings page with Active, Upcoming, Cancelled, and Completed tabs
- Edit and cancel actions for eligible bookings
- Edit limit tracking with a final edit warning modal
- Completed booking calculation from booking end date and time
- Dark and light mode with saved theme preference
- Minimal footer with GitHub link and email contact modal
- Responsive layout for desktop, tablet, and mobile screens
- Vercel client-side routing support through `vercel.json`

## Business Rules

- Same-day bookings cannot be edited after submission.
- Same-day bookings can still be cancelled while they are active.
- Future bookings can be edited before the booking date while edits remain.
- Each editable booking starts with two allowed edits.
- The final available edit shows a warning before the change is saved.
- On My Bookings, future non-cancelled bookings appear in Upcoming and move to Active when the booking date becomes today.
- Dashboard statistics separate editable future bookings from active or non-editable bookings.
- Completed bookings are calculated when the booking end date and time have passed.
- Cancelled bookings stay cancelled and do not move into Completed.
- Cancelled bookings do not block future availability.
- Bookings cannot overlap for the same resource on the same date.
- Back-to-back bookings are allowed when one booking ends exactly as another begins.
- Booking slots follow each resource's opening and closing hours.
- Past dates are not bookable.
- Past time slots for today are not bookable.
- Availability is based on the selected date, resource, duration, and existing non-cancelled bookings.
- Student ID must be `TP` followed by exactly 6 digits.

The overlap rule used for conflict prevention is:

```text
newStart < existingEnd && newEnd > existingStart
```

This blocks overlapping reservations while allowing back-to-back bookings such as `10:00-11:00` and `11:00-12:00`.

## Validation Rules

- Student name is required and accepts letters and spaces only.
- Student ID is required and must be `TP` followed by 6 digits.
- The Student ID input accepts only ASCII digits after the fixed `TP` prefix.
- A booking date is required.
- Past dates are blocked.
- A resource is required after a date is selected.
- A time slot is required before submission.
- Duration must be 1, 2, or 3 hours.
- Selected times must stay within the resource opening and closing hours.
- Today's selected start time cannot be in the past.
- If no time remains today for a resource, the form shows a clear availability error.
- Overlapping bookings for the same resource and date are blocked.
- Same-day bookings require confirmation because they cannot be edited after submission.

## How To Use

1. Open the app.
2. Browse campus resources from the Resources page.
3. Click Book Now on a resource card or go directly to Book.
4. Enter the student name and Student ID.
5. Select a date.
6. Select an available resource.
7. Choose a duration and available time slot.
8. Confirm the booking.
9. Manage reservations from My Bookings.
10. Review booking activity from the Dashboard.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- localStorage
- Vercel

## LocalStorage Note

NexBook is a frontend prototype. Data is saved in the user's browser with `localStorage`, so it is stored per browser and per device.

The app uses local storage for:

- Saved bookings
- Recent activity history
- Book form draft values
- Theme preference

This demonstrates the full booking flow without a backend. Data is not shared across users, browsers, or devices, and clearing browser storage removes the saved prototype data.

## Project Structure

```text
src/
  assets/            App assets such as the NexBook logo
  components/        Reusable UI components, cards, forms, selectors, and modals
  data/              Campus resource data
  pages/             Dashboard, Resources, Book Resource, and My Bookings pages
  types/             Shared TypeScript types
  utils/             Booking, availability, storage, date, activity, and Student ID helpers
public/              Public static assets
vercel.json          Vercel rewrite configuration for client-side routing
```

## Important Files

- `src/App.tsx` defines the main app layout and routes.
- `src/pages/Dashboard.tsx` renders booking statistics, campus snapshot, and Recent Activity.
- `src/pages/Resources.tsx` renders the searchable resource browsing experience.
- `src/pages/BookResource.tsx` renders the booking page and passes route resource IDs into the form.
- `src/pages/MyBookings.tsx` manages booking tabs, editing, cancelling, and booking status groups.
- `src/components/BookingForm.tsx` handles new booking creation, draft persistence, validation, and confirmation summary.
- `src/components/ResourceCard.tsx` renders each campus resource card and Book Now action.
- `src/components/BookingCard.tsx` renders booking cards on My Bookings.
- `src/components/AvailabilitySlots.tsx` renders duration controls and available time slots.
- `src/components/ResourceSelect.tsx` renders the custom resource selector and availability labels.
- `src/components/DatePicker.tsx` renders the custom date picker.
- `src/components/Navbar.tsx` renders navigation and theme switching.
- `src/components/Footer.tsx` renders the footer and email contact modal.
- `src/data/resources.ts` contains the campus resource list.
- `src/utils/storage.ts` handles booking persistence and activity recording.
- `src/utils/activityStorage.ts` stores Recent Activity records.
- `src/utils/bookingUtils.ts` contains booking validation and conflict checks.
- `src/utils/availabilityUtils.ts` calculates slots and availability counts.
- `src/utils/studentIdUtils.ts` formats and normalizes Student IDs.

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

## Deployment

NexBook can be deployed on Vercel as a Vite React app.

The included `vercel.json` file rewrites all routes to `index.html`, which allows React Router pages such as `/resources`, `/book`, and `/my-bookings` to refresh correctly in production.

## Future Improvements

- Backend database persistence
- Student authentication
- Admin dashboard for resource management
- Approval workflow for bookings
- Email or in-app notifications
- Calendar integration
- Booking quota limits per student
- Multi-user booking synchronization
- Unit tests for booking rules and availability logic