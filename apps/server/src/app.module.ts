import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { MatchModule } from './match/match.module';
import { GameModule } from './game/game.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule } from './config/config.module';

@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
        }),
        MongooseModule.forRoot(
            process.env.MONGODB_URI || 'mongodb://warpath:warpath123@localhost:27018/warpath?authSource=admin',
            {
                retryWrites: true,
                w: 'majority',
            }
        ),
        ConfigModule,
        AuthModule,
        UsersModule,
        RoomsModule,
        MatchModule,
        GameModule,
        TelemetryModule,
        AdminModule,
    ],
})
export class AppModule { }

