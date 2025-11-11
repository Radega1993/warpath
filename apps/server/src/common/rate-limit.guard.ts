import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { RateLimitService } from './rate-limit.service';
import { AuthenticatedSocket } from './types';

/**
 * Guard para rate-limiting en WebSocket
 * Usar con @UseGuards(RateLimitGuard) en métodos de gateway
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(private rateLimitService: RateLimitService) { }

    canActivate(context: ExecutionContext): boolean {
        const client = context.switchToWs().getClient<AuthenticatedSocket>();
        const data = context.switchToWs().getData();
        const handler = context.getHandler();

        // Obtener el tipo de acción del nombre del handler
        // Ejemplo: handlePlace -> 'place', handleAttack -> 'attack'
        const handlerName = handler.name;
        const actionType = this.extractActionType(handlerName);

        if (!actionType) {
            // Si no podemos determinar el tipo de acción, permitir (para evitar falsos positivos)
            return true;
        }

        const userId = client.userId;
        if (!userId) {
            throw new WsException({
                code: 'UNAUTHORIZED',
                message: 'User not authenticated',
            });
        }

        const isAllowed = this.rateLimitService.isAllowed(userId, actionType);

        if (!isAllowed) {
            const limitInfo = this.rateLimitService.getRateLimitInfo(userId, actionType);
            const resetIn = limitInfo
                ? Math.ceil((limitInfo.resetAt - Date.now()) / 1000)
                : 0;

            throw new WsException({
                code: 'RATE_LIMIT_EXCEEDED',
                message: `Rate limit exceeded for action '${actionType}'. Try again in ${resetIn} seconds.`,
                resetIn,
            });
        }

        return true;
    }

    /**
     * Extrae el tipo de acción del nombre del handler
     * handlePlace -> 'place'
     * handleAttack -> 'attack'
     * handleUpgradePath -> 'upgrade_path'
     */
    private extractActionType(handlerName: string): string | null {
        // Remover prefijo 'handle'
        if (!handlerName.startsWith('handle')) {
            return null;
        }

        const actionName = handlerName.replace('handle', '');

        // Convertir camelCase a snake_case
        // UpgradePath -> upgrade_path
        const snakeCase = actionName
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');

        return snakeCase;
    }
}

