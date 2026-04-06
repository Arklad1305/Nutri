/*
  # Add RLS policies for food_logs table

  1. Security
    - Enable RLS on food_logs table
    - Add policy for users to read their own food logs
    - Add policy for users to insert their own food logs
    - Add policy for users to update their own food logs
    - Add policy for users to delete their own food logs

  2. Important Notes
    - Users can ONLY access their own data (user_id must match auth.uid())
    - All operations require authentication
*/

-- Ensure RLS is enabled
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own food logs" ON food_logs;
DROP POLICY IF EXISTS "Users can insert own food logs" ON food_logs;
DROP POLICY IF EXISTS "Users can update own food logs" ON food_logs;
DROP POLICY IF EXISTS "Users can delete own food logs" ON food_logs;

-- Policy for SELECT (read own data)
CREATE POLICY "Users can view own food logs"
  ON food_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for INSERT (create own data)
CREATE POLICY "Users can insert own food logs"
  ON food_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (modify own data)
CREATE POLICY "Users can update own food logs"
  ON food_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (remove own data)
CREATE POLICY "Users can delete own food logs"
  ON food_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
