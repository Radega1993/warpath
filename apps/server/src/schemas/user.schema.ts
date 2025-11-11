import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
    GUEST = 'guest',
    USER = 'user',
    ADMIN = 'admin',
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    userId: string;

    @Prop({ required: true })
    handle: string;

    // Campos para usuarios autenticados
    @Prop({ unique: true, sparse: true })
    email?: string;

    @Prop()
    passwordHash?: string;

    @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.GUEST })
    role: UserRole;

    @Prop({ default: true })
    isGuest: boolean;

    // Estadísticas
    @Prop({ default: 0 })
    gamesPlayed: number;

    @Prop({ default: 0 })
    gamesWon: number;

    @Prop({ default: 0 })
    totalGoldEarned: number;

    @Prop({ default: 0 })
    totalTerritoriesConquered: number;

    // Última conexión
    @Prop()
    lastSeen?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

