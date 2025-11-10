import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GameService } from './game.service';
import { TimerService } from './timer.service';
import { RoomsService } from '../rooms/rooms.service';
import { MatchService } from '../match/match.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { AuthenticatedSocket, PlaceDto, AttackDto, FortifyDto, UpgradePathDto } from '../common/types';
import { PathType } from '@warpath/rules-engine';
import { z } from 'zod';

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
    pathId: z.string(),
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
    ) { }

    handleConnection(client: AuthenticatedSocket) {
        const roomId = this.extractRoomId(client.nsp.name);
        if (roomId) {
            client.roomId = roomId;
            console.log(`Client connected to room: ${roomId}`);

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
    }

    @SubscribeMessage('place')
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
            client.emit('error', { code: 'ACTION_FAILED', message: error.message });
        }
    }

    @SubscribeMessage('attack')
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
            client.emit('error', { code: 'ACTION_FAILED', message: error.message });
        }
    }

    @SubscribeMessage('fortify')
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
            client.emit('error', { code: 'ACTION_FAILED', message: error.message });
        }
    }

    @SubscribeMessage('upgrade_path')
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

            const fsm = this.gameService.getGame(roomId);
            if (!fsm) {
                client.emit('error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
                return;
            }

            fsm.upgradePath(validated.pathId as PathType);

            this.broadcastGameState(roomId);
        } catch (error) {
            client.emit('error', { code: 'ACTION_FAILED', message: error.message });
        }
    }

    @SubscribeMessage('end_turn')
    handleEndTurn(@ConnectedSocket() client: AuthenticatedSocket) {
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
            this.gameService.endGame(roomId);

            const match = this.matchService.getMatch(roomId);
            const duration = match ? Date.now() - match.startedAt.getTime() : 0;

            this.telemetryService.logMatchEnd(roomId, newState.winnerId || '', duration, newState.turn);

            this.server.to(`/room/${roomId}`).emit('game_over', {
                winnerId: newState.winnerId,
                stats: {
                    duration,
                    turns: newState.turn,
                    players: [],
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
        this.matchService.saveSnapshot(roomId, newState.turn, newState);

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

