import { API_URL } from '../config/env';

class ConfigService {
    private configCache: any = null;
    private cacheTimestamp: number = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

    async getConfig(): Promise<any> {
        const now = Date.now();

        // Usar caché si está disponible y no ha expirado
        if (this.configCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
            return this.configCache;
        }

        try {
            const response = await fetch(`${API_URL}/config`);
            if (!response.ok) {
                throw new Error('Error al obtener configuración');
            }

            this.configCache = await response.json();
            this.cacheTimestamp = now;
            return this.configCache;
        } catch (error) {
            // Si falla, usar valores por defecto
            console.warn('Error loading config, using defaults:', error);
            return this.getDefaultConfig();
        }
    }

    invalidateCache() {
        this.configCache = null;
        this.cacheTimestamp = 0;
    }

    private getDefaultConfig() {
        return {
            unitCosts: {
                explorer: 150,
                warrior: 250,
                elite: 300,
                hero: 350,
                chief: 1000,
                legend: 5000,
            },
            unitLimits: {
                explorer: 20,
                warrior: 25,
                elite: 15,
                hero: 10,
                chief: 1,
                legend: 3,
            },
        };
    }
}

export const configService = new ConfigService();

