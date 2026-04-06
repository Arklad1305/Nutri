/*
  # Agregar tracking de hidratación en alimentos

  1. Cambios en Tablas
    - `food_logs`: Agregar columna `water_ml` (numeric)
      - Permite trackear el contenido de agua en cada alimento
      - Default: 0 (para no romper datos existentes)
  
  2. Estándares Nutricionales
    - Crear o actualizar estándar para `water_ml`
    - Rango óptimo: 2000-3500 ml diarios (según Lieberman ODI)
    - Incluye agua de alimentos + líquidos consumidos
  
  3. Notas
    - El agua en alimentos contribuye significativamente a la hidratación total
    - Frutas y verduras pueden aportar 20-30% de la hidratación diaria
    - Compatible con el formato N8N y entradas manuales
*/

-- Agregar columna water_ml a food_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_logs' AND column_name = 'water_ml'
  ) THEN
    ALTER TABLE food_logs ADD COLUMN water_ml numeric DEFAULT 0;
  END IF;
END $$;

-- Crear o actualizar estándar de hidratación
INSERT INTO nutritional_standards (
  nutrient_key, 
  label, 
  unit, 
  category, 
  min_survival_value, 
  min_optimal_value, 
  description
)
VALUES (
  'water_ml', 
  'Hidratación (Alimentos/Líquidos)', 
  'ml', 
  'macro', 
  2000, 
  3500, 
  'Agua biológica y líquidos totales consumidos. Incluye agua de alimentos y bebidas.'
)
ON CONFLICT (nutrient_key) 
DO UPDATE SET 
  min_optimal_value = 3500,
  description = 'Agua biológica y líquidos totales consumidos. Incluye agua de alimentos y bebidas.',
  label = 'Hidratación (Alimentos/Líquidos)';