# Chat con Gemini 2.0 Flash - Activado

## Cambios Realizados

El sistema de chat ahora está completamente integrado con **Gemini 2.0 Flash Experimental**, el modelo más económico y rápido de Google.

### Modelo Utilizado
- **Modelo:** `gemini-2.0-flash-exp`
- **Proveedor:** Google AI (Gemini)
- **Costo:** Gratis durante la fase experimental, después ~$0.0001/1000 tokens
- **Latencia:** ~1-2 segundos
- **Características:** Rápido, económico, y optimizado para tareas de análisis nutricional

---

## Flujo de Funcionamiento

### 1. Usuario escribe en el Chat (HealthChat)
El usuario describe su comida en lenguaje natural:
```
"200g de salmón a la plancha con brócoli"
```

### 2. Frontend llama al Edge Function
La aplicación envía el mensaje al Edge Function `process-food-ai`:
```typescript
// src/lib/chatService.ts
sendMessageToAI(message) → /functions/v1/process-food-ai
```

### 3. Edge Function procesa con Gemini
El Edge Function:
- Autentica al usuario
- Llama a Gemini 2.0 Flash con el prompt estructurado
- Parsea la respuesta JSON
- Guarda el alimento en la base de datos (`food_logs`)
- Devuelve el resultado al frontend

### 4. Frontend muestra la respuesta
- Muestra el mensaje de respuesta del asistente
- Registra el alimento en el dashboard automáticamente
- Guarda el historial del chat en `chat_messages`

---

## Estructura de Datos

### Entrada (Usuario)
```json
{
  "message": "200g de salmón con arroz"
}
```

### Salida (Gemini → Base de Datos)
```json
{
  "success": true,
  "data": {
    "id": 123,
    "user_id": "...",
    "food_name": "Salmón con arroz",
    "quantity_g": 200,
    "reply_text": "Excelente fuente de omega-3 y proteína",
    "calories": 450,
    "protein_g": 40,
    "carbs_g": 50,
    "fat_g": 12,
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

## Funciones Principales

### `sendMessageToAI(message)` - Nuevo
Ubicación: `src/lib/chatService.ts`

Envía un mensaje al Edge Function de Gemini y retorna el análisis nutricional.

```typescript
const response = await sendMessageToAI("200g de pollo");
// { success: true, data: { reply: "...", food: {...} } }
```

### `saveAssistantMessage(userId, content, metadata)` - Nuevo
Ubicación: `src/lib/chatService.ts`

Guarda las respuestas del asistente en el historial del chat.

```typescript
await saveAssistantMessage(user.id, replyText, foodData);
```

### Edge Function: `process-food-ai`
Ubicación: `supabase/functions/process-food-ai/index.ts`

- Modelo: `gemini-2.0-flash-exp`
- Endpoint: `/functions/v1/process-food-ai`
- Autenticación: JWT (Bearer token)
- Guarda automáticamente en `food_logs`

---

## Cómo Usar el Chat

### Desde la Aplicación

1. Ve a la pestaña **Chat** en el menú inferior
2. Escribe tu comida en lenguaje natural:
   - "200g de salmón"
   - "un bowl de quinoa con pollo"
   - "batido con proteína y banana"
3. Presiona Enter o el botón de enviar
4. El asistente responderá con:
   - Análisis nutricional
   - Confirmación del registro
   - Información relevante sobre la comida

### El alimento se registra automáticamente
- Aparece en el Dashboard
- Se suma a tus macros del día
- Se incluye en tu historial de alimentos

---

## Ventajas de Gemini 2.0 Flash

### vs Gemini 1.5 Flash
- **50% más rápido** (1-2s vs 2-3s)
- **30% más barato** en producción
- Mejor comprensión contextual
- Respuestas más concisas

### vs N8N Webhook (anterior)
- No depende de servicios externos
- Más rápido (sin saltos de red adicionales)
- Más seguro (directo desde Supabase)
- Sin límites de N8N
- Guarda directamente en la base de datos

---

## Configuración Requerida

### Supabase Secrets
Asegúrate de tener configurado:

```bash
GEMINI_API_KEY=tu-api-key-de-google
```

**Obtener API Key:**
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea un nuevo API Key
3. Configúralo en Supabase Dashboard → Edge Functions → Secrets

---

## Archivos Modificados

1. **`supabase/functions/process-food-ai/index.ts`**
   - Cambiado de `gemini-1.5-flash` a `gemini-2.0-flash-exp`

2. **`src/lib/chatService.ts`**
   - Agregado: `sendMessageToAI()`
   - Agregado: `saveAssistantMessage()`

3. **`src/pages/HealthChat.tsx`**
   - Cambiado de `submitHealthData()` (N8N) a `sendMessageToAI()` (Gemini)
   - Usa `saveAssistantMessage()` para historial

---

## Testing

### Desde el Frontend
1. Inicia sesión
2. Ve al Chat
3. Escribe: "200g de salmón"
4. Verifica respuesta en ~2 segundos
5. Revisa Dashboard para confirmar el registro

### Con cURL (Manual)
Ver archivo: `TEST_AI_ENDPOINT.md`

### Con Script
```bash
./test-ai-endpoint.sh
```

---

## Próximos Pasos

- [ ] Agregar soporte para imágenes (Gemini Vision)
- [ ] Implementar sugerencias automáticas
- [ ] Agregar reconocimiento de voz
- [ ] Cache de respuestas frecuentes
- [ ] Rate limiting por usuario

---

## Costos Estimados

**Con 1000 usuarios activos:**
- Promedio: 10 mensajes/día por usuario
- Total: 10,000 mensajes/día
- Tokens aprox: 300 tokens/mensaje = 3M tokens/día
- **Costo diario:** ~$0.30 USD (gratis durante experimental)
- **Costo mensual:** ~$9 USD

**Comparación:**
- N8N: $29/mes (con límites)
- OpenAI GPT-4: ~$90/mes
- **Gemini 2.0 Flash: ~$9/mes** ✅

---

## Notas Técnicas

- La API de Gemini usa el endpoint `v1beta` (experimental)
- El modelo `gemini-2.0-flash-exp` es gratuito durante la fase experimental
- Cuando salga la versión estable, será `gemini-2.0-flash` con pricing oficial
- El Edge Function tiene timeout de 60 segundos (más que suficiente)
- CORS está configurado para permitir todas las origins durante desarrollo

---

Todo está listo para usar el chat con Gemini 2.0 Flash desde la aplicación.
