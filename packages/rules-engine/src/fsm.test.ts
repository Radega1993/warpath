import { describe, it, expect, beforeEach } from 'vitest';
import { GameFSM } from './fsm';
import {
    GameState,
    GamePhase,
    Player,
    TerritoryState,
    Troops,
    PathType,
    UnitRank,
    RaceType,
    HeroType
} from './types';
import { createEmptyTroops } from './combat';

describe('GameFSM', () => {
    let initialState: GameState;
    let fsm: GameFSM;

    beforeEach(() => {
        initialState = {
            id: 'game1',
            seed: 12345,
            turn: 0,
            currentPlayerId: 'p1',
            phase: GamePhase.LOBBY,
            players: {
                p1: {
                    id: 'p1',
                    userId: 'u1',
                    seat: 0,
                    raceId: RaceType.HUMAN,
                    heroId: HeroType.MERCHANT,
                    gold: 0,
                    actions: 1,
                    actionsLeft: 1,
                    clanLevel: 1,
                    paths: {
                        [PathType.CLAN]: 0,
                        [PathType.TREASURE]: 0,
                        [PathType.POWER]: 0,
                        [PathType.LUCK]: 0,
                        [PathType.LAND]: 0,
                        [PathType.WAR]: 0
                    },
                    territories: []
                },
                p2: {
                    id: 'p2',
                    userId: 'u2',
                    seat: 1,
                    raceId: RaceType.ORC,
                    heroId: HeroType.BATTLER,
                    gold: 0,
                    actions: 1,
                    actionsLeft: 1,
                    clanLevel: 1,
                    paths: {
                        [PathType.CLAN]: 0,
                        [PathType.TREASURE]: 0,
                        [PathType.POWER]: 0,
                        [PathType.LUCK]: 0,
                        [PathType.LAND]: 0,
                        [PathType.WAR]: 0
                    },
                    territories: []
                }
            },
            territories: {
                t1: {
                    id: 't1',
                    ownerId: null,
                    troops: createEmptyTroops(),
                    isSpawn: true
                },
                t2: {
                    id: 't2',
                    ownerId: null,
                    troops: createEmptyTroops(),
                    isSpawn: true
                },
                t3: {
                    id: 't3',
                    ownerId: null,
                    troops: createEmptyTroops(),
                    isSpawn: false
                }
            }
        };

        fsm = new GameFSM(initialState);
    });

    describe('startGame', () => {
        it('should initialize game correctly', () => {
            fsm.startGame();
            const state = fsm.getState();

            expect(state.phase).toBe(GamePhase.DEPLOY);
            expect(state.turn).toBe(1);
            expect(state.currentPlayerId).toBe('p1');

            // Verificar que los spawns fueron asignados
            const p1 = state.players.p1;
            const p2 = state.players.p2;

            expect(p1.territories.length).toBeGreaterThan(0);
            expect(p2.territories.length).toBeGreaterThan(0);
            expect(p1.gold).toBe(200);
            expect(p2.gold).toBe(200);
        });

        it('should throw error if not in LOBBY phase', () => {
            initialState.phase = GamePhase.DEPLOY;
            fsm = new GameFSM(initialState);

            expect(() => fsm.startGame()).toThrow('Game can only start from LOBBY phase');
        });
    });

    describe('deployTroops', () => {
        beforeEach(() => {
            fsm.startGame();
        });

        it('should deploy troops correctly', () => {
            const state = fsm.getState();
            const player = state.players[state.currentPlayerId];
            const territoryId = player.territories[0];

            const troops: Troops = createEmptyTroops();
            troops[UnitRank.WARRIOR] = 2;

            // Dar oro suficiente
            player.gold = 1000;

            fsm.deployTroops(territoryId, troops);

            const newState = fsm.getState();
            const territory = newState.territories[territoryId];
            const newPlayer = newState.players[state.currentPlayerId];

            expect(territory.troops[UnitRank.WARRIOR]).toBeGreaterThanOrEqual(2);
            expect(newPlayer.gold).toBeLessThan(1000);
            expect(newPlayer.actionsLeft).toBeLessThan(player.actions);
        });

        it('should throw error if not in DEPLOY phase', () => {
            const state = fsm.getState();
            state.phase = GamePhase.ATTACK;
            fsm = new GameFSM(state);

            const troops: Troops = createEmptyTroops();
            troops[UnitRank.WARRIOR] = 1;

            expect(() => fsm.deployTroops('t1', troops)).toThrow('Can only deploy in DEPLOY phase');
        });

        it('should throw error if not enough gold', () => {
            const state = fsm.getState();
            const player = state.players[state.currentPlayerId];
            const territoryId = player.territories[0];

            player.gold = 0;

            const troops: Troops = createEmptyTroops();
            troops[UnitRank.WARRIOR] = 1;

            expect(() => fsm.deployTroops(territoryId, troops)).toThrow('Cannot afford');
        });
    });

    describe('upgradePath', () => {
        beforeEach(() => {
            fsm.startGame();
        });

        it('should upgrade path correctly', () => {
            const state = fsm.getState();
            const player = state.players[state.currentPlayerId];

            player.gold = 1000;
            const initialLevel = player.paths[PathType.POWER];
            const initialGold = player.gold;

            fsm.upgradePath(PathType.POWER);

            const newState = fsm.getState();
            const newPlayer = newState.players[state.currentPlayerId];

            expect(newPlayer.paths[PathType.POWER]).toBe(initialLevel + 1);
            expect(newPlayer.gold).toBeLessThan(initialGold);
        });

        it('should throw error if not enough gold', () => {
            const state = fsm.getState();
            const player = state.players[state.currentPlayerId];

            player.gold = 0;

            expect(() => fsm.upgradePath(PathType.POWER)).toThrow('Not enough gold');
        });

        it('should throw error if path is at max level', () => {
            const state = fsm.getState();
            const player = state.players[state.currentPlayerId];

            player.gold = 1000;
            player.paths[PathType.POWER] = 3;

            expect(() => fsm.upgradePath(PathType.POWER)).toThrow('Path already at maximum level');
        });
    });

    describe('endTurn', () => {
        beforeEach(() => {
            fsm.startGame();
        });

        it('should advance to next player', () => {
            const state = fsm.getState();
            const currentPlayerId = state.currentPlayerId;

            fsm.endTurn();

            const newState = fsm.getState();
            expect(newState.currentPlayerId).not.toBe(currentPlayerId);
            expect(newState.turn).toBeGreaterThan(state.turn);
            expect(newState.phase).toBe(GamePhase.DEPLOY);
        });

        it('should calculate income correctly', () => {
            const state = fsm.getState();
            const player = state.players[state.currentPlayerId];

            // Asegurar que el jugador tiene territorios
            player.territories = ['t1', 't2'];
            const initialGold = player.gold;

            fsm.endTurn();

            const newState = fsm.getState();
            const newPlayer = newState.players[player.id];

            // Debería haber recibido ingresos (50 * 2 territorios = 100 mínimo)
            expect(newPlayer.gold).toBeGreaterThan(initialGold);
        });
    });
});

