/*
  # Add Complete Nutrient Tracking System

  1. New Columns Added to `food_logs`
    
    **A. Complete B-Vitamin Complex (Energy & Methylation)**
    - `vitamin_b1_thiamin_mg` (decimal) - Thiamin for carbohydrate metabolism
      - Critical for ATP production and nerve function
      - Sources: Whole grains, pork, legumes
    
    - `vitamin_b2_riboflavin_mg` (decimal) - Riboflavin for eye health and migraines
      - Essential for FAD coenzyme production
      - Sources: Dairy, eggs, leafy greens
    
    - `vitamin_b3_niacin_mg` (decimal) - Niacin for DNA repair and cholesterol
      - Critical for NAD+ production (cellular energy)
      - Sources: Meat, fish, whole grains
    
    - `vitamin_b5_pantothenic_mg` (decimal) - Pantothenic acid for hormones and stress
      - Required for CoA synthesis
      - Sources: Mushrooms, avocado, chicken
    
    - `vitamin_b7_biotin_mcg` (decimal) - Biotin for hair and skin
      - Essential for fatty acid synthesis
      - Sources: Eggs, nuts, salmon
    
    **B. Structural Minerals & Trace Elements**
    - `phosphorus_mg` (decimal) - Phosphorus for ATP and bone structure
      - Critical component of ATP (energy currency)
      - Sources: Meat, dairy, legumes
    
    - `manganese_mg` (decimal) - Manganese for mitochondrial protection
      - Antioxidant enzyme cofactor
      - Sources: Nuts, whole grains, tea
    
    - `iodine_mcg` (decimal) - Iodine for thyroid hormone production
      - Essential for T3 and T4 synthesis
      - Sources: Seaweed, iodized salt, fish
    
    - `chromium_mcg` (decimal) - Chromium for insulin sensitivity
      - Enhances insulin signaling
      - Sources: Broccoli, whole grains, meat
    
    **C. Essential Amino Acids (Complete Protein Synthesis)**
    - `leucine_mg` (decimal) - Leucine for muscle protein synthesis (BCAA)
      - Primary mTOR activator
      - Sources: Meat, dairy, legumes
    
    - `isoleucine_mg` (decimal) - Isoleucine for energy and immunity (BCAA)
      - Glucose metabolism
      - Sources: Meat, fish, eggs
    
    - `valine_mg` (decimal) - Valine for muscle metabolism (BCAA)
      - Third BCAA for muscle recovery
      - Sources: Dairy, meat, soy
    
    - `lysine_mg` (decimal) - Lysine for collagen and antiviral function
      - Inhibits viral replication
      - Sources: Meat, eggs, legumes
    
    - `methionine_mg` (decimal) - Methionine for methylation and detox
      - SAMe precursor (methylation)
      - Sources: Eggs, fish, meat
    
    - `phenylalanine_mg` (decimal) - Phenylalanine for dopamine production
      - Precursor to tyrosine and neurotransmitters
      - Sources: Meat, dairy, soy
    
    - `threonine_mg` (decimal) - Threonine for gut health and immunity
      - Mucin production in intestines
      - Sources: Meat, dairy, lentils
    
    - `histidine_mg` (decimal) - Histidine for immune response
      - Histamine precursor
      - Sources: Meat, fish, soy
    
    - `tryptophan_mg` (decimal) - Tryptophan for serotonin and sleep
      - Serotonin and melatonin precursor
      - Sources: Turkey, eggs, cheese

  2. Notes
    - All fields are nullable for backward compatibility
    - Default to 0 for numerical calculations
    - Completes the comprehensive biohacker tracking system
    - Enables full energy metabolism, hormonal balance, and protein synthesis tracking
*/

DO $$
BEGIN
  -- B-Vitamin Complex
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'vitamin_b1_thiamin_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN vitamin_b1_thiamin_mg numeric(10,3) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'vitamin_b2_riboflavin_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN vitamin_b2_riboflavin_mg numeric(10,3) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'vitamin_b3_niacin_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN vitamin_b3_niacin_mg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'vitamin_b5_pantothenic_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN vitamin_b5_pantothenic_mg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'vitamin_b7_biotin_mcg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN vitamin_b7_biotin_mcg numeric(10,2) DEFAULT 0;
  END IF;

  -- Structural Minerals & Trace Elements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'phosphorus_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN phosphorus_mg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'manganese_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN manganese_mg numeric(10,3) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'iodine_mcg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN iodine_mcg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'chromium_mcg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN chromium_mcg numeric(10,2) DEFAULT 0;
  END IF;

  -- Essential Amino Acids
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'leucine_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN leucine_mg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'isoleucine_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN isoleucine_mg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'valine_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN valine_mg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'lysine_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN lysine_mg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'methionine_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN methionine_mg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'phenylalanine_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN phenylalanine_mg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'threonine_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN threonine_mg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'histidine_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN histidine_mg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'tryptophan_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN tryptophan_mg numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Create indexes for commonly queried nutrients
CREATE INDEX IF NOT EXISTS idx_food_logs_b_vitamins ON food_logs(vitamin_b1_thiamin_mg, vitamin_b2_riboflavin_mg, vitamin_b3_niacin_mg) 
  WHERE vitamin_b1_thiamin_mg > 0 OR vitamin_b2_riboflavin_mg > 0 OR vitamin_b3_niacin_mg > 0;

CREATE INDEX IF NOT EXISTS idx_food_logs_amino_acids ON food_logs(leucine_mg, isoleucine_mg, valine_mg) 
  WHERE leucine_mg > 0 OR isoleucine_mg > 0 OR valine_mg > 0;