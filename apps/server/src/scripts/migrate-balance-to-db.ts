/**
 * Script para migrar balance.json a MongoDB
 * Ejecutar con: npx ts-node src/scripts/migrate-balance-to-db.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ConfigService } from '../config/config.service';

async function migrate() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const configService = app.get(ConfigService);

    try {
        console.log('🔄 Migrating balance.json to MongoDB...');

        // Esto cargará automáticamente desde balance.json si no existe en BD
        const config = await configService.getConfig();

        console.log('✅ Migration completed!');
        console.log('📋 Current configuration:');
        console.log(`   - Economy: ${JSON.stringify(config.economy)}`);
        console.log(`   - Unit Costs: ${JSON.stringify(config.unitCosts)}`);
        console.log(`   - Game Settings: ${JSON.stringify(config.gameSettings)}`);
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await app.close();
    }
}

migrate();

