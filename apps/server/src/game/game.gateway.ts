import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import { GameService } from './game.service';
import { TimerService } from './timer.service';
import { RoomsService } from '../rooms/rooms.service';
import { MatchService } from '../match/match.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { captureWebSocketError } from '../common/sentry.helper';
import * as Sentry from '@sentry/node';
import { AuthenticatedSocket, PlaceDto, AttackDto, FortifyDto, UpgradePathDto, MoveDto, ReinforceDto, UseZoneDto, ConsolidateDto } from '../common/types';
import { PathType, GamePhase } from '@warpath/rules-engine';
import { z } from 'zod';

/**
 * Normaliza un valor de enum a minúsculas y valida que sea un valor válido
 */
function normalizeEnum<T extends string>(value: string, enumObject: Record<string, T>): T | null {
    const normalized = value.toLowerCase();
    const validValues = Object.values(enumObject);
    return validValues.includes(normalized as T) ? (normalized as T) : null;
}

const placeSchema = z.object({
    territoryId: z.string(),
    units: z.object({
        d4: z.number().optional(),
        d6: z.number().optional(),
        d8: z.number().optional(),
        d12: z.number().optional(),
        d20: z.number().optional(),
        d100: z.number().optional(),
    }),
});

const attackSchema = z.object({
    fromId: z.string(),
    toId: z.string(),
    commit: z.object({
        d4: z.number().optional(),
        d6: z.number().optional(),
        d8: z.number().optional(),
        d12: z.number().optional(),
        d20: z.number().optional(),
        d100: z.number().optional(),
    }),
});

const fortifySchema = z.object({
    fromId: z.string(),
    toId: z.string(),
    units: z.object({
        d4: z.number().optional(),
        d6: z.number().optional(),
        d8: z.number().optional(),
        d12: z.number().optional(),
        d20: z.number().optional(),
        d100: z.number().optional(),
    }),
});

const upgradePathSchema = z.object({
    pathId: z.string().transform((val) => val.toLowerCase()),
});

const moveSchema = z.object({
    movements: z.array(z.object({
        fromId: z.string(),
        toId: z.string(),
        units: z.object({
            d4: z.number().optional(),
            d6: z.number().optional(),
            d8: z.number().optional(),
            d12: z.number().optional(),
            d20: z.number().optional(),
            d100: z.number().optional(),
        }),
    })),
});

const reinforceSchema = z.object({
    territoryId: z.string(),
});

const useZoneSchema = z.object({
    territoryId: z.string(),
});

const consolidateSchema = z.object({
    territoryId: z.string(),
});

@WebSocketGateway({
    namespace: /^\/room\/.+$/,
    cors: {
        origin: true,
        credentials: true,
    },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private gameService: GameService,
        private timerService: TimerService,
        private roomsService: RoomsService,
        private matchService: MatchService,
        private telemetryService: TelemetryService,
        private authService: AuthService,
        private usersService: UsersService,
    ) { }

    handleConnection(client: AuthenticatedSocket) {
        const roomId = this.extractRoomId(client.nsp.name);
        if (roomId) {
            client.roomId = roomId;

            // Intentar obtener userId de los query parameters
            const queryUserId = (client.handshake.query?.userId as string) || null;

            // Asignar userId automáticamente si no existe
            if (!client.userId) {
                if (queryUserId) {
                    // Usar el userId enviado por el cliente
                    client.userId = queryUserId;
                    console.log(`[GameGateway] Client connected to room: ${roomId} (userId from query: ${client.userId})`);
                } else {
                    // Generar nuevo userId si no se proporcionó
                    client.userId = this.authService.generateUserId();
                    console.log(`[GameGateway] Client connected to room: ${roomId} (userId generated: ${client.userId})`);
                }
            } else {
                console.log(`[GameGateway] Client connected to room: ${roomId} (userId: ${client.userId})`);
            }

            // Enviar estado actual del juego si existe
            const fsm = this.gameService.getGame(roomId);
            if (fsm) {
                const gameState = this.gameService.serializeGameState(fsm);
                const secondsLeft = this.timerService.getSecondsLeft(roomId);
                gameState.timers.turnSecondsLeft = secondsLeft;
                client.emit('game_state', gameState);
            }
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        // Manejar desconexión
        console.log(`Client disconnected from room: ${client.roomId}`);

        // Capturar desconexión inesperada en Sentry (solo si hay un juego activo)
        if (client.roomId) {
            const fsm = this.gameService.getGame(client.roomId);
            if (fsm) {
                // Solo registrar si el juego está en progreso (no es una desconexión normal al finalizar)
                const state = fsm.getState();
                if (state.phase !== GamePhase.LOBBY && state.phase !== GamePhase.GAME_OVER) {
                    Sentry.captureMessage('Client disconnected during active game', {
                        level: 'warning',
                        tags: {
                            roomId: client.roomId,
                            userId: client.userId,
                            phase: state.phase,
                            turn: state.turn,
                        },
                    });
                }
            }
        }
    }

    @SubscribeMessage('place')
    @UseGuards(RateLimitGuard)
    handlePlace(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: PlaceDto,
    ) {
        try {
            const validated = placeSchema.parse(data);
            const roomId = client.roomId;
            if (!roomId || !client.userId) {
                client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
                return;
            }

            const fsm = this.gameService.getGame(roomId);
            if (!fsm) {
                client.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
                return;
            }

            const troops = this.gameService.convertTroops(validated.units);
            fsm.deployTroops(validated.territoryId, troops);

            this.broadcastGameState(roomId);
        } catch (error) {
            captureWebSocketError(error, {
                action: 'place',
                roomId: client.roomId || 'unknown',
                userId: client.userId || 'unknown',
            });
            client.emit('error', { code: 'ACTION_FAILED', message: error.message });
        }
    }

    @SubscribeMessage('attack')
    @UseGuards(RateLimitGuard)
    handleAttack(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: AttackDto,
    ) {
        try {
            const validated = attackSchema.parse(data);
            const roomId = client.roomId;
            if (!roomId || !client.userId) {
                client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
                return;
            }

            const fsm = this.gameService.getGame(roomId);
            if (!fsm) {
                client.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
                return;
            }

            const state = fsm.getState();
            const attackerTroops = this.gameService.convertTroops(validated.commit);

            // Obtener tropas del defensor (simplificado: todas las tropas del territorio)
            const defenderTerritory = state.territories[validated.toId];
            const defenderTroops = defenderTerritory?.troops || this.gameService.convertTroops({});

            fsm.attackTerritory(validated.fromId, validated.toId, attackerTroops, defenderTroops);

            // Emitir resultado de combate (simplificado)
            client.emit('combat_result', {
                rolls: { attacker: [], defender: [] },
                modifiersApplied: { attacker: [], defender: [] },
                losses: { attacker: {}, defender: {} },
                conquest: defenderTerritory?.ownerId !== state.territories[validated.toId]?.ownerId,
            });

            this.broadcastGameState(roomId);
        } catch (error) {
            captureWebSocketError(error, {
                action: 'attack',
                roomId: client.roomId || 'unknown',
                userId: client.userId || 'unknown',
            });
            client.emit('error', { code: 'ACTION_FAILED', message: error.message });
        }
    }

    @SubscribeMessage('fortify')
    @UseGuards(RateLimitGuard)
    handleFortify(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: FortifyDto,
    ) {
        try {
            const validated = fortifySchema.parse(data);
            const roomId = client.roomId;
            if (!roomId || !client.userId) {
                client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
                return;
            }

            const fsm = this.gameService.getGame(roomId);
            if (!fsm) {
                client.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
                return;
            }

            const troops = this.gameService.convertTroops(validated.units);
            fsm.fortify(validated.fromId, validated.toId, troops);

            this.broadcastGameState(roomId);
        } catch (error) {
            captureWebSocketError(error, {
                action: 'fortify',
                roomId: client.roomId || 'unknown',
                userId: client.userId || 'unknown',
            });
            client.emit('error', { code: 'ACTION_FAILED', message: error.message });
        }
    }

    @SubscribeMessage('upgrade_path')
    @UseGuards(RateLimitGuard)
    handleUpgradePath(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: UpgradePathDto,
    ) {
        try {
            const validated = upgradePathSchema.parse(data);
            const roomId = client.roomId;
            if (!roomId || !client.userId) {
                client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
                return;
            }

            // Validar que el pathId sea un valor válido del enum
            const normalizedPathId = normalizeEnum(validated.pathId, PathType);
            if (!normalizedPathId) {
                client.emit('error', { code: 'INVALID_PATH', message: 'Invalid path ID' });
                return;
            }

            const fsm = this.gameService.getGame(roomId);
            if (!fsm) {
                client.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
                return;
            }

            fsm.upgradePath(normalizedPathId);

            this.broadcastGameState(roomId);
        } catch (error) {
            captureWebSocketError(error, {
                action: 'upgrade_path',
                roomId: client.roomId || 'unknown',
                userId: client.userId || 'unknown',
            });
            client.emit('error', { code: 'ACTION_FAILED', message: error.message });
        }
    }

    @SubscribeMessage('move')
    @UseGuards(RateLimitGuard)
    handleMove(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: MoveDto,
    ) {
        try {
            const validated = moveSchema.parse(data);
            const roomId = client.roomId;
            if (!roomId || !client.userId) {
                client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
                return;
            }

            const fsm = this.gameService.getGame(roomId);
            if (!fsm) {
                client.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
                return;
            }

            // Convertir movements a formato Troops
            const movements = validated.movements.map(m => ({
                fromId: m.fromId,
                toId: m.toId,
                troops: this.gameService.convertTroops(m.units),
            }));

            fsm.moveTroops(movements);

            this.broadcastGameState(roomId);
        } catch (error) {
            captureWebSocketError(error, {
                action: 'move',
                roomId: client.roomId || 'unknown',
                userId: client.userId || 'unknown',
            });
            client.emit('error', { code: 'ACTION_FAILED', message: error.message });
        }
    }

    @SubscribeMessage('reinforce')
    @UseGuards(RateLimitGuard)
    handleReinforce(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: ReinforceDto,
    ) {
        try {
            const validated = reinforceSchema.parse(data);
            const roomId = client.roomId;
            if (!roomId || !client.userId) {
                client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
                return;
            }

            const fsm = this.gameService.getGame(roomId);
            if (!fsm) {
                client.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
                return;
            }

            fsm.reinforceTerritory(validated.territoryId);

            this.broadcastGameState(roomId);
        } catch (error) {
            captureWebSocketError(error, {
                action: 'reinforce',
                roomId: client.roomId || 'unknown',
                userId: client.userId || 'unknown',
            });
            client.emit('error', { code: 'ACTION_FAILED', message: error.message });
        }
    }

    @SubscribeMessage('use_zone')
    @UseGuards(RateLimitGuard)
    handleUseZone(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: UseZoneDto,
    ) {
        try {
            const validated = useZoneSchema.parse(data);
            const roomId = client.roomId;
            if (!roomId || !client.userId) {
                client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
                return;
            }

            const fsm = this.gameService.getGame(roomId);
            if (!fsm) {
                client.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
                return;
            }

            fsm.useZone(validated.territoryId);

            this.broadcastGameState(roomId);
        } catch (error) {
            captureWebSocketError(error, {
                action: 'use_zone',
                roomId: client.roomId || 'unknown',
                userId: client.userId || 'unknown',
            });
            client.emit('error', { code: 'ACTION_FAILED', message: error.message });
        }
    }

    @SubscribeMessage('consolidate')
    @UseGuards(RateLimitGuard)
    handleConsolidate(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: ConsolidateDto,
    ) {
        try {
            const validated = consolidateSchema.parse(data);
            const roomId = client.roomId;
            if (!roomId || !client.userId) {
                client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
                return;
            }

            const fsm = this.gameService.getGame(roomId);
            if (!fsm) {
                client.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
                return;
            }

            fsm.consolidateTerritory(validated.territoryId);

            this.broadcastGameState(roomId);
        } catch (error) {
            captureWebSocketError(error, {
                action: 'consolidate',
                roomId: client.roomId || 'unknown',
                userId: client.userId || 'unknown',
            });
            client.emit('error', { code: 'ACTION_FAILED', message: error.message });
        }
    }

    @SubscribeMessage('end_turn')
    @UseGuards(RateLimitGuard)
    async handleEndTurn(@ConnectedSocket() client: AuthenticatedSocket) {
        const roomId = client.roomId;
        if (!roomId || !client.userId) {
            client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
            return;
        }

        const fsm = this.gameService.getGame(roomId);
        if (!fsm) {
            client.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
            return;
        }

        const state = fsm.getState();
        const previousGold = state.players[state.currentPlayerId]?.gold || 0;
        const turnStartTime = Date.now();

        fsm.endTurn();

        const newState = fsm.getState();
        const newPlayer = newState.players[newState.currentPlayerId];
        const goldChange = (newPlayer?.gold || 0) - previousGold;

        // Registrar duración del turno
        const turnDuration = Date.now() - turnStartTime;
        this.telemetryService.logTurnDuration(roomId, state.currentPlayerId, turnDuration);

        // Emitir actualización de economía
        if (goldChange > 0) {
            client.emit('economy_update', {
                goldChange,
                reason: 'territory_income',
            });
        }

        // Verificar si el juego terminó
        if (newState.phase === 'game_over') {
            this.timerService.stopTimer(roomId);
            await this.gameService.endGame(roomId);

            const match = await this.matchService.getMatch(roomId);
            const duration = match ? Date.now() - match.startedAt.getTime() : 0;

            this.telemetryService.logMatchEnd(roomId, newState.winnerId || '', duration, newState.turn);

            // Actualizar estadísticas de usuarios
            if (match && match.players) {
                for (const playerData of match.players) {
                    await this.usersService.updateUserStats(playerData.userId, {
                        won: playerData.won,
                        goldEarned: playerData.finalGold,
                        territoriesConquered: playerData.territories,
                    });
                }
            }

            this.server.to(`/room/${roomId}`).emit('game_over', {
                winnerId: newState.winnerId,
                stats: {
                    duration,
                    turns: newState.turn,
                    players: match?.players || [],
                },
            });
            return;
        }

        // Reiniciar timer para el siguiente turno
        this.timerService.startTimer(
            roomId,
            120,
            (secondsLeft) => {
                this.server.to(`/room/${roomId}`).emit('timer_tick', { secondsLeft });
            },
            () => {
                // Auto-end turn si expira el timer
                this.handleEndTurn(client);
            }
        );

        // Guardar snapshot
        await this.matchService.saveSnapshot(roomId, newState.turn, newState);

        this.broadcastGameState(roomId);
    }

    private extractRoomId(namespace: string): string | null {
        const match = namespace.match(/^\/room\/(.+)$/);
        return match ? match[1] : null;
    }

    private broadcastGameState(roomId: string) {
        const fsm = this.gameService.getGame(roomId);
        if (!fsm) {
            return;
        }

        const gameState = this.gameService.serializeGameState(fsm);
        const secondsLeft = this.timerService.getSecondsLeft(roomId);
        gameState.timers.turnSecondsLeft = secondsLeft;
        this.server.to(`/room/${roomId}`).emit('game_state', gameState);
    }
}

