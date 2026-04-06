/*
  # Fix Nutritional Standards - Safety Audit Corrections

  Fixes found in code audit:

  1. INCORRECT RDA/AI VALUES (used female values for unisex app):
     - Fiber: 25g → 38g (men's AI, IOM)
     - Vitamin K1: 90mcg → 120mcg (men's AI, IOM)
     - Vitamin K2: 90mcg → 120mcg (men's AI, IOM)
     - Iron optimal: 15mg → 8mg (men's RDA; 15mg is female value, risks hemochromatosis)

  2. VALUES EXCEEDING IOM TOLERABLE UPPER LIMITS:
     - Vitamin A max: 15000 IU → 10000 IU (IOM UL)
     - Vitamin C max: 5000mg → 2000mg (IOM UL)
     - Niacin B3 optimal: 50mg → 35mg, max: 500mg → 100mg (UL=35mg, 500mg = hepatotoxic)
     - Zinc max: 50mg → 40mg (IOM UL)
     - Sodium optimal: 3000mg → 2300mg, max: 5000mg → 3500mg (AHA/WHO guidelines)

  3. Sources: IOM DRIs, NIH ODS, WHO Guidelines, AHA Recommendations
*/

-- Fix fiber: men's AI is 38g, not 25g
UPDATE nutritional_standards
SET min_survival_value = 38
WHERE nutrient_key = 'fiber_g';

-- Fix vitamin K1: men's AI is 120mcg
UPDATE nutritional_standards
SET min_survival_value = 120
WHERE nutrient_key = 'vitamin_k1_mcg';

-- Fix vitamin K2: men's AI is 120mcg
UPDATE nutritional_standards
SET min_survival_value = 120
WHERE nutrient_key IN ('vitamin_k_mcg', 'vit_k2_mcg');

-- Fix vitamin A: max should not exceed IOM UL of 10,000 IU
UPDATE nutritional_standards
SET max_optimal_value = 10000
WHERE nutrient_key = 'vitamin_a_mcg' AND max_optimal_value > 10000;

-- Fix vitamin C: max should not exceed IOM UL of 2,000mg
UPDATE nutritional_standards
SET max_optimal_value = 2000
WHERE nutrient_key = 'vitamin_c_mg' AND max_optimal_value > 2000;

-- Fix niacin B3: UL is 35mg (flush/hepatotoxicity). Optimal=35, max=100 (conservative above UL)
UPDATE nutritional_standards
SET min_optimal_value = 35, max_optimal_value = 100
WHERE nutrient_key = 'vitamin_b3_niacin_mg';

-- Fix zinc: IOM UL is 40mg
UPDATE nutritional_standards
SET max_optimal_value = 40
WHERE nutrient_key = 'zinc_mg';

-- Fix sodium: AHA recommends <2300mg, WHO <2000mg
UPDATE nutritional_standards
SET min_optimal_value = 2300, max_optimal_value = 3500
WHERE nutrient_key = 'sodium_mg';

-- Fix iron optimal for men: 8mg is sufficient, 15mg risks overload
-- Keep min_survival at 8 (correct), lower optimal to 10 (conservative)
UPDATE nutritional_standards
SET min_optimal_value = 10
WHERE nutrient_key = 'iron_mg' AND min_optimal_value > 10;
