import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MatchService } from '../match/match.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match, MatchDocument } from '../schemas/match.schema';

@Controller('users')
export class UsersController {
    constructor(
        private usersService: UsersService,
        private matchService: MatchService,
        @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    ) { }

    @Get('me/history')
    @UseGuards(JwtAuthGuard)
    async getMyMatchHistory(@Request() req, @Query('limit') limit?: string) {
        const userId = req.user.userId;
        const limitNum = limit ? parseInt(limit, 10) : 20;

        // Obtener partidas donde el usuario participó
        const matches: any = await this.matchModel.find({
            'players.userId': userId,
            finishedAt: { $exists: true },
        })
            .sort({ finishedAt: -1 })
            .limit(limitNum)
            .exec();

        return matches.map(match => ({
            matchId: match.id,
            startedAt: match.startedAt,
            finishedAt: match.finishedAt,
            turns: match.turns,
            winnerId: match.winnerId,
            playerData: match.players?.find(p => p.userId === userId),
        }));
    }

    @Get('me/stats')
    @UseGuards(JwtAuthGuard)
    async getMyStats(@Request() req) {
        const user = await this.usersService.getUser(req.user.userId);
        if (!user) {
            return null;
        }

        return {
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            winRate: user.gamesPlayed > 0 ? (user.gamesWon / user.gamesPlayed * 100).toFixed(2) : 0,
            totalGoldEarned: user.totalGoldEarned,
            totalTerritoriesConquered: user.totalTerritoriesConquered,
        };
    }
}

