// @ts-ignore - Resuelto por alias en vite.config.ts
import * as Sentry from '@sentry/react';

/**
 * Inicializa Sentry para el frontend
 * Debe llamarse antes de renderizar la aplicación React
 */
export function initSentry() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    const environment = import.meta.env.MODE || 'development';

    // Si no hay DSN configurado, no inicializar Sentry
    if (!dsn) {
        console.log('⚠️  Sentry DSN not configured. Error tracking disabled.');
        return;
    }

    Sentry.init({
        dsn,
        environment,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],
        // Performance Monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        // Session Replay
        replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0, // Siempre grabar sesiones con errores
        // Configuración adicional
        beforeSend(event, hint) {
            // Filtrar eventos en desarrollo si es necesario
            if (environment === 'development') {
                // En desarrollo, solo enviar errores críticos
                if (event.level === 'error' || event.level === 'fatal') {
                    return event;
                }
                return null;
            }
            return event;
        },
        // Ignorar ciertos errores comunes del navegador
        ignoreErrors: [
            // Errores de red que son normales
            'NetworkError',
            'Network request failed',
            'Failed to fetch',
            // Errores de CORS
            'CORS',
            // Errores de WebSocket (ya se manejan)
            'WebSocket',
            'socket.io',
        ],
    });

    console.log('✅ Sentry initialized for frontend');
}

