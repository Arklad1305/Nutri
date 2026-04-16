-- ============================================================
-- Nutrition Cache: Cascading lookup results from USDA + OpenFoodFacts
-- Reduces Gemini API calls by caching verified nutritional data
-- ============================================================

-- Enable pg_trgm for fuzzy Spanish food name search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS nutrition_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Lookup keys
  food_key TEXT NOT NULL,                    -- Normalized lowercase key (e.g. "arroz_blanco_cocido")
  food_name_es TEXT NOT NULL,                -- Spanish display name
  food_name_en TEXT,                         -- English name (for USDA lookups)

  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('usda', 'openfoodfacts', 'gemini', 'manual')),
  usda_fdc_id INTEGER,                       -- USDA FoodData Central ID
  off_barcode TEXT,                           -- OpenFoodFacts barcode

  -- Nutritional data per 100g
  per_100g JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure: { calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, water_ml, sodium_mg, ... }

  -- 4-group biohacker matrix per 100g
  nutritional_matrix JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure: { motor: {...}, cognitive: {...}, hormonal: {...}, inflammation: {...} }

  -- Quality metadata
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.70 CHECK (confidence >= 0 AND confidence <= 1),
  -- 0.95+ = USDA verified, 0.80-0.94 = OpenFoodFacts, 0.60-0.79 = Gemini estimated

  data_quality TEXT DEFAULT 'standard' CHECK (data_quality IN ('verified', 'standard', 'estimated')),

  -- Timestamps
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Unique constraint on food_key to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_nutrition_cache_food_key ON nutrition_cache (food_key);

-- Trigram index for fuzzy Spanish name search
CREATE INDEX IF NOT EXISTS idx_nutrition_cache_trgm_es ON nutrition_cache USING gin (food_name_es gin_trgm_ops);

-- Index for English name search (exact + prefix)
CREATE INDEX IF NOT EXISTS idx_nutrition_cache_name_en ON nutrition_cache (food_name_en);

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_nutrition_cache_source ON nutrition_cache (source);

-- Index for USDA FDC ID lookup
CREATE INDEX IF NOT EXISTS idx_nutrition_cache_usda_fdc ON nutrition_cache (usda_fdc_id) WHERE usda_fdc_id IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_nutrition_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nutrition_cache_updated
  BEFORE UPDATE ON nutrition_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_cache_timestamp();

-- RLS: Public read (nutritional data is not user-specific), authenticated write
ALTER TABLE nutrition_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read nutrition cache"
  ON nutrition_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage nutrition cache"
  ON nutrition_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow edge functions (authenticated context) to insert/update cache
CREATE POLICY "Authenticated users can insert nutrition cache"
  ON nutrition_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update nutrition cache"
  ON nutrition_cache FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
