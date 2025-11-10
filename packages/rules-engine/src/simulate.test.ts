import { describe, it, expect } from 'vitest';
import { simulateBattles, printMetrics } from './simulate';

describe('Battle Simulation', () => {
    it('should simulate battles and return metrics', () => {
        const metrics = simulateBattles(100);

        expect(metrics.totalBattles).toBe(100);
        expect(metrics.attackerWins + metrics.defenderWins + metrics.draws).toBe(100);
        expect(metrics.averageDamage).toBeGreaterThan(0);
        expect(metrics.totalDamage).toBeGreaterThan(0);
    });

    it('should have reasonable win rates', () => {
        const metrics = simulateBattles(1000);

        // El atacante con más tropas debería ganar más a menudo
        // Pero no siempre (hay aleatoriedad)
        expect(metrics.attackerWins).toBeGreaterThan(0);
        expect(metrics.defenderWins).toBeGreaterThan(0);
    });

    it('should calculate average damage correctly', () => {
        const metrics = simulateBattles(100);

        const expectedAverage = metrics.totalDamage / metrics.totalBattles;
        expect(metrics.averageDamage).toBeCloseTo(expectedAverage, 2);
    });
});

