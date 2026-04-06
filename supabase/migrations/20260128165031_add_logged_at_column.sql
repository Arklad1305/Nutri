/*
  # Add logged_at column to food_logs

  1. Changes
    - Add `logged_at` column to track when food was actually consumed
    - Default to NOW() for new records
    - Copy existing created_at values to logged_at for historical data

  2. Notes
    - logged_at can be different from created_at (e.g., user logs a meal from yesterday)
    - created_at = when record was created in database
    - logged_at = when food was actually consumed
*/

-- Add logged_at column with default
ALTER TABLE food_logs 
ADD COLUMN IF NOT EXISTS logged_at timestamptz DEFAULT now();

-- Copy existing created_at values to logged_at for historical records
UPDATE food_logs 
SET logged_at = created_at 
WHERE logged_at IS NULL;

-- Make logged_at NOT NULL after populating
ALTER TABLE food_logs 
ALTER COLUMN logged_at SET NOT NULL;
