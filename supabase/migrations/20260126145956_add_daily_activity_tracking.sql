/*
  # Daily Activity Tracking for Adaptive Recomp (MATADOR Protocol)

  1. New Table
    - `daily_activity`
      - `id` (bigint, primary key, auto-increment)
      - `user_id` (uuid, foreign key to profiles)
      - `date` (date, the specific day being tracked)
      - `is_training_day` (boolean, true = high day, false = low day)
      - `activity_type` (text, optional: 'swimming', 'gym', 'rest', 'cardio')
      - `notes` (text, optional user notes)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `daily_activity` table
    - Users can only read/write their own activity data
    - Unique constraint on (user_id, date) to prevent duplicates

  3. Purpose
    - Support calorie cycling (MATADOR protocol)
    - Track training days vs rest days
    - Enable adaptive nutrition target calculation
*/

CREATE TABLE IF NOT EXISTS daily_activity (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  is_training_day boolean NOT NULL DEFAULT false,
  activity_type text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity
CREATE POLICY "Users can view own daily activity"
  ON daily_activity
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own activity
CREATE POLICY "Users can insert own daily activity"
  ON daily_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own activity
CREATE POLICY "Users can update own daily activity"
  ON daily_activity
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own activity
CREATE POLICY "Users can delete own daily activity"
  ON daily_activity
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries by user and date
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON daily_activity(user_id, date DESC);