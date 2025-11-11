import {
    Player,
    TerritoryState,
    ZoneType,
    PathType,
    HeroType,
    UNIT_COSTS,
    UnitRank
} from './types';

/**
 * Calcula los ingresos de oro de un jugador
 */
export function calculateIncome(
    player: Player,
    territories: Record<string, TerritoryState>
): number {
    let income = 0;

    // Base: 50 oro por territorio
    const territoryCount = player.territories.length;
    income += territoryCount * 50;

    // Bonificación de Jefe Comerciante
    if (player.heroId === HeroType.MERCHANT) {
        income += territoryCount * 50;
    }

    // Bonificaciones de Zonas
    for (const territoryId of player.territories) {
        const territory = territories[territoryId];
        if (territory?.zone === ZoneType.GOLD || territory?.zone === 'oro') {
            income += 150; // Zona Oro: +150
        }
    }

    // Bonificaciones de Camino del Tesoro
    const treasureLevel = player.paths[PathType.TREASURE];
    if (treasureLevel >= 1) {
        // N1: +25 oro/territorio
        income += territoryCount * 25;
    }
    if (treasureLevel >= 2) {
        // N2: +125 oro adicional (bonus plano)
        income += 125;
    }
    if (treasureLevel >= 3) {
        // N3: +300 oro adicional (bonus plano)
        income += 300;
    }

    return income;
}

/**
 * Calcula el coste de una tropa considerando modificadores
 */
export function calculateUnitCost(
    rank: UnitRank | string,
    player: Player
): number {
    const baseCost = UNIT_COSTS[rank as UnitRank];
    if (!baseCost) return 0;

    // Camino de la Tierra reduce costes
    const landLevel = player.paths[PathType.LAND];
    if (landLevel >= 1) {
        // N1: -10% coste, N2: -15% coste, N3: -20% coste
        const discount = landLevel === 1 ? 0.9 : landLevel === 2 ? 0.85 : 0.8;
        return Math.floor(baseCost * discount);
    }

    return baseCost;
}

/**
 * Calcula las acciones disponibles de un jugador
 */
export function calculateActions(player: Player): number {
    let actions = 1; // Base: 1 acción

    // Jefe Líder: +1 Acción
    if (player.heroId === HeroType.LEADER) {
        actions += 1;
    }

    // Zona Veloz: +1 Acción (se aplica en endTurn cuando se calcula para el siguiente jugador)
    // Nota: esto se maneja en el GameState, no aquí

    // Camino del Clan N3: +1 Acción/turno
    if (player.paths[PathType.CLAN] >= 3) {
        actions += 1;
    }

    // Camino de la Guerra N2: +1 Acción/turno
    if (player.paths[PathType.WAR] >= 2) {
        actions += 1;
    }

    return actions;
}

/**
 * Verifica si un jugador puede comprar una tropa
 */
export function canAffordUnit(
    player: Player,
    rank: UnitRank | string,
    count: number = 1
): boolean {
    const cost = calculateUnitCost(rank, player);
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
export function getChiefLimit(player: Player): number {
    if (player.paths[PathType.WAR] >= 3) {
        return 2; // WAR N3: hasta 2 jefes
    }
    return 1; // Sin WAR N3: solo 1 jefe
}

