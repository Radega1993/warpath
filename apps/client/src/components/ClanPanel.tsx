import { useGameStore } from '../store/gameStore';
import { useState } from 'react';

export default function ClanPanel() {
    const { gameState, userId } = useGameStore();
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!gameState) return null;

    const currentPlayer = gameState.players
        ? Object.values(gameState.players).find((p: any) => p.userId === userId)
        : null;

    if (!currentPlayer) return null;

    const clanEmblem = '🛡️'; // TODO: Cambiar por emblema real del clan
    const heroIcon = '👑'; // TODO: Cambiar por icono del héroe

    return (
        <div className="h-full">
            <div className="modern-panel h-full relative overflow-y-auto">
                {/* Botón colapsar */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-xs text-[#b0b0b0] hover:text-[#00d4ff] transition-colors bg-[#0a0a0f] rounded"
                >
                    {isCollapsed ? '▶' : '◀'}
                </button>

                {!isCollapsed && (
                    <div className="space-y-2 slide-in">
                        {/* Emblema del Clan */}
                        <div className="text-center">
                            <div className="text-4xl mb-1">{clanEmblem}</div>
                            <h2 className="modern-panel-header text-sm">Clan</h2>
                            <p className="text-xs text-[#b0b0b0]">Nivel {currentPlayer.clanLevel || 1}</p>
                        </div>

                        {/* Recursos */}
                        <div className="space-y-2 border-t border-[#2a2a3e] pt-2">
                            {/* Oro */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <span className="text-lg">💰</span>
                                    <span className="text-[#b0b0b0] text-xs font-semibold">Oro</span>
                                </div>
                                <span className="text-lg font-bold text-[#ffd700]">
                                    {currentPlayer.gold || 0}
                                </span>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <span className="text-lg">⚡</span>
                                    <span className="text-[#b0b0b0] text-xs font-semibold">Acciones</span>
                                </div>
                                <div className="flex gap-1">
                                    {Array.from({ length: currentPlayer.actions || 1 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={`
                                                w-3 h-3 rounded-full border
                                                ${i < (currentPlayer.actionsLeft || 0)
                                                    ? 'bg-[#00d4ff] border-[#00d4ff]'
                                                    : 'bg-[#2a2a3e] border-[#2a2a3e] opacity-30'
                                                }
                                            `}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Caminos */}
                        <div className="border-t border-[#2a2a3e] pt-2">
                            <h3 className="text-[#b0b0b0] text-xs mb-1 font-semibold">Caminos</h3>
                            <div className="space-y-1">
                                {Object.entries(gameState.paths || {}).map(([path, level]: [string, any]) => (
                                    <div key={path} className="flex items-center justify-between text-xs">
                                        <span className="capitalize text-[#b0b0b0]">{path}</span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map((lvl) => (
                                                <span
                                                    key={lvl}
                                                    className={`
                                                        w-2 h-2 rounded-full
                                                        ${lvl <= level
                                                            ? 'bg-[#00d4ff]'
                                                            : 'bg-[#2a2a3e] opacity-30'
                                                        }
                                                    `}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Héroe */}
                        <div className="border-t border-[#2a2a3e] pt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{heroIcon}</span>
                                <div>
                                    <p className="text-[#b0b0b0] text-xs font-semibold">Jefe</p>
                                    <p className="text-xs text-[#707070]">Activo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isCollapsed && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-4xl">{clanEmblem}</div>
                        <div className="text-2xl font-bold text-[#ffd700]">{currentPlayer.gold || 0}</div>
                    </div>
                )}
            </div>
        </div>
    );
}

