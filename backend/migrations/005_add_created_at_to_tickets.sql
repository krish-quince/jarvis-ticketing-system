-- Migration: Add created_at column to tickets table
-- This column records the exact timestamp when a ticket was first created.

-- Step 1: Add the column (nullable first so we can backfill)
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;

-- Step 2: Backfill existing rows from update_timestamp
UPDATE public.tickets
  SET created_at = update_timestamp
  WHERE created_at IS NULL;

-- Step 3: Set the default for future inserts and make NOT NULL
ALTER TABLE public.tickets
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public.tickets
  ALTER COLUMN created_at SET NOT NULL;
