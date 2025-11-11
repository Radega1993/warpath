# Configuración de Sentry

Sentry está configurado tanto en el backend (NestJS) como en el frontend (React) para monitoreo de errores y performance.

## Variables de Entorno

### Backend

Agregar al archivo `.env` o variables de entorno del servidor:

```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NODE_ENV=production  # o development
```

### Frontend

Agregar al archivo `.env` o `.env.local`:

```bash
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## Configuración

### Backend

- **Archivo**: `apps/server/src/common/sentry.config.ts`
- **Inicialización**: Se inicializa en `main.ts` antes de crear la aplicación NestJS
- **Integraciones**:
  - Profiling de Node.js
  - Captura automática de excepciones no manejadas
  - Filtro de excepciones HTTP
  - Interceptor para errores en controladores

### Frontend

- **Archivo**: `apps/client/src/sentry.config.ts`
- **Inicialización**: Se inicializa en `main.tsx` antes de renderizar React
- **Integraciones**:
  - Browser Tracing (performance)
  - Session Replay (grabación de sesiones con errores)
  - Error Boundary para errores de React

## Características

### Backend

1. **Captura de errores WebSocket**: Los errores en gateways se capturan automáticamente
2. **Contexto adicional**: Se incluye información de roomId, userId, y acción
3. **Filtrado**: Se ignoran errores de validación (Zod) y excepciones WebSocket manejadas
4. **Performance**: 10% de trazas en producción, 100% en desarrollo

### Frontend

1. **Error Boundary**: Captura errores de React y muestra UI de fallback
2. **Session Replay**: Graba sesiones cuando hay errores
3. **Performance Monitoring**: Rastrea rendimiento de la aplicación
4. **Filtrado**: Ignora errores comunes de red y WebSocket

## Uso Manual

### Backend

```typescript
import * as Sentry from '@sentry/node';
import { captureWebSocketError } from '../common/sentry.helper';

// Capturar excepción simple
Sentry.captureException(error);

// Capturar con contexto WebSocket
captureWebSocketError(error, {
    action: 'attack',
    roomId: 'room-123',
    userId: 'user-456',
});

// Capturar mensaje
Sentry.captureMessage('Something important happened', {
    level: 'warning',
    tags: { customTag: 'value' },
});
```

### Frontend

```typescript
import * as Sentry from '@sentry/react';

// Capturar excepción
Sentry.captureException(error);

// Capturar mensaje
Sentry.captureMessage('User action', {
    level: 'info',
    tags: { action: 'button_click' },
});

// Agregar contexto de usuario
Sentry.setUser({
    id: userId,
    username: handle,
});
```

## Desactivar Sentry

Para desactivar Sentry, simplemente no configurar las variables de entorno `SENTRY_DSN` o `VITE_SENTRY_DSN`. La aplicación funcionará normalmente sin tracking de errores.

## Dashboard de Sentry

Una vez configurado, puedes ver los errores en:
- https://sentry.io/organizations/your-org/projects/your-project/

## Notas

- En desarrollo, solo se envían errores críticos (level: error o fatal)
- En producción, se muestrea el 10% de las trazas para no sobrecargar
- Session Replay solo graba sesiones con errores en producción
- Los errores de validación (Zod) no se envían a Sentry (ya se manejan)

