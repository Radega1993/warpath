import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { MatchService } from '../match/match.service';
import { RoomsService } from '../rooms/rooms.service';
import { GameFSM } from '@warpath/rules-engine';

describe('GameService', () => {
    let service: GameService;
    let matchService: MatchService;
    let roomsService: RoomsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameService,
                {
                    provide: MatchService,
                    useValue: {
                        createMatch: jest.fn(),
                        saveSnapshot: jest.fn(),
                        getMatch: jest.fn(),
                        endMatch: jest.fn(),
                    },
                },
                {
                    provide: RoomsService,
                    useValue: {
                        getRoom: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<GameService>(GameService);
        matchService = module.get<MatchService>(MatchService);
        roomsService = module.get<RoomsService>(RoomsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('startGame', () => {
        it('should start a game successfully', () => {
            const roomId = 'test-room';
            const mockRoom = {
                id: roomId,
                status: 'in_progress', // El código espera 'in_progress', no 'ready'
                players: [
                    {
                        userId: 'user1',
                        handle: 'Player1',
                        seat: 0,
                        raceId: 'human',
                        heroId: 'merchant',
                        ready: true,
                    },
                    {
                        userId: 'user2',
                        handle: 'Player2',
                        seat: 1,
                        raceId: 'orc',
                        heroId: 'battler',
                        ready: true,
                    },
                ],
            };

            jest.spyOn(roomsService, 'getRoom').mockReturnValue(mockRoom as any);
            jest.spyOn(matchService, 'createMatch').mockReturnValue({} as any);
            jest.spyOn(matchService, 'saveSnapshot').mockImplementation(() => { });

            const fsm = service.startGame(roomId);

            expect(fsm).toBeDefined();
            expect(fsm).toBeInstanceOf(GameFSM);
            expect(matchService.createMatch).toHaveBeenCalledWith(roomId, expect.any(Number));
            expect(matchService.saveSnapshot).toHaveBeenCalled();
        });

        it('should return null if room not found', () => {
            jest.spyOn(roomsService, 'getRoom').mockReturnValue(undefined);

            const fsm = service.startGame('non-existent');

            expect(fsm).toBeNull();
        });

        it('should return null if room status is not ready', () => {
            const mockRoom = {
                id: 'test-room',
                status: 'waiting',
                players: [],
            };

            jest.spyOn(roomsService, 'getRoom').mockReturnValue(mockRoom as any);

            const fsm = service.startGame('test-room');

            expect(fsm).toBeNull();
        });
    });

    describe('getGame', () => {
        it('should return game FSM if exists', () => {
            const roomId = 'test-room';
            const mockRoom = {
                id: roomId,
                status: 'in_progress', // El código espera 'in_progress'
                players: [
                    {
                        userId: 'user1',
                        handle: 'Player1',
                        seat: 0,
                        raceId: 'human',
                        heroId: 'merchant',
                        ready: true,
                    },
                ],
            };

            jest.spyOn(roomsService, 'getRoom').mockReturnValue(mockRoom as any);
            jest.spyOn(matchService, 'createMatch').mockReturnValue({} as any);
            jest.spyOn(matchService, 'saveSnapshot').mockImplementation(() => { });

            service.startGame(roomId);
            const fsm = service.getGame(roomId);

            expect(fsm).toBeDefined();
            expect(fsm).toBeInstanceOf(GameFSM);
        });

        it('should return undefined if game not found', () => {
            const fsm = service.getGame('non-existent');
            expect(fsm).toBeUndefined();
        });
    });

    describe('convertTroops', () => {
        it('should convert client format to rules-engine format', () => {
            const clientUnits = {
                d4: 5,
                d6: 3,
                d8: 2,
                d12: 1,
                d20: 0,
                d100: 0,
            };

            const troops = service.convertTroops(clientUnits);

            expect(troops['d4']).toBe(5);
            expect(troops['d6']).toBe(3);
            expect(troops['d8']).toBe(2);
            expect(troops['d12']).toBe(1);
            expect(troops['d20']).toBe(0);
            expect(troops['d100']).toBe(0);
        });

        it('should handle missing units', () => {
            const clientUnits = {
                d4: 5,
            };

            const troops = service.convertTroops(clientUnits);

            expect(troops['d4']).toBe(5);
            expect(troops['d6']).toBe(0);
            expect(troops['d8']).toBe(0);
        });
    });

    describe('serializeGameState', () => {
        it('should serialize game state correctly', () => {
            const roomId = 'test-room';
            const mockRoom = {
                id: roomId,
                status: 'in_progress', // El código espera 'in_progress'
                players: [
                    {
                        userId: 'user1',
                        handle: 'Player1',
                        seat: 0,
                        raceId: 'human',
                        heroId: 'merchant',
                        ready: true,
                    },
                ],
            };

            jest.spyOn(roomsService, 'getRoom').mockReturnValue(mockRoom as any);
            jest.spyOn(matchService, 'createMatch').mockReturnValue({} as any);
            jest.spyOn(matchService, 'saveSnapshot').mockImplementation(() => { });

            const fsm = service.startGame(roomId);
            expect(fsm).not.toBeNull();
            const serialized = service.serializeGameState(fsm!);

            expect(serialized).toHaveProperty('turn');
            expect(serialized).toHaveProperty('phase');
            expect(serialized).toHaveProperty('gold');
            expect(serialized).toHaveProperty('actionsLeft');
            expect(serialized).toHaveProperty('owners');
            expect(serialized).toHaveProperty('troopsByTerritory');
            expect(serialized).toHaveProperty('paths');
            expect(serialized).toHaveProperty('zones');
            expect(serialized).toHaveProperty('timers');
        });
    });
});

