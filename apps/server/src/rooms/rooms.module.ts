import { Module, forwardRef } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { GameModule } from '../game/game.module';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
    imports: [UsersModule, AuthModule, forwardRef(() => GameModule), TelemetryModule],
    providers: [RoomsService, RoomsGateway],
    exports: [RoomsService],
})
export class RoomsModule { }

