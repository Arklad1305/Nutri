-- =============================================================================
-- Migración: Fix RLS y constraints
-- Versión: v1.2.0
-- Fecha: 2026-04-06
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FIX CRÍTICO: meal_recommendations INSERT policy era WITH CHECK (true)
--    Permitía que cualquier usuario autenticado insertara en meal_recommendations
--    de cualquier otro usuario.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service can insert meal recommendations" ON meal_recommendations;

CREATE POLICY "Users can insert own meal recommendations"
  ON meal_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 2. Agregar DELETE policy faltante en daily_goals
--    Los usuarios no podían eliminar sus propios objetivos diarios.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_goals'
      AND policyname = 'Users can delete own daily goals'
  ) THEN
    CREATE POLICY "Users can delete own daily goals"
      ON daily_goals
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- -----------------------------------------------------------------------------
-- 3. Agregar UPDATE policy faltante en water_logs
--    Los usuarios no podían corregir registros de agua.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'water_logs'
      AND policyname = 'Users can update own water logs'
  ) THEN
    CREATE POLICY "Users can update own water logs"
      ON water_logs
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- -----------------------------------------------------------------------------
-- 4. Check constraints para integridad de datos
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'activity_logs_duration_positive'
  ) THEN
    ALTER TABLE activity_logs
      ADD CONSTRAINT activity_logs_duration_positive
      CHECK (duration_minutes > 0);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'food_logs_quantity_positive'
  ) THEN
    ALTER TABLE food_logs
      ADD CONSTRAINT food_logs_quantity_positive
      CHECK (quantity_g > 0);
  END IF;
END$$;
