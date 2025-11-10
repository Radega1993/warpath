import { Test, TestingModule } from '@nestjs/testing';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { GameService } from '../game/game.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { AuthenticatedSocket } from '../common/types';
import { RaceType, HeroType } from '@warpath/rules-engine';

describe('RoomsGateway', () => {
    let gateway: RoomsGateway;
    let roomsService: RoomsService;
    let authService: AuthService;
    let usersService: UsersService;
    let gameService: GameService;
    let mockSocket: Partial<AuthenticatedSocket>;

    beforeEach(async () => {
        const mockRoomsService = {
            createRoom: jest.fn(),
            getRoom: jest.fn(),
            addPlayer: jest.fn(),
            removePlayer: jest.fn(),
            pickFaction: jest.fn(),
            pickHero: jest.fn(),
            setPlayerReady: jest.fn(),
            startMatch: jest.fn(),
        };

        const mockAuthService = {
            generateUserId: jest.fn(() => 'user-123'),
        };

        const mockUsersService = {
            createUser: jest.fn(),
            getUser: jest.fn(),
        };

        const mockGameService = {
            startGame: jest.fn(),
            getGameState: jest.fn(),
        };

        const mockTelemetryService = {
            logMatchStart: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomsGateway,
                { provide: RoomsService, useValue: mockRoomsService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: UsersService, useValue: mockUsersService },
                { provide: GameService, useValue: mockGameService },
                { provide: TelemetryService, useValue: mockTelemetryService },
            ],
        }).compile();

        gateway = module.get<RoomsGateway>(RoomsGateway);
        roomsService = module.get<RoomsService>(RoomsService);
        authService = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        gameService = module.get<GameService>(GameService);

        mockSocket = {
            id: 'socket-123',
            userId: 'user-123',
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
            };

            (roomsService.createRoom as jest.Mock).mockReturnValue(mockRoom);

            const result = gateway.handleCreateRoom(
                mockSocket as AuthenticatedSocket,
                { mode: 'standard', maxPlayers: 2 },
            );

            expect(roomsService.createRoom).toHaveBeenCalledWith('standard', 2, 'test-user-id');
            expect(mockSocket.emit).toHaveBeenCalledWith('room_created', { roomId: mockRoom.id });
        });

        it('should validate room creation data', async () => {
            expect(() => {
                gateway.handleCreateRoom(
                    mockSocket as AuthenticatedSocket,
                    { mode: 'standard', maxPlayers: 5 }, // Invalid maxPlayers
                );
            }).toThrow();
        });
    });

    describe('handleJoinRoom', () => {
        it('should join room and return room data', async () => {
            const mockRoom = {
                id: 'room-123',
                mode: 'standard',
                maxPlayers: 2,
                status: 'waiting',
                players: [{ userId: 'user-123', handle: 'Player1' }],
            };

            (roomsService.getRoom as jest.Mock).mockReturnValue(mockRoom);
            (roomsService.addPlayer as jest.Mock).mockReturnValue(mockRoom);

            const result = gateway.handleJoinRoom(
                mockSocket as AuthenticatedSocket,
                { roomId: 'room-123', handle: 'Player1' },
            );

            expect(roomsService.addPlayer).toHaveBeenCalledWith('room-123', 'user-123', 'Player1');
            expect(mockSocket.join).toHaveBeenCalledWith('room-123');
            expect(result).toEqual(mockRoom);
        });

        it('should validate join room data', async () => {
            expect(() => {
                gateway.handleJoinRoom(
                    mockSocket as AuthenticatedSocket,
                    { roomId: 'invalid', handle: '' }, // Invalid data
                );
            }).toThrow();
        });
    });

    describe('handlePickFaction', () => {
        it('should pick faction for player', async () => {
            const mockRoom = {
                id: 'room-123',
                players: [{ userId: 'user-123', raceId: RaceType.HUMAN }],
            };

            (roomsService.pickFaction as jest.Mock).mockReturnValue(mockRoom);

            const result = gateway.handlePickFaction(
                mockSocket as AuthenticatedSocket,
                { raceId: RaceType.HUMAN },
            );

            expect(roomsService.pickFaction).toHaveBeenCalledWith('room-123', 'user-123', RaceType.HUMAN);
            expect(result).toEqual(mockRoom);
        });
    });

    describe('handlePickHero', () => {
        it('should pick hero for player', async () => {
            const mockRoom = {
                id: 'room-123',
                players: [{ userId: 'user-123', heroId: HeroType.MERCHANT }],
            };

            (roomsService.pickHero as jest.Mock).mockReturnValue(mockRoom);

            const result = gateway.handlePickHero(
                mockSocket as AuthenticatedSocket,
                { heroId: HeroType.MERCHANT },
            );

            expect(roomsService.pickHero).toHaveBeenCalledWith('room-123', 'user-123', HeroType.MERCHANT);
            expect(result).toEqual(mockRoom);
        });
    });

    describe('handleStartMatch', () => {
        it('should start match and initialize game', async () => {
            const mockRoom = {
                id: 'room-123',
                status: 'ready',
                players: [
                    { userId: 'user-123', ready: true },
                    { userId: 'user-456', ready: true },
                ],
            };

            const mockGameState = {
                id: 'game-123',
                turn: 1,
                phase: 'deploy',
            };

            (roomsService.getRoom as jest.Mock).mockReturnValue(mockRoom);
            (roomsService.startMatch as jest.Mock).mockReturnValue({ ...mockRoom, status: 'in_progress' });
            (gameService.startGame as jest.Mock).mockReturnValue({ getState: () => mockGameState });

            const result = gateway.handleStartMatch(
                mockSocket as AuthenticatedSocket,
            );

            expect(roomsService.startMatch).toHaveBeenCalledWith('room-123');
            expect(gameService.startGame).toHaveBeenCalledWith('room-123');
            expect(result).toBeDefined();
        });
    });
});

