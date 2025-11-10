import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { TimerService } from './timer.service';
import { RoomsModule } from '../rooms/rooms.module';
import { MatchModule } from '../match/match.module';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
    imports: [forwardRef(() => RoomsModule), MatchModule, TelemetryModule],
    providers: [GameService, GameGateway, TimerService],
    exports: [GameService, TimerService],
})
export class GameModule { }

