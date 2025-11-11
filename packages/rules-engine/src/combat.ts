import { SeededRNG } from './rng';
import {
    UnitRank,
    RANK_DICE,
    Troops,
    CombatResult,
    CombatModifiers
} from './types';

/**
 * Resuelve un combate entre atacante y defensor
 */
export function resolveCombat(
    attackerTroops: Troops,
    defenderTroops: Troops,
    modifiers: CombatModifiers,
    rng: SeededRNG
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
            let roll = rng.rollDice(RANK_DICE[rank]);

            // Aplicar eficacia (+1 al dado)
            if (modifiers.attackerEfficiency) {
                roll = Math.min(roll + 1, RANK_DICE[rank]);
            }

            // Camino de la Suerte N3: boost a élites (+1 al dado de élites)
            if (rank === UnitRank.ELITE && modifiers.luckBoostElites) {
                roll = Math.min(roll + 1, RANK_DICE[rank]);
            }

            // Aplicar rerolls (puede haber múltiples rerolls)
            if (modifiers.attackerRerolls > 0) {
                for (let r = 0; r < modifiers.attackerRerolls; r++) {
                    const reroll = rng.rollDice(RANK_DICE[rank]);
                    let adjustedReroll = reroll;
                    if (modifiers.attackerEfficiency) {
                        adjustedReroll = Math.min(reroll + 1, RANK_DICE[rank]);
                    }
                    // Boost a élites también en rerolls
                    if (rank === UnitRank.ELITE && modifiers.luckBoostElites) {
                        adjustedReroll = Math.min(adjustedReroll + 1, RANK_DICE[rank]);
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
            let roll = rng.rollDice(RANK_DICE[rank]);

            // Aplicar eficacia (+1 al dado)
            if (modifiers.defenderEfficiency) {
                roll = Math.min(roll + 1, RANK_DICE[rank]);
            }

            // Aplicar bonificación de defensa (Zona Amurallada: +2)
            if (modifiers.defenderDefenseBonus > 0) {
                roll = Math.min(roll + modifiers.defenderDefenseBonus, RANK_DICE[rank]);
            }

            // Aplicar rerolls (puede haber múltiples rerolls)
            if (modifiers.defenderRerolls > 0) {
                for (let r = 0; r < modifiers.defenderRerolls; r++) {
                    const reroll = rng.rollDice(RANK_DICE[rank]);
                    let adjustedReroll = reroll;
                    if (modifiers.defenderEfficiency) {
                        adjustedReroll = Math.min(adjustedReroll + 1, RANK_DICE[rank]);
                    }
                    if (modifiers.defenderDefenseBonus > 0) {
                        adjustedReroll = Math.min(adjustedReroll + modifiers.defenderDefenseBonus, RANK_DICE[rank]);
                    }
                    roll = Math.max(roll, adjustedReroll);
                }
            }

            defenderRolls.push({ rank, roll });
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

        // Regla de daño ≥8: detener si el daño acumulado alcanza 8
        if (totalDamage >= 8) {
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
                const attackerRankValue = getRankValue(attackerRoll.rank);
                const defenderRankValue = getRankValue(defenderRoll.rank);

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
function getRankValue(rank: UnitRank): number {
    return RANK_DICE[rank];
}

