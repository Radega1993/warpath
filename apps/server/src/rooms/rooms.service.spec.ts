import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RoomsService, RoomStatus } from './rooms.service';
import { RaceType, HeroType } from '@warpath/rules-engine';
import { Room, RoomDocument } from '../schemas/room.schema';

describe('RoomsService', () => {
    let service: RoomsService;
    let mockRoomModel: any;

    beforeEach(async () => {
        // Mock del modelo de Mongoose
        mockRoomModel = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomsService,
                {
                    provide: getModelToken(Room.name),
                    useValue: mockRoomModel,
                },
            ],
        }).compile();

        service = module.get<RoomsService>(RoomsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createRoom', () => {
        it('should create a room successfully', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 4,
                status: RoomStatus.WAITING,
                players: [],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.create = jest.fn().mockReturnValue(mockRoom);

            const room = await service.createRoom('standard', 4, 'creator1');

            expect(room).toBeDefined();
            expect(room.id).toBeDefined();
            expect(room.mode).toBe('standard');
            expect(room.maxPlayers).toBe(4);
            expect(room.status).toBe(RoomStatus.WAITING);
            expect(room.players).toEqual([]);
            expect(room.creatorId).toBe('creator1');
        });
    });

    describe('addPlayer', () => {
        it('should add a player to a room', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 4,
                status: RoomStatus.WAITING,
                players: [],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockRoom),
            });

            const player = await service.addPlayer('test-room-id', 'user1', 'Player1');

            expect(player).toBeDefined();
            expect(player?.userId).toBe('user1');
            expect(player?.handle).toBe('Player1');
            expect(player?.seat).toBe(0);
            expect(mockRoom.players.length).toBe(1);
        });

        it('should change status to PICKING when 2 players join', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 4,
                status: RoomStatus.WAITING,
                players: [],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockRoom),
            });

            await service.addPlayer('test-room-id', 'user1', 'Player1');
            await service.addPlayer('test-room-id', 'user2', 'Player2');

            expect(mockRoom.status).toBe(RoomStatus.PICKING);
        });

        it('should return null if room is full', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 2,
                status: RoomStatus.WAITING,
                players: [
                    { userId: 'user1', handle: 'Player1', seat: 0, ready: false },
                    { userId: 'user2', handle: 'Player2', seat: 1, ready: false },
                ],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockRoom),
            });

            const player = await service.addPlayer('test-room-id', 'user3', 'Player3');

            expect(player).toBeNull();
        });

        it('should return null if room not found', async () => {
            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            const player = await service.addPlayer('non-existent', 'user1', 'Player1');
            expect(player).toBeNull();
        });
    });

    describe('removePlayer', () => {
        it('should remove a player from a room', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 4,
                status: RoomStatus.WAITING,
                players: [
                    { userId: 'user1', handle: 'Player1', seat: 0, ready: false },
                ],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockRoom),
            });

            const removed = await service.removePlayer('test-room-id', 'user1');

            expect(removed).toBe(true);
            expect(mockRoom.players.length).toBe(0);
        });

        it('should return false if player not found', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 4,
                status: RoomStatus.WAITING,
                players: [],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockRoom),
            });

            const removed = await service.removePlayer('test-room-id', 'non-existent');

            expect(removed).toBe(false);
        });
    });

    describe('pickFaction', () => {
        it('should pick faction for a player', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 4,
                status: RoomStatus.WAITING,
                players: [
                    { userId: 'user1', handle: 'Player1', seat: 0, ready: false },
                ],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockRoom),
            });

            const success = await service.pickFaction('test-room-id', 'user1', RaceType.HUMAN);

            expect(success).toBe(true);
            expect(mockRoom.players[0].raceId).toBe(RaceType.HUMAN);
        });

        it('should prevent picking same race twice', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 4,
                status: RoomStatus.WAITING,
                players: [
                    { userId: 'user1', handle: 'Player1', seat: 0, ready: false },
                    { userId: 'user2', handle: 'Player2', seat: 1, ready: false },
                ],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockRoom),
            });

            await service.pickFaction('test-room-id', 'user1', RaceType.HUMAN);
            const success = await service.pickFaction('test-room-id', 'user2', RaceType.HUMAN);

            expect(success).toBe(false);
        });
    });

    describe('pickHero', () => {
        it('should pick hero for a player', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 4,
                status: RoomStatus.WAITING,
                players: [
                    { userId: 'user1', handle: 'Player1', seat: 0, ready: false },
                ],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockRoom),
            });

            const success = await service.pickHero('test-room-id', 'user1', HeroType.MERCHANT);

            expect(success).toBe(true);
            expect(mockRoom.players[0].heroId).toBe(HeroType.MERCHANT);
        });

        it('should prevent picking same hero twice', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 4,
                status: RoomStatus.WAITING,
                players: [
                    { userId: 'user1', handle: 'Player1', seat: 0, ready: false },
                    { userId: 'user2', handle: 'Player2', seat: 1, ready: false },
                ],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockRoom),
            });

            await service.pickHero('test-room-id', 'user1', HeroType.MERCHANT);
            const success = await service.pickHero('test-room-id', 'user2', HeroType.MERCHANT);

            expect(success).toBe(false);
        });
    });

    describe('startMatch', () => {
        it('should start match when all players have race selected', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 2,
                status: RoomStatus.READY,
                players: [
                    { userId: 'user1', handle: 'Player1', seat: 0, raceId: RaceType.HUMAN, ready: true },
                    { userId: 'user2', handle: 'Player2', seat: 1, raceId: RaceType.ORC, ready: true },
                ],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockRoom),
            });

            const success = await service.startMatch('test-room-id');

            expect(success).toBe(true);
            expect(mockRoom.status).toBe(RoomStatus.IN_PROGRESS);
            expect(mockRoom.startedAt).toBeDefined();
        });

        it('should not start match if not all players have race', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 2,
                status: RoomStatus.PICKING,
                players: [
                    { userId: 'user1', handle: 'Player1', seat: 0, raceId: RaceType.HUMAN, ready: false },
                    { userId: 'user2', handle: 'Player2', seat: 1, ready: false },
                ],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockRoom),
            });

            const success = await service.startMatch('test-room-id');

            expect(success).toBe(false);
        });

        it('should not start match if not enough players', async () => {
            const mockRoom = {
                id: 'test-room-id',
                mode: 'standard',
                maxPlayers: 2,
                status: RoomStatus.WAITING,
                players: [
                    { userId: 'user1', handle: 'Player1', seat: 0, ready: false },
                ],
                creatorId: 'creator1',
                save: jest.fn().mockResolvedValue(true),
            };

            mockRoomModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockRoom),
            });

            const success = await service.startMatch('test-room-id');

            expect(success).toBe(false);
        });
    });
});
