import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameState } from '@warpath/rules-engine';
import { Match, MatchDocument } from '../schemas/match.schema';
import { MatchSnapshot, MatchSnapshotDocument } from '../schemas/match-snapshot.schema';

// Re-exportar tipos para compatibilidad
export type { Match, MatchSnapshot };

@Injectable()
export class MatchService {
    constructor(
        @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
        @InjectModel(MatchSnapshot.name) private snapshotModel: Model<MatchSnapshotDocument>,
    ) { }

    /**
     * Crea un nuevo registro de partida
     */
    async createMatch(roomId: string, seed: number): Promise<Match> {
        const match = new this.matchModel({
            id: roomId,
            roomId,
            seed,
            startedAt: new Date(),
            turns: 0,
        });
        return await match.save();
    }

    /**
     * Obtiene una partida por ID
     */
    async getMatch(roomId: string): Promise<Match | null> {
        return await this.matchModel.findOne({ id: roomId }).exec();
    }

    /**
     * Finaliza una partida
     */
    async endMatch(roomId: string, winnerId: string, turns: number, players?: Array<{
        userId: string;
        playerId: string;
        raceId?: string;
        heroId?: string;
        finalGold: number;
        territories: number;
        won: boolean;
    }>): Promise<void> {
        await this.matchModel.updateOne(
            { id: roomId },
            {
                finishedAt: new Date(),
                winnerId,
                turns,
                players: players || [],
            }
        ).exec();
    }

    /**
     * Guarda un snapshot del estado del juego
     */
    async saveSnapshot(roomId: string, turn: number, state: GameState): Promise<void> {
        const snapshot = new this.snapshotModel({
            id: `${roomId}-${turn}`,
            matchId: roomId,
            turn,
            stateJson: JSON.stringify(state),
        });
        await snapshot.save();
    }

    /**
     * Obtiene los snapshots de una partida
     */
    async getSnapshots(roomId: string): Promise<MatchSnapshot[]> {
        return await this.snapshotModel.find({ matchId: roomId }).sort({ turn: 1 }).exec();
    }
}

