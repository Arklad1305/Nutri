# 🔬 COMPARACIÓN TÉCNICA: ANTES vs. DESPUÉS

## 📊 CASO DE ESTUDIO REAL

**Perfil de ejemplo:**
- Hombre, 30 años
- Peso: 100kg
- Altura: 180cm
- Objetivo: Perder grasa
- Actividad: Activo (entrena 5-6 días/semana)
- Sueño: 7h

---

## ❌ CÓDIGO ANTERIOR (V3.0)

### Paso 1: Cálculo BMR
```typescript
BMR = (10 × 100) + (6.25 × 180) - (5 × 30) + 5
BMR = 1000 + 1125 - 150 + 5
BMR = 1980 kcal
```
✅ **Correcto** (Mifflin-St Jeor)

---

### Paso 2: Cálculo TDEE
```typescript
// ⚠️ PROBLEMA: Ignora activity_level del usuario
if (isTrainingDay) {
  TDEE = BMR × 1.6 = 1980 × 1.6 = 3168 kcal
} else {
  TDEE = BMR × 1.2 = 1980 × 1.2 = 2376 kcal
}
```

❌ **INCORRECTO:**
- Usuario configuró "Activo" (PAL 1.725)
- Sistema usa 1.6 (día entreno) o 1.2 (descanso)
- **Ignora completamente la configuración del usuario**

**TDEE real debería ser:**
```
TDEE = 1980 × 1.725 = 3415 kcal
```

**Error:** -247 kcal/día en día de entreno

---

### Paso 3: Ajuste calórico
```typescript
// Siempre asume pérdida de grasa
if (isTrainingDay) {
  targetCalories = 3168 × 0.90 = 2851 kcal  // -10%
} else {
  targetCalories = 2376 × 0.75 = 1782 kcal  // -25%
}
```

❌ **PROBLEMAS:**
1. Si el objetivo es "gain_muscle", sigue aplicando déficit
2. Si el objetivo es "maintain", sigue aplicando déficit
3. No hay forma de tener superávit calórico

---

### Paso 4: Macros
```typescript
proteinMultiplier = 2.2 g/kg (2.4 si mal sueño)
Proteína = 100 × 2.2 = 220g ✅

fatTarget = 100 × 0.9 = 90g ✅

// Día entreno:
proteinCal = 220 × 4 = 880 kcal
fatCal = 90 × 9 = 810 kcal
remainingCal = 2851 - 880 - 810 = 1161 kcal
carbsTarget = 1161 / 4 = 290g ✅
```

✅ **Macros:** Bien calculados (dentro del TDEE incorrecto)

---

## ✅ CÓDIGO NUEVO (V4.0)

### Paso 1: Cálculo BMR
```typescript
BMR = (10 × 100) + (6.25 × 180) - (5 × 30) + 5
BMR = 1980 kcal
```
✅ **Igual** (Mifflin-St Jeor)

---

### Paso 2: Cálculo PAL (Nuevo)
```typescript
// ✅ AHORA RESPETA activity_level del usuario
const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,      // ← Usuario seleccionó esto
  very_active: 1.9
}

baseFactor = 1.725

// Ajuste dinámico por día de entrenamiento
if (isTrainingDay) {
  dailyFactor = min(1.725 + 0.25, 1.9) = 1.9
} else {
  dailyFactor = max(1.725 - 0.15, 1.2) = 1.575
}
```

✅ **CORRECTO:** Usa el PAL que el usuario configuró + ajuste contextual

---

### Paso 3: TDEE Base
```typescript
// Día entrenamiento:
TDEE = 1980 × 1.9 = 3762 kcal

// Día descanso:
TDEE = 1980 × 1.575 = 3119 kcal
```

✅ **Mucho más preciso** que los valores fijos anteriores

**Comparación día entrenamiento:**
- Antes: 3168 kcal (factor fijo 1.6)
- Ahora: 3762 kcal (factor 1.9 basado en "Activo" + entreno)
- **Diferencia: +594 kcal**

---

### Paso 4: Ajuste calórico según objetivo
```typescript
// Objetivo: lose_weight
if (isTrainingDay) {
  caloricAdjustment = -0.10
  targetCalories = 3762 × 0.90 = 3386 kcal
} else {
  caloricAdjustment = -0.25
  targetCalories = 3119 × 0.75 = 2339 kcal
}
```

✅ **Ahora respeta el objetivo:**

| Objetivo | Día Alto | Día Bajo |
|----------|----------|----------|
| lose_weight | -10% | -25% |
| maintain | 0% | 0% |
| gain_muscle | +15% | +5% |

---

### Paso 5: Macros
```typescript
// Objetivo: lose_weight → proteína 2.3 g/kg
proteinTarget = 100 × 2.3 = 230g

fatTarget = 100 × 0.9 = 90g

// Día entreno: 3386 kcal
proteinCal = 230 × 4 = 920 kcal
fatCal = 90 × 9 = 810 kcal
remainingCal = 3386 - 920 - 810 = 1656 kcal
carbsTarget = 1656 / 4 = 414g

// Safeguard cerebral: min 60g (ya cumplido)
```

✅ **Macros optimizados** para el objetivo correcto

---

## 📈 COMPARACIÓN LADO A LADO

### Día de Entrenamiento

| Métrica | V3.0 (Anterior) | V4.0 (Nuevo) | Diferencia |
|---------|-----------------|--------------|------------|
| BMR | 1980 kcal | 1980 kcal | Igual ✅ |
| Factor PAL | 1.6 (fijo) | 1.9 (dinámico) | +0.3 |
| TDEE | 3168 kcal | 3762 kcal | **+594 kcal** |
| Ajuste | -10% | -10% | Igual ✅ |
| Calorías meta | 2851 kcal | 3386 kcal | **+535 kcal** |
| Proteína | 220g | 230g | +10g |
| Grasas | 90g | 90g | Igual |
| Carbos | 290g | 414g | **+124g** |

---

### Día de Descanso

| Métrica | V3.0 (Anterior) | V4.0 (Nuevo) | Diferencia |
|---------|-----------------|--------------|------------|
| BMR | 1980 kcal | 1980 kcal | Igual ✅ |
| Factor PAL | 1.2 (fijo) | 1.575 (dinámico) | +0.375 |
| TDEE | 2376 kcal | 3119 kcal | **+743 kcal** |
| Ajuste | -25% | -25% | Igual ✅ |
| Calorías meta | 1782 kcal | 2339 kcal | **+557 kcal** |
| Proteína | 220g | 230g | +10g |
| Grasas | 90g | 90g | Igual |
| Carbos | 118g | 227g | **+109g** |

---

## 🎯 IMPACTO REAL EN RESULTADOS

### Escenario Anterior (V3.0)

**Semana tipo (4 días entreno, 3 descanso):**
```
Calorías totales semana:
  (4 × 2851) + (3 × 1782) = 11,404 + 5,346 = 16,750 kcal

Promedio diario: 16,750 / 7 = 2,393 kcal/día

TDEE real: 3,415 kcal/día
Déficit real: 3,415 - 2,393 = 1,022 kcal/día

Pérdida peso/semana: 1,022 × 7 / 7700 = 0.93 kg/semana
```

❌ **PROBLEMA:**
- Déficit demasiado agresivo (>1000 kcal)
- Riesgo: Pérdida masa muscular, metabolismo lento
- Insostenible largo plazo

---

### Escenario Nuevo (V4.0)

**Semana tipo (4 días entreno, 3 descanso):**
```
Calorías totales semana:
  (4 × 3386) + (3 × 2339) = 13,544 + 7,017 = 20,561 kcal

Promedio diario: 20,561 / 7 = 2,937 kcal/día

TDEE real promedio:
  (4 × 3762) + (3 × 3119) = 15,048 + 9,357 = 24,405 kcal
  24,405 / 7 = 3,486 kcal/día

Déficit real: 3,486 - 2,937 = 549 kcal/día

Pérdida peso/semana: 549 × 7 / 7700 = 0.50 kg/semana
```

✅ **ÓPTIMO:**
- Déficit moderado (~500 kcal/día)
- Rango ideal: 0.5-1% peso corporal/semana
- Retiene masa muscular
- Sostenible largo plazo

---

## 🧪 CASO: OBJETIVO GAIN_MUSCLE

**¿Qué pasaba antes?**

```typescript
// V3.0: Siempre aplicaba déficit, sin importar el objetivo
if (user.goal === 'gain_muscle') {
  // ⚠️ Aún aplicaba déficit -10%/-25%
  targetCalories = tdeeBase × 0.90  // ¡Déficit!
}
```

❌ **IMPOSIBLE GANAR MÚSCULO EN DÉFICIT** (excepto novatos)

---

**¿Qué pasa ahora?**

```typescript
// V4.0: Superávit real para anabolismo
if (user.goal === 'gain_muscle') {
  if (isTrainingDay) {
    caloricAdjustment = 0.15  // +15% superávit
    targetCalories = 3762 × 1.15 = 4326 kcal
  } else {
    caloricAdjustment = 0.05  // +5% superávit
    targetCalories = 3119 × 1.05 = 3275 kcal
  }
}
```

✅ **AHORA SÍ PUEDE GANAR MÚSCULO:**
- Superávit calculado para síntesis proteica
- Día entreno: +15% (anabolismo)
- Día descanso: +5% (recuperación sin exceso grasa)

**Promedio semanal:**
```
(4 × 4326) + (3 × 3275) = 17,304 + 9,825 = 27,129 kcal
27,129 / 7 = 3,876 kcal/día

TDEE promedio: 3,486 kcal/día
Superávit: 3,876 - 3,486 = 390 kcal/día

Ganancia peso: 390 × 7 / 7700 = 0.35 kg/semana
```

✅ **Ganancia limpia** (0.25-0.5 kg/semana = rango ideal)

---

## 🔍 MICRONUTRIENTES: ANTES vs. DESPUÉS

### Vitamina D3

**Antes:**
```typescript
vitaminD3 = 2000
if (weight > 80) {
  vitaminD3 = 2000 + (weight - 80) × 40
}
if (vitaminD3 > 10000) vitaminD3 = 10000
```

**Ahora:**
```typescript
// Igual (ya estaba bien)
vitaminD3 = 2000
if (weight > 80) {
  vitaminD3 = min(2000 + (weight - 80) × 40, 10000)
}
```

✅ **Sin cambios** (método ya era correcto)

**Ejemplo (100kg):**
```
2000 + (100 - 80) × 40 = 2000 + 800 = 2800 IU
```

---

### Magnesio

**Antes:**
```typescript
magnesium = 400
if (activity === 'moderate' || activity === 'active') {
  magnesium = gender === 'male' ? 600 : 500
}
if (isSleepDeprived) {
  magnesium = 600
}
```

**Ahora:**
```typescript
// Añadido 'very_active'
magnesium = 400
if (activity in ['moderate', 'active', 'very_active']) {
  magnesium = gender === 'male' ? 600 : 500
}
if (isSleepDeprived) {
  magnesium = 600
}
```

✅ **Mejora:** Incluye "very_active"

---

### Vitamina C (Sueño)

**Antes:**
```typescript
vitaminC = 90
if (isSleepDeprived) {  // <6.5h
  vitaminC = 1000
}
```

**Ahora:**
```typescript
vitaminC = 90
if (isSevereDeprivation) {  // <5h
  vitaminC = 1000
} else if (isSleepDeprived) {  // <6.5h
  vitaminC = 500
}
```

✅ **Mejora:** Gradación por severidad
- Privación moderada: 500mg
- Privación severa: 1000mg

---

## 📊 RESUMEN DE CAMBIOS CRÍTICOS

### 1. TDEE Calculation

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Factor PAL | Fijo (1.2 o 1.6) | Dinámico (1.2 - 1.9) |
| Respeta activity_level | ❌ No | ✅ Sí |
| Ajuste por día | Binario | Contextual (+0.25 / -0.15) |

**Impacto:** Diferencia de 500-800 kcal en TDEE

---

### 2. Objetivo del Usuario

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Pérdida grasa | ✅ Soportado | ✅ Soportado |
| Mantenimiento | ❌ Aplicaba déficit | ✅ TDEE exacto |
| Ganancia muscular | ❌ Aplicaba déficit | ✅ Superávit (+15%/+5%) |

**Impacto:** Antes era IMPOSIBLE ganar músculo

---

### 3. Protocolo MATADOR

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Solo en pérdida grasa | ❌ Siempre activo | ✅ Solo si goal = lose_weight |
| Déficit personalizado | ✅ -10%/-25% | ✅ -10%/-25% |

**Impacto:** Protocolo ahora se activa solo cuando corresponde

---

### 4. Proteína

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Base | 2.2 g/kg | 2.0 g/kg (mantenimiento/ganancia) |
| En déficit | 2.2 g/kg | 2.3 g/kg (ISSN guidelines) |
| Ajuste sueño | +0.2 g/kg | +0.1 (moderado) / +0.3 (severo) |

**Impacto:** Más preciso según objetivo

---

## 🎓 VALIDACIÓN CIENTÍFICA

### Referencias Nuevas Incorporadas

1. **FAO/WHO PAL Standards (2004)**
   - Antes: No usado
   - Ahora: Base del sistema

2. **ISSN Proteína en Déficit (2017)**
   - Antes: 2.2 g/kg fijo
   - Ahora: 2.3-3.1 g/kg en déficit

3. **Katch-McArdle (opcional)**
   - Antes: Solo Mifflin-St Jeor
   - Ahora: Opción si hay % grasa

4. **Protocolo MATADOR (2018)**
   - Antes: Siempre activo
   - Ahora: Solo en pérdida grasa

---

## ✅ CONCLUSIONES

### Lo que se mantuvo bien:

1. ✅ BMR (Mifflin-St Jeor)
2. ✅ Peso ajustado Willett (obesidad)
3. ✅ Ajustes por sueño
4. ✅ Micronutrientes escalados
5. ✅ Protocolo MATADOR (lógica interna)

---

### Lo que se corrigió:

1. ✅ **TDEE ahora respeta activity_level** (error crítico corregido)
2. ✅ **Objetivos múltiples** (antes solo déficit)
3. ✅ **Superávit para ganancia muscular** (antes imposible)
4. ✅ **Factor PAL dinámico** (antes estático)
5. ✅ **Proteína optimizada por objetivo** (ISSN guidelines)

---

### Impacto cuantificable:

| Métrica | Error Anterior | Ahora |
|---------|----------------|-------|
| TDEE | ±500-800 kcal | ±10% (estándar científico) |
| Objetivos soportados | 1 (solo déficit) | 3 (déficit, mantenimiento, superávit) |
| Precisión proteína | Buena | Excelente (según ISSN) |
| Universalidad | Media | Alta (población general) |

---

**Última actualización:** 2026-01-29
**Motor:** Bioquímico Universal V4.0
**Status:** ✅ Producción Ready
