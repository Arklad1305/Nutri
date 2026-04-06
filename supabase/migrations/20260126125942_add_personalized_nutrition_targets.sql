/*
  # Add Personalized Nutrition Targets to Profiles

  1. New Columns Added to `profiles`
    
    **Calculated Nutrition Targets (Auto-computed based on user metrics)**
    - `target_calories` (integer) - Daily calorie target based on TDEE and goals
      - Calculated using Mifflin-St Jeor + activity multiplier + goal adjustment
    
    - `target_protein_g` (integer) - Daily protein target in grams
      - 1.2-1.8g per kg of adjusted body weight (adjusted for BMI > 30)
      - Capped at 220g for safety (renal/hepatic protection)
    
    - `target_carbs_g` (integer) - Daily carbohydrate target in grams
      - Calculated from remaining calories after protein and fat allocation
      - Adjusted for biohacking/low-carb profiles
    
    - `target_fat_g` (integer) - Daily fat target in grams
      - Minimum 0.8g per kg (hormonal health)
      - Increased for biohacking profiles (1.0g/kg)
    
    - `bmi` (decimal) - Body Mass Index
      - weight_kg / (height_m^2)
    
    - `adjusted_weight_kg` (decimal) - Adjusted body weight for obese individuals
      - For BMI > 30: ideal_weight + 0.25 * (actual_weight - ideal_weight)
      - Used for protein calculations to avoid overestimation
    
    - `nutrition_targets_json` (jsonb) - Complete targets object
      - Stores full calculation including micro-targets and diagnostic message
      - Allows for flexible expansion without schema changes

  2. Notes
    - All fields are nullable for backward compatibility
    - These values should be recalculated when user updates their profile
    - The BMI adjustment protects obese users from excessive protein recommendations
    - Vitamin D3 scales with body weight (2000 IU base + 40 IU per kg over 80kg)
    - Magnesium increases with activity level (400-600mg)
    - Water target is 35ml per kg of total body weight
*/

DO $$
BEGIN
  -- Target Macros
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'target_calories'
  ) THEN
    ALTER TABLE profiles ADD COLUMN target_calories integer DEFAULT 2000;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'target_protein_g'
  ) THEN
    ALTER TABLE profiles ADD COLUMN target_protein_g integer DEFAULT 100;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'target_carbs_g'
  ) THEN
    ALTER TABLE profiles ADD COLUMN target_carbs_g integer DEFAULT 250;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'target_fat_g'
  ) THEN
    ALTER TABLE profiles ADD COLUMN target_fat_g integer DEFAULT 65;
  END IF;

  -- Body Composition Metrics
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bmi'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bmi numeric(4,1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'adjusted_weight_kg'
  ) THEN
    ALTER TABLE profiles ADD COLUMN adjusted_weight_kg numeric(5,1);
  END IF;

  -- Complete Targets Object (includes micros and diagnostic)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'nutrition_targets_json'
  ) THEN
    ALTER TABLE profiles ADD COLUMN nutrition_targets_json jsonb;
  END IF;
END $$;

-- Create index for faster lookups on BMI ranges (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_profiles_bmi ON profiles(bmi) 
  WHERE bmi IS NOT NULL;

-- Add comment explaining the adjusted weight calculation
COMMENT ON COLUMN profiles.adjusted_weight_kg IS 'Adjusted body weight for protein calculations. For BMI > 30: ideal_weight + 0.25 * (excess_weight). Prevents protein overestimation in obese individuals.';