/*
  # Update Nutritional Standards with Biohacking-Calibrated Data

  1. Changes
    - Clears existing nutritional standards
    - Inserts biohacking-optimized standards for adult male performance
    - Includes new nutrient categories: bioactive compounds
    - Adjusts RDA (survival) vs ODI (optimal) values for peak performance
    
  2. New Nutrients Added
    - Omega-3 total (critical for systemic anti-inflammation)
    - Vitamin K2 (directs calcium to bones, not arteries)
    - Selenium (thyroid protection)
    - Polyphenols (gut bacteria fuel and antioxidants)
    
  3. Philosophy
    - min_survival_value: RDA - minimum to avoid disease
    - min_optimal_value: ODI - optimal for peak performance and longevity
    - Special case: sugar_g (less is better, optimal is minimum)
*/

-- Clear existing data to avoid conflicts
TRUNCATE TABLE nutritional_standards;

-- Insert biohacking-calibrated nutritional standards
INSERT INTO nutritional_standards (nutrient_key, label, unit, category, min_survival_value, min_optimal_value, max_optimal_value, description) VALUES

-- MACROS (Adjusted for performance/moderate muscle building)
('protein_g', 'Proteína Total', 'g', 'macro', 56, 140, 200, 'Base para mTOR y reparación muscular.'),
('fiber_g', 'Fibra', 'g', 'macro', 30, 50, 70, 'Crítico para la microbiota intestinal.'),
('sugar_g', 'Azúcar Añadido', 'g', 'macro', 50, 0, 25, 'Mientras menos, mejor. El óptimo es el máximo aquí.'),

-- LIPIDS (Essential fatty acids)
('omega_3_total_g', 'Omega-3 Total', 'g', 'lipid', 1.6, 3.0, 5.0, 'Antiinflamatorio sistémico. EPA+DHA críticos.'),

-- VITAMINS (Real biohacking)
('vit_d3_iu', 'Vitamina D3', 'UI', 'vitamin', 600, 3000, 10000, 'Hormona solar. 600 UI es muy bajo para inmunidad real.'),
('vit_c_mg', 'Vitamina C', 'mg', 'vitamin', 90, 500, 2000, 'Antioxidante y precursor de colágeno.'),
('vit_a_iu', 'Vitamina A', 'UI', 'vitamin', 3000, 5000, 10000, 'Salud ocular y diferenciación celular.'),
('vit_k2_mcg', 'Vitamina K2', 'mcg', 'vitamin', 90, 150, 300, 'Direcciona el calcio a los huesos, no a las arterias.'),
('b12_mcg', 'Vitamina B12', 'mcg', 'vitamin', 2.4, 10, 100, 'Energía mitocondrial y metilación.'),

-- MINERALS (Electrolytes and cofactors)
('magnesium_mg', 'Magnesio', 'mg', 'mineral', 400, 500, 700, 'Participa en 300+ reacciones enzimáticas. Reduce estrés.'),
('zinc_mg', 'Zinc', 'mg', 'mineral', 11, 25, 40, 'Testosterona e inmunidad. No exceder por tiempo prolongado.'),
('potassium_mg', 'Potasio', 'mg', 'mineral', 3500, 4700, 6000, 'Vital para la bomba sodio-potasio y presión arterial.'),
('selenium_mcg', 'Selenio', 'mcg', 'mineral', 55, 100, 400, 'Protección de la tiroides y antioxidante.'),
('iron_mg', 'Hierro', 'mg', 'mineral', 8, 15, 45, 'Transporte de oxígeno. Hombres necesitan menos que mujeres.'),

-- BIOACTIVES (Advanced level - not typically tracked but powerful)
('polyphenols_total_mg', 'Polifenoles', 'mg', 'bioactive', 500, 1000, 2000, 'Alimento para bacterias buenas y antioxidante sistémico.');
