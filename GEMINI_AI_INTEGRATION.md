# Integración de IA con Gemini - Sistema Completo

## Descripción General

El sistema ahora usa **Google Gemini 1.5 Flash** directamente desde el Edge Function de Supabase, eliminando la necesidad de n8n como intermediario. La IA analiza texto en lenguaje natural y calcula automáticamente todos los nutrientes organizados en los 4 grupos bioquímicos.

---

## Arquitectura del Flujo

```
Usuario escribe "200g de salmón"
         ↓
Frontend envía a Edge Function
         ↓
Edge Function → Gemini API (con prompt biohacker)
         ↓
Gemini retorna JSON estructurado
         ↓
Edge Function parsea y limpia JSON
         ↓
Edge Function inserta en food_logs (VIP + JSONB)
         ↓
Frontend recarga datos y muestra
```

---

## 1. Edge Function: process-food-ai

**Ubicación:** `/supabase/functions/process-food-ai/index.ts`

**URL de Producción:**
```
https://gdoquewussvvkmwgdgxp.supabase.co/functions/v1/process-food-ai
```

### Request Format

```typescript
POST /functions/v1/process-food-ai
Headers:
  Authorization: Bearer <user_jwt_token>
  Content-Type: application/json

Body:
{
  "message": "200g de salmón a la plancha con brócoli"
}
```

### Response Format

```typescript
{
  "success": true,
  "data": {
    "id": 123,
    "user_id": "uuid",
    "food_name": "Salmón a la plancha con brócoli",
    "quantity_g": 200,
    "reply_text": "Excelente elección: proteína de alta calidad, omega-3 y antioxidantes",
    "calories": 320,
    "protein_g": 45,
    "carbs_g": 8,
    "fat_g": 15,
    // ... resto de VIP columns
    "nutritional_matrix": {
      "motor": { ... },
      "cognitive": { ... },
      "hormonal": { ... },
      "inflammation": { ... }
    }
  }
}
```

---

## 2. Prompt de IA (System Prompt)

El prompt está optimizado para biohacking y organiza nutrientes en 4 grupos funcionales:

### Los 4 Grupos Bioquímicos

**GRUPO 1 - MOTOR (Energía, Rendimiento Físico)**
- Macros: calorías, proteína, carbohidratos, grasas, fibra, azúcares
- Hidratación: agua
- Electrolitos: sodio, potasio, cloruro
- Aminoácidos Estructurales: leucina, isoleucina, valina, lisina, metionina, treonina
- Minerales Estructurales: hierro, zinc, magnesio

**GRUPO 2 - COGNITIVO (Neurotransmisores, Energía Mental)**
- Aminoácidos Neuro: triptófano, fenilalanina, tirosina, histidina
- Neuronutrientes: taurina, colina, creatina
- Vitaminas B: B1-B12, Folato
- Vitamina C
- Minerales Traza: selenio, cromo
- Electrolitos: sodio, potasio

**GRUPO 3 - HORMONAL (Testosterona, Insulina, Tiroides)**
- Tiroides/Insulina: zinc, magnesio, selenio, cromo, yodo, manganeso
- Vitaminas Liposolubles: A, D3, E, K1, K2
- Estructura Ósea: calcio, fósforo, cobre, hierro

**GRUPO 4 - INFLAMACIÓN (Balance Omega, Antioxidantes)**
- Perfil Lipídico: omega-3, omega-6, grasas saturadas, trans, colesterol
- Antiinflamatorios: EPA, DHA, ALA, vitamina E
- Bioactivos: polifenoles, antocianinas, quercetina, resveratrol, curcumina

---

## 3. Estrategia de Inferencia de la IA

### Reglas de Inferencia Inteligente

1. **Cantidades no especificadas:**
   - Porción estándar de proteína: 150-200g
   - Guarnición de vegetales: 100g
   - Carbohidratos complejos: 100g
   - Frutas: 1 pieza mediana (~150g)

2. **Estimación de Micronutrientes:**
   - La IA usa bases de datos nutricionales internalizadas
   - Prioriza precisión sobre completitud
   - Si no conoce un valor con certeza, usa 0

3. **Contexto Contextual:**
   - "Salmón" → Automáticamente infiere omega-3 alto, vitamina D, proteína completa
   - "Brócoli" → Vitamina C, folato, sulforafano (polifenoles)
   - "Aguacate" → Grasas monoinsaturadas, potasio, folato

---

## 4. Estructura de Datos (Hybrid Schema)

### Columnas VIP (Acceso Rápido en SQL)

```sql
-- MOTOR
calories NUMERIC
protein_g NUMERIC
carbs_g NUMERIC
fat_g NUMERIC
water_ml NUMERIC
leucine_mg NUMERIC
sodium_mg NUMERIC

-- COGNITIVE
choline_mg NUMERIC

-- HORMONAL
zinc_mg NUMERIC
magnesium_mg NUMERIC
vit_d3_iu NUMERIC

-- INFLAMMATION
omega_3_total_g NUMERIC
polyphenols_total_mg NUMERIC
```

### JSONB nutritional_matrix (Detalles Completos)

```typescript
{
  motor: {
    calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, water_ml,
    electrolytes: { sodium_mg, potassium_mg, chloride_mg },
    aminos_muscle: { leucine_mg, isoleucine_mg, valine_mg, ... },
    structure_minerals: { iron_mg, zinc_mg, magnesium_mg }
  },
  cognitive: {
    aminos_brain: { tryptophan_mg, phenylalanine_mg, tyrosine_mg, histidine_mg },
    neuro_others: { taurine_mg, choline_mg, creatine_mg },
    energy_vitamins: { vit_b1_mg, vit_b2_mg, ..., vit_b12_mcg, vit_c_mg },
    trace_minerals: { selenium_mcg, chromium_mcg },
    electrolytes: { sodium_mg, potassium_mg }
  },
  hormonal: {
    thyroid_insulin: { zinc_mg, magnesium_mg, selenium_mcg, chromium_mcg, iodine_mcg, manganese_mg },
    liposolubles: { vit_a_mcg, vit_d3_iu, vit_e_iu, vit_k1_mcg, vit_k2_mcg },
    structure: { calcium_mg, phosphorus_mg, copper_mg, iron_mg }
  },
  inflammation: {
    omega: { omega_3_total_mg, epa_dha_mg, omega_6_mg },
    sat_fats: { saturated_g, monounsaturated_g, polyunsaturated_g, trans_fat_g, cholesterol_mg },
    bioactives: { polyphenols_total_mg, anthocyanins_mg, quercetin_mg, resveratrol_mg, curcumin_mg }
  }
}
```

---

## 5. Frontend Integration (AddFoodModal)

### Modo IA Activado

El usuario puede cambiar entre modo "Manual" y "Con IA":

**Modo Manual:**
- Entrada tradicional de campos individuales
- Control total sobre valores

**Modo IA (Nuevo):**
- Textarea para descripción en lenguaje natural
- Ejemplos sugeridos:
  - "200g de salmón a la plancha con brócoli al vapor"
  - "Dos huevos revueltos con aguacate"
  - "Batido de proteína con banana y almendras"

### Código Frontend Simplificado

```typescript
const handleAiSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/process-food-ai`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ message: aiDescription })
    }
  )

  const result = await response.json()
  onSuccess() // Recarga la lista de alimentos
}
```

---

## 6. Ventajas del Sistema Sin n8n

### Antes (con n8n):
```
Frontend → Edge Function → n8n Webhook → OpenAI/Anthropic → n8n Transform → Supabase
```
- Múltiples puntos de falla
- Latencia adicional
- Costos de n8n hosting
- Complejidad de debugging

### Ahora (directo con Gemini):
```
Frontend → Edge Function → Gemini API → Supabase
```
- Un solo salto
- Latencia mínima (~2-3 segundos)
- Sin costos adicionales (solo Gemini API)
- Debugging simple en Edge Function logs

---

## 7. Variables de Entorno Necesarias

### En Supabase Edge Functions (Automáticas)

```bash
SUPABASE_URL=https://gdoquewussvvkmwgdgxp.supabase.co
SUPABASE_ANON_KEY=<auto-configured>
SUPABASE_SERVICE_ROLE_KEY=<auto-configured>
```

### Usuario Debe Configurar

```bash
GEMINI_API_KEY=<tu-api-key-de-google>
```

**Cómo obtener Gemini API Key:**
1. Ir a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crear nuevo API Key
3. Configurar en Supabase Dashboard → Edge Functions → Secrets
4. Nombre: `GEMINI_API_KEY`

---

## 8. Costos Aproximados

### Gemini 1.5 Flash (Modelo Usado)

**Pricing:**
- Input: $0.075 / 1M tokens
- Output: $0.30 / 1M tokens

**Estimación por Request:**
- System Prompt: ~500 tokens
- User Input: ~50 tokens (promedio)
- Output: ~800 tokens
- **Costo por request: ~$0.0003 (0.03 centavos)**

**Volumen:**
- 1,000 comidas registradas/mes = **$0.30/mes**
- 10,000 comidas/mes = **$3/mes**

---

## 9. Limitaciones y Mejoras Futuras

### Limitaciones Actuales

1. **Sin procesamiento de imágenes** (por ahora solo texto)
2. **Estimaciones**: Los valores son aproximados basados en bases de datos internalizadas de Gemini
3. **Sin feedback loop**: No aprende de correcciones del usuario

### Mejoras Planeadas

1. **Visión con Gemini Pro Vision:**
   - Subir foto de comida
   - Gemini identifica alimentos y cantidades
   - Código: `gemini-pro-vision` model

2. **Feedback Loop:**
   - Usuario puede editar valores
   - Sistema aprende patrones de corrección

3. **Recetas desde Imágenes:**
   - Foto de comida casera
   - Gemini extrae receta completa

4. **Análisis Contextual:**
   - "Comí en McDonalds" → Gemini pregunta qué pediste
   - Conversación multi-turno

---

## 10. Testing y Debugging

### Probar Edge Function Directamente

```bash
curl -X POST \
  'https://gdoquewussvvkmwgdgxp.supabase.co/functions/v1/process-food-ai' \
  -H 'Authorization: Bearer <USER_JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"message": "200g de pechuga de pollo"}'
```

### Ver Logs de Edge Function

```bash
# En Supabase Dashboard
Functions → process-food-ai → Logs
```

### Errores Comunes

**1. "Gemini returned no response"**
- Problema: API Key inválida
- Solución: Verificar `GEMINI_API_KEY` en Secrets

**2. "No JSON found in Gemini response"**
- Problema: Respuesta de Gemini malformada
- Solución: Revisar logs, Gemini puede haber devuelto texto plano

**3. "Invalid response structure from Gemini"**
- Problema: JSON sin campo `food_data`
- Solución: Mejorar prompt con más ejemplos

---

## 11. Ejemplos de Uso

### Entrada Simple

**Usuario escribe:**
```
200g de atún enlatado
```

**Gemini responde (JSON):**
```json
{
  "reply_text": "Excelente fuente de proteína magra y omega-3",
  "food_data": {
    "food_name": "Atún enlatado",
    "quantity_g": 200,
    "group_1_motor": {
      "calories": 240,
      "protein_g": 50,
      "carbs_g": 0,
      "fat_g": 5,
      // ...
    },
    // ... resto de grupos
  }
}
```

### Entrada Compleja

**Usuario escribe:**
```
Bowl de quinoa con pollo, aguacate, tomate cherry y aderezo de tahini
```

**Gemini responde:**
- Descompone cada ingrediente
- Estima cantidades razonables
- Suma nutrientes totales
- Genera nombre descriptivo

---

## 12. Seguridad

### Validaciones Implementadas

1. **Autenticación JWT:** Solo usuarios autenticados pueden usar la función
2. **RLS Policies:** Los datos se insertan con el user_id del JWT
3. **Input Sanitization:** El mensaje se limpia antes de enviarse a Gemini
4. **Output Parsing:** JSON de Gemini se valida antes de insertar en DB

### Best Practices

- **Nunca exponer API Keys en frontend**
- **Siempre validar JWT en Edge Function**
- **Rate Limiting:** Considerar implementar límites por usuario
- **Logging:** No loggear mensajes de usuario (privacidad)

---

## 13. Migración desde n8n

Si tenías workflows en n8n, la migración es simple:

### Antes

```
n8n: Webhook → OpenAI Node → Function Node (parse) → Supabase Node
```

### Ahora

```
Edge Function: process-food-ai (todo incluido)
```

**Ventajas:**
- Código versionado en Git
- Deployment automático con Supabase CLI
- Sin dependencias externas
- Más rápido y confiable

---

## Recursos

- [Gemini API Docs](https://ai.google.dev/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentación del Esquema Híbrido](./N8N_RESPONSE_FORMAT_HYBRID.md)
- [Edge Function Code](./supabase/functions/process-food-ai/index.ts)
