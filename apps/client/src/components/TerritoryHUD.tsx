import { useGameStore } from '../store/gameStore';
import { mapData } from '@warpath/shared';
import { wsService } from '../services/websocket.service';

const UNIT_NAMES: Record<string, string> = {
    d4: 'Explorador',
    d6: 'Guerrero',
    d8: 'Élite',
    d12: 'Héroe',
    d20: 'Jefe',
    d100: 'Leyenda',
};

export default function TerritoryHUD() {
    const { gameState, selectedTerritory, userId, attackFrom, fortifyFrom } = useGameStore();

    if (!selectedTerritory || !gameState) return null;

    const territory = mapData.territories.find((t: any) => t.id === selectedTerritory);
    const ownerId = gameState.owners[selectedTerritory];
    const isMine = ownerId === userId;
    const troops = gameState.troopsByTerritory[selectedTerritory] || {};
    const zone = gameState.zones?.[selectedTerritory];

    // Obtener información del jugador dueño
    const ownerPlayer = gameState.players
        ? Object.values(gameState.players).find((p: any) => p.userId === ownerId)
        : null;

    // Calcular posición del HUD cerca del territorio seleccionado
    // Por ahora, posición fija. TODO: Calcular basado en posición del territorio en el mapa
    const position = { top: '10%', right: '2%' };

    const handleQuickAction = (action: string) => {
        if (!isMine) return;

        switch (action) {
            case 'reinforce':
                wsService.reinforce(selectedTerritory);
                break;
            case 'consolidate':
                wsService.consolidate(selectedTerritory);
                break;
            case 'use_zone':
                if (zone === 'oro' || zone === 'reclutamiento') {
                    wsService.useZone(selectedTerritory);
                }
                break;
        }
    };

    return (
        <div
            className="modern-panel absolute z-50 slide-in"
            style={position}
        >
            <h3 className="modern-panel-header text-base mb-3 border-b border-[#2a2a3e] pb-2">
                {territory?.name || selectedTerritory}
            </h3>

            {/* Propietario */}
            <div className="mb-3">
                <p className="text-sm text-[#b0b0b0] mb-1">Propietario:</p>
                <p className={`font-bold ${isMine ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>
                    {isMine ? 'Tu Clan' : (ownerPlayer ? `Clan Enemigo` : 'Neutral')}
                </p>
            </div>

            {/* Zona Especial */}
            {zone && (
                <div className="mb-3">
                    <p className="text-sm text-[#b0b0b0] mb-1">Zona:</p>
                    <p className="font-bold text-[#ffd700] capitalize">{zone}</p>
                </div>
            )}

            {/* Tropas */}
            <div className="mb-3">
                <p className="text-sm text-[#b0b0b0] mb-2">Tropas:</p>
                <div className="space-y-1">
                    {Object.entries(troops).map(([rank, count]: [string, any]) => (
                        count > 0 && (
                            <div key={rank} className="flex items-center justify-between text-sm">
                                <span className="text-[#b0b0b0]">{UNIT_NAMES[rank]}:</span>
                                <span className="font-bold text-[#00d4ff]">{count}</span>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Acciones rápidas (solo si es territorio propio) */}
            {isMine && gameState.phase !== 'fortify' && (
                <div className="border-t border-[#2a2a3e] pt-3 space-y-2">
                    <button
                        onClick={() => handleQuickAction('reinforce')}
                        className="w-full modern-button secondary text-sm py-2"
                    >
                        <span>🛡️</span>
                        <span>Reforzar</span>
                    </button>
                    <button
                        onClick={() => handleQuickAction('consolidate')}
                        className="w-full modern-button secondary text-sm py-2"
                    >
                        <span>⚔️</span>
                        <span>Consolidar</span>
                    </button>
                    {zone && (zone === 'oro' || zone === 'reclutamiento') && (
                        <button
                            onClick={() => handleQuickAction('use_zone')}
                            className="w-full modern-button text-sm py-2"
                        >
                            <span>✨</span>
                            <span>Usar Zona</span>
                        </button>
                    )}
                </div>
            )}

            {/* Indicadores de acción en curso */}
            {(attackFrom === selectedTerritory || fortifyFrom === selectedTerritory) && (
                <div className="mt-3 p-2 bg-[#0a0a0f] rounded border border-[#ffaa00]">
                    <p className="text-xs text-[#ffaa00]">
                        {attackFrom === selectedTerritory ? '⚔️ Origen de ataque' : '🛡️ Origen de fortificación'}
                    </p>
                </div>
            )}
        </div>
    );
}

