# Guía del Sistema de Matriz Nutricional JSONB

## Descripción General

El sistema ahora utiliza JSONB de PostgreSQL para almacenar datos nutricionales de forma flexible. Esto permite rastrear 50+ nutrientes sin crear 50 columnas individuales.

## Arquitectura

### Tabla `food_logs`

La tabla `food_logs` ahora incluye dos campos nuevos:

- `quantity_g` (numeric): Cantidad en gramos (normalizada a 100g por defecto)
- `nutritional_matrix` (jsonb): Objeto JSON con toda la información nutricional

Los campos legacy (`calories`, `protein_g`, etc.) se mantienen por compatibilidad pero se recomienda usar `nutritional_matrix`.

### Estructura del JSONB

El `nutritional_matrix` sigue esta jerarquía:

```json
{
  "A_macronutrients": {
    "calories": 150,
    "protein_g": 20,
    "carbs_g": 5,
    "fat_g": 7,
    "fiber_g": 2,
    "sugar_g": 1
  },
  "B_vitamins": {
    "vitamin_a_mcg": 500,
    "vitamin_c_mg": 10,
    "vitamin_d_mcg": 2,
    "vitamin_e_mg": 5,
    "vitamin_k_mcg": 80,
    "vitamin_b1_thiamin_mg": 0.1,
    "vitamin_b2_riboflavin_mg": 0.2,
    "vitamin_b3_niacin_mg": 3,
    "vitamin_b5_pantothenic_mg": 1,
    "vitamin_b6_mg": 0.5,
    "vitamin_b7_biotin_mcg": 30,
    "vitamin_b9_folate_mcg": 100,
    "vitamin_b12_mcg": 2
  },
  "C_minerals": {
    "calcium_mg": 100,
    "iron_mg": 2,
    "magnesium_mg": 50,
    "phosphorus_mg": 200,
    "potassium_mg": 300,
    "sodium_mg": 100,
    "zinc_mg": 3,
    "copper_mg": 0.5,
    "manganese_mg": 0.5,
    "selenium_mcg": 20,
    "chromium_mcg": 10,
    "iodine_mcg": 50
  },
  "D_amino_acids": {
    "leucine_mg": 1500,
    "isoleucine_mg": 800,
    "valine_mg": 900,
    "lysine_mg": 1200,
    "methionine_mg": 400,
    "phenylalanine_mg": 700,
    "threonine_mg": 600,
    "tryptophan_mg": 200,
    "histidine_mg": 500
  },
  "E_fatty_acids": {
    "saturated_g": 2,
    "monounsaturated_g": 3,
    "polyunsaturated_g": 2,
    "omega_3_mg": 500,
    "omega_6_mg": 1000,
    "trans_fat_g": 0
  },
  "F_other": {
    "cholesterol_mg": 50,
    "caffeine_mg": 0,
    "alcohol_g": 0,
    "water_g": 70
  }
}
```

## Utilidades TypeScript

### Funciones Helper Disponibles

#### `getMacros(matrix)`
Extrae macronutrientes del JSONB:

```typescript
import { getMacros } from '../lib/nutritionUtils';

const macros = getMacros(foodLog.nutritional_matrix);
// { calories: 150, protein: 20, carbs: 5, fat: 7, fiber: 2, sugar: 1 }
```

#### `getVitamins(matrix)`
Extrae todas las vitaminas:

```typescript
const vitamins = getVitamins(foodLog.nutritional_matrix);
// { vitamin_a_mcg: 500, vitamin_c_mg: 10, ... }
```

#### `getMinerals(matrix)`
Extrae todos los minerales:

```typescript
const minerals = getMinerals(foodLog.nutritional_matrix);
// { calcium_mg: 100, iron_mg: 2, ... }
```

#### `getAminoAcids(matrix)`
Extrae aminoácidos:

```typescript
const aminoAcids = getAminoAcids(foodLog.nutritional_matrix);
```

#### `getFattyAcids(matrix)`
Extrae ácidos grasos:

```typescript
const fattyAcids = getFattyAcids(foodLog.nutritional_matrix);
```

#### `getOther(matrix)`
Extrae otros nutrientes (colesterol, cafeína, etc.):

```typescript
const other = getOther(foodLog.nutritional_matrix);
```

#### `getNutrientValue(matrix, category, nutrient)`
Obtiene un valor específico:

```typescript
const vitaminC = getNutrientValue(matrix, 'B_vitamins', 'vitamin_c_mg');
```

#### `createNutritionalMatrix(data)`
Crea una matriz nutricional desde datos simples:

```typescript
const matrix = createNutritionalMatrix({
  calories: 200,
  protein_g: 25,
  carbs_g: 10,
  fat_g: 8,
  vitamin_c_mg: 15,
  iron_mg: 3
});
```

#### `sumNutritionalMatrices(matrices)`
Suma múltiples matrices (útil para totales diarios):

```typescript
const todayLogs = [...]; // array de food_logs
const matrices = todayLogs.map(log => log.nutritional_matrix);
const totalNutrition = sumNutritionalMatrices(matrices);
```

## Consultas SQL

### Consultar nutrientes específicos

```sql
-- Obtener alimentos con más de 100mg de vitamina C
SELECT food_name,
       nutritional_matrix->'B_vitamins'->>'vitamin_c_mg' as vitamin_c
FROM food_logs
WHERE (nutritional_matrix->'B_vitamins'->>'vitamin_c_mg')::numeric > 100;
```

### Sumar nutrientes del día

```sql
-- Total de proteína consumida hoy
SELECT SUM((nutritional_matrix->'A_macronutrients'->>'protein_g')::numeric) as total_protein
FROM food_logs
WHERE user_id = 'user-uuid'
  AND logged_at >= CURRENT_DATE
  AND logged_at < CURRENT_DATE + INTERVAL '1 day';
```

### Buscar alimentos por categoría de nutrientes

```sql
-- Alimentos ricos en aminoácidos específicos
SELECT food_name,
       nutritional_matrix->'D_amino_acids'->>'leucine_mg' as leucine
FROM food_logs
WHERE nutritional_matrix ? 'D_amino_acids'
  AND (nutritional_matrix->'D_amino_acids'->>'leucine_mg')::numeric > 1000;
```

### Análisis avanzado

```sql
-- Promedio de macros por tipo de comida
SELECT meal_type,
       AVG((nutritional_matrix->'A_macronutrients'->>'calories')::numeric) as avg_calories,
       AVG((nutritional_matrix->'A_macronutrients'->>'protein_g')::numeric) as avg_protein,
       AVG((nutritional_matrix->'A_macronutrients'->>'carbs_g')::numeric) as avg_carbs
FROM food_logs
WHERE user_id = 'user-uuid'
GROUP BY meal_type;
```

## Rendimiento

### Índices

El sistema incluye un índice GIN para búsquedas rápidas:

```sql
CREATE INDEX idx_food_logs_nutritional_matrix
ON food_logs USING gin (nutritional_matrix);
```

Este índice permite:
- Búsquedas rápidas por cualquier nutriente
- Consultas de existencia (`?` operator)
- Consultas de contención (`@>` operator)

### Mejores Prácticas

1. **Normalizar a 100g**: Siempre normaliza las cantidades a 100g para facilitar comparaciones
2. **Completar datos**: Llena todos los campos que conozcas, incluso si son 0
3. **Usar helpers**: Usa las funciones helper en TypeScript en lugar de acceder directamente al JSON
4. **Batch inserts**: Para múltiples alimentos, usa inserts en batch

## Migración de Datos Legacy

Los datos existentes se migraron automáticamente al nuevo formato. Puedes verificar:

```sql
SELECT food_name,
       calories as legacy_calories,
       nutritional_matrix->'A_macronutrients'->>'calories' as matrix_calories
FROM food_logs
LIMIT 10;
```

## Extensibilidad

Para agregar nuevos nutrientes:

1. No requiere cambios en el schema de la base de datos
2. Simplemente agrega el campo al JSON cuando insertes
3. Actualiza el tipo TypeScript `NutritionalMatrix` si quieres type-safety
4. Crea helpers si necesitas acceso frecuente al nuevo nutriente

Ejemplo:

```typescript
// Agregar Omega-9 sin cambiar el schema
await supabase.from('food_logs').insert({
  user_id: userId,
  food_name: "Aceite de oliva",
  nutritional_matrix: {
    A_macronutrients: { ... },
    E_fatty_acids: {
      omega_3_mg: 100,
      omega_6_mg: 800,
      omega_9_mg: 5000  // ¡Nuevo nutriente!
    }
  }
});
```

## Biohacking & Analytics

Este sistema es ideal para biohacking porque:

1. **Tracking completo**: Rastrea 50+ nutrientes sin limitaciones
2. **Consultas flexibles**: Analiza cualquier combinación de nutrientes
3. **Histórico completo**: Mantiene datos históricos sin pérdida de información
4. **Escalable**: Agrega nuevos nutrientes sin migrar datos
5. **Performante**: Los índices GIN hacen las consultas muy rápidas

### Casos de Uso Avanzados

```typescript
// 1. Tracking de ratio Omega-3 a Omega-6
const omega3 = getNutrientValue(matrix, 'E_fatty_acids', 'omega_3_mg');
const omega6 = getNutrientValue(matrix, 'E_fatty_acids', 'omega_6_mg');
const ratio = omega3 / omega6;

// 2. Perfil completo de aminoácidos para optimizar síntesis proteica
const aminoAcids = getAminoAcids(matrix);
const bcaa = aminoAcids.leucine_mg + aminoAcids.isoleucine_mg + aminoAcids.valine_mg;

// 3. Análisis de micronutrientes para longevidad
const longevityNutrients = {
  vitaminD: getNutrientValue(matrix, 'B_vitamins', 'vitamin_d_mcg'),
  magnesium: getNutrientValue(matrix, 'C_minerals', 'magnesium_mg'),
  omega3: getNutrientValue(matrix, 'E_fatty_acids', 'omega_3_mg'),
};
```
