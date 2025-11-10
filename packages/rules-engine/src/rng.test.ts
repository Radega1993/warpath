import { describe, it, expect } from 'vitest';
import { SeededRNG } from './rng';

describe('SeededRNG', () => {
    it('should generate deterministic random numbers with same seed', () => {
        const rng1 = new SeededRNG(12345);
        const rng2 = new SeededRNG(12345);

        const rolls1: number[] = [];
        const rolls2: number[] = [];

        for (let i = 0; i < 10; i++) {
            rolls1.push(rng1.random());
            rolls2.push(rng2.random());
        }

        expect(rolls1).toEqual(rolls2);
    });

    it('should generate different numbers with different seeds', () => {
        const rng1 = new SeededRNG(12345);
        const rng2 = new SeededRNG(54321);

        const roll1 = rng1.random();
        const roll2 = rng2.random();

        expect(roll1).not.toBe(roll2);
    });

    it('should generate integers in range', () => {
        const rng = new SeededRNG(12345);
        const min = 1;
        const max = 6;

        for (let i = 0; i < 100; i++) {
            const result = rng.randomInt(min, max);
            expect(result).toBeGreaterThanOrEqual(min);
            expect(result).toBeLessThanOrEqual(max);
        }
    });

    it('should roll dice correctly', () => {
        const rng = new SeededRNG(12345);
        const faces = 6;

        for (let i = 0; i < 100; i++) {
            const result = rng.rollDice(faces);
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(faces);
        }
    });

    it('should track counter correctly', () => {
        const rng = new SeededRNG(12345);
        expect(rng.getCounter()).toBe(0);

        rng.random();
        expect(rng.getCounter()).toBe(1);

        rng.rollDice(6);
        expect(rng.getCounter()).toBe(2);
    });

    it('should clone correctly', () => {
        const rng1 = new SeededRNG(12345);
        rng1.random();
        rng1.random();

        const rng2 = rng1.clone();

        expect(rng2.getSeed()).toBe(rng1.getSeed());
        expect(rng2.getCounter()).toBe(rng1.getCounter());

        const roll1 = rng1.random();
        const roll2 = rng2.random();

        expect(roll1).toBe(roll2);
    });
});

