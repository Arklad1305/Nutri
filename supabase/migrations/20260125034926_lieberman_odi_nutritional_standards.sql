/*
  # Lieberman ODI Nutritional Standards - RDA vs Optimal Daily Intake

  1. Philosophy
    - RDA (min_survival_value): Minimum to prevent deficiency diseases
    - ODI (min_optimal_value): Optimal for disease prevention and peak performance
    - Based on "The Real Vitamin & Mineral Book" by Shari Lieberman
    
  2. Key Differences from Previous Standards
    - Vitamin C: 90mg → 2000mg (22x increase for optimal health)
    - Vitamin E: 22 UI → 400 UI (18x increase)
    - B12: 2.4mcg → 100mcg (42x increase)
    - Zinc: 11mg → 30mg (3x increase)
    - Selenium: 55mcg → 200mcg (4x increase)
    - Chromium: Added as key mineral for glucose tolerance
    
  3. New Nutrients Added
    - Vitamin E: Master fat-soluble antioxidant
    - Folate (B9): DNA repair and homocysteine reduction
    - Chromium: Glucose Tolerance Factor (GTF)
    
  4. Categories
    - Energy: Calorie baseline
    - Macros: Protein, carbs, fats, fiber, sugar
    - Vitamins: A, C, D3, E, B12, Folate (focus on Lieberman's high-dose recommendations)
    - Minerals: Magnesium, Zinc, Selenium, Chromium
    - Amino Acids: Leucine for mTOR activation
    - Lipids: Omega-3 (EPA/DHA), Omega-6 ratio control
    - Bioactives: Polyphenols for cellular protection
*/

TRUNCATE TABLE nutritional_standards;

INSERT INTO nutritional_standards (nutrient_key, label, unit, category, min_survival_value, min_optimal_value, max_optimal_value, description) VALUES

-- ENERGY AND MACROS
('calories', 'Calorías', 'kcal', 'energy', 2000, 2500, 3500, 'Combustible base metabólico.'),
('protein_g', 'Proteína', 'g', 'macro', 56, 140, 220, 'Estructural. Lieberman sugiere dietas densas en nutrientes.'),
('carbs_g', 'Carbohidratos', 'g', 'macro', 130, 150, 300, 'Energía glucolítica. Ajustar según actividad.'),
('fat_g', 'Grasas', 'g', 'macro', 44, 70, 120, 'Soporte hormonal y absorción de vitaminas liposolubles.'),
('fiber_g', 'Fibra', 'g', 'macro', 25, 40, 60, 'Detoxificación intestinal y control glucémico.'),
('sugar_g', 'Azúcar', 'g', 'macro', 50, 0, 25, 'Minimizar al máximo para evitar inflamación.'),

-- VITAMINS (Lieberman's Core Focus - High-Dose Prevention)
('vit_a_iu', 'Vitamina A (Retinol)', 'UI', 'vitamin', 3000, 7500, 15000, 'Lieberman: Vital para mucosas e inmunidad viral.'),
('vit_c_mg', 'Vitamina C', 'mg', 'vitamin', 90, 2000, 5000, 'Lieberman: Dosis altas para estrés y soporte adrenal.'),
('vit_d3_iu', 'Vitamina D3', 'UI', 'vitamin', 600, 2000, 5000, 'Lieberman: Prevención ósea y salud celular.'),
('vit_e_iu', 'Vitamina E', 'UI', 'vitamin', 22, 400, 1000, 'Lieberman: El antioxidante liposoluble maestro.'),
('vit_k2_mcg', 'Vitamina K2', 'mcg', 'vitamin', 90, 200, 400, 'Calcificación ósea y descalcificación arterial.'),
('b12_mcg', 'Vitamina B12', 'mcg', 'vitamin', 2.4, 100, 1000, 'Lieberman: 100-1000mcg para energía y metilación.'),
('folate_mcg', 'Folato (B9)', 'mcg', 'vitamin', 400, 800, 1000, 'Lieberman: Crítico para reparar ADN y bajar homocisteína.'),

-- MINERALS (Metabolic Support)
('magnesium_mg', 'Magnesio', 'mg', 'mineral', 400, 600, 800, 'Lieberman: Esencial para relajar sistema nervioso y músculos.'),
('zinc_mg', 'Zinc', 'mg', 'mineral', 11, 30, 50, 'Lieberman: Función inmune y salud prostática/hormonal.'),
('potassium_mg', 'Potasio', 'mg', 'mineral', 3500, 4700, 6000, 'Balance electrolítico y presión arterial.'),
('sodium_mg', 'Sodio', 'mg', 'mineral', 1500, 3000, 5000, 'Necesario para deportistas, moderar si eres sedentario.'),
('selenium_mcg', 'Selenio', 'mcg', 'mineral', 55, 200, 400, 'Lieberman: Potente preventivo antioxidante.'),
('iron_mg', 'Hierro', 'mg', 'mineral', 8, 15, 45, 'Transporte de oxígeno. Precaución con excesos.'),
('chromium_mcg', 'Cromo', 'mcg', 'mineral', 35, 200, 500, 'Lieberman: Factor de tolerancia a la glucosa (GTF).'),

-- AMINO ACIDS
('leucine_g', 'Leucina', 'g', 'amino', 2.5, 8.0, 15.0, 'Activador metabólico (mTOR). Mínimo 2.5g por comida.'),
('glycine_g', 'Glicina', 'g', 'amino', 3.0, 10.0, 20.0, 'Antagonista de metionina. Colágeno y sueño.'),
('methionine_g', 'Metionina', 'g', 'amino', 0.8, 2.0, 3.0, 'Pro-envejecimiento si hay exceso. Moderar.'),
('taurine_mg', 'Taurina', 'mg', 'amino', 500, 2000, 6000, 'Salud mitocondrial y modulación GABA.'),
('tryptophan_g', 'Triptófano', 'g', 'amino', 0.5, 1.0, 2.0, 'Precursor de serotonina y melatonina.'),

-- LIPIDS (Essential Fatty Acids)
('omega_3_total_g', 'Omega-3 Total', 'g', 'lipid', 1.6, 4.0, 8.0, 'Base antiinflamatoria general.'),
('omega_3_epa_dha_g', 'Omega-3 (EPA+DHA)', 'g', 'lipid', 0.5, 3.0, 6.0, 'Lieberman: Dosis antiinflamatoria funcional. Cerebro y corazón.'),
('omega_6_g', 'Omega-6', 'g', 'lipid', 10, 5, 12, 'Controlar ratio Omega-6:Omega-3 (ideal 2:1 a 4:1).'),
('sat_fat_g', 'Grasa Saturada', 'g', 'lipid', 20, 30, 50, 'No es enemiga en contexto calórico apropiado.'),
('cholesterol_mg', 'Colesterol', 'mg', 'lipid', 300, 400, 600, 'Precursor hormonal. No temer si no hay inflamación sistémica.'),

-- BIOACTIVES
('polyphenols_total_mg', 'Polifenoles', 'mg', 'bioactive', 500, 1000, 2500, 'Lieberman: Protección celular antioxidante. Té verde, cacao, bayas.');
