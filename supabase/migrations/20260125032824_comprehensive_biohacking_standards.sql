/*
  # Comprehensive Biohacking Nutritional Standards - Complete Matrix

  1. Changes
    - Clears and rebuilds nutritional standards with complete biohacking data
    - Adds detailed amino acid standards (leucine, glycine, methionine, taurine, tryptophan)
    - Adds detailed lipid breakdown (EPA/DHA, Omega-6, saturated fat, cholesterol)
    - Includes energy tracking (calories)
    - Expands vitamins and minerals with biohacking-optimized ranges
    
  2. New Categories
    - Energy: Calorie tracking baseline
    - Amino Acids: Individual amino acid optimization for mTOR, collagen, sleep
    - Detailed Lipids: Omega-3 breakdown, Omega-6 ratio, cholesterol management
    
  3. Philosophy
    - min_survival_value: RDA - minimum to avoid deficiency disease
    - min_optimal_value: ODI - optimal for peak performance, longevity, hormetic stress
    - Special cases: 
      * sugar_g: Less is better (optimal = 0)
      * methionine_g: Pro-aging if excessive (keep moderate)
      * omega_6_g: Pro-inflammatory if high (keep ratio low vs Omega-3)
*/

TRUNCATE TABLE nutritional_standards;

INSERT INTO nutritional_standards (nutrient_key, label, unit, category, min_survival_value, min_optimal_value, max_optimal_value, description) VALUES

-- ENERGY AND MACROS
('calories', 'Calorías', 'kcal', 'energy', 2000, 2500, 3500, 'Depende de tu TMB y actividad.'),
('protein_g', 'Proteína Total', 'g', 'macro', 56, 160, 250, 'Base estructural. 1.6g - 2.2g por kg de peso.'),
('carbs_g', 'Carbohidratos', 'g', 'macro', 130, 150, 300, 'Ajustar según actividad física (Ciclar carbos).'),
('fat_g', 'Grasas Totales', 'g', 'macro', 44, 80, 150, 'Combustible hormonal.'),
('fiber_g', 'Fibra', 'g', 'macro', 30, 50, 70, 'Vital para la microbiota y glucosa.'),
('sugar_g', 'Azúcar Añadido', 'g', 'macro', 50, 0, 25, 'Tóxico metabólico. Mantener en 0 si es posible.'),

-- AMINO ACIDS (Biohacker level)
('leucine_g', 'Leucina', 'g', 'amino', 2.5, 8.0, 15.0, 'El gatillo de mTOR. Mínimo 2.5g por comida para anabolismo.'),
('glycine_g', 'Glicina', 'g', 'amino', 3.0, 10.0, 20.0, 'Antagonista de metionina, vital para colágeno y sueño.'),
('methionine_g', 'Metionina', 'g', 'amino', 0.8, 2.0, 3.0, 'Aminoácido pro-envejecimiento si hay exceso. Moderar.'),
('taurine_mg', 'Taurina', 'mg', 'amino', 500, 2000, 6000, 'Salud mitocondrial y calma nerviosa (GABA).'),
('tryptophan_g', 'Triptófano', 'g', 'amino', 0.5, 1.0, 2.0, 'Precursor de Serotonina y Melatonina.'),

-- DETAILED LIPIDS
('omega_3_total_g', 'Omega-3 Total', 'g', 'lipid', 1.6, 4.0, 8.0, 'Antiinflamatorio general.'),
('omega_3_epa_dha_g', 'Omega-3 (EPA+DHA)', 'g', 'lipid', 0.5, 3.0, 6.0, 'El REAL potente. Salud cerebral y cardiovascular.'),
('omega_6_g', 'Omega-6', 'g', 'lipid', 10, 8, 15, 'Pro-inflamatorio en exceso. Mantener ratio bajo vs Omega-3.'),
('sat_fat_g', 'Grasa Saturada', 'g', 'lipid', 20, 30, 50, 'No es el enemigo, pero requiere contexto calórico.'),
('cholesterol_mg', 'Colesterol', 'mg', 'lipid', 300, 400, 600, 'Precursor de testosterona. No temer si no hay inflamación.'),

-- VITAMINS (Cofactors)
('vit_d3_iu', 'Vitamina D3', 'UI', 'vitamin', 600, 5000, 10000, 'Hormona maestra. Niveles óptimos > 40ng/mL en sangre.'),
('vit_c_mg', 'Vitamina C', 'mg', 'vitamin', 90, 1000, 2000, 'Estrés oxidativo y suprarrenales.'),
('vit_a_iu', 'Vitamina A (Retinol)', 'UI', 'vitamin', 3000, 5000, 10000, 'Inmunidad y visión.'),
('vit_k2_mcg', 'Vitamina K2', 'mcg', 'vitamin', 90, 200, 400, 'Descalcifica arterias, calcifica huesos.'),
('b12_mcg', 'Vitamina B12', 'mcg', 'vitamin', 2.4, 10, 100, 'Energía y metilación.'),

-- MINERALS
('magnesium_mg', 'Magnesio', 'mg', 'mineral', 400, 600, 800, 'Relajante muscular y nervioso. Casi todos tienen déficit.'),
('potassium_mg', 'Potasio', 'mg', 'mineral', 3500, 4700, 6000, 'Bomba sodio-potasio. Vital para presión arterial.'),
('sodium_mg', 'Sodio', 'mg', 'mineral', 1500, 3000, 5000, 'Necesario si entrenas, peligroso si eres sedentario.'),
('zinc_mg', 'Zinc', 'mg', 'mineral', 11, 30, 50, 'Testosterona e inmunidad.'),
('iron_mg', 'Hierro', 'mg', 'mineral', 8, 15, 45, 'Transporte de oxígeno.'),
('selenium_mcg', 'Selenio', 'mcg', 'mineral', 55, 100, 400, 'Protección tiroidea y antioxidante.'),

-- BIOACTIVES
('polyphenols_total_mg', 'Polifenoles', 'mg', 'bioactive', 500, 1500, 3000, 'Señalización celular hormética. Té verde, cacao, frutos rojos.');
