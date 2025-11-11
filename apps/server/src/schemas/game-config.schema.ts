import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameConfigDocument = GameConfig & Document;

@Schema({ timestamps: true })
export class GameConfig {
    @Prop({ required: true, unique: true, default: 'default' })
    configId: string;

    // Configuración de economía
    @Prop({ type: Object, default: {} })
    economy: {
        baseIncomePerTerritory?: number;
        merchantHeroBonus?: number;
    };

    // Configuración de zonas
    @Prop({ type: Object, default: {} })
    zones: {
        gold?: { incomeBonus?: number };
        fast?: { actionBonus?: number };
        battle?: { efficiencyBonus?: boolean };
        walled?: { defenseBonus?: number };
        defensive?: { maxTroopsPerSide?: number };
        recruitment?: { freeUnit?: boolean; freeUnitType?: string };
    };

    // Configuración de caminos
    @Prop({ type: Object, default: {} })
    paths: {
        clan?: {
            n1?: { unlocksClanLevel?: number };
            n2?: { unlocksClanLevel?: number };
            n3?: { actionBonus?: number; freeWarriorOnDeploy?: boolean };
        };
        treasure?: {
            n1?: { incomePerTerritory?: number };
            n2?: { flatIncomeBonus?: number };
            n3?: { flatIncomeBonus?: number };
        };
        power?: {
            n1?: { unlocksRank?: string };
            n2?: { unlocksRank?: string };
            n3?: { unlocksRank?: string };
        };
        luck?: {
            n1?: { attackerRerolls?: number };
            n2?: { defenderDefenseBonus?: number };
            n3?: { eliteBoost?: number };
        };
        land?: {
            n1?: { costReduction?: number };
            n2?: { costReduction?: number };
            n3?: { costReduction?: number; freeUnitInRecruitment?: boolean };
        };
        war?: {
            n1?: { efficiency?: boolean };
            n2?: { actionBonus?: number };
            n3?: { maxChiefs?: number; note?: string };
        };
    };

    // Niveles de clan
    @Prop({ type: Object, default: {} })
    clanLevels: {
        level2?: { unlockedBy?: string };
        level3?: { unlockedBy?: string; attackBonus?: number };
    };

    // Costos de unidades
    @Prop({ type: Object, default: {} })
    unitCosts: {
        explorer?: number;
        warrior?: number;
        elite?: number;
        hero?: number;
        chief?: number;
        legend?: number;
    };

    // Límites de unidades
    @Prop({ type: Object, default: {} })
    unitLimits: {
        explorer?: number;
        warrior?: number;
        elite?: number;
        hero?: number;
        chief?: number;
        legend?: number;
    };

    // Configuración de combate
    @Prop({ type: Object, default: {} })
    combat: {
        damageThreshold?: number;
        tieRule?: string;
    };

    // Configuración de juego
    @Prop({ type: Object, default: {} })
    gameSettings: {
        defaultTurnTime?: number; // segundos
        maxPlayers?: number;
        minPlayers?: number;
        startingGold?: number;
        startingActions?: number;
    };

    // Dados por rango
    @Prop({ type: Object, default: {} })
    rankDice: {
        explorer?: number;
        warrior?: number;
        elite?: number;
        hero?: number;
        chief?: number;
        legend?: number;
    };
}

export const GameConfigSchema = SchemaFactory.createForClass(GameConfig);

