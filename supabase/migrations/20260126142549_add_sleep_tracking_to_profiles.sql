/*
  # Añadir Seguimiento de Sueño al Sistema

  1. Cambios en Tabla `profiles`
    - Añade `last_night_sleep_hours` (decimal) para almacenar horas dormidas la noche anterior
    - Este campo es crítico para ajustes metabólicos automáticos

  2. Propósito
    - Permitir ajustes dinámicos de macros/micros basados en calidad de sueño
    - Activar "protocolo de protección metabólica" cuando sueño < 6.5 horas
    - Ajustar automáticamente:
      * Proteína (+20% si privación de sueño para combatir Ghrelina)
      * Carbohidratos (reducción por resistencia a insulina temporal)
      * Magnesio (600mg si privación vs 400mg normal)
      * Vitamina C (1000mg vs 90mg para soporte adrenal)

  3. Seguridad
    - Campo opcional (NULL permitido)
    - Valor por defecto: 7.5 horas (neutro)
    - RLS ya está configurado en la tabla profiles
*/

-- Añadir campo de seguimiento de sueño
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_night_sleep_hours'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN last_night_sleep_hours numeric(3,1) DEFAULT 7.5 CHECK (last_night_sleep_hours >= 0 AND last_night_sleep_hours <= 24);
  END IF;
END $$;

-- Comentario para documentación
COMMENT ON COLUMN profiles.last_night_sleep_hours IS 'Horas dormidas la noche anterior. Usado para ajustes metabólicos automáticos. < 6.5h activa protocolo de protección contra resistencia a insulina.';
