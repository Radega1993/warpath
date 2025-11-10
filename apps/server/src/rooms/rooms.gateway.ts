import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Inject, forwardRef } from '@nestjs/common';
import { RoomsService, RoomStatus } from './rooms.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { GameService } from '../game/game.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { TimerService } from '../game/timer.service';
import { AuthenticatedSocket, CreateRoomDto, JoinRoomDto, PickFactionDto, PickHeroDto } from '../common/types';
import { z } from 'zod';

const createRoomSchema = z.object({
    mode: z.string(),
    maxPlayers: z.number().min(2).max(4),
});

const joinRoomSchema = z.object({
    roomId: z.string().uuid(),
    handle: z.string().min(1).max(20),
});

const pickFactionSchema = z.object({
    raceId: z.string(),
});

const pickHeroSchema = z.object({
    heroId: z.string(),
});

@WebSocketGateway({
    namespace: '/lobby',
    cors: {
        origin: true,
        credentials: true,
    },
})
export class RoomsGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    constructor(
        private roomsService: RoomsService,
        private authService: AuthService,
        private usersService: UsersService,
        @Inject(forwardRef(() => GameService))
        private gameService: GameService,
        private telemetryService: TelemetryService,
        private timerService: TimerService,
    ) { }

    handleConnection(client: AuthenticatedSocket) {
        // Intentar obtener userId de los query parameters
        const queryUserId = (client.handshake.query?.userId as string) || null;
        
        // Asignar userId automáticamente si no existe (guest mode)
        if (!client.userId) {
            if (queryUserId) {
                // Usar el userId enviado por el cliente
                client.userId = queryUserId;
                console.log(`[RoomsGateway] Client connected to lobby: ${client.id} (userId from query: ${client.userId})`);
            } else {
                // Generar nuevo userId si no se proporcionó
                client.userId = this.authService.generateUserId();
                console.log(`[RoomsGateway] Client connected to lobby: ${client.id} (userId generated: ${client.userId})`);
            }
        } else {
            console.log(`[RoomsGateway] Client reconnected to lobby: ${client.id} (userId: ${client.userId})`);
        }

        // Enviar userId al cliente
        if (client.userId) {
            client.emit('user_authenticated', { userId: client.userId });
        }
    }

    @SubscribeMessage('create_room')
    handleCreateRoom(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: CreateRoomDto,
    ) {
        try {
            const validated = createRoomSchema.parse(data);

            // Asegurar que el userId esté asignado (por si acaso)
            if (!client.userId) {
                client.userId = this.authService.generateUserId();
                console.log(`[RoomsGateway] create_room: Assigned userId ${client.userId} to client ${client.id}`);
            }

            console.log(`[RoomsGateway] create_room: Client ${client.id} (userId: ${client.userId}) creating room`);

            const room = this.roomsService.createRoom(validated.mode, validated.maxPlayers, client.userId);

            // Unir al cliente a la sala
            client.join(room.id);
            client.roomId = room.id;

            // Añadir jugador a la sala
            const player = this.roomsService.addPlayer(room.id, client.userId, 'Player');
            if (!player) {
                client.emit('error', { code: 'ROOM_FULL', message: 'Room is full' });
                return;
            }

            // Crear usuario
            this.usersService.createOrUpdateUser(client.userId, 'Player');

            // Emitir room_created primero, luego room_update
            client.emit('room_created', { roomId: room.id });
            // Pequeño delay para asegurar que el cliente escuche room_created antes de room_update
            setTimeout(() => {
                this.broadcastRoomUpdate(room.id);
            }, 10);
        } catch (error) {
            client.emit('error', { code: 'VALIDATION_ERROR', message: error.message });
        }
    }

    @SubscribeMessage('join_room')
    handleJoinRoom(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: JoinRoomDto,
    ) {
        try {
            const validated = joinRoomSchema.parse(data);

            if (!client.userId) {
                client.emit('error', { code: 'UNAUTHORIZED', message: 'User not authenticated' });
                return;
            }

            // Validar handle
            if (!this.authService.validateHandle(validated.handle)) {
                client.emit('error', { code: 'INVALID_HANDLE', message: 'Invalid handle' });
                return;
            }

            const room = this.roomsService.getRoom(validated.roomId);
            if (!room) {
                client.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
                return;
            }

            if (room.status === RoomStatus.IN_PROGRESS) {
                client.emit('error', { code: 'ROOM_IN_PROGRESS', message: 'Room is in progress' });
                return;
            }

            // Unir al cliente a la sala
            client.leave(client.roomId || '');
            client.join(room.id);
            client.roomId = room.id;

            // Añadir jugador a la sala
            const player = this.roomsService.addPlayer(room.id, client.userId, validated.handle);
            if (!player) {
                client.emit('error', { code: 'ROOM_FULL', message: 'Room is full' });
                return;
            }

            // Crear o actualizar usuario
            this.usersService.createOrUpdateUser(client.userId, validated.handle);

            this.broadcastRoomUpdate(room.id);
        } catch (error) {
            client.emit('error', { code: 'VALIDATION_ERROR', message: error.message });
        }
    }

    @SubscribeMessage('leave_room')
    handleLeaveRoom(@ConnectedSocket() client: AuthenticatedSocket) {
        if (!client.userId || !client.roomId) {
            return;
        }

        const room = this.roomsService.getRoom(client.roomId);
        if (room) {
            this.roomsService.removePlayer(client.roomId, client.userId);
            client.leave(client.roomId);
            client.roomId = undefined;
            this.broadcastRoomUpdate(client.roomId);
        }
    }

    @SubscribeMessage('pick_faction')
    handlePickFaction(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: PickFactionDto,
    ) {
        try {
            const validated = pickFactionSchema.parse(data);

            if (!client.userId || !client.roomId) {
                client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
                return;
            }

            const success = this.roomsService.pickFaction(client.roomId, client.userId, validated.raceId as any);
            if (!success) {
                client.emit('error', { code: 'PICK_FAILED', message: 'Failed to pick faction' });
                return;
            }

            this.broadcastRoomUpdate(client.roomId);
        } catch (error) {
            client.emit('error', { code: 'VALIDATION_ERROR', message: error.message });
        }
    }

    @SubscribeMessage('pick_hero')
    handlePickHero(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: PickHeroDto,
    ) {
        try {
            const validated = pickHeroSchema.parse(data);

            if (!client.userId || !client.roomId) {
                client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
                return;
            }

            const success = this.roomsService.pickHero(client.roomId, client.userId, validated.heroId as any);
            if (!success) {
                client.emit('error', { code: 'PICK_FAILED', message: 'Failed to pick hero' });
                return;
            }

            this.broadcastRoomUpdate(client.roomId);
        } catch (error) {
            client.emit('error', { code: 'VALIDATION_ERROR', message: error.message });
        }
    }

    @SubscribeMessage('set_ready')
    handleSetReady(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { ready: boolean },
    ) {
        if (!client.userId || !client.roomId) {
            client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
            return;
        }

        const room = this.roomsService.getRoom(client.roomId);
        if (!room) {
            client.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            return;
        }

        const player = room.players.find(p => p.userId === client.userId);
        if (!player) {
            client.emit('error', { code: 'PLAYER_NOT_FOUND', message: 'Player not found in room' });
            return;
        }

        // Verificar que el jugador tenga raza seleccionada antes de marcar como ready
        if (data.ready && !player.raceId) {
            client.emit('error', { code: 'NO_RACE_SELECTED', message: 'You must select a race before marking as ready' });
            return;
        }

        const success = this.roomsService.setPlayerReady(client.roomId, client.userId, data.ready);
        if (!success) {
            client.emit('error', { code: 'SET_READY_FAILED', message: 'Failed to set ready status' });
            return;
        }

        this.broadcastRoomUpdate(client.roomId);
    }

    @SubscribeMessage('start_match')
    handleStartMatch(@ConnectedSocket() client: AuthenticatedSocket) {
        if (!client.userId || !client.roomId) {
            client.emit('error', { code: 'UNAUTHORIZED', message: 'Not in a room' });
            return;
        }

        const room = this.roomsService.getRoom(client.roomId);
        if (!room) {
            client.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            return;
        }

        console.log(`[RoomsGateway] start_match: Room ${client.roomId}, status: ${room.status}, players: ${room.players.length}`);
        console.log(`[RoomsGateway] start_match: Players:`, room.players.map(p => ({ userId: p.userId, raceId: p.raceId, ready: p.ready })));

        // Verificar que solo el creador de la sala pueda iniciar la partida
        if (room.creatorId !== client.userId) {
            console.log(`[RoomsGateway] start_match: User ${client.userId} is not the creator (${room.creatorId})`);
            client.emit('error', { code: 'NOT_CREATOR', message: 'Only the room creator can start the match' });
            return;
        }

        // Verificar que todos los jugadores tengan raza seleccionada
        const allHaveRace = room.players.every(p => p.raceId);
        if (!allHaveRace) {
            console.log(`[RoomsGateway] start_match: Not all players have selected a race`);
            client.emit('error', { code: 'NOT_ALL_READY', message: 'All players must select a race before starting' });
            return;
        }

        // Verificar que haya al menos 2 jugadores
        if (room.players.length < 2) {
            console.log(`[RoomsGateway] start_match: Not enough players (${room.players.length})`);
            client.emit('error', { code: 'NOT_ENOUGH_PLAYERS', message: 'At least 2 players are required to start' });
            return;
        }

        // Marcar todos los jugadores como listos si tienen raza
        room.players.forEach(player => {
            if (player.raceId) {
                player.ready = true;
            }
        });

        const success = this.roomsService.startMatch(client.roomId);
        if (!success) {
            console.log(`[RoomsGateway] start_match: Failed to start match for room ${client.roomId}`);
            client.emit('error', { code: 'START_FAILED', message: 'Failed to start match' });
            return;
        }

        console.log(`[RoomsGateway] start_match: Successfully started match for room ${client.roomId}`);

        // Iniciar el juego
        const fsm = this.gameService.startGame(client.roomId);
        if (!fsm) {
            client.emit('error', { code: 'GAME_START_FAILED', message: 'Failed to start game' });
            return;
        }

        // Registrar telemetría
        this.telemetryService.logMatchStart(client.roomId, room.players);

        // Redirigir clientes a la sala de juego
        this.server.to(client.roomId).socketsJoin(`/room/${client.roomId}`);

        // Iniciar timer para el primer turno
        this.timerService.startTimer(
            client.roomId,
            120,
            (secondsLeft) => {
                this.server.to(`/room/${client.roomId}`).emit('timer_tick', { secondsLeft });
            },
            () => {
                // Auto-end turn si expira el timer (se manejará en GameGateway)
            }
        );

        // Emitir estado inicial del juego
        const gameState = this.gameService.serializeGameState(fsm);
        const secondsLeft = this.timerService.getSecondsLeft(client.roomId);
        gameState.timers.turnSecondsLeft = secondsLeft;
        console.log(`[RoomsGateway] Emitting initial game_state to /room/${client.roomId}:`, gameState);
        this.server.to(`/room/${client.roomId}`).emit('game_state', gameState);

        this.broadcastRoomUpdate(client.roomId);
    }

    private broadcastRoomUpdate(roomId: string) {
        const room = this.roomsService.getRoom(roomId);
        if (!room) {
            console.log(`[RoomsGateway] broadcastRoomUpdate: Room ${roomId} not found`);
            return;
        }

        const roomUpdate = {
            id: room.id,
            mode: room.mode,
            maxPlayers: room.maxPlayers,
            status: room.status,
            creatorId: room.creatorId,
            players: room.players.map(p => ({
                userId: p.userId,
                handle: p.handle,
                seat: p.seat,
                raceId: p.raceId,
                heroId: p.heroId,
                ready: p.ready,
            })),
        };

        console.log(`[RoomsGateway] broadcastRoomUpdate: Room ${roomId}`, roomUpdate);
        this.server.to(roomId).emit('room_update', roomUpdate);
    }
}

