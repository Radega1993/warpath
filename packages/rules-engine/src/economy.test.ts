import { describe, it, expect } from 'vitest';
import {
    calculateIncome,
    calculateUnitCost,
    calculateActions,
    canAffordUnit,
    canDeployRank
} from './economy';
import { Player, TerritoryState, PathType, HeroType, RaceType, UnitRank } from './types';

describe('Economy', () => {
    describe('calculateIncome', () => {
        it('should calculate base income (50 per territory)', () => {
            const player: Player = {
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
                territories: ['t1', 't2', 't3']
            };

            const territories: Record<string, TerritoryState> = {
                t1: { id: 't1', ownerId: 'p1', troops: {} as any, isSpawn: false },
                t2: { id: 't2', ownerId: 'p1', troops: {} as any, isSpawn: false },
                t3: { id: 't3', ownerId: 'p1', troops: {} as any, isSpawn: false }
            };

            const income = calculateIncome(player, territories);
            expect(income).toBe(300); // 3 territorios * 50 + 3 * 50 (Comerciante) = 150 + 150 = 300
        });

        it('should add zone bonus (Gold zone: +150)', () => {
            const player: Player = {
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
                territories: ['t1']
            };

            const territories: Record<string, TerritoryState> = {
                t1: {
                    id: 't1',
                    ownerId: 'p1',
                    troops: {} as any,
                    isSpawn: false,
                    zone: 'oro' as any
                }
            };

            const income = calculateIncome(player, territories);
            expect(income).toBe(250); // 50 base + 50 (Comerciante) + 150 (Zona Oro) = 250
        });

        it('should add treasure path bonuses', () => {
            const player: Player = {
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
                    [PathType.TREASURE]: 3,
                    [PathType.POWER]: 0,
                    [PathType.LUCK]: 0,
                    [PathType.LAND]: 0,
                    [PathType.WAR]: 0
                },
                territories: ['t1']
            };

            const territories: Record<string, TerritoryState> = {
                t1: { id: 't1', ownerId: 'p1', troops: {} as any, isSpawn: false }
            };

            const income = calculateIncome(player, territories);
            // 50 base + 50 (Comerciante) + 25 (Tesoro N1) + 125 (Tesoro N2) + 300 (Tesoro N3)
            expect(income).toBe(550);
        });
    });

    describe('calculateUnitCost', () => {
        it('should return base cost without modifiers', () => {
            const player: Player = {
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
            };

            const cost = calculateUnitCost(UnitRank.WARRIOR, player);
            expect(cost).toBe(250); // Coste base
        });

        it('should apply land path discount (10%)', () => {
            const player: Player = {
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
                    [PathType.LAND]: 1,
                    [PathType.WAR]: 0
                },
                territories: []
            };

            const cost = calculateUnitCost(UnitRank.WARRIOR, player);
            expect(cost).toBe(225); // 250 * 0.9 = 225
        });
    });

    describe('calculateActions', () => {
        it('should return base actions (1)', () => {
            const player: Player = {
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
            };

            const actions = calculateActions(player);
            expect(actions).toBe(1);
        });

        it('should add leader hero bonus (+1)', () => {
            const player: Player = {
                id: 'p1',
                userId: 'u1',
                seat: 0,
                raceId: RaceType.HUMAN,
                heroId: HeroType.LEADER,
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
            };

            const actions = calculateActions(player);
            expect(actions).toBe(2); // 1 base + 1 (Líder)
        });

        it('should add clan path N3 bonus (+1)', () => {
            const player: Player = {
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
                    [PathType.CLAN]: 3,
                    [PathType.TREASURE]: 0,
                    [PathType.POWER]: 0,
                    [PathType.LUCK]: 0,
                    [PathType.LAND]: 0,
                    [PathType.WAR]: 0
                },
                territories: []
            };

            const actions = calculateActions(player);
            expect(actions).toBe(2); // 1 base + 1 (Clan N3)
        });

        it('should add war path N2 bonus (+1)', () => {
            const player: Player = {
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
                    [PathType.WAR]: 2
                },
                territories: []
            };

            const actions = calculateActions(player);
            expect(actions).toBe(2); // 1 base + 1 (Guerra N2)
        });
    });

    describe('canAffordUnit', () => {
        it('should return true if player has enough gold', () => {
            const player: Player = {
                id: 'p1',
                userId: 'u1',
                seat: 0,
                raceId: RaceType.HUMAN,
                heroId: HeroType.MERCHANT,
                gold: 500,
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
            };

            expect(canAffordUnit(player, UnitRank.WARRIOR, 1)).toBe(true);
            expect(canAffordUnit(player, UnitRank.WARRIOR, 2)).toBe(true);
            expect(canAffordUnit(player, UnitRank.WARRIOR, 3)).toBe(false); // 3 * 250 = 750 > 500
        });
    });

    describe('canDeployRank', () => {
        it('should allow explorer, warrior, and chief at level 1', () => {
            const player: Player = {
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
            };

            expect(canDeployRank(player, UnitRank.EXPLORER)).toBe(true);
            expect(canDeployRank(player, UnitRank.WARRIOR)).toBe(true);
            expect(canDeployRank(player, UnitRank.CHIEF)).toBe(true);
            expect(canDeployRank(player, UnitRank.ELITE)).toBe(false);
            expect(canDeployRank(player, UnitRank.HERO)).toBe(false);
            expect(canDeployRank(player, UnitRank.LEGEND)).toBe(false);
        });

        it('should allow elite with power path N1', () => {
            const player: Player = {
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
                    [PathType.POWER]: 1,
                    [PathType.LUCK]: 0,
                    [PathType.LAND]: 0,
                    [PathType.WAR]: 0
                },
                territories: []
            };

            expect(canDeployRank(player, UnitRank.ELITE)).toBe(true);
            expect(canDeployRank(player, UnitRank.HERO)).toBe(false);
            expect(canDeployRank(player, UnitRank.LEGEND)).toBe(false);
        });

        it('should allow hero with power path N2', () => {
            const player: Player = {
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
                    [PathType.POWER]: 2,
                    [PathType.LUCK]: 0,
                    [PathType.LAND]: 0,
                    [PathType.WAR]: 0
                },
                territories: []
            };

            expect(canDeployRank(player, UnitRank.HERO)).toBe(true);
            expect(canDeployRank(player, UnitRank.LEGEND)).toBe(false);
        });

        it('should allow legend with power path N3', () => {
            const player: Player = {
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
                    [PathType.POWER]: 3,
                    [PathType.LUCK]: 0,
                    [PathType.LAND]: 0,
                    [PathType.WAR]: 0
                },
                territories: []
            };

            expect(canDeployRank(player, UnitRank.LEGEND)).toBe(true);
        });
    });
});

