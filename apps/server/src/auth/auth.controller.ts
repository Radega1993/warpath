import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        const { user, token } = await this.authService.register(
            registerDto.email,
            registerDto.password,
            registerDto.handle,
        );
        return {
            user: {
                userId: user.userId,
                email: user.email,
                handle: user.handle,
                role: user.role,
                isGuest: user.isGuest,
            },
            token,
        };
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        const { user, token } = await this.authService.login(
            loginDto.email,
            loginDto.password,
        );
        return {
            user: {
                userId: user.userId,
                email: user.email,
                handle: user.handle,
                role: user.role,
                isGuest: user.isGuest,
            },
            token,
        };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        const user = req.user;
        return {
            userId: user.userId,
            email: user.email,
            handle: user.handle,
            role: user.role,
            isGuest: user.isGuest,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            totalGoldEarned: user.totalGoldEarned,
            totalTerritoriesConquered: user.totalTerritoriesConquered,
        };
    }
}

