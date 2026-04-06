# Guía de Diagnóstico: Headers de Autenticación

## Problema Resuelto

Se han agregado validaciones robustas y logs detallados para asegurar que el header `Authorization` se envíe correctamente desde el frontend al Edge Function.

## Cambios Implementados

### 1. Frontend (chatService.ts)

#### Validación Robusta del Token:
```typescript
// ✅ Verificación en múltiples niveles
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  console.error('[chatService] No session found')
  return { success: false, error: 'No authenticated session' }
}

if (!session.access_token) {
  console.error('[chatService] Session exists but no access_token')
  return { success: false, error: 'Invalid session: no access token' }
}
```

#### Headers Manuales Explícitos:
```typescript
const headers = {
  'Authorization': `Bearer ${session.access_token}`,
  'Content-Type': 'application/json',
  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
}

const response = await fetch(apiUrl, {
  method: 'POST',
  headers,  // ✅ Headers explícitos, no inferidos
  body: JSON.stringify({ message }),
})
```

#### Logs de Debugging:
```typescript
console.log('[chatService] Sending message to AI', {
  messageLength: message.length,
  hasToken: !!session.access_token,
  tokenPrefix: session.access_token.substring(0, 20) + '...'
})

console.log('[chatService] Request headers prepared', {
  hasAuth: !!headers.Authorization,
  hasContentType: !!headers['Content-Type'],
  hasApikey: !!headers.apikey,
})

console.log('[chatService] Response received', {
  status: response.status,
  statusText: response.statusText,
  ok: response.ok
})
```

### 2. Backend (process-food-ai/index.ts)

#### Logs de Headers Recibidos:
```typescript
console.log("[process-food-ai] Request received", {
  method: req.method,
  url: req.url,
  headers: {
    authorization: req.headers.get("Authorization") ? "present" : "missing",
    contentType: req.headers.get("Content-Type"),
    apikey: req.headers.get("apikey") ? "present" : "missing",
  }
});
```

#### Validación de Authorization:
```typescript
const authHeader = req.headers.get("Authorization");

if (!authHeader) {
  console.error("[process-food-ai] No Authorization header", {
    allHeaders: Array.from(req.headers.keys())
  });
  return new Response(
    JSON.stringify({
      success: false,
      error: "No Authorization header provided",
      details: "The request must include an Authorization header with a Bearer token"
    }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

console.log("[process-food-ai] Authorization header present", {
  prefix: authHeader.substring(0, 20) + "..."
});
```

#### Logs del Flujo Completo:
```typescript
// ✅ Usuario autenticado
console.log("[process-food-ai] User authenticated successfully", {
  userId: user.id,
  email: user.email
});

// ✅ Llamada a Gemini
console.log("[process-food-ai] Calling Gemini API", {
  messageLength: message.length,
  messagePreview: message.substring(0, 50) + "..."
});

// ✅ Respuesta de Gemini
console.log("[process-food-ai] Gemini API responded", {
  status: geminiResponse.status,
  ok: geminiResponse.ok
});

// ✅ Inserción en DB
console.log("[process-food-ai] Inserting food log to database", {
  userId: user.id,
  foodName: foodData.food_name,
  calories: foodData.calories
});

// ✅ Éxito
console.log("[process-food-ai] Food log inserted successfully", {
  logId: data?.id,
  foodName: data?.food_name
});
```

## Cómo Diagnosticar Problemas

### Paso 1: Abre la Consola del Navegador (F12)

Busca estos logs en orden:

#### En el Frontend:
```
[chatService] Sending message to AI {messageLength: 15, hasToken: true, tokenPrefix: "eyJhb..."}
[chatService] Request headers prepared {hasAuth: true, hasContentType: true, hasApikey: true}
[chatService] Response received {status: 200, ok: true}
[chatService] API Success Response: {...}
```

#### En Supabase Dashboard → Edge Functions → Logs:
```
[process-food-ai] Request received {method: "POST", headers: {authorization: "present", ...}}
[process-food-ai] Authorization header present {prefix: "Bearer eyJhb..."}
[process-food-ai] User authenticated successfully {userId: "...", email: "..."}
[process-food-ai] Calling Gemini API {messageLength: 15, ...}
[process-food-ai] Gemini API responded {status: 200, ok: true}
[process-food-ai] Inserting food log to database {...}
[process-food-ai] Food log inserted successfully {...}
```

### Paso 2: Identifica el Punto de Falla

#### Si falla en el frontend:

**Error: "No session found"**
- El usuario no está logueado
- Solución: Hacer logout y login de nuevo

**Error: "Session exists but no access_token"**
- La sesión está corrupta
- Solución: Limpiar localStorage y volver a iniciar sesión

**Error: "Request headers prepared {hasAuth: false}"**
- El token no se extrajo correctamente
- Revisar `supabase.auth.getSession()`

#### Si falla en el backend:

**Error: "No Authorization header"**
- El header no llegó al servidor
- Revisar CORS o configuración de red
- Revisar si los headers se están enviando en el fetch

**Error: "Authentication failed"**
- El token es inválido o expiró
- Revisar configuración JWT en Supabase
- Hacer logout y login de nuevo

**Error: "Gemini API error"**
- API key inválido o modelo incorrecto
- Verificar que `GEMINI_API_KEY` esté configurado en Supabase Secrets
- Verificar que el modelo sea `gemini-2.5-flash`

**Error: "Database insert error"**
- Problema con RLS o esquema
- Verificar políticas RLS en tabla `food_logs`
- Verificar que todas las columnas existan

### Paso 3: Probar la Configuración

#### Test 1: Verificar Sesión
```javascript
// En la consola del navegador
const { data } = await supabase.auth.getSession()
console.log('Session:', data.session?.access_token ? 'Valid' : 'Invalid')
```

#### Test 2: Verificar Headers
```javascript
// En la consola del navegador
const response = await fetch('URL_DE_TU_EDGE_FUNCTION', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ message: 'test' })
})
console.log('Status:', response.status)
```

## Soluciones Comunes

### Problema: "No Authorization header"

**Causa:** El header no se envía en entornos móviles o con ciertas configuraciones de red.

**Solución:** Ya implementado - estamos usando fetch directo con headers explícitos en lugar de `supabase.functions.invoke`.

### Problema: Token expirado

**Causa:** El access token tiene tiempo de vida limitado.

**Solución:**
```typescript
// Ya implementado en chatService.ts
const { data: { session } } = await supabase.auth.getSession()
// ✅ Esto siempre devuelve un token fresco
```

### Problema: CORS

**Causa:** El navegador bloquea la petición por política CORS.

**Solución:** Ya configurado en el Edge Function:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};
```

## Verificación Final

Para confirmar que todo funciona:

1. **Abre la app en el navegador**
2. **Inicia sesión**
3. **Abre la consola (F12)**
4. **Ve al Chat**
5. **Escribe:** "200g de pollo"
6. **Observa los logs:**
   - Frontend: Deberías ver todos los logs `[chatService]`
   - Backend: Ve a Supabase Dashboard → Edge Functions → Logs

Si ves todos los logs correctamente, el sistema está funcionando.

## Contacto para Soporte

Si después de seguir esta guía sigues teniendo problemas:

1. Copia todos los logs del navegador (consola)
2. Copia los logs del Edge Function (Supabase Dashboard)
3. Indica en qué paso exactamente falla el flujo
4. Proporciona capturas de pantalla si es posible

---

**Última actualización:** 2026-01-28
**Versión del fix:** 2.0 - Headers manuales + Logging detallado
