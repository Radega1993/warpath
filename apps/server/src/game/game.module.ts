import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { TimerService } from './timer.service';
import { RoomsModule } from '../rooms/rooms.module';
import { MatchModule } from '../match/match.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ConfigModule } from '../config/config.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [forwardRef(() => RoomsModule), MatchModule, TelemetryModule, AuthModule, UsersModule, ConfigModule, CommonModule],
    providers: [GameService, GameGateway, TimerService],
    exports: [GameService, TimerService],
})
export class GameModule { }

