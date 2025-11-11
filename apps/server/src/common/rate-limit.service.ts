import { Injectable } from '@nestjs/common';

export interface RateLimitConfig {
    maxRequests: number; // Máximo número de requests
    windowMs: number; // Ventana de tiempo en milisegundos
}

export interface ActionRateLimit {
    count: number;
    resetAt: number; // Timestamp cuando se resetea
}

/**
 * Servicio de rate-limiting para WebSocket y HTTP
 * Previene spam y abuso de acciones
 */
@Injectable()
export class RateLimitService {
    // Mapa de userId -> actionType -> RateLimitInfo
    private rateLimitMap: Map<string, Map<string, ActionRateLimit>> = new Map();

    // Configuraciones por tipo de acción
    private readonly actionLimits: Map<string, RateLimitConfig> = new Map([
        // Acciones de juego (más restrictivas)
        ['place', { maxRequests: 10, windowMs: 5000 }], // 10 despliegues por 5 segundos
        ['attack', { maxRequests: 5, windowMs: 3000 }], // 5 ataques por 3 segundos
        ['fortify', { maxRequests: 8, windowMs: 5000 }], // 8 fortificaciones por 5 segundos
        ['move', { maxRequests: 3, windowMs: 5000 }], // 3 movimientos por 5 segundos
        ['reinforce', { maxRequests: 5, windowMs: 5000 }], // 5 refuerzos por 5 segundos
        ['consolidate', { maxRequests: 5, windowMs: 5000 }], // 5 consolidaciones por 5 segundos
        ['use_zone', { maxRequests: 3, windowMs: 10000 }], // 3 usos de zona por 10 segundos
        ['upgrade_path', { maxRequests: 5, windowMs: 5000 }], // 5 mejoras por 5 segundos
        ['end_turn', { maxRequests: 2, windowMs: 10000 }], // 2 fin de turno por 10 segundos (prevenir spam)

        // Acciones de lobby (menos restrictivas)
        ['create_room', { maxRequests: 5, windowMs: 60000 }], // 5 salas por minuto
        ['join_room', { maxRequests: 10, windowMs: 30000 }], // 10 uniones por 30 segundos
        ['pick_faction', { maxRequests: 10, windowMs: 10000 }], // 10 selecciones por 10 segundos
        ['pick_hero', { maxRequests: 10, windowMs: 10000 }], // 10 selecciones por 10 segundos
        ['set_ready', { maxRequests: 5, windowMs: 5000 }], // 5 cambios de ready por 5 segundos
        ['start_match', { maxRequests: 2, windowMs: 10000 }], // 2 inicios por 10 segundos

        // Límite global por usuario (todas las acciones combinadas)
        ['global', { maxRequests: 50, windowMs: 10000 }], // 50 acciones totales por 10 segundos
    ]);

    /**
     * Verifica si una acción está permitida según el rate limit
     * @param userId ID del usuario
     * @param actionType Tipo de acción (place, attack, etc.)
     * @returns true si está permitido, false si excede el límite
     */
    isAllowed(userId: string, actionType: string): boolean {
        const now = Date.now();

        // Obtener o crear mapa de acciones para este usuario
        if (!this.rateLimitMap.has(userId)) {
            this.rateLimitMap.set(userId, new Map());
        }
        const userActions = this.rateLimitMap.get(userId)!;

        // Verificar límite global primero
        if (!this.checkLimit(userId, 'global', now, userActions)) {
            return false;
        }

        // Verificar límite específico de la acción
        return this.checkLimit(userId, actionType, now, userActions);
    }

    /**
     * Verifica un límite específico
     */
    private checkLimit(
        userId: string,
        actionType: string,
        now: number,
        userActions: Map<string, ActionRateLimit>,
    ): boolean {
        const config = this.actionLimits.get(actionType);
        if (!config) {
            // Si no hay configuración, permitir (para acciones no configuradas)
            return true;
        }

        const limitInfo = userActions.get(actionType);

        // Si no existe o ya expiró, crear nuevo
        if (!limitInfo || now >= limitInfo.resetAt) {
            userActions.set(actionType, {
                count: 1,
                resetAt: now + config.windowMs,
            });
            return true;
        }

        // Si ya alcanzó el límite, rechazar
        if (limitInfo.count >= config.maxRequests) {
            return false;
        }

        // Incrementar contador
        limitInfo.count++;
        return true;
    }

    /**
     * Obtiene información del rate limit para un usuario y acción
     * Útil para debugging o mostrar al usuario cuántas acciones le quedan
     */
    getRateLimitInfo(userId: string, actionType: string): {
        remaining: number;
        resetAt: number;
        limit: number;
    } | null {
        const config = this.actionLimits.get(actionType);
        if (!config) return null;

        const userActions = this.rateLimitMap.get(userId);
        if (!userActions) {
            return {
                remaining: config.maxRequests,
                resetAt: Date.now() + config.windowMs,
                limit: config.maxRequests,
            };
        }

        const limitInfo = userActions.get(actionType);
        const now = Date.now();

        if (!limitInfo || now >= limitInfo.resetAt) {
            return {
                remaining: config.maxRequests,
                resetAt: now + config.windowMs,
                limit: config.maxRequests,
            };
        }

        return {
            remaining: Math.max(0, config.maxRequests - limitInfo.count),
            resetAt: limitInfo.resetAt,
            limit: config.maxRequests,
        };
    }

    /**
     * Limpia entradas antiguas para liberar memoria
     * Debería llamarse periódicamente
     */
    cleanup(): void {
        const now = Date.now();
        const usersToDelete: string[] = [];

        for (const [userId, userActions] of this.rateLimitMap.entries()) {
            const actionsToDelete: string[] = [];

            for (const [actionType, limitInfo] of userActions.entries()) {
                if (now >= limitInfo.resetAt) {
                    actionsToDelete.push(actionType);
                }
            }

            // Eliminar acciones expiradas
            actionsToDelete.forEach(action => userActions.delete(action));

            // Si el usuario no tiene acciones activas, marcarlo para eliminar
            if (userActions.size === 0) {
                usersToDelete.push(userId);
            }
        }

        // Eliminar usuarios sin acciones activas
        usersToDelete.forEach(userId => this.rateLimitMap.delete(userId));
    }

    /**
     * Resetea el rate limit para un usuario específico (útil para testing o admin)
     */
    resetUser(userId: string): void {
        this.rateLimitMap.delete(userId);
    }

    /**
     * Resetea todos los rate limits (útil para testing)
     */
    resetAll(): void {
        this.rateLimitMap.clear();
    }

    /**
     * Inicia limpieza automática cada minuto
     */
    startAutoCleanup(): void {
        setInterval(() => {
            this.cleanup();
        }, 60000); // Cada minuto
    }
}

