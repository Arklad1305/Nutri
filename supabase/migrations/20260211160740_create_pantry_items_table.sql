/*
  # Create Pantry Items Table

  1. New Tables
    - `pantry_items`
      - `id` (bigint, primary key, auto-increment)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, not null) - nombre del ingrediente
      - `quantity` (numeric, optional) - cantidad disponible
      - `unit` (text, optional) - unidad de medida (kg, g, unidades, etc.)
      - `category` (text, optional) - categoría (carnes, vegetales, lácteos, etc.)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `pantry_items` table
    - Add policies for authenticated users to:
      - Read their own pantry items
      - Insert their own pantry items
      - Update their own pantry items
      - Delete their own pantry items
*/

CREATE TABLE IF NOT EXISTS pantry_items (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  quantity numeric,
  unit text,
  category text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT
CREATE POLICY "Users can read own pantry items"
  ON pantry_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for INSERT
CREATE POLICY "Users can insert own pantry items"
  ON pantry_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE
CREATE POLICY "Users can update own pantry items"
  ON pantry_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE
CREATE POLICY "Users can delete own pantry items"
  ON pantry_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_category ON pantry_items(category);