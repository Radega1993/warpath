import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const exists = promisify(fs.exists);

@Injectable()
export class AdminService {
    private readonly balanceFilePath = path.join(__dirname, '../../../packages/rules-engine/balance.json');

    constructor(private configService: ConfigService) { }

    /**
     * Obtiene el balance actual desde la BD
     */
    async getBalance(): Promise<any> {
        const config = await this.configService.getConfig();

        // Convertir a formato balance.json para compatibilidad
        return {
            economy: config.economy || {},
            zones: config.zones || {},
            paths: config.paths || {},
            clanLevels: config.clanLevels || {},
            unitCosts: config.unitCosts || {},
            unitLimits: config.unitLimits || {},
            combat: config.combat || {},
            gameSettings: config.gameSettings || {},
            rankDice: config.rankDice || {},
        };
    }

    /**
     * Actualiza el balance en la BD
     */
    async updateBalance(balance: any): Promise<void> {
        // Validar que el balance tenga la estructura correcta
        this.validateBalance(balance);

        // Actualizar en BD
        await this.configService.updateConfig({
            economy: balance.economy,
            zones: balance.zones,
            paths: balance.paths,
            clanLevels: balance.clanLevels,
            unitCosts: balance.unitCosts,
            unitLimits: balance.unitLimits,
            combat: balance.combat,
            gameSettings: balance.gameSettings,
            rankDice: balance.rankDice,
        });

        // También actualizar balance.json para compatibilidad con rules-engine
        try {
            const backupPath = `${this.balanceFilePath}.backup.${Date.now()}`;
            if (await exists(this.balanceFilePath)) {
                await copyFile(this.balanceFilePath, backupPath);
            }

            // Escribir nuevo balance en archivo (solo para compatibilidad)
            const fileBalance = {
                economy: balance.economy,
                zones: balance.zones,
                paths: balance.paths,
                clanLevels: balance.clanLevels,
                unitCosts: balance.unitCosts,
                unitLimits: balance.unitLimits,
                combat: balance.combat,
            };
            await writeFile(this.balanceFilePath, JSON.stringify(fileBalance, null, 4), 'utf-8');
        } catch (error: any) {
            console.warn(`Failed to update balance.json file: ${error.message}`);
        }
    }

    /**
     * Actualiza una sección específica del balance
     */
    async updateBalanceSection(section: string, data: any): Promise<void> {
        const balance = await this.getBalance();

        if (!balance[section]) {
            throw new Error(`Section ${section} does not exist in balance`);
        }

        balance[section] = { ...balance[section], ...data };
        await this.updateBalance(balance);
    }

    /**
     * Valida la estructura del balance
     */
    private validateBalance(balance: any): void {
        const requiredSections = ['economy', 'zones', 'paths', 'clanLevels', 'unitCosts', 'unitLimits', 'combat'];

        for (const section of requiredSections) {
            if (!balance[section]) {
                throw new Error(`Missing required section: ${section}`);
            }
        }

        // Validar que gameSettings y rankDice existan (opcionales pero recomendados)
        if (!balance.gameSettings) {
            balance.gameSettings = {
                defaultTurnTime: 120,
                maxPlayers: 4,
                minPlayers: 2,
                startingGold: 0,
                startingActions: 1,
            };
        }

        if (!balance.rankDice) {
            balance.rankDice = {
                explorer: 4,
                warrior: 6,
                elite: 8,
                hero: 12,
                chief: 20,
                legend: 100,
            };
        }
    }
}

