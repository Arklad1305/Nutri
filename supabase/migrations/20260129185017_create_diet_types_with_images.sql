/*
  # Create Diet Types Table with Images
  
  1. New Tables
    - `diet_types`
      - `id` (bigint, primary key)
      - `name` (text, unique) - Diet name (Keto, Paleo, etc.)
      - `description` (text) - Short description
      - `image_url` (text) - URL to the diet image
      - `color` (text) - Theme color for the card
      - `benefits` (text[]) - Array of key benefits
      - `sort_order` (integer) - Display order
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `diet_types` table
    - Add policy for public read access (diet types are public data)
    
  3. Initial Data
    - Pre-populate with 7 diet types and Pexels images
*/

CREATE TABLE IF NOT EXISTS diet_types (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  color text DEFAULT '#3b82f6',
  benefits text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diet_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view diet types"
  ON diet_types
  FOR SELECT
  TO public
  USING (true);

-- Insert diet types with Pexels stock images
INSERT INTO diet_types (name, description, image_url, color, benefits, sort_order) VALUES
  (
    'Keto',
    'Alta en grasas, muy baja en carbohidratos',
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    '#10b981',
    ARRAY['Cetosis', 'Pérdida de grasa', 'Claridad mental'],
    1
  ),
  (
    'Paleo',
    'Alimentos no procesados, sin lácteos ni legumbres',
    'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=800',
    '#f59e0b',
    ARRAY['Anti-inflamatorio', 'Natural', 'Energía estable'],
    2
  ),
  (
    'Anti-Inflammatory',
    'Enfoque anti-inflamatorio, bajo ratio Omega 6:3',
    'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=800',
    '#06b6d4',
    ARRAY['Reduce inflamación', 'Omega-3', 'Salud articular'],
    3
  ),
  (
    'Carnivore',
    'Principalmente productos de origen animal',
    'https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg?auto=compress&cs=tinysrgb&w=800',
    '#ef4444',
    ARRAY['Alta proteína', 'Cero carbos', 'Nutrición densa'],
    4
  ),
  (
    'Vegan',
    '100% alimentos de origen vegetal',
    'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=800',
    '#22c55e',
    ARRAY['Plant-based', 'Ético', 'Alto en fibra'],
    5
  ),
  (
    'Mediterranean',
    'Grasas saludables, granos integrales',
    'https://images.pexels.com/photos/1640775/pexels-photo-1640775.jpeg?auto=compress&cs=tinysrgb&w=800',
    '#3b82f6',
    ARRAY['Salud cardiovascular', 'Longevidad', 'Balanceado'],
    6
  ),
  (
    'High-Protein',
    'Optimizado para desarrollo muscular',
    'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?auto=compress&cs=tinysrgb&w=800',
    '#8b5cf6',
    ARRAY['Anabolismo', 'Saciedad', 'Recuperación'],
    7
  );
