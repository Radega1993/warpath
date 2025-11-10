import { Injectable } from '@nestjs/common';
import { GameState } from '@warpath/rules-engine';

export interface Match {
    id: string;
    roomId: string;
    seed: number;
    startedAt: Date;
    finishedAt?: Date;
    winnerId?: string;
    turns: number;
}

export interface MatchSnapshot {
    id: string;
    matchId: string;
    turn: number;
    stateJson: string;
    createdAt: Date;
}

@Injectable()
export class MatchService {
    private matches: Map<string, Match> = new Map();
    private snapshots: Map<string, MatchSnapshot[]> = new Map();

    /**
     * Crea un nuevo registro de partida
     */
    createMatch(roomId: string, seed: number): Match {
        const match: Match = {
            id: roomId,
            roomId,
            seed,
            startedAt: new Date(),
            turns: 0,
        };
        this.matches.set(roomId, match);
        return match;
    }

    /**
     * Obtiene una partida por ID
     */
    getMatch(roomId: string): Match | undefined {
        return this.matches.get(roomId);
    }

    /**
     * Finaliza una partida
     */
    endMatch(roomId: string, winnerId: string, turns: number): void {
        const match = this.matches.get(roomId);
        if (match) {
            match.finishedAt = new Date();
            match.winnerId = winnerId;
            match.turns = turns;
        }
    }

    /**
     * Guarda un snapshot del estado del juego
     */
    saveSnapshot(roomId: string, turn: number, state: GameState): void {
        const snapshot: MatchSnapshot = {
            id: `${roomId}-${turn}`,
            matchId: roomId,
            turn,
            stateJson: JSON.stringify(state),
            createdAt: new Date(),
        };

        if (!this.snapshots.has(roomId)) {
            this.snapshots.set(roomId, []);
        }

        const snapshots = this.snapshots.get(roomId)!;
        snapshots.push(snapshot);
    }

    /**
     * Obtiene los snapshots de una partida
     */
    getSnapshots(roomId: string): MatchSnapshot[] {
        return this.snapshots.get(roomId) || [];
    }
}

