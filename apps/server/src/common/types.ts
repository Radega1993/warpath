import { Socket } from 'socket.io';
import { RaceType, HeroType } from '@warpath/rules-engine';

export interface AuthenticatedSocket extends Socket {
    userId?: string;
    handle?: string;
    roomId?: string;
}

export interface CreateRoomDto {
    mode: string;
    maxPlayers: number;
}

export interface JoinRoomDto {
    roomId: string;
    handle: string;
}

export interface PickFactionDto {
    raceId: RaceType;
}

export interface PickHeroDto {
    heroId: HeroType;
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

export interface MoveDto {
    movements: Array<{
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
    }>;
}

export interface ReinforceDto {
    territoryId: string;
}

export interface UseZoneDto {
    territoryId: string;
}

export interface ConsolidateDto {
    territoryId: string;
}

