import { describe, it, expect } from 'vitest';
import {
    calculateIncome,
    calculateUnitCost,
    calculateActions,
    canAffordUnit,
    canDeployRank,
} from './economy';
import {
    Player,
    TerritoryState,
    PathType,
    HeroType,
    RaceType,
    UnitRank,
    ZoneType,
} from './types';

describe('Economy Extended', () => {
    describe('calculateIncome - Zone Bonuses', () => {
        it('should add Veloz zone bonus (+1 action, not income)', () => {
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
                    [PathType.WAR]: 0,
                },
                territories: ['t1'],
            };

            const territories: Record<string, TerritoryState> = {
                t1: {
                    id: 't1',
                    ownerId: 'p1',
                    troops: {} as any,
                    isSpawn: false,
                    zone: ZoneType.FAST,
                },
            };

            const income = calculateIncome(player, territories);
            // Veloz doesn't add income, only actions
            expect(income).toBeGreaterThanOrEqual(50); // Base income
        });

        it('should add Battle zone bonus (efficiency, not income)', () => {
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
                    [PathType.WAR]: 0,
                },
                territories: ['t1'],
            };

            const territories: Record<string, TerritoryState> = {
                t1: {
                    id: 't1',
                    ownerId: 'p1',
                    troops: {} as any,
                    isSpawn: false,
                    zone: ZoneType.BATTLE,
                },
            };

            const income = calculateIncome(player, territories);
            // Battle zone doesn't add income, only efficiency
            expect(income).toBeGreaterThanOrEqual(50);
        });

        it('should handle multiple zones correctly', () => {
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
                    [PathType.WAR]: 0,
                },
                territories: ['t1', 't2'],
            };

            const territories: Record<string, TerritoryState> = {
                t1: {
                    id: 't1',
                    ownerId: 'p1',
                    troops: {} as any,
                    isSpawn: false,
                    zone: ZoneType.GOLD,
                },
                t2: {
                    id: 't2',
                    ownerId: 'p1',
                    troops: {} as any,
                    isSpawn: false,
                    zone: ZoneType.GOLD,
                },
            };

            const income = calculateIncome(player, territories);
            // 2 territories * 50 + 2 * 50 (Merchant) + 2 * 150 (Gold zones)
            expect(income).toBe(500);
        });
    });

    describe('calculateUnitCost - Land Path', () => {
        it('should apply 10% discount at Land N1', () => {
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
                    [PathType.WAR]: 0,
                },
                territories: [],
            };

            const cost = calculateUnitCost(UnitRank.WARRIOR, player);
            expect(cost).toBe(225); // 250 * 0.9 = 225
        });

        it('should not apply discount at Land N0', () => {
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
                    [PathType.WAR]: 0,
                },
                territories: [],
            };

            const cost = calculateUnitCost(UnitRank.WARRIOR, player);
            expect(cost).toBe(250); // Base cost
        });

        it('should apply discount to all unit ranks', () => {
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
                    [PathType.WAR]: 0,
                },
                territories: [],
            };

            const explorerCost = calculateUnitCost(UnitRank.EXPLORER, player);
            const warriorCost = calculateUnitCost(UnitRank.WARRIOR, player);
            const eliteCost = calculateUnitCost(UnitRank.ELITE, player);

            expect(explorerCost).toBe(135); // 150 * 0.9
            expect(warriorCost).toBe(225); // 250 * 0.9
            expect(eliteCost).toBe(270); // 300 * 0.9
        });
    });

    describe('calculateActions - All Sources', () => {
        it('should combine all action bonuses', () => {
            const player: Player = {
                id: 'p1',
                userId: 'u1',
                seat: 0,
                raceId: RaceType.HUMAN,
                heroId: HeroType.LEADER, // +1
                gold: 0,
                actions: 1,
                actionsLeft: 1,
                clanLevel: 1,
                paths: {
                    [PathType.CLAN]: 3, // +1
                    [PathType.TREASURE]: 0,
                    [PathType.POWER]: 0,
                    [PathType.LUCK]: 0,
                    [PathType.LAND]: 0,
                    [PathType.WAR]: 2, // +1
                },
                territories: [],
            };

            const actions = calculateActions(player);
            // Base: 1 + Leader: 1 + Clan N3: 1 + War N2: 1 = 4
            expect(actions).toBe(4);
        });

        it('should not stack War N2 and War N3', () => {
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
                    [PathType.WAR]: 3, // N3 doesn't add more actions
                },
                territories: [],
            };

            const actions = calculateActions(player);
            // Base: 1 + War N2: 1 = 2 (N3 doesn't add more)
            expect(actions).toBe(2);
        });
    });

    describe('canAffordUnit - Edge Cases', () => {
        it('should handle multiple units correctly', () => {
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
                    [PathType.WAR]: 0,
                },
                territories: [],
            };

            expect(canAffordUnit(player, UnitRank.WARRIOR, 1)).toBe(true);
            expect(canAffordUnit(player, UnitRank.WARRIOR, 2)).toBe(true);
            expect(canAffordUnit(player, UnitRank.WARRIOR, 3)).toBe(false); // 3 * 250 = 750 > 500
        });

        it('should consider Land path discount', () => {
            const player: Player = {
                id: 'p1',
                userId: 'u1',
                seat: 0,
                raceId: RaceType.HUMAN,
                heroId: HeroType.MERCHANT,
                gold: 450,
                actions: 1,
                actionsLeft: 1,
                clanLevel: 1,
                paths: {
                    [PathType.CLAN]: 0,
                    [PathType.TREASURE]: 0,
                    [PathType.POWER]: 0,
                    [PathType.LUCK]: 0,
                    [PathType.LAND]: 1, // 10% discount
                    [PathType.WAR]: 0,
                },
                territories: [],
            };

            // With discount: 250 * 0.9 = 225 per unit
            expect(canAffordUnit(player, UnitRank.WARRIOR, 2)).toBe(true); // 2 * 225 = 450
            expect(canAffordUnit(player, UnitRank.WARRIOR, 3)).toBe(false); // 3 * 225 = 675 > 450
        });
    });

    describe('canDeployRank - All Ranks', () => {
        it('should allow all base ranks at level 1', () => {
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
                    [PathType.WAR]: 0,
                },
                territories: [],
            };

            expect(canDeployRank(player, UnitRank.EXPLORER)).toBe(true);
            expect(canDeployRank(player, UnitRank.WARRIOR)).toBe(true);
            expect(canDeployRank(player, UnitRank.CHIEF)).toBe(true);
            expect(canDeployRank(player, UnitRank.ELITE)).toBe(false);
            expect(canDeployRank(player, UnitRank.HERO)).toBe(false);
            expect(canDeployRank(player, UnitRank.LEGEND)).toBe(false);
        });

        it('should unlock ranks progressively with Power path', () => {
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
                    [PathType.WAR]: 0,
                },
                territories: [],
            };

            expect(canDeployRank(player, UnitRank.EXPLORER)).toBe(true);
            expect(canDeployRank(player, UnitRank.WARRIOR)).toBe(true);
            expect(canDeployRank(player, UnitRank.CHIEF)).toBe(true);
            expect(canDeployRank(player, UnitRank.ELITE)).toBe(true);
            expect(canDeployRank(player, UnitRank.HERO)).toBe(true);
            expect(canDeployRank(player, UnitRank.LEGEND)).toBe(true);
        });
    });
});

