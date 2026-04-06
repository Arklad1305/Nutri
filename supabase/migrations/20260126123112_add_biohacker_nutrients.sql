/*
  # Add Biohacker-Level Nutrient Tracking

  1. New Columns Added to `food_logs`
    
    **A. Brain & Cognitive Function**
    - `choline_mg` (decimal) - Choline for acetylcholine production (memory & focus)
      - Critical for programmers and cognitive performance
      - Sources: Eggs, liver, salmon
    
    - `anthocyanins_mg` (decimal) - Anthocyanins for neural cleanup
      - Powerful antioxidants for brain health
      - Sources: Blueberries, blackberries, purple foods
    
    **B. Mitochondrial Energy & Methylation**
    - `copper_mg` (decimal) - Copper for energy production
      - Essential for balancing zinc intake
      - Critical for ATP production and iron metabolism
      - Sources: Shellfish, nuts, seeds
    
    - `vitamin_e_iu` (decimal) - Vitamin E in International Units
      - Protects cell membranes from oxidation
      - Fat-soluble antioxidant
      - Sources: Avocado, nuts, seeds
    
    **C. Coagulation & Bone Health**
    - `vitamin_k1_mcg` (decimal) - Vitamin K1 (Phylloquinone)
      - Different from K2 (MK-7)
      - Critical for blood coagulation
      - Sources: Leafy greens, broccoli
    
    **D. Gut Health & Microbiome**
    - `probiotics_cfu` (bigint) - Probiotic Colony Forming Units
      - Tracks foods that support microbiota
      - Stored as integer (millions of CFU)
      - Sources: Yogurt, kefir, fermented foods

  2. Notes
    - All fields are nullable to maintain backward compatibility
    - Default to 0 for numerical calculations
    - These fields complete the biohacker tracking system
    - Calcium and Folate already exist in the schema
*/

DO $$
BEGIN
  -- Brain & Cognitive Function
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'choline_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN choline_mg numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'anthocyanins_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN anthocyanins_mg numeric(10,2) DEFAULT 0;
  END IF;

  -- Mitochondrial Energy
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'copper_mg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN copper_mg numeric(10,3) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'vitamin_e_iu'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN vitamin_e_iu numeric(10,2) DEFAULT 0;
  END IF;

  -- Coagulation & Bone Health
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'vitamin_k1_mcg'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN vitamin_k1_mcg numeric(10,2) DEFAULT 0;
  END IF;

  -- Gut Health
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'probiotics_cfu'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN probiotics_cfu bigint DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_food_logs_choline ON food_logs(choline_mg) WHERE choline_mg > 0;
CREATE INDEX IF NOT EXISTS idx_food_logs_probiotics ON food_logs(probiotics_cfu) WHERE probiotics_cfu > 0;