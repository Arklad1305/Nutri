/*
  # Add recipe columns to meal_recommendations table

  1. Changes
    - Add `recipe_title` column for recipe name
    - Add `recipe_description` column for recipe summary
    - Add `ingredients` array column for ingredient list
    - Add `instructions` array column for step-by-step instructions
    - Add `target_nutrients` array column for nutrients optimized by recipe

  2. Security
    - Enable RLS on meal_recommendations table
    - Add policy for users to read their own recommendations
    - Add policy for users to delete their own recommendations
    - Add policy for authenticated service to insert recommendations

  3. Notes
    - Arrays stored as TEXT[] for PostgreSQL array support
    - Recipe data comes from n8n workflow with AI generation
*/

-- Add recipe-related columns
ALTER TABLE meal_recommendations 
ADD COLUMN IF NOT EXISTS recipe_title TEXT,
ADD COLUMN IF NOT EXISTS recipe_description TEXT,
ADD COLUMN IF NOT EXISTS ingredients TEXT[],
ADD COLUMN IF NOT EXISTS instructions TEXT[],
ADD COLUMN IF NOT EXISTS target_nutrients TEXT[];

-- Enable RLS
ALTER TABLE meal_recommendations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own meal recommendations" ON meal_recommendations;
DROP POLICY IF EXISTS "Users can delete own meal recommendations" ON meal_recommendations;
DROP POLICY IF EXISTS "Service can insert meal recommendations" ON meal_recommendations;

-- Policy for SELECT (read own data)
CREATE POLICY "Users can view own meal recommendations"
  ON meal_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for DELETE (remove own data)
CREATE POLICY "Users can delete own meal recommendations"
  ON meal_recommendations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for INSERT (allow service role to insert)
CREATE POLICY "Service can insert meal recommendations"
  ON meal_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
