import { useGameStore } from '../store/gameStore';

const UNIT_NAMES: Record<string, string> = {
    d4: 'Explorador',
    d6: 'Guerrero',
    d8: 'Élite',
    d12: 'Héroe',
    d20: 'Jefe',
    d100: 'Leyenda',
};

export default function CombatLog() {
    const { lastCombatResult } = useGameStore();

    if (!lastCombatResult) {
        return (
            <div className="bg-gray-800 rounded-lg shadow-xl p-4">
                <h3 className="text-lg font-bold text-white mb-2">Log de Combate</h3>
                <p className="text-sm text-gray-400">No hay combates recientes</p>
            </div>
        );
    }

    const { rolls, attackerRolls, defenderRolls, losses, attackerLosses, defenderLosses, conquest } = lastCombatResult;

    // Normalizar datos del backend (puede venir en formato rolls o attackerRolls/defenderRolls)
    const normalizedAttackerRolls = attackerRolls || rolls?.attacker || [];
    const normalizedDefenderRolls = defenderRolls || rolls?.defender || [];
    const normalizedAttackerLosses = attackerLosses || losses?.attacker || {};
    const normalizedDefenderLosses = defenderLosses || losses?.defender || {};

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-4 max-h-64 overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-3">Log de Combate</h3>

            <div className="space-y-3">
                {/* Resultado */}
                <div className={`p-2 rounded ${conquest ? 'bg-green-900/30 border border-green-600' : 'bg-red-900/30 border border-red-600'}`}>
                    <p className={`text-sm font-bold ${conquest ? 'text-green-400' : 'text-red-400'}`}>
                        {conquest ? '✓ Conquista exitosa' : '✗ Ataque fallido'}
                    </p>
                </div>

                {/* Tiradas del atacante */}
                {normalizedAttackerRolls.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Atacante:</p>
                        <div className="space-y-1">
                            {normalizedAttackerRolls.map((roll: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-gray-700 p-1 rounded">
                                    <span className="text-gray-300">{UNIT_NAMES[roll.rank] || roll.rank}:</span>
                                    <span className="text-yellow-400 font-bold">{roll.roll}</span>
                                </div>
                            ))}
                        </div>
                        {Object.keys(normalizedAttackerLosses).length > 0 && (
                            <div className="mt-1 text-xs text-red-400">
                                Pérdidas: {Object.entries(normalizedAttackerLosses).map(([rank, count]: [string, any]) =>
                                    `${count} ${UNIT_NAMES[rank] || rank}`
                                ).join(', ')}
                            </div>
                        )}
                    </div>
                )}

                {/* Tiradas del defensor */}
                {normalizedDefenderRolls.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Defensor:</p>
                        <div className="space-y-1">
                            {normalizedDefenderRolls.map((roll: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-gray-700 p-1 rounded">
                                    <span className="text-gray-300">{UNIT_NAMES[roll.rank] || roll.rank}:</span>
                                    <span className="text-yellow-400 font-bold">{roll.roll}</span>
                                </div>
                            ))}
                        </div>
                        {Object.keys(normalizedDefenderLosses).length > 0 && (
                            <div className="mt-1 text-xs text-red-400">
                                Pérdidas: {Object.entries(normalizedDefenderLosses).map(([rank, count]: [string, any]) =>
                                    `${count} ${UNIT_NAMES[rank] || rank}`
                                ).join(', ')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

