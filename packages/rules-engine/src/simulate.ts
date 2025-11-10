/**
 * Script de simulación de batallas
 * Simula 1000 batallas y volca métricas
 */

import { SeededRNG } from './rng';
import { resolveCombat, createEmptyTroops } from './combat';
import { UnitRank, CombatModifiers } from './types';

interface BattleMetrics {
    totalBattles: number;
    attackerWins: number;
    defenderWins: number;
    draws: number;
    averageDamage: number;
    totalDamage: number;
    battlesWithConquest: number;
}

function simulateBattles(count: number = 1000): BattleMetrics {
    const metrics: BattleMetrics = {
        totalBattles: 0,
        attackerWins: 0,
        defenderWins: 0,
        draws: 0,
        averageDamage: 0,
        totalDamage: 0,
        battlesWithConquest: 0
    };

    for (let i = 0; i < count; i++) {
        const seed = Math.floor(Math.random() * 1000000);
        const rng = new SeededRNG(seed);

        // Configuración de batalla típica
        const attacker = createEmptyTroops();
        const defender = createEmptyTroops();

        // Atacante: 3 guerreros
        attacker[UnitRank.WARRIOR] = 3;

        // Defensor: 2 guerreros
        defender[UnitRank.WARRIOR] = 2;

        const modifiers: CombatModifiers = {
            attackerEfficiency: false,
            defenderEfficiency: false,
            attackerRerolls: 0,
            defenderRerolls: 0,
            defenderDefenseBonus: 0
        };

        const result = resolveCombat(attacker, defender, modifiers, rng);

        metrics.totalBattles++;
        metrics.totalDamage += result.totalDamage;

        if (result.conquest) {
            metrics.battlesWithConquest++;
            metrics.attackerWins++;
        } else {
            const attackerLosses = Object.values(result.attackerLosses).reduce((a, b) => a + b, 0);
            const defenderLosses = Object.values(result.defenderLosses).reduce((a, b) => a + b, 0);

            if (attackerLosses < defenderLosses) {
                metrics.attackerWins++;
            } else if (defenderLosses < attackerLosses) {
                metrics.defenderWins++;
            } else {
                metrics.draws++;
            }
        }
    }

    metrics.averageDamage = metrics.totalDamage / metrics.totalBattles;

    return metrics;
}

function printMetrics(metrics: BattleMetrics): void {
    console.log('\n=== Métricas de Simulación de Batallas ===\n');
    console.log(`Total de batallas: ${metrics.totalBattles}`);
    console.log(`Victorias del atacante: ${metrics.attackerWins} (${((metrics.attackerWins / metrics.totalBattles) * 100).toFixed(2)}%)`);
    console.log(`Victorias del defensor: ${metrics.defenderWins} (${((metrics.defenderWins / metrics.totalBattles) * 100).toFixed(2)}%)`);
    console.log(`Empates: ${metrics.draws} (${((metrics.draws / metrics.totalBattles) * 100).toFixed(2)}%)`);
    console.log(`Conquistas: ${metrics.battlesWithConquest} (${((metrics.battlesWithConquest / metrics.totalBattles) * 100).toFixed(2)}%)`);
    console.log(`Daño promedio: ${metrics.averageDamage.toFixed(2)}`);
    console.log(`Daño total: ${metrics.totalDamage}\n`);
}

// Ejecutar simulación si se ejecuta directamente
if (require.main === module) {
    const metrics = simulateBattles(1000);
    printMetrics(metrics);
}

export { simulateBattles, printMetrics };

