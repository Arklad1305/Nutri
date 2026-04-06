# Troubleshooting: Error 401 - Gemini API

## ⚠️ IMPORTANTE: NO DESACTIVAR verify_jwt

**NUNCA uses `--no-verify-jwt`.** Tu Edge Function ya está configurada correctamente.

Lee `NO_DESACTIVAR_JWT.md` para entender por qué esto es un error de seguridad grave.

---

## El Problema

El error `Failed to load resource: 401` indica que el Edge Function no puede autenticar las solicitudes correctamente.

Las causas más comunes son:

1. **GEMINI_API_KEY no configurado** (más probable)
2. Token de sesión expirado
3. Problema de autenticación de Supabase

---

## 🔍 Herramienta de Diagnóstico Automático

**USA ESTO PRIMERO:**

Abre `test-edge-function.html` en tu navegador y ejecuta el diagnóstico completo.

Te dirá EXACTAMENTE cuál es el problema y cómo solucionarlo.

---

## Solución 1: Configurar GEMINI_API_KEY

### Paso 1: Obtener tu API Key de Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en **"Get API Key"** o **"Create API Key"**
4. Copia el API Key generado

### Paso 2: Configurar el Secret en Supabase

1. Ve a tu **Supabase Dashboard**
2. Navega a **Edge Functions** (en el menú lateral)
3. Haz clic en la pestaña **"Secrets"**
4. Agrega un nuevo secret:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Tu API key de Gemini
5. Haz clic en **"Add"** o **"Save"**

### Paso 3: Verificar que el Secret fue configurado

1. En el mismo panel de Secrets, verifica que aparezca `GEMINI_API_KEY`
2. El valor debe estar oculto (por seguridad)
3. Si no aparece, repite el Paso 2

### Paso 4: Reiniciar el Edge Function (Opcional)

A veces es necesario redesplegar el Edge Function después de agregar un secret:

```bash
# Si tienes acceso a Supabase CLI:
supabase functions deploy process-food-ai
```

O simplemente espera 1-2 minutos para que los cambios se propaguen.

---

## Solución 2: Verificar Autenticación de Usuario

Si el GEMINI_API_KEY está configurado correctamente, el problema puede ser tu sesión:

### Paso 1: Cerrar sesión y volver a iniciar

1. En la aplicación, ve a **Profile**
2. Haz clic en **"Cerrar Sesión"**
3. Vuelve a iniciar sesión
4. Intenta enviar un mensaje nuevamente

### Paso 2: Verificar token en el navegador

1. Abre las **Developer Tools** (F12)
2. Ve a la pestaña **Console**
3. Ejecuta:
   ```javascript
   (async () => {
     const { data } = await supabase.auth.getSession();
     console.log('Session:', data.session);
   })();
   ```
4. Verifica que `data.session` tenga un `access_token` válido

---

## Solución 3: Verificar Configuración del Edge Function

### Verificar que el Edge Function está desplegado

1. Ve a **Supabase Dashboard → Edge Functions**
2. Verifica que `process-food-ai` aparezca en la lista
3. Verifica que su estado sea **"Active"** o **"Deployed"**

### Verificar logs del Edge Function

1. En **Edge Functions**, haz clic en `process-food-ai`
2. Ve a la pestaña **"Logs"**
3. Envía un mensaje desde el chat
4. Observa los logs para ver el error exacto

Los logs pueden mostrar:
- `GEMINI_API_KEY not configured` → Configura el secret (Solución 1)
- `Unauthorized` → Problema de autenticación (Solución 2)
- `Gemini API error: 401` → El API Key de Gemini es inválido

---

## Verificación Rápida

### Desde el navegador (Developer Tools → Console):

```javascript
// 1. Verificar sesión
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// 2. Probar el Edge Function directamente
const response = await fetch(
  'https://gdoquewussvvkmwgdgxp.supabase.co/functions/v1/process-food-ai',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: 'test' })
  }
);

const result = await response.json();
console.log('Result:', result);
```

### Posibles resultados:

1. **Si el error dice `GEMINI_API_KEY not configured`:**
   → Sigue la **Solución 1**

2. **Si el error dice `Unauthorized` o `Authentication failed`:**
   → Sigue la **Solución 2**

3. **Si funciona correctamente:**
   → El error está resuelto

---

## Mejoras Implementadas

He actualizado el código para proporcionar **mensajes de error más claros**:

### En el Edge Function:
- Verifica que el API Key esté configurado antes de llamar a Gemini
- Muestra mensajes de error detallados en los logs
- Devuelve información útil al frontend

### En el Frontend:
- Detecta automáticamente el tipo de error
- Muestra mensajes específicos al usuario:
  - "El API key de Gemini no está configurado"
  - "Tu sesión expiró"
  - Detalles técnicos en consola

---

## Contacto al Administrador

Si después de seguir todos los pasos el error persiste, proporciona la siguiente información:

1. **Mensaje de error completo** (desde Developer Tools → Console)
2. **Logs del Edge Function** (desde Supabase Dashboard)
3. **Screenshot del error**
4. **Pasos que seguiste**

Esto ayudará a diagnosticar el problema más rápidamente.

---

## Resumen

El error 401 más común es que **el GEMINI_API_KEY no está configurado en Supabase**.

**Solución rápida:**
1. Ve a Supabase Dashboard → Edge Functions → Secrets
2. Agrega `GEMINI_API_KEY` con tu API key de Google AI Studio
3. Espera 1-2 minutos
4. Intenta nuevamente

**Con los cambios recientes, el chat ahora te dirá exactamente cuál es el problema.**
