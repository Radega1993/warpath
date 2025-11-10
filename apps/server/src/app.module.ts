import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { MatchModule } from './match/match.module';
import { GameModule } from './game/game.module';
import { TelemetryModule } from './telemetry/telemetry.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        AuthModule,
        UsersModule,
        RoomsModule,
        MatchModule,
        GameModule,
        TelemetryModule,
    ],
})
export class AppModule { }

