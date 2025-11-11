import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Inicializa Sentry para el backend
 * Debe llamarse antes de crear la aplicación NestJS
 */
export function initSentry() {
    const dsn = process.env.SENTRY_DSN;
    const environment = process.env.NODE_ENV || 'development';

    // Si no hay DSN configurado, no inicializar Sentry (modo desarrollo sin Sentry)
    if (!dsn) {
        console.log('⚠️  Sentry DSN not configured. Error tracking disabled.');
        return;
    }

    Sentry.init({
        dsn,
        environment,
        integrations: [
            nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% en producción, 100% en desarrollo
        // Profiling
        profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
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
        // Ignorar ciertos errores comunes
        ignoreErrors: [
            'ValidationError', // Errores de validación de Zod (ya se manejan)
            'WsException', // Excepciones WebSocket (ya se manejan)
        ],
    });

    console.log('✅ Sentry initialized for backend');
}

