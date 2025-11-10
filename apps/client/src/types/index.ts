// Types for WebSocket communication
export interface CreateRoomDto {
    mode: string;
    maxPlayers: number;
}

export interface JoinRoomDto {
    roomId: string;
    handle: string;
}

export interface PickFactionDto {
    raceId: string;
}

export interface PickHeroDto {
    heroId: string;
}

export interface PlaceDto {
    territoryId: string;
    units: {
        d4?: number;
        d6?: number;
        d8?: number;
        d12?: number;
        d20?: number;
        d100?: number;
    };
}

export interface AttackDto {
    fromId: string;
    toId: string;
    commit: {
        d4?: number;
        d6?: number;
        d8?: number;
        d12?: number;
        d20?: number;
        d100?: number;
    };
}

export interface FortifyDto {
    fromId: string;
    toId: string;
    units: {
        d4?: number;
        d6?: number;
        d8?: number;
        d12?: number;
        d20?: number;
        d100?: number;
    };
}

export interface UpgradePathDto {
    pathId: string;
}

// Game state types
export interface GameState {
    id?: string;
    seed?: number;
    turn: number;
    phase: string;
    gold: number;
    actionsLeft: number;
    currentPlayerId?: string; // userId del jugador actual
    players?: Record<string, { userId: string; playerId: string }>; // Mapeo de playerId a userId
    owners: Record<string, string>; // territoryId -> userId
    troopsByTerritory: Record<string, any>;
    paths: Record<string, number>;
    zones: Record<string, string>;
    timers: {
        turnSecondsLeft: number;
    };
}

export interface RoomState {
    id: string;
    mode: string;
    maxPlayers: number;
    status: string;
    creatorId?: string; // userId del creador de la sala
    players: Array<{
        userId: string;
        handle: string;
        raceId?: string;
        heroId?: string;
        ready?: boolean;
    }>;
}

export interface CombatResult {
    attackerRolls: Array<{ rank: string; roll: number }>;
    defenderRolls: Array<{ rank: string; roll: number }>;
    attackerLosses: Record<string, number>;
    defenderLosses: Record<string, number>;
    conquest: boolean;
    totalDamage: number;
}

