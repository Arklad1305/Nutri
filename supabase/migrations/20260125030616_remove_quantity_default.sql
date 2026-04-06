/*
  # Remove Default Value from quantity_g

  1. Changes
    - Remove DEFAULT 100 from quantity_g column in food_logs table
    - This forces explicit quantity values to be provided
    - Prevents accidental 100g entries when quantity is not specified
*/

ALTER TABLE food_logs 
ALTER COLUMN quantity_g DROP DEFAULT;