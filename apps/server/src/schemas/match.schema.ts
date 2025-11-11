import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MatchDocument = Match & Document;

@Schema({ timestamps: true })
export class Match {
    @Prop({ required: true, unique: true })
    id: string;

    @Prop({ required: true })
    roomId: string;

    @Prop({ required: true })
    seed: number;

    @Prop({ required: true })
    startedAt: Date;

    @Prop()
    finishedAt?: Date;

    @Prop()
    winnerId?: string;

    @Prop({ default: 0 })
    turns: number;

    // Vinculación con usuarios
    @Prop({ type: [{ userId: String, playerId: String, raceId: String, heroId: String, finalGold: Number, territories: Number, won: Boolean }] })
    players?: Array<{
        userId: string;
        playerId: string;
        raceId?: string;
        heroId?: string;
        finalGold: number;
        territories: number;
        won: boolean;
    }>;
}

export const MatchSchema = SchemaFactory.createForClass(Match);

