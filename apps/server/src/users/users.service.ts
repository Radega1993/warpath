import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    /**
     * Crea o actualiza un usuario (compatibilidad con código existente)
     */
    async createOrUpdateUser(userId: string, handle: string): Promise<UserDocument> {
        let user: any = await this.userModel.findOne({ userId }).exec();

        if (!user) {
            const newUser = new this.userModel({
                userId,
                handle,
                role: 'guest' as any,
                isGuest: true,
            });
            user = await newUser.save();
        } else {
            user.handle = handle;
            user.lastSeen = new Date();
            await user.save();
        }

        return user as UserDocument;
    }

    /**
     * Obtiene un usuario por ID
     */
    async getUser(userId: string): Promise<UserDocument | null> {
        const user: any = await this.userModel.findOne({ userId }).exec();
        return user as UserDocument | null;
    }

    /**
     * Obtiene historial de partidas de un usuario
     */
    async getUserMatchHistory(userId: string, limit: number = 20): Promise<any[]> {
        // Esto se implementará cuando actualicemos MatchService
        return [];
    }

    /**
     * Actualiza estadísticas de usuario después de una partida
     */
    async updateUserStats(userId: string, stats: {
        won?: boolean;
        goldEarned?: number;
        territoriesConquered?: number;
    }): Promise<void> {
        const user: any = await this.userModel.findOne({ userId }).exec();
        if (!user) return;

        user.gamesPlayed += 1;
        if (stats.won) {
            user.gamesWon += 1;
        }
        if (stats.goldEarned) {
            user.totalGoldEarned += stats.goldEarned;
        }
        if (stats.territoriesConquered) {
            user.totalTerritoriesConquered += stats.territoriesConquered;
        }

        await user.save();
    }
}
