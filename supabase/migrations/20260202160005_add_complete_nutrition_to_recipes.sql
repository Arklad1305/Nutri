/*
  # Add Complete Nutritional Information to Recipes

  1. Changes
    - Add macronutrient columns (protein_g, carbs_g, fat_g, fiber_g, sugar_g)
    - Add micronutrient columns (vitamins and minerals per serving)
    - All values represent per serving amounts

  2. Security
    - No RLS changes needed (existing policies apply)

  3. Notes
    - Uses IF NOT EXISTS to prevent errors on re-run
    - All columns are nullable to support existing records
    - Values should be calculated per serving for accurate tracking
*/

-- Add macronutrient columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'protein_g'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN protein_g numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'carbs_g'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN carbs_g numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'fat_g'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN fat_g numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'fiber_g'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN fiber_g numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'sugar_g'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN sugar_g numeric;
  END IF;
END $$;

-- Add micronutrient columns (minerals)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'sodium_mg'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN sodium_mg numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'calcium_mg'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN calcium_mg numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'iron_mg'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN iron_mg numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'magnesium_mg'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN magnesium_mg numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'zinc_mg'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN zinc_mg numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'potassium_mg'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN potassium_mg numeric;
  END IF;
END $$;

-- Add fatty acid columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'omega_3_mg'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN omega_3_mg numeric;
  END IF;
END $$;

-- Add vitamin columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'vit_d3_iu'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN vit_d3_iu numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'vit_b12_mcg'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN vit_b12_mcg numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_recommendations' AND column_name = 'folate_mcg'
  ) THEN
    ALTER TABLE meal_recommendations ADD COLUMN folate_mcg numeric;
  END IF;
END $$;
