/*
  # Add Diet Preference to User Profiles

  1. Modifications
    - Add `preferred_diet` column to `profiles` table
    - Array of diet preferences (user can follow multiple diets)
    - Defaults to empty array
  
  2. Notes
    - Users can select multiple diet tags (e.g., both Keto and Anti-Inflammatory)
    - This will be used by the recipe generator to provide personalized recommendations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_diet'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_diet text[] DEFAULT '{}';
  END IF;
END $$;