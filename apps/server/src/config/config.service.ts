import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameConfig, GameConfigDocument } from '../schemas/game-config.schema';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConfigService implements OnModuleInit {
    private configCache: GameConfigDocument | null = null;

    constructor(
        @InjectModel(GameConfig.name) private configModel: Model<GameConfigDocument>,
    ) { }

    async onModuleInit() {
        // Cargar configuración al iniciar (async pero no bloqueamos)
        this.loadConfig().catch(err => {
            console.error('Error loading config on init:', err);
        });
    }

    /**
     * Carga la configuración desde la BD o crea una por defecto
     */
    async loadConfig(): Promise<GameConfigDocument> {
        if (this.configCache) {
            return this.configCache;
        }

        const configResult: any = await this.configModel.findOne({ configId: 'default' }).exec();
        let config = configResult;

        if (!config) {
            // Si no existe, crear desde balance.json
            config = await this.initializeFromFile();
        }

        this.configCache = (config as any) as GameConfigDocument;
        return this.configCache;
    }

    /**
     * Inicializa la configuración desde balance.json
     */
    private async initializeFromFile(): Promise<GameConfigDocument> {
        const balanceFilePath = path.join(__dirname, '../../../packages/rules-engine/balance.json');
        let balanceData: any = {};

        try {
            if (fs.existsSync(balanceFilePath)) {
                const fileContent = fs.readFileSync(balanceFilePath, 'utf-8');
                balanceData = JSON.parse(fileContent);
            }
        } catch (error) {
            console.warn('Could not load balance.json, using defaults');
        }

        // Mapear datos de balance.json a GameConfig
        const config = new this.configModel({
            configId: 'default',
            economy: balanceData.economy || {
                baseIncomePerTerritory: 50,
                merchantHeroBonus: 50,
            },
            zones: balanceData.zones || {},
            paths: balanceData.paths || {},
            clanLevels: balanceData.clanLevels || {},
            unitCosts: balanceData.unitCosts || {
                explorer: 150,
                warrior: 250,
                elite: 300,
                hero: 350,
                chief: 1000,
                legend: 5000,
            },
            unitLimits: balanceData.unitLimits || {
                explorer: 20,
                warrior: 25,
                elite: 15,
                hero: 10,
                chief: 1,
                legend: 3,
            },
            combat: balanceData.combat || {
                damageThreshold: 8,
                tieRule: 'same_rank_both_die',
            },
            gameSettings: {
                defaultTurnTime: 120,
                maxPlayers: 4,
                minPlayers: 2,
                startingGold: 0,
                startingActions: 1,
            },
            rankDice: {
                explorer: 4,
                warrior: 6,
                elite: 8,
                hero: 12,
                chief: 20,
                legend: 100,
            },
        });

        await config.save();
        return (config as any) as GameConfigDocument;
    }

    /**
     * Obtiene la configuración completa
     */
    async getConfig(): Promise<GameConfigDocument> {
        return await this.loadConfig();
    }

    /**
     * Actualiza la configuración
     */
    async updateConfig(updates: Partial<GameConfig>): Promise<GameConfigDocument> {
        const config = await this.configModel.findOneAndUpdate(
            { configId: 'default' },
            { $set: updates },
            { new: true, upsert: true }
        ).exec();

        // Invalidar caché
        this.configCache = null;
        await this.loadConfig();

        return (config as any) as GameConfigDocument;
    }

    /**
     * Obtiene un valor específico de la configuración
     */
    async getValue<T = any>(path: string): Promise<T | undefined> {
        const config: any = await this.loadConfig();
        const keys = path.split('.');
        let value: any = config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return value as T;
    }

    /**
     * Invalida el caché (útil después de actualizaciones)
     */
    invalidateCache() {
        this.configCache = null;
    }
}

