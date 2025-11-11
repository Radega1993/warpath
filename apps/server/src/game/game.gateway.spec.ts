import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { TimerService } from './timer.service';
import { RoomsService } from '../rooms/rooms.service';
import { MatchService } from '../match/match.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { AuthenticatedSocket } from '../common/types';

describe('GameGateway', () => {
    let gateway: GameGateway;
    let gameService: GameService;
    let timerService: TimerService;
    let mockSocket: Partial<AuthenticatedSocket>;
    let mockServer: any;

    beforeEach(async () => {
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };
        const mockGameService = {
            startGame: jest.fn().mockResolvedValue(null),
            getGame: jest.fn(),
            serializeGameState: jest.fn(),
            deployTroops: jest.fn(),
            attackTerritory: jest.fn(),
            fortify: jest.fn(),
            upgradePath: jest.fn(),
            endTurn: jest.fn(),
            endGame: jest.fn().mockResolvedValue(undefined),
            convertTroops: jest.fn(),
        };

        const mockTimerService = {
            startTimer: jest.fn(),
            stopTimer: jest.fn(),
            getSecondsLeft: jest.fn(),
        };

        const mockRoomsService = {
            getRoom: jest.fn().mockResolvedValue(null),
        };

        const mockMatchService = {
            getMatch: jest.fn().mockResolvedValue(null),
            saveSnapshot: jest.fn().mockResolvedValue(undefined),
            endMatch: jest.fn().mockResolvedValue(undefined),
        };

        const mockTelemetryService = {
            logEvent: jest.fn(),
            logMatchStart: jest.fn(),
            logMatchEnd: jest.fn(),
            logTurnDuration: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameGateway,
                { provide: GameService, useValue: mockGameService },
                { provide: TimerService, useValue: mockTimerService },
                { provide: RoomsService, useValue: mockRoomsService },
                { provide: MatchService, useValue: mockMatchService },
                { provide: TelemetryService, useValue: mockTelemetryService },
            ],
        }).compile();

        gateway = module.get<GameGateway>(GameGateway);
        gateway.server = mockServer;
        gameService = module.get<GameService>(GameService);
        timerService = module.get<TimerService>(TimerService);

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

    describe('handleConnection', () => {
        it('should extract roomId from namespace and send game state', async () => {
            const mockGameState = {
                id: 'game-123',
                turn: 1,
                phase: 'deploy',
                timers: {
                    turnSecondsLeft: 120,
                },
            };

            const mockGame = {
                getState: jest.fn().mockReturnValue(mockGameState),
            };
            (gameService.getGame as jest.Mock).mockReturnValue(mockGame);
            (gameService.serializeGameState as jest.Mock).mockReturnValue(mockGameState);
            (timerService.getSecondsLeft as jest.Mock).mockReturnValue(120);

            // Mock the namespace extraction
            (mockSocket as any).nsp = { name: '/room/room-123' };

            gateway.handleConnection(mockSocket as AuthenticatedSocket);

            expect(mockSocket.roomId).toBe('room-123');
            // Verify that game state was emitted (the timers will be added by the gateway)
            expect(mockSocket.emit).toHaveBeenCalledWith('game_state', expect.any(Object));
        });
    });

    describe('handlePlace', () => {
        it('should deploy troops to territory', async () => {
            const mockGameState = {
                id: 'game-123',
                turn: 1,
                phase: 'deploy',
            };

            const mockGame = {
                deployTroops: jest.fn(),
                getState: jest.fn().mockReturnValue(mockGameState),
            };
            (gameService.getGame as jest.Mock).mockReturnValue(mockGame);
            (gameService.convertTroops as jest.Mock).mockReturnValue({ d6: 2 });
            (gameService.serializeGameState as jest.Mock).mockReturnValue({
                ...mockGameState,
                timers: { turnSecondsLeft: 120 },
            });
            (timerService.getSecondsLeft as jest.Mock).mockReturnValue(120);

            gateway.handlePlace(
                mockSocket as AuthenticatedSocket,
                { territoryId: 't1', units: { d6: 2 } },
            );

            expect(mockGame.deployTroops).toHaveBeenCalled();
        });
    });

    describe('handleAttack', () => {
        it('should attack territory', async () => {
            const mockGameState = {
                id: 'game-123',
                turn: 1,
                phase: 'attack',
                territories: {
                    t2: {
                        id: 't2',
                        ownerId: 'user-456',
                        troops: { d6: 1 },
                    },
                },
            };

            const mockGame = {
                attackTerritory: jest.fn(),
                getState: jest.fn().mockReturnValue(mockGameState),
            };
            (gameService.getGame as jest.Mock).mockReturnValue(mockGame);
            (gameService.convertTroops as jest.Mock).mockReturnValue({ d6: 2 });
            (gameService.serializeGameState as jest.Mock).mockReturnValue({
                ...mockGameState,
                timers: { turnSecondsLeft: 120 },
            });
            (timerService.getSecondsLeft as jest.Mock).mockReturnValue(120);

            gateway.handleAttack(
                mockSocket as AuthenticatedSocket,
                { fromId: 't1', toId: 't2', commit: { d6: 2 } },
            );

            expect(mockGame.attackTerritory).toHaveBeenCalled();
        });
    });

    describe('handleFortify', () => {
        it('should fortify territory', async () => {
            const mockGameState = {
                id: 'game-123',
                turn: 1,
                phase: 'fortify',
            };

            const mockGame = {
                fortify: jest.fn(),
                getState: jest.fn().mockReturnValue(mockGameState),
            };
            (gameService.getGame as jest.Mock).mockReturnValue(mockGame);
            (gameService.convertTroops as jest.Mock).mockReturnValue({ d6: 2 });
            (gameService.serializeGameState as jest.Mock).mockReturnValue({
                ...mockGameState,
                timers: { turnSecondsLeft: 120 },
            });
            (timerService.getSecondsLeft as jest.Mock).mockReturnValue(120);

            gateway.handleFortify(
                mockSocket as AuthenticatedSocket,
                { fromId: 't1', toId: 't2', units: { d6: 2 } },
            );

            expect(mockGame.fortify).toHaveBeenCalled();
        });
    });

    describe('handleUpgradePath', () => {
        it('should upgrade path', async () => {
            const mockGameState = {
                id: 'game-123',
                turn: 1,
                phase: 'deploy',
            };

            const mockGame = {
                upgradePath: jest.fn(),
                getState: jest.fn().mockReturnValue(mockGameState),
            };
            (gameService.getGame as jest.Mock).mockReturnValue(mockGame);
            (gameService.serializeGameState as jest.Mock).mockReturnValue({
                ...mockGameState,
                timers: { turnSecondsLeft: 120 },
            });
            (timerService.getSecondsLeft as jest.Mock).mockReturnValue(120);

            gateway.handleUpgradePath(
                mockSocket as AuthenticatedSocket,
                { pathId: 'power' },
            );

            expect(mockGame.upgradePath).toHaveBeenCalled();
        });
    });

    describe('handleEndTurn', () => {
        it('should end turn and advance to next player', async () => {
            const mockGameState = {
                id: 'game-123',
                turn: 2,
                phase: 'deploy',
                players: {
                    'user-123': {
                        id: 'user-123',
                        gold: 100,
                    },
                },
                currentPlayerId: 'user-123',
            };

            const mockNewGameState = {
                ...mockGameState,
                turn: 3,
                phase: 'deploy',
                currentPlayerId: 'user-456',
            };

            const mockGame = {
                endTurn: jest.fn(),
                getState: jest.fn()
                    .mockReturnValueOnce(mockGameState)
                    .mockReturnValueOnce(mockNewGameState),
            };
            (gameService.getGame as jest.Mock).mockReturnValue(mockGame);
            (gameService.serializeGameState as jest.Mock).mockReturnValue({
                ...mockNewGameState,
                timers: { turnSecondsLeft: 120 },
            });
            (timerService.stopTimer as jest.Mock).mockReturnValue(undefined);
            (timerService.startTimer as jest.Mock).mockReturnValue(undefined);
            (timerService.getSecondsLeft as jest.Mock).mockReturnValue(120);
            (matchService.saveSnapshot as jest.Mock).mockResolvedValue(undefined);

            await gateway.handleEndTurn(
                mockSocket as AuthenticatedSocket,
            );

            expect(mockGame.endTurn).toHaveBeenCalled();
            // stopTimer solo se llama cuando el juego termina, no en cada turno
            // expect(timerService.stopTimer).toHaveBeenCalled();
            expect(timerService.startTimer).toHaveBeenCalled();
        });
    });
});

