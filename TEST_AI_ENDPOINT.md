# Pruebas del Endpoint de IA con Gemini

## Datos del Proyecto

**URL de Supabase:**
```
https://gdoquewussvvkmwgdgxp.supabase.co
```

**ANON Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkb3F1ZXd1c3N2dmttd2dkZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODAwMzUsImV4cCI6MjA4NDc1NjAzNX0.xO_j1KAiY2ySnJsL9alMDiTvfHIRO9pXMZoue2RBofg
```

**Usuario de Prueba:**
- Email: `sebastian.lisboalisboa@gmail.com`
- ID: `c86e3794-3f12-4e3f-8147-3365f4b9ff41`

---

## IMPORTANTE: Configurar GEMINI_API_KEY

Antes de probar, debes configurar tu API Key de Gemini en Supabase:

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea un nuevo API Key
3. Configúralo en Supabase:
   - Dashboard → Project Settings → Edge Functions → Secrets
   - Nombre: `GEMINI_API_KEY`
   - Valor: Tu API Key de Google

---

## Método 1: Prueba Completa con Autenticación (Recomendado)

### Paso 1: Autenticarse y obtener el Access Token

```bash
# Reemplaza YOUR_PASSWORD con la contraseña del usuario
curl -i --location --request POST \
  'https://gdoquewussvvkmwgdgxp.supabase.co/auth/v1/token?grant_type=password' \
  --header 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkb3F1ZXd1c3N2dmttd2dkZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODAwMzUsImV4cCI6MjA4NDc1NjAzNX0.xO_j1KAiY2ySnJsL9alMDiTvfHIRO9pXMZoue2RBofg' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "email": "sebastian.lisboalisboa@gmail.com",
    "password": "YOUR_PASSWORD"
  }'
```

**Respuesta esperada:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "c86e3794-3f12-4e3f-8147-3365f4b9ff41",
    "email": "sebastian.lisboalisboa@gmail.com"
  }
}
```

### Paso 2: Llamar al Endpoint con el Access Token

```bash
# Reemplaza YOUR_ACCESS_TOKEN con el access_token del paso anterior
curl -i --location --request POST \
  'https://gdoquewussvvkmwgdgxp.supabase.co/functions/v1/process-food-ai' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "message": "200g de salmón con arroz integral y brócoli"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "user_id": "c86e3794-3f12-4e3f-8147-3365f4b9ff41",
    "food_name": "Salmón con arroz integral y brócoli",
    "quantity_g": 200,
    "reply_text": "Excelente combinación: proteína de alta calidad, carbohidratos complejos y omega-3",
    "calories": 450,
    "protein_g": 40,
    "carbs_g": 50,
    "fat_g": 12,
    "water_ml": 150,
    "leucine_mg": 3200,
    "sodium_mg": 250,
    "choline_mg": 95,
    "zinc_mg": 2.5,
    "magnesium_mg": 85,
    "vit_d3_iu": 450,
    "omega_3_total_g": 2.8,
    "polyphenols_total_mg": 120,
    "nutritional_matrix": {
      "motor": { ... },
      "cognitive": { ... },
      "hormonal": { ... },
      "inflammation": { ... }
    },
    "created_at": "2026-01-28T...",
    "logged_at": "2026-01-28T..."
  },
  "message": "Food logged successfully with hybrid schema (VIP + JSONB)"
}
```

---

## Método 2: Script Automatizado (Bash)

Crea un archivo `test-ai.sh`:

```bash
#!/bin/bash

# Configuración
SUPABASE_URL="https://gdoquewussvvkmwgdgxp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkb3F1ZXd1c3N2dmttd2dkZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODAwMzUsImV4cCI6MjA4NDc1NjAzNX0.xO_j1KAiY2ySnJsL9alMDiTvfHIRO9pXMZoue2RBofg"
EMAIL="sebastian.lisboalisboa@gmail.com"
PASSWORD="YOUR_PASSWORD"  # Reemplaza con tu contraseña

echo "🔐 Autenticando usuario..."

# Obtener access token
AUTH_RESPONSE=$(curl -s --request POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  --header "apikey: ${ANON_KEY}" \
  --header "Content-Type: application/json" \
  --data-raw "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\"
  }")

ACCESS_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error al autenticar. Verifica tu contraseña."
  echo "Respuesta: $AUTH_RESPONSE"
  exit 1
fi

echo "✅ Usuario autenticado"
echo ""
echo "🤖 Probando endpoint de IA con Gemini..."
echo ""

# Llamar al endpoint de IA
curl -i --request POST \
  "${SUPABASE_URL}/functions/v1/process-food-ai" \
  --header "Authorization: Bearer ${ACCESS_TOKEN}" \
  --header "Content-Type: application/json" \
  --data-raw '{
    "message": "200g de salmón a la plancha con brócoli al vapor y una porción de arroz integral"
  }'
```

**Ejecutar:**
```bash
chmod +x test-ai.sh
./test-ai.sh
```

---

## Método 3: Desde el Frontend (Prueba Manual)

1. Inicia sesión en la aplicación con:
   - Email: `sebastian.lisboalisboa@gmail.com`
   - Contraseña: (tu contraseña)

2. Abre el modal "Agregar Alimento"

3. Cambia a modo "Con IA" (botón con ícono de Sparkles)

4. Escribe en el textarea:
   ```
   200g de salmón a la plancha con brócoli
   ```

5. Presiona "Analizar con IA"

6. Espera 2-3 segundos

7. Revisa en la consola del navegador (F12) el log:
   ```
   Alimento procesado con IA: {...}
   ```

8. El alimento debe aparecer en tu lista de Dashboard

---

## Ejemplos de Mensajes para Probar

### Comidas Simples
```json
{"message": "200g de pechuga de pollo"}
{"message": "dos huevos revueltos"}
{"message": "un aguacate mediano"}
{"message": "100g de atún enlatado"}
```

### Comidas Compuestas
```json
{"message": "Bowl de quinoa con pollo, aguacate y tomate"}
{"message": "Ensalada césar con salmón"}
{"message": "Batido de proteína con banana y almendras"}
{"message": "Tacos de carnitas con guacamole"}
```

### Comidas con Detalles
```json
{"message": "150g de salmón a la plancha, 100g de arroz integral, 80g de brócoli al vapor"}
{"message": "3 huevos revueltos con queso, aguacate y tortillas de maíz"}
{"message": "Smoothie con 30g proteína whey, 1 banana, 200ml leche de almendras, 15g mantequilla de maní"}
```

---

## Verificar Resultados en la Base de Datos

```bash
# Ver últimos alimentos registrados
curl --request POST \
  'https://gdoquewussvvkmwgdgxp.supabase.co/rest/v1/rpc/get_daily_nutrition' \
  --header "apikey: ${ANON_KEY}" \
  --header "Authorization: Bearer ${ACCESS_TOKEN}" \
  --header "Content-Type: application/json" \
  --data-raw '{}'
```

O directamente en Supabase Dashboard:
```sql
SELECT
  food_name,
  quantity_g,
  calories,
  protein_g,
  reply_text,
  created_at
FROM food_logs
WHERE user_id = 'c86e3794-3f12-4e3f-8147-3365f4b9ff41'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Troubleshooting

### Error: "GEMINI_API_KEY not configured"

**Solución:** Configura tu API Key en Supabase:
- Dashboard → Settings → Edge Functions → Secrets
- Add Secret: `GEMINI_API_KEY` = `tu-api-key`

### Error: "Unauthorized"

**Solución:** Tu access_token expiró o es inválido. Vuelve a autenticarte (Paso 1).

### Error: "Gemini API error: 400"

**Solución:** El API Key es inválido o no tiene permisos. Verifica en Google AI Studio.

### Error: "No JSON found in Gemini response"

**Solución:** Gemini devolvió texto sin JSON. Verifica los logs del Edge Function:
- Dashboard → Edge Functions → process-food-ai → Logs

### El alimento se guarda pero con valores en 0

**Solución:** Gemini no pudo parsear el mensaje. Prueba con mensajes más descriptivos:
- ❌ "comí algo"
- ✅ "200g de pollo con arroz"

---

## Monitorear Edge Function en Tiempo Real

```bash
# Ver logs en tiempo real (requiere Supabase CLI)
supabase functions logs process-food-ai --follow
```

O desde el Dashboard:
- Edge Functions → process-food-ai → Logs

---

## Performance Esperado

- **Latencia:** 2-3 segundos
- **Costo por request:** ~$0.0003 (0.03 centavos)
- **Rate Limit Gemini:** 60 requests/minuto (Free tier)
- **Precisión:** ~85-90% en nutrientes VIP, ~60-70% en micros raros

---

## Próximos Pasos

1. ✅ Configurar GEMINI_API_KEY
2. ✅ Probar con el script de prueba
3. ✅ Verificar datos en la base de datos
4. ✅ Probar desde el frontend
5. ⏭️ Implementar rate limiting
6. ⏭️ Agregar análisis de imágenes con Gemini Vision
7. ⏭️ Implementar feedback loop para mejorar precisión
