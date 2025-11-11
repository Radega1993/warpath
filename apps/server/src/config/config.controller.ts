import { Controller, Get } from '@nestjs/common';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
    constructor(private configService: ConfigService) { }

    @Get()
    async getConfig() {
        const config = await this.configService.getConfig();

        // Retornar solo los datos necesarios para el cliente (sin gameSettings internos)
        return {
            economy: config.economy,
            zones: config.zones,
            paths: config.paths,
            clanLevels: config.clanLevels,
            unitCosts: config.unitCosts,
            unitLimits: config.unitLimits,
            combat: config.combat,
            rankDice: config.rankDice,
        };
    }
}

