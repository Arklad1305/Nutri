/*
  # Create Activity Logs Table

  1. New Tables
    - `activity_logs`
      - `id` (bigint, primary key, auto-increment)
      - `user_id` (uuid, foreign key to auth.users)
      - `activity_type` (text) - Type of activity (walk, run, bike, strength, etc.)
      - `activity_name` (text) - Descriptive name (e.g., "Caminata paso lento")
      - `duration_minutes` (numeric) - Duration of the activity
      - `intensity_level` (text) - Intensity: light, moderate, vigorous
      - `calories_burned` (numeric, nullable) - Estimated calories burned
      - `notes` (text, nullable) - Optional notes
      - `logged_at` (timestamptz) - When the activity was performed
      - `created_at` (timestamptz) - When the record was created
  
  2. Security
    - Enable RLS on `activity_logs` table
    - Add policies for authenticated users to manage their own activity logs
    
  3. Important Notes
    - This table tracks physical activities to adjust nutritional targets
    - Activities affect metabolic state and calorie requirements
    - Integrates with the existing nutrition tracking system
*/

CREATE TABLE IF NOT EXISTS activity_logs (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  activity_name text NOT NULL,
  duration_minutes numeric NOT NULL DEFAULT 0,
  intensity_level text NOT NULL DEFAULT 'moderate',
  calories_burned numeric DEFAULT 0,
  notes text,
  logged_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity logs"
  ON activity_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity logs"
  ON activity_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_logged_at ON activity_logs(logged_at);