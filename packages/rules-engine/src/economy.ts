import {
    Player,
    TerritoryState,
    ZoneType,
    PathType,
    HeroType,
    UNIT_COSTS,
    UnitRank
} from './types';
import { GameConfig, DEFAULT_CONFIG } from './config';

/**
 * Calcula los ingresos de oro de un jugador
 */
export function calculateIncome(
    player: Player,
    territories: Record<string, TerritoryState>,
    config: GameConfig = DEFAULT_CONFIG
): number {
    let income = 0;

    // Base: oro por territorio desde config
    const territoryCount = player.territories.length;
    const baseIncome = config.economy.baseIncomePerTerritory;
    income += territoryCount * baseIncome;

    // Bonificación de Jefe Comerciante
    if (player.heroId === HeroType.MERCHANT) {
        income += territoryCount * config.economy.merchantHeroBonus;
    }

    // Bonificaciones de Zonas
    for (const territoryId of player.territories) {
        const territory = territories[territoryId];
        if (territory?.zone === ZoneType.GOLD || territory?.zone === 'oro') {
            income += config.zones.gold?.incomeBonus || 150;
        }
    }

    // Bonificaciones de Camino del Tesoro
    const treasureLevel = player.paths[PathType.TREASURE];
    if (treasureLevel >= 1 && config.paths.treasure?.n1) {
        income += territoryCount * (config.paths.treasure.n1.incomePerTerritory || 25);
    }
    if (treasureLevel >= 2 && config.paths.treasure?.n2) {
        income += config.paths.treasure.n2.flatIncomeBonus || 125;
    }
    if (treasureLevel >= 3 && config.paths.treasure?.n3) {
        income += config.paths.treasure.n3.flatIncomeBonus || 300;
    }

    return income;
}

/**
 * Calcula el coste de una tropa considerando modificadores
 */
export function calculateUnitCost(
    rank: UnitRank | string,
    player: Player,
    config: GameConfig = DEFAULT_CONFIG
): number {
    // Mapear rank a key de config
    const rankKey = rank.toLowerCase().replace('d', '') as keyof typeof config.unitCosts;
    const baseCost = config.unitCosts[rankKey] || UNIT_COSTS[rank as UnitRank] || 0;
    if (!baseCost) return 0;

    // Camino de la Tierra reduce costes
    const landLevel = player.paths[PathType.LAND];
    if (landLevel >= 1 && config.paths.land) {
        const reduction = config.paths.land[`n${landLevel}` as 'n1' | 'n2' | 'n3']?.costReduction || 0;
        const discount = 1 - reduction;
        return Math.floor(baseCost * discount);
    }

    return baseCost;
}

/**
 * Calcula las acciones disponibles de un jugador
 */
export function calculateActions(
    player: Player,
    config: GameConfig = DEFAULT_CONFIG
): number {
    let actions = 1; // Base: 1 acción

    // Jefe Líder: +1 Acción
    if (player.heroId === HeroType.LEADER) {
        actions += 1;
    }

    // Zona Veloz: +1 Acción (se aplica en endTurn cuando se calcula para el siguiente jugador)
    // Nota: esto se maneja en el GameState, no aquí

    // Camino del Clan N3: +1 Acción/turno
    if (player.paths[PathType.CLAN] >= 3 && config.paths.clan?.n3?.actionBonus) {
        actions += config.paths.clan.n3.actionBonus;
    }

    // Camino de la Guerra N2: +1 Acción/turno
    if (player.paths[PathType.WAR] >= 2 && config.paths.war?.n2?.actionBonus) {
        actions += config.paths.war.n2.actionBonus;
    }

    return actions;
}

/**
 * Verifica si un jugador puede comprar una tropa
 */
export function canAffordUnit(
    player: Player,
    rank: UnitRank | string,
    count: number = 1,
    config: GameConfig = DEFAULT_CONFIG
): boolean {
    const cost = calculateUnitCost(rank, player, config);
    return player.gold >= cost * count;
}

/**
 * Verifica si un jugador puede desplegar un rango de tropa
 */
export function canDeployRank(
    player: Player,
    rank: UnitRank | string
): boolean {
    // Nivel 1: Exploradores, Guerreros y Jefe
    if (rank === UnitRank.EXPLORER || rank === UnitRank.WARRIOR || rank === UnitRank.CHIEF) {
        return true;
    }

    // Élites requieren Camino del Poder N1
    if (rank === UnitRank.ELITE) {
        return player.paths[PathType.POWER] >= 1;
    }

    // Héroes requieren Camino del Poder N2
    if (rank === UnitRank.HERO) {
        return player.paths[PathType.POWER] >= 2;
    }

    // Leyendas requieren Camino del Poder N3
    if (rank === UnitRank.LEGEND) {
        return player.paths[PathType.POWER] >= 3;
    }

    return false;
}

/**
 * Obtiene el límite máximo de jefes para un jugador
 * WAR N3 permite tener hasta 2 jefes, sin él solo 1
 */
export function getChiefLimit(
    player: Player,
    config: GameConfig = DEFAULT_CONFIG
): number {
    if (player.paths[PathType.WAR] >= 3 && config.paths.war?.n3?.maxChiefs) {
        return config.paths.war.n3.maxChiefs;
    }
    return 1; // Sin WAR N3: solo 1 jefe
}

