import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { GameModule } from '../game/game.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { CommonModule } from '../common/common.module';
import { Room, RoomSchema } from '../schemas/room.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
        UsersModule,
        AuthModule,
        forwardRef(() => GameModule),
        TelemetryModule,
        CommonModule,
    ],
    providers: [RoomsService, RoomsGateway],
    exports: [RoomsService],
})
export class RoomsModule { }

