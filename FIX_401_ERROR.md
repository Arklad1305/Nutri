# Solución para Error 401 "Error del servidor: 401"

## 🔧 Cambios Aplicados

### 1. Validación Mejorada de Sesión
Ahora validamos:
- Que la sesión exista
- Que tenga access_token
- Que el token no haya expirado
- Manejo de errores de sesión

### 2. Archivos Modificados
- `src/lib/chatService.ts` - Mejor validación de sesión y token
- `src/components/AudioRecorder.tsx` - Validación de expiración
- `src/components/ImageUploader.tsx` - Validación de expiración

## 🚨 Causa Probable del Error 401

El error "Error del servidor: 401" generalmente ocurre por:

1. **Token Expirado** (más común)
   - Las sesiones de Supabase expiran después de cierto tiempo
   - Solución: Cerrar sesión y volver a iniciar

2. **Token Inválido**
   - El token en localStorage está corrupto
   - Solución: Limpiar localStorage

3. **Configuración de JWT**
   - Las políticas RLS están rechazando el token
   - Solución: Verificar políticas en Supabase Dashboard

## 📋 Pasos de Diagnóstico

### Paso 1: Verificar Sesión Actual

1. Abre la aplicación
2. Abre DevTools (F12) → Console
3. Ejecuta:
```javascript
const { data, error } = await window.supabase.auth.getSession()
console.log('Session:', data.session)
console.log('Expires at:', data.session?.expires_at ? new Date(data.session.expires_at * 1000) : 'N/A')
console.log('Now:', new Date())
```

Si `expires_at` es menor que `now`, tu sesión expiró.

### Paso 2: Forzar Refresh de Sesión

```javascript
const { data, error } = await window.supabase.auth.refreshSession()
console.log('New session:', data.session)
```

### Paso 3: Usar Herramienta de Debug

1. Abre `test-auth-debug.html` en tu navegador
2. Ingresa tus credenciales
3. Haz login
4. Verifica que la sesión sea válida
5. Prueba la Edge Function

### Paso 4: Limpiar y Re-autenticar

Si nada funciona:

1. Cierra sesión en la app
2. Abre DevTools → Application → Local Storage
3. Borra todos los items de Supabase
4. Recarga la página
5. Inicia sesión nuevamente

## 🔍 Verificar Logs de Edge Function

Si el problema persiste después de re-autenticarte:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Edge Functions** → **process-food-ai** → **Logs**
4. Busca entradas con `[process-food-ai]`
5. Revisa los mensajes de error específicos

## 🛠️ Soluciones Rápidas

### Solución 1: Refresh Token Automático

Agrega esto en `src/lib/supabase.ts`:

```typescript
// Refresh token automáticamente
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed:', session)
  }
  if (event === 'SIGNED_OUT') {
    console.log('User signed out')
  }
})
```

### Solución 2: Interceptor de Fetch

Si quieres refresh automático antes de cada llamada:

```typescript
const originalFetch = window.fetch
window.fetch = async (url, options) => {
  // Si es llamada a Edge Function, refresh token primero
  if (url.includes('/functions/v1/')) {
    const { data } = await supabase.auth.getSession()
    if (data.session?.expires_at) {
      const now = Math.floor(Date.now() / 1000)
      const timeLeft = data.session.expires_at - now

      // Si quedan menos de 5 minutos, refresh
      if (timeLeft < 300) {
        await supabase.auth.refreshSession()
      }
    }
  }

  return originalFetch(url, options)
}
```

### Solución 3: Verificar JWT en Supabase

1. Ve a Supabase Dashboard → Authentication → Policies
2. Verifica que la tabla `food_logs` tenga:
   - Policy para INSERT con `auth.uid() = user_id`
   - Policy para SELECT con `auth.uid() = user_id`

Si no existen, créalas:

```sql
-- Policy para INSERT
CREATE POLICY "Users can insert own food logs"
ON food_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy para SELECT
CREATE POLICY "Users can view own food logs"
ON food_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

## 📞 Si Aún Persiste el Error

Si después de todo esto sigue el error 401:

1. **Captura el request completo:**
   - DevTools → Network → Filtra "process-food-ai"
   - Click en el request fallido
   - Copia Headers y Response

2. **Revisa los logs de Supabase:**
   - Ve a Dashboard → Logs
   - Busca el timestamp del request
   - Copia el mensaje de error completo

3. **Verifica variables de entorno:**
   ```bash
   # En tu .env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

4. **Test manual con curl:**
   ```bash
   # Obtén tu access_token de DevTools:
   # localStorage.getItem('sb-YOUR_PROJECT-auth-token')

   curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/process-food-ai" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -H "apikey: YOUR_ANON_KEY" \
     -d '{"message": "100g de arroz"}'
   ```

## ✅ Verificación Final

Después de aplicar la solución:

1. Cierra sesión
2. Borra localStorage
3. Inicia sesión nuevamente
4. Prueba enviar un mensaje en el chat
5. Prueba grabar audio
6. Prueba subir una imagen

Si todo funciona, el problema estaba en el token expirado o inválido.

## 🔐 Prevención Futura

Para evitar este error en el futuro:

1. **Implementar refresh automático** (ver Solución 1 arriba)
2. **Agregar indicator de expiración** en el UI
3. **Manejar TOKEN_REFRESHED event** para notificar al usuario
4. **Implementar retry logic** en llamadas a API

## 📚 Recursos

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Edge Functions Debugging](https://supabase.com/docs/guides/functions/debugging)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
