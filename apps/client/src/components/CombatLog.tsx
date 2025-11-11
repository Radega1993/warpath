import { useGameStore } from '../store/gameStore';
import { useState } from 'react';

const UNIT_NAMES: Record<string, string> = {
    d4: 'Explorador',
    d6: 'Guerrero',
    d8: 'Élite',
    d12: 'Héroe',
    d20: 'Jefe',
    d100: 'Leyenda',
};

const RACE_ICONS: Record<string, string> = {
    human: '👤',
    orc: '👹',
    elf: '🧝',
    dwarf: '⛏️',
    undead: '💀',
    demon: '😈',
};

export default function CombatLog() {
    const { lastCombatResult, gameState } = useGameStore();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Historial de combates (por ahora solo el último, pero se puede expandir)
    const combatHistory = lastCombatResult ? [lastCombatResult] : [];

    return (
        <div className="modern-panel h-full relative overflow-hidden flex flex-col">
            {/* Botón colapsar */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-xs text-[#b0b0b0] hover:text-[#00d4ff] transition-colors z-10 bg-[#0a0a0f] rounded"
            >
                {isCollapsed ? '◀' : '▶'}
            </button>

            {!isCollapsed && (
                <div className="space-y-2 slide-in h-full flex flex-col">
                    {/* Título */}
                    <div className="border-b border-[#2a2a3e] pb-1 flex-shrink-0">
                        <h3 className="modern-panel-header text-sm">📜 Registro de Combate</h3>
                    </div>

                    {/* Mini-mapa de control (simplificado) */}
                    {gameState && (
                        <div className="p-2 bg-[#0a0a0f] rounded border border-[#2a2a3e] flex-shrink-0">
                            <p className="text-xs text-[#b0b0b0] mb-1">Control de Territorios</p>
                            <div className="flex gap-1 flex-wrap">
                                {Object.entries(gameState.owners || {}).slice(0, 20).map(([territoryId, ownerId]: [string, any]) => {
                                    const isMine = ownerId === gameState.currentPlayerId;
                                    return (
                                        <div
                                            key={territoryId}
                                            className={`
                                                    w-2.5 h-2.5 rounded
                                                    ${isMine ? 'bg-[#00d4ff]' : 'bg-[#2a2a3e]'}
                                                `}
                                            title={territoryId}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Scroll de combates */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                        {combatHistory.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-[#707070] text-xs italic">
                                    No hay combates recientes
                                </p>
                            </div>
                        ) : (
                            combatHistory.map((result: any, idx: number) => {
                                const { rolls, attackerRolls, defenderRolls, losses, attackerLosses, defenderLosses, conquest } = result;
                                const normalizedAttackerRolls = attackerRolls || rolls?.attacker || [];
                                const normalizedDefenderRolls = defenderRolls || rolls?.defender || [];
                                const normalizedAttackerLosses = attackerLosses || losses?.attacker || {};
                                const normalizedDefenderLosses = defenderLosses || losses?.defender || {};

                                return (
                                    <div
                                        key={idx}
                                        className={`
                                                p-3 rounded border border-[#2a2a3e] bg-[#0a0a0f]
                                                ${conquest
                                                ? 'border-[#00ff88]'
                                                : 'border-[#ff4444]'
                                            }
                                            `}
                                    >
                                        {/* Encabezado del combate */}
                                        <div className="flex items-center justify-between mb-2 border-b border-[#2a2a3e] pb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{RACE_ICONS.orc || '⚔️'}</span>
                                                <span className="text-[#b0b0b0] text-sm font-semibold">Ataque</span>
                                            </div>
                                            <span className={`
                                                    text-xs font-bold px-2 py-1 rounded
                                                    ${conquest
                                                    ? 'bg-[#00ff88] text-[#0a0a0f]'
                                                    : 'bg-[#ff4444] text-white'
                                                }
                                                `}>
                                                {conquest ? '✓ Victoria' : '✗ Derrota'}
                                            </span>
                                        </div>

                                        {/* Tiradas del atacante */}
                                        {normalizedAttackerRolls.length > 0 && (
                                            <div className="mb-2">
                                                <p className="text-xs text-[#b0b0b0] mb-1">Atacante:</p>
                                                <div className="space-y-1">
                                                    {normalizedAttackerRolls.slice(0, 3).map((roll: any, rollIdx: number) => (
                                                        <div
                                                            key={rollIdx}
                                                            className="flex items-center justify-between text-xs bg-[#0a0a0f] p-1 rounded"
                                                        >
                                                            <span className="text-[#b0b0b0]">
                                                                {UNIT_NAMES[roll.rank] || roll.rank}:
                                                            </span>
                                                            <span className="text-[#ffd700] font-bold">{roll.roll}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {Object.keys(normalizedAttackerLosses).length > 0 && (
                                                    <div className="mt-1 text-xs text-[#ff4444]">
                                                        Pérdidas: {Object.entries(normalizedAttackerLosses)
                                                            .map(([rank, count]: [string, any]) =>
                                                                `${count} ${UNIT_NAMES[rank] || rank}`
                                                            )
                                                            .join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Tiradas del defensor */}
                                        {normalizedDefenderRolls.length > 0 && (
                                            <div>
                                                <p className="text-xs text-[#b0b0b0] mb-1">Defensor:</p>
                                                <div className="space-y-1">
                                                    {normalizedDefenderRolls.slice(0, 3).map((roll: any, rollIdx: number) => (
                                                        <div
                                                            key={rollIdx}
                                                            className="flex items-center justify-between text-xs bg-[#0a0a0f] p-1 rounded"
                                                        >
                                                            <span className="text-[#b0b0b0]">
                                                                {UNIT_NAMES[roll.rank] || roll.rank}:
                                                            </span>
                                                            <span className="text-[#ffd700] font-bold">{roll.roll}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {Object.keys(normalizedDefenderLosses).length > 0 && (
                                                    <div className="mt-1 text-xs text-[#ff4444]">
                                                        Pérdidas: {Object.entries(normalizedDefenderLosses)
                                                            .map(([rank, count]: [string, any]) =>
                                                                `${count} ${UNIT_NAMES[rank] || rank}`
                                                            )
                                                            .join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {isCollapsed && (
                <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📜</span>
                    <span className="text-xs text-[#b0b0b0]">{combatHistory.length}</span>
                </div>
            )}
        </div>
    );
}
