/**
 * Interfaz de configuración del juego
 * Esta configuración se carga desde la base de datos
 */
export interface GameConfig {
    economy: {
        baseIncomePerTerritory: number;
        merchantHeroBonus: number;
    };
    zones: {
        gold?: { incomeBonus?: number };
        fast?: { actionBonus?: number };
        battle?: { efficiencyBonus?: boolean };
        walled?: { defenseBonus?: number };
        defensive?: { maxTroopsPerSide?: number };
        recruitment?: { freeUnit?: boolean; freeUnitType?: string };
    };
    paths: {
        clan?: {
            n1?: { unlocksClanLevel?: number };
            n2?: { unlocksClanLevel?: number };
            n3?: { actionBonus?: number; freeWarriorOnDeploy?: boolean };
        };
        treasure?: {
            n1?: { incomePerTerritory?: number };
            n2?: { flatIncomeBonus?: number };
            n3?: { flatIncomeBonus?: number };
        };
        power?: {
            n1?: { unlocksRank?: string };
            n2?: { unlocksRank?: string };
            n3?: { unlocksRank?: string };
        };
        luck?: {
            n1?: { attackerRerolls?: number };
            n2?: { defenderDefenseBonus?: number };
            n3?: { eliteBoost?: number };
        };
        land?: {
            n1?: { costReduction?: number };
            n2?: { costReduction?: number };
            n3?: { costReduction?: number; freeUnitInRecruitment?: boolean };
        };
        war?: {
            n1?: { efficiency?: boolean };
            n2?: { actionBonus?: number };
            n3?: { maxChiefs?: number; note?: string };
        };
    };
    clanLevels: {
        level2?: { unlockedBy?: string };
        level3?: { unlockedBy?: string; attackBonus?: number };
    };
    unitCosts: {
        explorer: number;
        warrior: number;
        elite: number;
        hero: number;
        chief: number;
        legend: number;
    };
    unitLimits: {
        explorer: number;
        warrior: number;
        elite: number;
        hero: number;
        chief: number;
        legend: number;
    };
    combat: {
        damageThreshold: number;
        tieRule: string;
    };
    rankDice: {
        explorer: number;
        warrior: number;
        elite: number;
        hero: number;
        chief: number;
        legend: number;
    };
    gameSettings?: {
        defaultTurnTime?: number;
        maxPlayers?: number;
        minPlayers?: number;
        startingGold?: number;
        startingActions?: number;
    };
}

/**
 * Configuración por defecto (fallback si no se proporciona)
 */
export const DEFAULT_CONFIG: GameConfig = {
    economy: {
        baseIncomePerTerritory: 50,
        merchantHeroBonus: 50,
    },
    zones: {
        gold: { incomeBonus: 150 },
        fast: { actionBonus: 1 },
        battle: { efficiencyBonus: true },
        walled: { defenseBonus: 2 },
        defensive: { maxTroopsPerSide: 10 },
        recruitment: { freeUnit: true, freeUnitType: 'warrior' },
    },
    paths: {},
    clanLevels: {},
    unitCosts: {
        explorer: 150,
        warrior: 250,
        elite: 300,
        hero: 350,
        chief: 1000,
        legend: 5000,
    },
    unitLimits: {
        explorer: 20,
        warrior: 25,
        elite: 15,
        hero: 10,
        chief: 1,
        legend: 3,
    },
    combat: {
        damageThreshold: 8,
        tieRule: 'same_rank_both_die',
    },
    rankDice: {
        explorer: 4,
        warrior: 6,
        elite: 8,
        hero: 12,
        chief: 20,
        legend: 100,
    },
    gameSettings: {
        defaultTurnTime: 120,
        maxPlayers: 4,
        minPlayers: 2,
        startingGold: 200,
        startingActions: 1,
    },
};

