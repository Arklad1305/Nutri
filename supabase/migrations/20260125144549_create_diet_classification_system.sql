/*
  # Create Diet Classification System

  1. New Tables
    - `diet_categories`
      - `id` (bigint, primary key, auto-increment)
      - `name` (text, unique) - Diet name (Keto, Paleo, Vegan, etc.)
      - `description` (text) - Description of the diet
      - `icon` (text) - Icon name for UI
      - `criteria` (jsonb) - Technical criteria (carbs limit, protein %, etc.)
      - `created_at` (timestamptz)
  
  2. Modifications
    - Add `diet_tags` column to `food_logs` - Array of diet classifications
  
  3. Security
    - Enable RLS on `diet_categories` table
    - Public read access (all users can see diet categories)
    - Only system can insert/update diet categories
  
  4. Initial Data
    - Populate diet categories with biohacking standards:
      * Keto / Low Carb: Net carbs < 5g per 100g
      * Paleo / Primal: No processed foods, dairy, or legumes
      * Anti-Inflammatory: Omega 6:3 ratio < 4:1, high polyphenols
      * Carnivore / High Protein: >70% calories from animal sources
      * Vegan / Plant-Based: 100% plant sources
      * Mediterranean: Healthy fats, whole grains, lean proteins
*/

CREATE TABLE IF NOT EXISTS diet_categories (
  id bigserial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  criteria jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diet_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view diet categories"
  ON diet_categories FOR SELECT
  TO authenticated
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'diet_tags'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN diet_tags text[] DEFAULT '{}';
  END IF;
END $$;

INSERT INTO diet_categories (name, description, icon, criteria) VALUES
  (
    'Keto',
    'Dieta cetogénica: Alta en grasas, muy baja en carbohidratos para inducir cetosis',
    'zap',
    '{"max_net_carbs_per_100g": 5, "min_fat_percentage": 60, "max_carb_percentage": 10}'::jsonb
  ),
  (
    'Paleo',
    'Dieta paleolítica: Alimentos no procesados, sin lácteos ni legumbres',
    'users',
    '{"allowed_sources": ["meat", "fish", "vegetables", "fruits", "nuts"], "excluded": ["dairy", "legumes", "grains", "processed"]}'::jsonb
  ),
  (
    'Anti-Inflammatory',
    'Enfoque anti-inflamatorio: Ratio Omega 6:3 bajo, alto en polifenoles',
    'shield',
    '{"max_omega_6_3_ratio": 4, "min_polyphenols": true, "avoid_seed_oils": true}'::jsonb
  ),
  (
    'Carnivore',
    'Dieta carnívora: Principalmente productos de origen animal',
    'drumstick',
    '{"min_animal_percentage": 70, "protein_focus": true}'::jsonb
  ),
  (
    'Vegan',
    'Dieta vegana: 100% alimentos de origen vegetal',
    'leaf',
    '{"plant_based": 100, "no_animal_products": true}'::jsonb
  ),
  (
    'Mediterranean',
    'Dieta mediterránea: Grasas saludables, granos integrales, proteínas magras',
    'sun',
    '{"healthy_fats": true, "whole_grains": true, "lean_proteins": true, "olive_oil": true}'::jsonb
  ),
  (
    'High-Protein',
    'Alto en proteína: Optimizado para desarrollo muscular',
    'activity',
    '{"min_protein_percentage": 30, "min_protein_g_per_kg": 2.0}'::jsonb
  ),
  (
    'Inflammatory',
    'ADVERTENCIA: Contiene aceites de semillas o azúcares refinados',
    'alert-triangle',
    '{"seed_oils": true, "refined_sugars": true, "processed": true}'::jsonb
  )
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_food_logs_diet_tags 
  ON food_logs USING GIN(diet_tags);