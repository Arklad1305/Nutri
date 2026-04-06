/*
  # Create meal_recommendations table for AI-generated recipes

  1. New Tables
    - `meal_recommendations`
      - `id` (bigint, primary key, auto-increment)
      - `user_id` (uuid, foreign key to auth.users)
      - `recipe_title` (text)
      - `recipe_description` (text)
      - `ingredients` (text array)
      - `instructions` (text array)
      - `target_nutrients` (text array) - Nutrients this recipe optimizes
      - `nutritional_info` (jsonb) - Complete nutritional breakdown
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `meal_recommendations` table
    - Policy: Users can view their own recommendations
    - Policy: Users can insert their own recommendations
    - Policy: Users can delete their own recommendations
  
  3. Indexes
    - Index on user_id for fast queries
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS meal_recommendations (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_title text NOT NULL,
  recipe_description text,
  ingredients text[] DEFAULT '{}',
  instructions text[] DEFAULT '{}',
  target_nutrients text[] DEFAULT '{}',
  nutritional_info jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal recommendations"
  ON meal_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal recommendations"
  ON meal_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal recommendations"
  ON meal_recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_meal_recommendations_user_id 
  ON meal_recommendations(user_id);

CREATE INDEX IF NOT EXISTS idx_meal_recommendations_created_at 
  ON meal_recommendations(created_at DESC);