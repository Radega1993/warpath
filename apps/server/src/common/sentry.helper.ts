import * as Sentry from '@sentry/node';

/**
 * Helper para capturar errores en Sentry con contexto de WebSocket
 */
export function captureWebSocketError(
    error: Error | unknown,
    context: {
        action: string;
        roomId?: string;
        userId?: string;
        [key: string]: any;
    },
) {
    Sentry.captureException(error, {
        tags: {
            source: 'websocket',
            ...context,
        },
        extra: context,
    });
}

