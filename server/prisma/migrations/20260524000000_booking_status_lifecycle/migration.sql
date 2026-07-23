-- Safely migrate booking statuses from pending/approved to lifecycle states.
-- Existing active-like rows become upcoming; runtime normalization updates
-- upcoming rows to active/completed based on date and time.

ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";

CREATE TYPE "BookingStatus" AS ENUM (
  'upcoming',
  'active',
  'cancelled',
  'completed'
);

ALTER TABLE "Booking" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Booking"
ALTER COLUMN "status" TYPE "BookingStatus"
USING (
  CASE "status"::text
    WHEN 'pending' THEN 'upcoming'
    WHEN 'approved' THEN 'upcoming'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'completed' THEN 'completed'
    ELSE 'upcoming'
  END
)::"BookingStatus";

ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'upcoming';

DROP TYPE "BookingStatus_old";
