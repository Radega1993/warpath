/**
 * RNG seeded para determinismo
 * Implementación simple de LCG (Linear Congruential Generator)
 */
export class SeededRNG {
    private seed: number;
    private counter: number = 0;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Genera un número aleatorio entre 0 y 1
     */
    random(): number {
        // LCG: (a * seed + c) mod m
        // Parámetros usados: a=1664525, c=1013904223, m=2^32
        this.seed = (1664525 * this.seed + 1013904223) % (2 ** 32);
        this.counter++;
        return this.seed / (2 ** 32);
    }

    /**
     * Genera un entero aleatorio entre min (inclusive) y max (inclusive)
     */
    randomInt(min: number, max: number): number {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    /**
     * Tira un dado de n caras
     */
    rollDice(faces: number): number {
        return this.randomInt(1, faces);
    }

    /**
     * Obtiene el contador de tiradas (útil para debugging)
     */
    getCounter(): number {
        return this.counter;
    }

    /**
     * Obtiene la seed actual
     */
    getSeed(): number {
        return this.seed;
    }

    /**
     * Crea una copia del RNG (útil para simular sin afectar el original)
     */
    clone(): SeededRNG {
        const cloned = new SeededRNG(this.seed);
        cloned.counter = this.counter;
        return cloned;
    }
}

