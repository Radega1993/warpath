import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { GameConfig, GameConfigSchema } from '../schemas/game-config.schema';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([{ name: GameConfig.name, schema: GameConfigSchema }]),
    ],
    controllers: [ConfigController],
    providers: [ConfigService],
    exports: [ConfigService],
})
export class ConfigModule { }

