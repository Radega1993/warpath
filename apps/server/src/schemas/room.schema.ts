import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RaceType, HeroType } from '@warpath/rules-engine';

export type RoomDocument = Room & Document;

export enum RoomStatus {
    WAITING = 'waiting',
    PICKING = 'picking',
    READY = 'ready',
    IN_PROGRESS = 'in_progress',
}

@Schema({ _id: false })
export class RoomPlayer {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    handle: string;

    @Prop({ required: true })
    seat: number;

    @Prop({ type: String, enum: Object.values(RaceType) })
    raceId?: RaceType;

    @Prop({ type: String, enum: Object.values(HeroType) })
    heroId?: HeroType;

    @Prop({ default: false })
    ready: boolean;
}

@Schema({ timestamps: true })
export class Room {
    @Prop({ required: true, unique: true })
    id: string;

    @Prop({ required: true })
    mode: string;

    @Prop({ required: true })
    maxPlayers: number;

    @Prop({ type: String, enum: Object.values(RoomStatus), default: RoomStatus.WAITING })
    status: RoomStatus;

    @Prop({ type: [RoomPlayer], default: [] })
    players: RoomPlayer[];

    @Prop({ required: true })
    creatorId: string;

    @Prop()
    startedAt?: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

