# Troubleshooting: Audio e Imagen en el Chat

## 🔍 Diagnóstico Rápido

### Síntoma 1: Los botones de 🎤 y 📷 no responden

**Verificaciones:**
1. Abre la consola del navegador (F12 → Console)
2. Busca errores al hacer clic en los botones
3. Verifica permisos del navegador

**Posibles causas:**
- Permisos de micrófono/cámara no otorgados
- JavaScript bloqueado
- Navegador no compatible

### Síntoma 2: El micrófono graba pero no envía

**Verificaciones en consola:**
```javascript
// Deberías ver estos logs:
console.log('Starting recording...')
console.log('Stopping recording...')
console.log('Processing audio...')
console.log('Multimedia result:', result)
```

**Si no ves "Processing audio":**
- El MediaRecorder no está capturando datos
- Verifica `audioChunksRef` en el debugger

### Síntoma 3: La imagen se sube pero no analiza

**Verificaciones:**
1. Tamaño de la imagen (máx 10MB)
2. Formato soportado (JPG, PNG, WebP)
3. Respuesta del servidor en Network tab

**Logs esperados:**
```
POST /functions/v1/process-food-ai
Status: 200
Response: { success: true, data: {...} }
```

## 🛠️ Pruebas de Componentes

### Test 1: AudioRecorder

Abre DevTools → Console y ejecuta:

```javascript
// 1. Verificar permisos
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Micrófono accesible', stream)
    stream.getTracks().forEach(track => track.stop())
  })
  .catch(err => console.error('❌ Error micrófono:', err))

// 2. Verificar MediaRecorder
if ('MediaRecorder' in window) {
  console.log('✅ MediaRecorder disponible')
} else {
  console.error('❌ MediaRecorder no soportado')
}
```

### Test 2: ImageUploader

```javascript
// Verificar File API
if ('FileReader' in window) {
  console.log('✅ FileReader disponible')
} else {
  console.error('❌ FileReader no soportado')
}

// Test de conversión Base64
const testFile = new Blob(['test'], { type: 'image/jpeg' })
const reader = new FileReader()
reader.onloadend = () => {
  const base64 = reader.result.split(',')[1]
  console.log('✅ Conversión Base64 funciona:', base64)
}
reader.readAsDataURL(testFile)
```

### Test 3: Edge Function

Prueba directa con curl:

```bash
# Test con texto
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/process-food-ai" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"message": "Comí 200g de pollo"}'

# Test con imagen (Base64 corto para ejemplo)
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/process-food-ai" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "mimeType": "image/png"
  }'
```

## 🔑 Permisos del Navegador

### Chrome/Edge
1. Haz clic en el candado 🔒 en la barra de direcciones
2. Ve a "Configuración del sitio"
3. Asegúrate de que Micrófono y Cámara estén en "Permitir"

### Firefox
1. Haz clic en el ícono de configuración en la barra de direcciones
2. Ve a "Permisos"
3. Activa Micrófono y Cámara

### Safari
1. Safari → Preferencias → Sitios web
2. Micrófono y Cámara → Permitir para tu sitio

## 📊 Logs Esperados (Flujo Completo)

### Audio Exitoso:
```
[Frontend] Starting recording...
[Frontend] Recording stopped
[Frontend] Converting to Base64...
[Frontend] Calling Edge Function...
[Edge Function] [process-food-ai] Request received
[Edge Function] [process-food-ai] User authenticated successfully
[Edge Function] [process-food-ai] Calling Gemini API {hasAudio: true}
[Edge Function] [process-food-ai] Gemini API responded {status: 200}
[Edge Function] [process-food-ai] Food log inserted successfully
[Frontend] Multimedia result: {success: true, data: {...}}
```

### Imagen Exitosa:
```
[Frontend] File selected: image.jpg (2.3 MB)
[Frontend] Converting to Base64...
[Frontend] Calling Edge Function...
[Edge Function] [process-food-ai] Request received
[Edge Function] [process-food-ai] User authenticated successfully
[Edge Function] [process-food-ai] Calling Gemini API {hasImage: true}
[Edge Function] [process-food-ai] Gemini API responded {status: 200}
[Edge Function] [process-food-ai] Food log inserted successfully
[Frontend] Multimedia result: {success: true, data: {...}}
```

## ❌ Errores Comunes

### Error: "Debes iniciar sesión"
**Causa:** Token de sesión no disponible o expirado
**Solución:**
```javascript
// Verificar sesión
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
// Si es null, hacer logout y login de nuevo
```

### Error: "Error del servidor: 401"
**Causa:** Authorization header no válido
**Solución:**
1. Verifica que el token se esté enviando
2. Revisa logs de la Edge Function en Supabase Dashboard
3. Asegúrate de que JWT verification esté habilitado

### Error: "No Authorization header provided"
**Causa:** El header no llega a la Edge Function
**Solución:**
```typescript
// Verificar que los headers incluyan:
headers: {
  'Authorization': `Bearer ${session.access_token}`,
  'Content-Type': 'application/json',
  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
}
```

### Error: "GEMINI_API_KEY not configured"
**Causa:** API key de Gemini no está en secrets
**Solución:**
1. Ve a Supabase Dashboard
2. Edge Functions → Secrets
3. Agrega `GEMINI_API_KEY`

### Error: MediaRecorder no captura nada
**Causa:** Formato de audio no soportado
**Solución:**
```javascript
// Detectar formato soportado
const mimeTypes = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4'
]

const supportedType = mimeTypes.find(type =>
  MediaRecorder.isTypeSupported(type)
)

console.log('Formato soportado:', supportedType)
```

## 🎯 Checklist Final

Antes de reportar un bug, verifica:

- [ ] El navegador tiene permisos de micrófono/cámara
- [ ] La sesión de usuario está activa
- [ ] Las variables de entorno están configuradas (`.env`)
- [ ] GEMINI_API_KEY está en Supabase Secrets
- [ ] La Edge Function está desplegada
- [ ] No hay errores en la consola del navegador
- [ ] La Network tab muestra request exitoso (200)
- [ ] Los logs de Supabase no muestran errores

## 🚀 Next Steps

Si todo lo anterior pasa pero sigue sin funcionar:

1. Activa verbose logging:
```typescript
// En AudioRecorder.tsx y ImageUploader.tsx
console.log('[DEBUG] Estado actual:', {
  isRecording,
  isProcessing,
  hasSession: !!session,
  audioChunks: audioChunksRef.current.length
})
```

2. Captura el request completo:
```javascript
// En DevTools → Network → click en request
// Ve a Headers y copia todo
// Ve a Payload y copia el body
```

3. Revisa logs de Supabase:
   - Dashboard → Edge Functions → process-food-ai → Logs
   - Busca errores o warnings

4. Si Gemini responde pero no se guarda:
   - Verifica RLS policies en `food_logs`
   - Revisa que el user_id coincida
