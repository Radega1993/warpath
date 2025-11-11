/**
 * Configuración centralizada de variables de entorno
 * Usa variables de entorno o valores por defecto para desarrollo local
 */

// URL del servidor backend
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// URL base para WebSockets (puede ser relativa para usar el proxy de Vite)
export const WS_URL = import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? '' : 'http://localhost:3001');

// En desarrollo, usar URL relativa para que pase por el proxy de Vite
// En producción, usar la URL completa del servidor
export const getWebSocketURL = (namespace: string = '') => {
    if (import.meta.env.DEV && !import.meta.env.VITE_WS_URL) {
        // En desarrollo, usar URL relativa para el proxy de Vite
        return namespace ? `/${namespace}` : '/';
    }
    // En producción o si está configurado, usar URL completa
    const base = WS_URL || API_URL;
    return namespace ? `${base}/${namespace}` : base;
};

