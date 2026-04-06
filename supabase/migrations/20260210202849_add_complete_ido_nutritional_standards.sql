/*
  # Complete IDO Nutritional Standards - Biohacker Level

  1. Philosophy
    - RDA (min_survival_value): Government minimum to prevent deficiency
    - ODI (min_optimal_value): Lieberman's Optimal Daily Intake for peak performance
    - UL (max_optimal_value): Upper safe limit before toxicity risk

  2. New Standards Added

    **A. Complete B-Vitamin Complex (Energy & Methylation)**
    - B1 Thiamin: ATP production, nerve function
    - B2 Riboflavin: FAD coenzyme, migraine prevention
    - B3 Niacin: NAD+ production, DNA repair
    - B5 Pantothenic: CoA synthesis, hormone production
    - B6 Pyridoxine: Neurotransmitter synthesis, homocysteine reduction
    - B7 Biotin: Fatty acid synthesis, hair/skin health

    **B. Structural & Trace Minerals**
    - Calcium: Bone structure, muscle contraction, nerve signaling
    - Copper: Iron metabolism, ATP production, Zn:Cu ratio
    - Manganese: SOD2 antioxidant, mitochondrial protection
    - Phosphorus: ATP backbone, bone mineralization
    - Iodine: Thyroid hormones T3/T4, metabolic rate

    **C. Essential Amino Acids (Complete Profile)**
    - Isoleucine: BCAA, glucose metabolism
    - Valine: BCAA, muscle recovery
    - Lysine: Collagen synthesis, antiviral
    - Phenylalanine: Dopamine/norepinephrine precursor
    - Threonine: Gut mucin, immunity
    - Histidine: Histamine precursor, immune response

    **D. Bioactive Compounds**
    - Choline: Acetylcholine, memory, liver health
    - Anthocyanins: Neuroprotection, antioxidant
    - Vitamin K1: Blood coagulation (distinct from K2)

  3. Scientific Sources
    - Lieberman "The Real Vitamin & Mineral Book"
    - ISSN Position Stands
    - Institute of Medicine DRIs
    - Examine.com Research Database
*/

-- B-VITAMIN COMPLEX (Energy Metabolism & Methylation)
INSERT INTO nutritional_standards (nutrient_key, label, unit, category, min_survival_value, min_optimal_value, max_optimal_value, description) VALUES
('vitamin_b1_thiamin_mg', 'Vitamina B1 (Tiamina)', 'mg', 'vitamin', 1.2, 25, 100, 'Lieberman: 25-100mg. Crítica para metabolismo de carbohidratos y función nerviosa. Deficiencia causa beriberi.'),
('vitamin_b2_riboflavin_mg', 'Vitamina B2 (Riboflavina)', 'mg', 'vitamin', 1.3, 25, 100, 'Lieberman: 25-100mg. Esencial para producción de FAD. Previene migrañas en dosis altas.'),
('vitamin_b3_niacin_mg', 'Vitamina B3 (Niacina)', 'mg', 'vitamin', 16, 50, 500, 'Lieberman: 50-100mg. Precursor de NAD+ para energía celular. Flush por encima de 100mg.'),
('vitamin_b5_pantothenic_mg', 'Vitamina B5 (Ácido Pantoténico)', 'mg', 'vitamin', 5, 100, 500, 'Lieberman: 100-500mg. Necesario para CoA. Soporte adrenal bajo estrés.'),
('vitamin_b6_pyridoxine_mg', 'Vitamina B6 (Piridoxina)', 'mg', 'vitamin', 1.7, 25, 100, 'Lieberman: 25-100mg. Síntesis de neurotransmisores. Reduce homocisteína con B12 y folato.'),
('vitamin_b7_biotin_mcg', 'Vitamina B7 (Biotina)', 'mcg', 'vitamin', 30, 300, 5000, 'Lieberman: 300-600mcg. Metabolismo de grasas. Importante para cabello, piel y uñas.')
ON CONFLICT (nutrient_key) DO UPDATE SET
  min_survival_value = EXCLUDED.min_survival_value,
  min_optimal_value = EXCLUDED.min_optimal_value,
  max_optimal_value = EXCLUDED.max_optimal_value,
  description = EXCLUDED.description;

-- STRUCTURAL & TRACE MINERALS
INSERT INTO nutritional_standards (nutrient_key, label, unit, category, min_survival_value, min_optimal_value, max_optimal_value, description) VALUES
('calcium_mg', 'Calcio', 'mg', 'mineral', 1000, 1200, 2500, 'Lieberman: 1000-1500mg. Huesos, músculos, nervios. Requiere vitamina D y K2 para absorción óptima.'),
('copper_mg', 'Cobre', 'mg', 'mineral', 0.9, 2, 10, 'Lieberman: 2-3mg. Crítico para metabolismo del hierro y producción de ATP. Ratio Zn:Cu ideal 10:1.'),
('manganese_mg', 'Manganeso', 'mg', 'mineral', 2.3, 5, 11, 'Lieberman: 5-10mg. Cofactor de SOD2 mitocondrial. Protección antioxidante crucial.'),
('phosphorus_mg', 'Fósforo', 'mg', 'mineral', 700, 1000, 4000, 'Base estructural del ATP. Relación Ca:P ideal 1:1 a 2:1. Exceso depleta calcio.'),
('iodine_mcg', 'Yodo', 'mcg', 'mineral', 150, 300, 1100, 'Lieberman: 150-300mcg. Síntesis de T3/T4 tiroideas. Deficiencia causa hipotiroidismo subclínico.')
ON CONFLICT (nutrient_key) DO UPDATE SET
  min_survival_value = EXCLUDED.min_survival_value,
  min_optimal_value = EXCLUDED.min_optimal_value,
  max_optimal_value = EXCLUDED.max_optimal_value,
  description = EXCLUDED.description;

-- ESSENTIAL AMINO ACIDS (Complete Profile - ISSN Guidelines)
INSERT INTO nutritional_standards (nutrient_key, label, unit, category, min_survival_value, min_optimal_value, max_optimal_value, description) VALUES
('isoleucine_g', 'Isoleucina', 'g', 'amino', 1.4, 3.0, 6.0, 'BCAA. Metabolismo de glucosa muscular. ISSN: 3-6g/día para atletas.'),
('valine_g', 'Valina', 'g', 'amino', 1.8, 4.0, 8.0, 'BCAA. Reparación muscular y energía. Ratio BCAA ideal Leu:Iso:Val = 2:1:1.'),
('lysine_g', 'Lisina', 'g', 'amino', 2.1, 3.0, 6.0, 'Síntesis de colágeno y carnitina. Función antiviral (inhibe replicación HSV).'),
('phenylalanine_g', 'Fenilalanina', 'g', 'amino', 1.8, 3.0, 5.0, 'Precursor de tirosina → dopamina → norepinefrina. Cognición y motivación.'),
('threonine_g', 'Treonina', 'g', 'amino', 1.3, 2.5, 5.0, 'Producción de mucina intestinal. Esencial para integridad de barrera gut.'),
('histidine_g', 'Histidina', 'g', 'amino', 1.0, 2.0, 4.0, 'Precursor de histamina. Respuesta inmune y regulación ácido gástrico.')
ON CONFLICT (nutrient_key) DO UPDATE SET
  min_survival_value = EXCLUDED.min_survival_value,
  min_optimal_value = EXCLUDED.min_optimal_value,
  max_optimal_value = EXCLUDED.max_optimal_value,
  description = EXCLUDED.description;

-- BIOACTIVE COMPOUNDS (Cognitive & Antioxidant)
INSERT INTO nutritional_standards (nutrient_key, label, unit, category, min_survival_value, min_optimal_value, max_optimal_value, description) VALUES
('choline_mg', 'Colina', 'mg', 'bioactive', 550, 1000, 3500, 'Lieberman: 500-2000mg. Precursor de acetilcolina (memoria). Salud hepática y metilación.'),
('anthocyanins_mg', 'Antocianinas', 'mg', 'bioactive', 50, 200, 500, 'Flavonoides neuroprotectores. Cruzan barrera hematoencefálica. Arándanos, moras, uvas.'),
('vitamin_k1_mcg', 'Vitamina K1 (Filoquinona)', 'mcg', 'vitamin', 90, 200, 1000, 'Coagulación sanguínea. Diferente de K2 (calcificación ósea). Vegetales de hoja verde.')
ON CONFLICT (nutrient_key) DO UPDATE SET
  min_survival_value = EXCLUDED.min_survival_value,
  min_optimal_value = EXCLUDED.min_optimal_value,
  max_optimal_value = EXCLUDED.max_optimal_value,
  description = EXCLUDED.description;

-- Update existing amino acid units from 'g' to mg where appropriate for consistency
UPDATE nutritional_standards 
SET unit = 'mg', 
    min_survival_value = min_survival_value * 1000,
    min_optimal_value = min_optimal_value * 1000,
    max_optimal_value = max_optimal_value * 1000
WHERE nutrient_key IN ('isoleucine_g', 'valine_g', 'lysine_g', 'phenylalanine_g', 'threonine_g', 'histidine_g')
  AND unit = 'g';

-- Rename keys to match food_logs columns (mg suffix)
UPDATE nutritional_standards SET nutrient_key = 'isoleucine_mg' WHERE nutrient_key = 'isoleucine_g';
UPDATE nutritional_standards SET nutrient_key = 'valine_mg' WHERE nutrient_key = 'valine_g';
UPDATE nutritional_standards SET nutrient_key = 'lysine_mg' WHERE nutrient_key = 'lysine_g';
UPDATE nutritional_standards SET nutrient_key = 'phenylalanine_mg' WHERE nutrient_key = 'phenylalanine_g';
UPDATE nutritional_standards SET nutrient_key = 'threonine_mg' WHERE nutrient_key = 'threonine_g';
UPDATE nutritional_standards SET nutrient_key = 'histidine_mg' WHERE nutrient_key = 'histidine_g';
