import { SeededRNG } from './rng';
import {
    UnitRank,
    RANK_DICE,
    Troops,
    CombatResult,
    CombatModifiers
} from './types';
import { GameConfig, DEFAULT_CONFIG } from './config';

/**
 * Obtiene el dado para un rango desde la configuración
 */
function getRankDice(rank: UnitRank, config: GameConfig): number {
    const rankKey = rank.toLowerCase().replace('d', '') as keyof typeof config.rankDice;
    return config.rankDice[rankKey] || RANK_DICE[rank] || 4;
}

/**
 * Resuelve un combate entre atacante y defensor
 */
export function resolveCombat(
    attackerTroops: Troops,
    defenderTroops: Troops,
    modifiers: CombatModifiers,
    rng: SeededRNG,
    config: GameConfig = DEFAULT_CONFIG
): CombatResult {
    // Aplicar límite de tropas si existe (Zona Defensiva)
    const maxTroops = modifiers.maxTroopsPerSide;
    const attackerCommits = maxTroops
        ? limitTroops(attackerTroops, maxTroops)
        : attackerTroops;
    const defenderCommits = maxTroops
        ? limitTroops(defenderTroops, maxTroops)
        : defenderTroops;

    // Inicializar pérdidas
    const attackerLosses: Troops = createEmptyTroops();
    const defenderLosses: Troops = createEmptyTroops();

    // Tiradas del atacante
    const attackerRolls: Array<{ rank: UnitRank; roll: number }> = [];
    for (const rank of Object.keys(attackerCommits) as UnitRank[]) {
        const count = attackerCommits[rank];
        for (let i = 0; i < count; i++) {
            const maxDice = getRankDice(rank, config);
            let roll = rng.rollDice(maxDice);

            // Aplicar eficacia (+1 al dado)
            if (modifiers.attackerEfficiency) {
                roll = Math.min(roll + 1, maxDice);
            }

            // Camino de la Suerte N3: boost a élites (+1 al dado de élites)
            if (rank === UnitRank.ELITE && modifiers.luckBoostElites) {
                roll = Math.min(roll + 1, maxDice);
            }

            // Aplicar rerolls (puede haber múltiples rerolls)
            if (modifiers.attackerRerolls > 0) {
                for (let r = 0; r < modifiers.attackerRerolls; r++) {
                    const reroll = rng.rollDice(maxDice);
                    let adjustedReroll = reroll;
                    if (modifiers.attackerEfficiency) {
                        adjustedReroll = Math.min(reroll + 1, maxDice);
                    }
                    // Boost a élites también en rerolls
                    if (rank === UnitRank.ELITE && modifiers.luckBoostElites) {
                        adjustedReroll = Math.min(adjustedReroll + 1, maxDice);
                    }
                    roll = Math.max(roll, adjustedReroll);
                }
            }

            attackerRolls.push({ rank, roll });
        }
    }

    // Tiradas del defensor
    const defenderRolls: Array<{ rank: UnitRank; roll: number }> = [];
    for (const rank of Object.keys(defenderCommits) as UnitRank[]) {
        const count = defenderCommits[rank];
        for (let i = 0; i < count; i++) {
            const maxDice = getRankDice(rank, config);
            let roll = rng.rollDice(maxDice);

            // Aplicar eficacia (+1 al dado)
            if (modifiers.defenderEfficiency) {
                roll = Math.min(roll + 1, maxDice);
            }

            // Aplicar bonificación de defensa (Zona Amurallada: +2)
            if (modifiers.defenderDefenseBonus > 0) {
                roll = Math.min(roll + modifiers.defenderDefenseBonus, maxDice);
            }

            // Consolidar: +2 dados (2 exploradores adicionales)
            // Esto se aplica añadiendo 2 tiradas de explorador al final

            // Aplicar rerolls (puede haber múltiples rerolls)
            if (modifiers.defenderRerolls > 0) {
                for (let r = 0; r < modifiers.defenderRerolls; r++) {
                    const reroll = rng.rollDice(maxDice);
                    let adjustedReroll = reroll;
                    if (modifiers.defenderEfficiency) {
                        adjustedReroll = Math.min(adjustedReroll + 1, maxDice);
                    }
                    if (modifiers.defenderDefenseBonus > 0) {
                        adjustedReroll = Math.min(adjustedReroll + modifiers.defenderDefenseBonus, maxDice);
                    }
                    roll = Math.max(roll, adjustedReroll);
                }
            }

            defenderRolls.push({ rank, roll });
        }
    }

    // Consolidar: añadir +2 dados (2 exploradores) si está consolidado
    if (modifiers.defenderConsolidated) {
        const explorerDice = getRankDice(UnitRank.EXPLORER, config);
        for (let i = 0; i < 2; i++) {
            let roll = rng.rollDice(explorerDice);

            // Aplicar eficacia si está activa
            if (modifiers.defenderEfficiency) {
                roll = Math.min(roll + 1, explorerDice);
            }

            // Aplicar bonificación de defensa
            if (modifiers.defenderDefenseBonus > 0) {
                roll = Math.min(roll + modifiers.defenderDefenseBonus, explorerDice);
            }

            defenderRolls.push({ rank: UnitRank.EXPLORER, roll });
        }
    }

    // Ordenar tiradas de mayor a menor
    attackerRolls.sort((a, b) => b.roll - a.roll);
    defenderRolls.sort((a, b) => b.roll - a.roll);

    // Comparar tiradas
    const maxPairs = Math.min(attackerRolls.length, defenderRolls.length);
    let totalDamage = 0;

    for (let i = 0; i < maxPairs; i++) {
        const attackerRoll = attackerRolls[i];
        const defenderRoll = defenderRolls[i];

        // Regla de daño: detener si el daño acumulado alcanza el umbral
        const damageThreshold = config.combat.damageThreshold || 8;
        if (totalDamage >= damageThreshold) {
            break;
        }

        if (attackerRoll.roll > defenderRoll.roll) {
            // Atacante gana
            defenderLosses[defenderRoll.rank]++;
            totalDamage += attackerRoll.roll;
        } else if (defenderRoll.roll > attackerRoll.roll) {
            // Defensor gana
            attackerLosses[attackerRoll.rank]++;
            totalDamage += defenderRoll.roll;
        } else {
            // Empate: mismo rango → mueren ambos, distinto rango → gana el superior
            if (attackerRoll.rank === defenderRoll.rank) {
                // Mismo rango: mueren ambos
                attackerLosses[attackerRoll.rank]++;
                defenderLosses[defenderRoll.rank]++;
                totalDamage += attackerRoll.roll;
            } else {
                // Distinto rango: gana el superior
                const attackerRankValue = getRankValue(attackerRoll.rank, config);
                const defenderRankValue = getRankValue(defenderRoll.rank, config);

                if (attackerRankValue > defenderRankValue) {
                    defenderLosses[defenderRoll.rank]++;
                    totalDamage += attackerRoll.roll;
                } else {
                    attackerLosses[attackerRoll.rank]++;
                    totalDamage += defenderRoll.roll;
                }
            }
        }
    }

    // Determinar si hubo conquista
    const defenderTotal = sumTroops(defenderCommits);
    const defenderLost = sumTroops(defenderLosses);
    const conquest = defenderTotal > 0 && defenderLost >= defenderTotal;

    return {
        attackerRolls,
        defenderRolls,
        attackerLosses,
        defenderLosses,
        conquest,
        totalDamage
    };
}

/**
 * Limita las tropas a un máximo por rango (para Zona Defensiva)
 */
function limitTroops(troops: Troops, maxTotal: number): Troops {
    const limited: Troops = createEmptyTroops();
    let total = 0;

    // Priorizar rangos más altos
    const ranks: UnitRank[] = [
        UnitRank.LEGEND,
        UnitRank.CHIEF,
        UnitRank.HERO,
        UnitRank.ELITE,
        UnitRank.WARRIOR,
        UnitRank.EXPLORER
    ];

    for (const rank of ranks) {
        const available = troops[rank];
        const remaining = maxTotal - total;

        if (remaining <= 0) break;

        limited[rank] = Math.min(available, remaining);
        total += limited[rank];
    }

    return limited;
}

/**
 * Crea un objeto de tropas vacío
 */
export function createEmptyTroops(): Troops {
    return {
        [UnitRank.EXPLORER]: 0,
        [UnitRank.WARRIOR]: 0,
        [UnitRank.ELITE]: 0,
        [UnitRank.HERO]: 0,
        [UnitRank.CHIEF]: 0,
        [UnitRank.LEGEND]: 0
    };
}

/**
 * Suma el total de tropas
 */
export function sumTroops(troops: Troops): number {
    return Object.values(troops).reduce((sum, count) => sum + count, 0);
}

/**
 * Obtiene el valor numérico de un rango (para comparación)
 */
function getRankValue(rank: UnitRank, config: GameConfig): number {
    return getRankDice(rank, config);
}

