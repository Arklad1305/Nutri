/*
  # Fix ingredients and instructions columns to JSONB

  1. Changes
    - Convert `ingredients` column from text[] to jsonb
    - Convert `instructions` column from text[] to jsonb
    - Preserve existing data by converting text[] to proper jsonb arrays

  2. Purpose
    - Allow storing structured ingredient and instruction objects
    - Fix issue where objects were being stored as JSON strings
    - Enable proper querying and manipulation of recipe data

  3. Notes
    - Uses safe conversion that preserves existing data
    - Handles both old text array data and new object data
*/

-- Convert ingredients from text[] to jsonb
DO $$
BEGIN
  -- First, add a temporary column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'ingredients_new'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN ingredients_new jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Copy and convert existing data
  UPDATE meal_recommendations
  SET ingredients_new =
    CASE
      WHEN ingredients IS NULL THEN '[]'::jsonb
      WHEN array_length(ingredients, 1) IS NULL THEN '[]'::jsonb
      ELSE (
        SELECT jsonb_agg(
          CASE
            WHEN elem ~ '^\s*\{.*\}\s*$' THEN elem::jsonb
            ELSE to_jsonb(elem)
          END
        )
        FROM unnest(ingredients) AS elem
      )
    END;

  -- Drop old column and rename new one
  ALTER TABLE meal_recommendations DROP COLUMN IF EXISTS ingredients;
  ALTER TABLE meal_recommendations RENAME COLUMN ingredients_new TO ingredients;
END $$;

-- Convert instructions from text[] to jsonb
DO $$
BEGIN
  -- First, add a temporary column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'instructions_new'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN instructions_new jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Copy and convert existing data
  UPDATE meal_recommendations
  SET instructions_new =
    CASE
      WHEN instructions IS NULL THEN '[]'::jsonb
      WHEN array_length(instructions, 1) IS NULL THEN '[]'::jsonb
      ELSE (
        SELECT jsonb_agg(
          CASE
            WHEN elem ~ '^\s*\{.*\}\s*$' THEN elem::jsonb
            ELSE to_jsonb(elem)
          END
        )
        FROM unnest(instructions) AS elem
      )
    END;

  -- Drop old column and rename new one
  ALTER TABLE meal_recommendations DROP COLUMN IF EXISTS instructions;
  ALTER TABLE meal_recommendations RENAME COLUMN instructions_new TO instructions;
END $$;
