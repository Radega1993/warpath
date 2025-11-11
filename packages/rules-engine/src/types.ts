// Rangos de tropas y sus dados
export enum UnitRank {
    EXPLORER = 'd4',    // Explorador
    WARRIOR = 'd6',      // Guerrero
    ELITE = 'd8',       // Élite
    HERO = 'd12',       // Héroe
    CHIEF = 'd20',      // Jefe
    LEGEND = 'd100'     // Leyenda
}

// Costes y límites por rango
export const UNIT_COSTS: Record<UnitRank, number> = {
    [UnitRank.EXPLORER]: 150,
    [UnitRank.WARRIOR]: 250,
    [UnitRank.ELITE]: 300,
    [UnitRank.HERO]: 350,
    [UnitRank.CHIEF]: 1000,
    [UnitRank.LEGEND]: 5000
};

export const UNIT_LIMITS: Record<UnitRank, number> = {
    [UnitRank.EXPLORER]: 20,
    [UnitRank.WARRIOR]: 25,
    [UnitRank.ELITE]: 15,
    [UnitRank.HERO]: 10,
    [UnitRank.CHIEF]: 2, // Máximo 2, pero solo 1 sin WAR N3
    [UnitRank.LEGEND]: 3
};

// Dados por rango
export const RANK_DICE: Record<UnitRank, number> = {
    [UnitRank.EXPLORER]: 4,
    [UnitRank.WARRIOR]: 6,
    [UnitRank.ELITE]: 8,
    [UnitRank.HERO]: 12,
    [UnitRank.CHIEF]: 20,
    [UnitRank.LEGEND]: 100
};

// Caminos disponibles
export enum PathType {
    CLAN = 'clan',
    TREASURE = 'treasure',
    POWER = 'power',
    LUCK = 'luck',
    LAND = 'land',
    WAR = 'war'
}

// Niveles de camino (0-3)
export type PathLevel = 0 | 1 | 2 | 3;

// Zonas especiales
export enum ZoneType {
    GOLD = 'oro',
    FAST = 'veloz',
    BATTLE = 'batalla',
    WALLED = 'amurallada',
    DEFENSIVE = 'defensiva',
    RECRUITMENT = 'reclutamiento'
}

// Jefes disponibles
export enum HeroType {
    MASTER = 'maestro',        // +3 rerolls
    PROTECTOR = 'protector',   // +2 defendiendo, con Eficacia
    BATTLER = 'batallador',    // +1 dado del rango más alto
    MERCHANT = 'comerciante',  // +50 oro/territorio
    DOMINATOR = 'dominador',   // doblar uso de Zonas sin coste
    STRATEGIST = 'estratega',  // +1 eficacia
    LEADER = 'lider',          // +1 Acción
    WARLORD = 'señor_guerra'   // +1 Acción/turno
}

// Razas (placeholder, se expandirá)
export enum RaceType {
    HUMAN = 'human',
    ORC = 'orc',
    ELF = 'elf',
    DWARF = 'dwarf',
    UNDEAD = 'undead',
    DEMON = 'demon'
}

// Tropas por territorio
export interface Troops {
    [UnitRank.EXPLORER]: number;
    [UnitRank.WARRIOR]: number;
    [UnitRank.ELITE]: number;
    [UnitRank.HERO]: number;
    [UnitRank.CHIEF]: number;
    [UnitRank.LEGEND]: number;
}

// Estado de un jugador
export interface Player {
    id: string;
    userId: string;
    seat: number;
    raceId: RaceType;
    heroId: HeroType;
    secondHeroId?: HeroType; // WAR N3: segundo jefe activo
    gold: number;
    actions: number;
    actionsLeft: number;
    clanLevel: 1 | 2 | 3;
    paths: Record<PathType, PathLevel>;
    territories: string[]; // IDs de territorios controlados
    usedZones?: string[]; // IDs de territorios con zonas ya utilizadas este turno/partida
}

// Estado de un territorio
export interface TerritoryState {
    id: string;
    ownerId: string | null;
    troops: Troops;
    zone?: ZoneType | string; // Permite string para compatibilidad con JSON
    isSpawn: boolean;
    reinforced?: boolean; // Reforzado: +1 eficacia defensa hasta perder territorio
    consolidated?: boolean; // Consolidado: +2 dados (2 exploradores) en próxima defensa hasta perder territorio
}

// Fases del juego
export enum GamePhase {
    LOBBY = 'lobby',
    DEPLOY = 'deploy',
    ATTACK = 'attack',
    FORTIFY = 'fortify',
    END_TURN = 'end_turn',
    GAME_OVER = 'game_over'
}

// Estado del juego
export interface GameState {
    id: string;
    seed: number;
    turn: number;
    currentPlayerId: string;
    phase: GamePhase;
    players: Record<string, Player>;
    territories: Record<string, TerritoryState>;
    turnTimer?: number; // segundos restantes
    winnerId?: string;
}

// Resultado de combate
export interface CombatResult {
    attackerRolls: Array<{ rank: UnitRank; roll: number }>;
    defenderRolls: Array<{ rank: UnitRank; roll: number }>;
    attackerLosses: Troops;
    defenderLosses: Troops;
    conquest: boolean; // true si el territorio cambió de dueño
    totalDamage: number;
}

// Modificadores de combate
export interface CombatModifiers {
    attackerEfficiency: boolean; // +1 a dados
    defenderEfficiency: boolean;
    attackerRerolls: number;
    defenderRerolls: number;
    defenderDefenseBonus: number; // +2 de Amurallada
    maxTroopsPerSide?: number; // límite de Defensiva
    luckBoostElites?: boolean; // Camino LUCK N3: boost a élites
    defenderReinforced?: boolean; // Reforzado: +1 eficacia defensa
    defenderConsolidated?: boolean; // Consolidado: +2 dados (2 exploradores) en defensa
}

