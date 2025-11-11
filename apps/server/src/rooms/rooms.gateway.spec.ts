import { Test, TestingModule } from '@nestjs/testing';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { GameService } from '../game/game.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { TimerService } from '../game/timer.service';
import { AuthenticatedSocket } from '../common/types';
import { RaceType, HeroType } from '@warpath/rules-engine';

describe('RoomsGateway', () => {
    let gateway: RoomsGateway;
    let roomsService: RoomsService;
    let authService: AuthService;
    let usersService: UsersService;
    let gameService: GameService;
    let mockSocket: Partial<AuthenticatedSocket>;
    let mockServer: any;

    beforeEach(async () => {
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            socketsJoin: jest.fn(),
        };
        const mockRoomsService = {
            createRoom: jest.fn().mockResolvedValue({}),
            getRoom: jest.fn().mockResolvedValue(null),
            addPlayer: jest.fn().mockResolvedValue(null),
            removePlayer: jest.fn().mockResolvedValue(false),
            pickFaction: jest.fn().mockResolvedValue(false),
            pickHero: jest.fn().mockResolvedValue(false),
            setPlayerReady: jest.fn().mockResolvedValue(false),
            startMatch: jest.fn().mockResolvedValue(false),
        };

        const mockAuthService = {
            generateUserId: jest.fn(() => 'user-123'),
            validateHandle: jest.fn(() => true),
        };

        const mockUsersService = {
            createUser: jest.fn(),
            getUser: jest.fn(),
            createOrUpdateUser: jest.fn(),
        };

        const mockGameService = {
            startGame: jest.fn().mockResolvedValue(null),
            serializeGameState: jest.fn(),
        };

        const mockTelemetryService = {
            logMatchStart: jest.fn(),
        };

        const mockTimerService = {
            startTimer: jest.fn(),
            stopTimer: jest.fn(),
            getSecondsLeft: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomsGateway,
                { provide: RoomsService, useValue: mockRoomsService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: UsersService, useValue: mockUsersService },
                { provide: GameService, useValue: mockGameService },
                { provide: TelemetryService, useValue: mockTelemetryService },
                { provide: TimerService, useValue: mockTimerService },
            ],
        }).compile();

        gateway = module.get<RoomsGateway>(RoomsGateway);
        gateway.server = mockServer;
        roomsService = module.get<RoomsService>(RoomsService);
        authService = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        gameService = module.get<GameService>(GameService);

        mockSocket = {
            id: 'socket-123',
            userId: 'user-123',
            roomId: 'room-123',
            emit: jest.fn(),
            on: jest.fn(),
            disconnect: jest.fn(),
            join: jest.fn(),
            leave: jest.fn(),
            to: jest.fn().mockReturnThis(),
        };
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleCreateRoom', () => {
        it('should create room and return room data', async () => {
            const mockRoom = {
                id: 'room-123',
                mode: 'standard',
                maxPlayers: 2,
                status: 'waiting',
                players: [],
                creatorId: 'user-123',
            };

            (roomsService.createRoom as jest.Mock).mockResolvedValue(mockRoom);
            (roomsService.addPlayer as jest.Mock).mockResolvedValue({ userId: 'user-123', handle: 'Player' });
            (roomsService.getRoom as jest.Mock).mockResolvedValue(mockRoom);
            (usersService.createOrUpdateUser as jest.Mock).mockReturnValue(undefined);

            // Usar setTimeout para esperar el broadcastRoomUpdate
            await gateway.handleCreateRoom(
                mockSocket as AuthenticatedSocket,
                { mode: 'standard', maxPlayers: 2 },
            );

            expect(roomsService.createRoom).toHaveBeenCalledWith('standard', 2, 'user-123');
            expect(mockSocket.emit).toHaveBeenCalledWith('room_created', { roomId: mockRoom.id });

            // Esperar un poco para que se ejecute el setTimeout
            await new Promise(resolve => setTimeout(resolve, 20));
        });

        it('should validate room creation data', async () => {
            gateway.handleCreateRoom(
                mockSocket as AuthenticatedSocket,
                { mode: 'standard', maxPlayers: 5 }, // Invalid maxPlayers
            );

            // El código emite un error en lugar de lanzar una excepción
            expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
                code: 'VALIDATION_ERROR',
            }));
        });
    });

    describe('handleJoinRoom', () => {
        it('should join room and return room data', async () => {
            const mockRoom = {
                id: 'room-123',
                mode: 'standard',
                maxPlayers: 2,
                status: 'waiting',
                creatorId: 'user-456',
                players: [{ userId: 'user-123', handle: 'Player1' }],
            };

            // El roomId debe ser un UUID válido según el schema
            const validRoomId = '123e4567-e89b-12d3-a456-426614174000';
            // El mockRoom.id debe coincidir con el validRoomId para que el código funcione
            mockRoom.id = validRoomId;

            (roomsService.getRoom as jest.Mock).mockResolvedValue(mockRoom);
            (roomsService.addPlayer as jest.Mock).mockResolvedValue({ userId: 'user-123', handle: 'Player1' });
            (usersService.createOrUpdateUser as jest.Mock).mockReturnValue(undefined);
            (authService.validateHandle as jest.Mock).mockReturnValue(true);

            // El método no retorna nada, solo emite eventos
            await gateway.handleJoinRoom(
                mockSocket as AuthenticatedSocket,
                { roomId: validRoomId, handle: 'Player1' },
            );

            // El código usa room.id, no validated.roomId
            expect(roomsService.addPlayer).toHaveBeenCalledWith(validRoomId, 'user-123', 'Player1');
            expect(mockSocket.join).toHaveBeenCalledWith(validRoomId);

            // Esperar un poco para que se ejecute el broadcastRoomUpdate
            await new Promise(resolve => setTimeout(resolve, 20));
        });

        it('should validate join room data', async () => {
            gateway.handleJoinRoom(
                mockSocket as AuthenticatedSocket,
                { roomId: 'invalid', handle: '' }, // Invalid data
            );

            // El código emite un error en lugar de lanzar una excepción
            expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
                code: 'VALIDATION_ERROR',
            }));
        });
    });

    describe('handlePickFaction', () => {
        it('should pick faction for player', async () => {
            const mockRoom = {
                id: 'room-123',
                players: [{ userId: 'user-123', raceId: RaceType.HUMAN }],
            };

            (roomsService.pickFaction as jest.Mock).mockResolvedValue(true);
            (roomsService.getRoom as jest.Mock).mockResolvedValue(mockRoom);

            // El método no retorna nada, solo emite eventos
            await gateway.handlePickFaction(
                mockSocket as AuthenticatedSocket,
                { raceId: RaceType.HUMAN },
            );

            expect(roomsService.pickFaction).toHaveBeenCalledWith('room-123', 'user-123', RaceType.HUMAN);
        });
    });

    describe('handlePickHero', () => {
        it('should pick hero for player', async () => {
            const mockRoom = {
                id: 'room-123',
                players: [{ userId: 'user-123', heroId: HeroType.MERCHANT }],
            };

            (roomsService.pickHero as jest.Mock).mockResolvedValue(true);
            (roomsService.getRoom as jest.Mock).mockResolvedValue(mockRoom);

            // El método no retorna nada, solo emite eventos
            await gateway.handlePickHero(
                mockSocket as AuthenticatedSocket,
                { heroId: HeroType.MERCHANT },
            );

            expect(roomsService.pickHero).toHaveBeenCalledWith('room-123', 'user-123', HeroType.MERCHANT);
        });
    });

    describe('handleStartMatch', () => {
        it('should start match and initialize game', async () => {
            const mockRoom = {
                id: 'room-123',
                status: 'ready',
                creatorId: 'user-123', // El creador debe ser el mismo que el userId del socket
                players: [
                    { userId: 'user-123', raceId: 'human', ready: true },
                    { userId: 'user-456', raceId: 'orc', ready: true },
                ],
            };

            const mockGameState = {
                id: 'game-123',
                turn: 1,
                phase: 'deploy',
                timers: { turnSecondsLeft: 120 },
            };

            const mockGameFSM = {
                getState: jest.fn().mockReturnValue(mockGameState),
            };

            (roomsService.getRoom as jest.Mock).mockResolvedValue(mockRoom);
            (roomsService.startMatch as jest.Mock).mockResolvedValue(true);
            (gameService.startGame as jest.Mock).mockResolvedValue(mockGameFSM);
            (gameService.serializeGameState as jest.Mock).mockReturnValue(mockGameState);

            await gateway.handleStartMatch(
                mockSocket as AuthenticatedSocket,
            );

            expect(roomsService.startMatch).toHaveBeenCalledWith('room-123');
            expect(gameService.startGame).toHaveBeenCalledWith('room-123');
        });
    });
});

