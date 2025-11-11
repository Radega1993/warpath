import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MatchSnapshotDocument = MatchSnapshot & Document;

@Schema({ timestamps: true })
export class MatchSnapshot {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true, index: true })
    matchId: string;

    @Prop({ required: true })
    turn: number;

    @Prop({ required: true, type: String })
    stateJson: string;
}

export const MatchSnapshotSchema = SchemaFactory.createForClass(MatchSnapshot);

