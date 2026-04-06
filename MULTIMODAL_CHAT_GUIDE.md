# Guía del Chat Multimodal con Gemini

## 🎯 Descripción General

El chat de salud ahora soporta **3 métodos de entrada** para registrar alimentos:
1. **Texto**: Escribe lo que comiste
2. **Audio 🎤**: Graba tu voz describiendo los alimentos
3. **Imagen 📷**: Sube una foto de tu comida

## 🏗️ Arquitectura

### Frontend (React Web)
- **AudioRecorder.tsx**: Captura audio usando `MediaRecorder` API del navegador
- **ImageUploader.tsx**: Permite subir imágenes desde el dispositivo
- **HealthChat.tsx**: Integra ambos componentes y gestiona el flujo

### Backend (Supabase Edge Function)
- **process-food-ai**: Recibe texto, audio (webm) o imagen (jpeg/png) en Base64
- Envía el contenido multimodal a **Gemini 2.5 Flash**
- Extrae la información nutricional completa
- Guarda en la base de datos con el esquema híbrido (VIP + JSONB)

## 🎤 Grabación de Audio (Web)

### Cómo Funciona
```typescript
// 1. Solicitar permiso al micrófono
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

// 2. Crear MediaRecorder
const mediaRecorder = new MediaRecorder(stream)

// 3. Capturar chunks de audio
mediaRecorder.ondataavailable = (event) => {
  audioChunks.push(event.data)
}

// 4. Al detener, crear Blob en formato webm
mediaRecorder.onstop = () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
  // Convertir a Base64 y enviar
}
```

### Formato de Audio
- **Web**: `audio/webm` (Chrome, Edge, Firefox)
- **Safari**: `audio/mp4` (automáticamente detectado)
- Gemini acepta ambos formatos sin conversión adicional

## 📷 Subida de Imágenes

### Cómo Funciona
```typescript
// 1. Input file oculto
<input type="file" accept="image/*" onChange={handleFileChange} />

// 2. Leer imagen como Base64
const reader = new FileReader()
reader.readAsDataURL(file)

// 3. Extraer Base64 puro (sin prefijo data:)
const base64String = result.split(',')[1]

// 4. Enviar a Edge Function
fetch('/functions/v1/process-food-ai', {
  body: JSON.stringify({
    imageBase64: base64String,
    mimeType: file.type
  })
})
```

### Formatos Soportados
- JPEG, PNG, WebP, GIF
- Máximo: 10MB por imagen
- Gemini analiza visualmente el contenido

## 🧠 Edge Function Multimodal

### Request Body
```json
{
  "message": "texto opcional",
  "audioBase64": "string base64 opcional",
  "imageBase64": "string base64 opcional",
  "mimeType": "audio/webm | image/jpeg"
}
```

### Construcción de Parts para Gemini
```typescript
const parts = []

// Siempre incluir el prompt del sistema
parts.push({
  text: `${SYSTEM_PROMPT}\n\n[contexto según tipo de entrada]`
})

// Si hay audio
if (audioBase64) {
  parts.push({
    inlineData: {
      mimeType: "audio/webm",
      data: audioBase64
    }
  })
}

// Si hay imagen
if (imageBase64) {
  parts.push({
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64
    }
  })
}

// Enviar a Gemini
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
  body: JSON.stringify({
    contents: [{ parts }]
  })
})
```

## 🔄 Flujo de Usuario

### Caso 1: Texto
1. Usuario escribe: "Comí 200g de pollo con arroz"
2. Se envía directamente a Gemini como texto
3. Gemini extrae nutrientes y responde con JSON
4. Se guarda en `food_logs`

### Caso 2: Audio
1. Usuario presiona 🎤 y dice: "Almorcé salmón con brócoli"
2. Se graba en formato webm
3. Se convierte a Base64
4. Se envía a Edge Function con `audioBase64`
5. Gemini transcribe Y analiza nutrientes
6. Se guarda en `food_logs`

### Caso 3: Imagen
1. Usuario sube foto de un plato
2. Se convierte a Base64
3. Se envía a Edge Function con `imageBase64`
4. Gemini analiza visualmente la imagen
5. Identifica alimentos y estima cantidades
6. Se guarda en `food_logs`

## ✅ Ventajas de esta Arquitectura

### Para Web (Actual)
- ✅ Usa APIs nativas del navegador (MediaRecorder)
- ✅ No requiere dependencias adicionales
- ✅ Funciona en Chrome, Edge, Firefox, Safari
- ✅ Ligero y rápido

### Migración a React Native (Futuro)
Cuando migres a móvil:
- 🔄 Cambiar `MediaRecorder` por `expo-av` (solo frontend)
- ✅ El backend NO cambia (ya acepta Base64)
- ✅ La lógica de negocio es idéntica
- ✅ Solo reemplazar 2 componentes

## 🚀 Próximas Mejoras

1. **Streaming de Audio**: Enviar chunks en tiempo real
2. **Compresión de Imágenes**: Reducir tamaño antes de enviar
3. **Caché de Respuestas**: Para análisis recurrentes
4. **Múltiples Idiomas**: Soportar transcripción en español/inglés
5. **OCR de Etiquetas**: Escanear información nutricional de empaques

## 🎨 UX Highlights

- 🎤 Botón rojo pulsante mientras graba
- 📷 Input file oculto con botón estilizado
- ⏳ Indicadores de carga durante el procesamiento
- ✅ Mensajes de confirmación con datos nutricionales
- ❌ Manejo de errores claro y específico

## 🔐 Seguridad

- ✅ Todos los endpoints requieren autenticación JWT
- ✅ Validación de tamaño de archivos (10MB max)
- ✅ Validación de tipos MIME
- ✅ Base64 sin exponer URLs públicas
- ✅ RLS habilitado en todas las tablas
