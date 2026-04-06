/*
  # Add JSONB Nutritional Matrix to Food Logs

  ## Overview
  This migration transforms the food tracking system to use a flexible JSONB structure
  for storing comprehensive nutritional data. This allows tracking 50+ nutrients without
  creating 50 individual columns.

  ## Changes

  ### 1. New Columns in `food_logs`
  - `quantity_g` (numeric) - Normalized quantity in grams (default 100g)
  - `nutritional_matrix` (jsonb) - Complete nutritional breakdown stored as hierarchical JSON

  ### 2. JSONB Structure
  The nutritional_matrix follows this hierarchical structure:

  ```json
  {
    "A_macronutrients": {
      "calories": 150,
      "protein_g": 20,
      "carbs_g": 5,
      "fat_g": 7,
      "fiber_g": 2,
      "sugar_g": 1
    },
    "B_vitamins": {
      "vitamin_a_mcg": 500,
      "vitamin_c_mg": 10,
      "vitamin_d_mcg": 2,
      "vitamin_e_mg": 5,
      "vitamin_k_mcg": 80,
      "vitamin_b1_thiamin_mg": 0.1,
      "vitamin_b2_riboflavin_mg": 0.2,
      "vitamin_b3_niacin_mg": 3,
      "vitamin_b5_pantothenic_mg": 1,
      "vitamin_b6_mg": 0.5,
      "vitamin_b7_biotin_mcg": 30,
      "vitamin_b9_folate_mcg": 100,
      "vitamin_b12_mcg": 2
    },
    "C_minerals": {
      "calcium_mg": 100,
      "iron_mg": 2,
      "magnesium_mg": 50,
      "phosphorus_mg": 200,
      "potassium_mg": 300,
      "sodium_mg": 100,
      "zinc_mg": 3,
      "copper_mg": 0.5,
      "manganese_mg": 0.5,
      "selenium_mcg": 20,
      "chromium_mcg": 10,
      "iodine_mcg": 50
    },
    "D_amino_acids": {
      "leucine_mg": 1500,
      "isoleucine_mg": 800,
      "valine_mg": 900,
      "lysine_mg": 1200,
      "methionine_mg": 400,
      "phenylalanine_mg": 700,
      "threonine_mg": 600,
      "tryptophan_mg": 200,
      "histidine_mg": 500
    },
    "E_fatty_acids": {
      "saturated_g": 2,
      "monounsaturated_g": 3,
      "polyunsaturated_g": 2,
      "omega_3_mg": 500,
      "omega_6_mg": 1000,
      "trans_fat_g": 0
    },
    "F_other": {
      "cholesterol_mg": 50,
      "caffeine_mg": 0,
      "alcohol_g": 0,
      "water_g": 70
    }
  }
  ```

  ## Benefits
  - Flexible: Add new nutrients without schema changes
  - Efficient: JSONB is indexed and queryable
  - Scalable: Can store unlimited nutritional data
  - Hierarchical: Organized by nutrient categories (A-F)
  - Query-friendly: Can sum, average, filter on individual fields

  ## Backward Compatibility
  - Existing columns are preserved for compatibility
  - Migration copies existing data to nutritional_matrix
  - Applications can gradually transition to using JSONB

  ## Security
  - Maintains existing RLS policies
  - GIN index for fast JSONB queries
*/

-- Add new columns to food_logs
ALTER TABLE public.food_logs
  ADD COLUMN IF NOT EXISTS quantity_g NUMERIC(8,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS nutritional_matrix JSONB DEFAULT '{}'::jsonb;

-- Migrate existing data to nutritional_matrix
-- This preserves all current nutritional data in the new JSONB format
UPDATE public.food_logs
SET nutritional_matrix = jsonb_build_object(
  'A_macronutrients', jsonb_build_object(
    'calories', COALESCE(calories, 0),
    'protein_g', COALESCE(protein_g, 0),
    'carbs_g', COALESCE(carbs_g, 0),
    'fat_g', COALESCE(fat_g, 0),
    'fiber_g', COALESCE(fiber_g, 0),
    'sugar_g', COALESCE(sugar_g, 0)
  ),
  'B_vitamins', jsonb_build_object(
    'vitamin_a_mcg', COALESCE(vitamin_a_mcg, 0),
    'vitamin_c_mg', COALESCE(vitamin_c_mg, 0),
    'vitamin_d_mcg', COALESCE(vitamin_d_mcg, 0),
    'vitamin_e_mg', COALESCE(vitamin_e_mg, 0),
    'vitamin_k_mcg', COALESCE(vitamin_k_mcg, 0),
    'vitamin_b6_mg', COALESCE(vitamin_b6_mg, 0),
    'vitamin_b12_mcg', COALESCE(vitamin_b12_mcg, 0),
    'folate_mcg', COALESCE(folate_mcg, 0)
  ),
  'C_minerals', jsonb_build_object(
    'calcium_mg', COALESCE(calcium_mg, 0),
    'iron_mg', COALESCE(iron_mg, 0),
    'magnesium_mg', COALESCE(magnesium_mg, 0),
    'potassium_mg', COALESCE(potassium_mg, 0),
    'sodium_mg', COALESCE(sodium_mg, 0),
    'zinc_mg', COALESCE(zinc_mg, 0)
  ),
  'D_amino_acids', '{}'::jsonb,
  'E_fatty_acids', '{}'::jsonb,
  'F_other', '{}'::jsonb
)
WHERE nutritional_matrix = '{}'::jsonb OR nutritional_matrix IS NULL;

-- Create GIN index for efficient JSONB queries
-- This allows fast queries like: "Show me all foods high in vitamin C"
CREATE INDEX IF NOT EXISTS idx_food_logs_nutritional_matrix
  ON public.food_logs USING gin (nutritional_matrix);

-- Create index for quantity-based queries
CREATE INDEX IF NOT EXISTS idx_food_logs_quantity
  ON public.food_logs(quantity_g);

-- Create composite index for user + date queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date
  ON public.food_logs(user_id, logged_at DESC);

-- Add helpful comment
COMMENT ON COLUMN public.food_logs.nutritional_matrix IS
  'Complete nutritional breakdown stored as hierarchical JSONB. Categories: A_macronutrients, B_vitamins, C_minerals, D_amino_acids, E_fatty_acids, F_other';

COMMENT ON COLUMN public.food_logs.quantity_g IS
  'Quantity in grams (normalized). Nutritional values in matrix are per this quantity.';
