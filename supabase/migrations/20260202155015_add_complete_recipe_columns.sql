/*
  # Add Complete Recipe Columns to meal_recommendations

  1. Changes
    - Add recipe metadata columns (title, description, meal_type, etc.)
    - Add recipe timing columns (prep_time, cook_time, servings)
    - Add classification columns (difficulty, cuisine, diet type)
    - Add nutrition per serving columns
    - Add user interaction columns (rating, times_cooked, favorite)
    - Add media and metadata columns (image_url, source, tags)
  
  2. Security
    - No RLS changes needed (existing policies apply)
  
  3. Notes
    - Uses IF NOT EXISTS to prevent errors on re-run
    - Maintains backward compatibility with existing data
    - All new columns are nullable to support old records
*/

-- Add recipe core info
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'title'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN title text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'description'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN description text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'meal_type'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN meal_type text;
  END IF;
END $$;

-- Add timing info
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'prep_time_minutes'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN prep_time_minutes integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'cook_time_minutes'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN cook_time_minutes integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'servings'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN servings integer DEFAULT 1;
  END IF;
END $$;

-- Add classification columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'difficulty_level'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN difficulty_level text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'cuisine_type'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN cuisine_type text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'diet_classification'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN diet_classification text;
  END IF;
END $$;

-- Add nutrition per serving (the critical missing column)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'calories_per_serving'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN calories_per_serving numeric;
  END IF;
END $$;

-- Add user interaction columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'user_rating'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN user_rating integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'times_cooked'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN times_cooked integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN is_favorite boolean DEFAULT false;
  END IF;
END $$;

-- Add tags as jsonb array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'tags'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN tags jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add nutritional highlights
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'nutritional_highlights'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN nutritional_highlights jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add media and source info
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'recipe_image_url'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN recipe_image_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'recipe_source'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN recipe_source text DEFAULT 'gemini-ai-generated';
  END IF;
END $$;
