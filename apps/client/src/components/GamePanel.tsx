import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { wsService } from '../services/websocket.service';
import { configService } from '../services/config.service';
import { mapData } from '@warpath/shared';

// Costes de unidades por defecto (fallback)
const DEFAULT_UNIT_COSTS: Record<string, number> = {
    d4: 150,   // Explorador
    d6: 250,   // Guerrero
    d8: 300,   // Élite
    d12: 350,  // Héroe
    d20: 1000, // Jefe
    d100: 5000, // Leyenda
};

const UNIT_NAMES: Record<string, string> = {
    d4: 'Explorador',
    d6: 'Guerrero',
    d8: 'Élite',
    d12: 'Héroe',
    d20: 'Jefe',
    d100: 'Leyenda',
};

export default function GamePanel() {
    const { gameState, selectedTerritory, setSelectedTerritory, userId, attackFrom, setAttackFrom, fortifyFrom, setFortifyFrom } = useGameStore();
    const [selectedUnits, setSelectedUnits] = useState<Record<string, number>>({
        d4: 0, d6: 0, d8: 0, d12: 0, d20: 0, d100: 0,
    });
    const [unitCosts, setUnitCosts] = useState<Record<string, number>>(DEFAULT_UNIT_COSTS);

    // Estado para la acción "Mover"
    const [moveFrom, setMoveFrom] = useState<string | null>(null);
    const [moveDestinations, setMoveDestinations] = useState<Array<{ territoryId: string; units: Record<string, number> }>>([]);
    const [isMoveMode, setIsMoveMode] = useState(false);

    // Cargar configuración al montar el componente
    useEffect(() => {
        configService.getConfig().then(config => {
            if (config.unitCosts) {
                // Mapear de formato BD (explorer, warrior, etc.) a formato UI (d4, d6, etc.)
                const costs: Record<string, number> = {
                    d4: config.unitCosts.explorer || DEFAULT_UNIT_COSTS.d4,
                    d6: config.unitCosts.warrior || DEFAULT_UNIT_COSTS.d6,
                    d8: config.unitCosts.elite || DEFAULT_UNIT_COSTS.d8,
                    d12: config.unitCosts.hero || DEFAULT_UNIT_COSTS.d12,
                    d20: config.unitCosts.chief || DEFAULT_UNIT_COSTS.d20,
                    d100: config.unitCosts.legend || DEFAULT_UNIT_COSTS.d100,
                };
                setUnitCosts(costs);
            }
        }).catch(err => {
            console.warn('Error loading config, using defaults:', err);
        });
    }, []);

    if (!gameState) {
        return (
            <div className="modern-panel">
                <p className="text-[#b0b0b0]">Esperando inicio de partida...</p>
            </div>
        );
    }

    // Verificar si es el turno del jugador actual
    const isMyTurn = gameState.currentPlayerId && userId
        ? gameState.currentPlayerId === userId
        : false;

    // Obtener información del territorio seleccionado
    const selectedTerritoryInfo = selectedTerritory ? {
        name: mapData.territories.find((t: any) => t.id === selectedTerritory)?.name || selectedTerritory,
        owner: gameState.owners[selectedTerritory],
        troops: gameState.troopsByTerritory[selectedTerritory] || {},
        isMine: gameState.owners[selectedTerritory] === userId,
        zone: gameState.zones?.[selectedTerritory],
    } : null;

    // Calcular coste total de unidades seleccionadas
    const totalCost = Object.entries(selectedUnits).reduce((sum, [rank, count]) => {
        return sum + (unitCosts[rank] || 0) * count;
    }, 0);

    const handleUnitChange = (rank: string, delta: number) => {
        setSelectedUnits(prev => ({
            ...prev,
            [rank]: Math.max(0, (prev[rank] || 0) + delta),
        }));
    };

    const handleDeploy = () => {
        if (!selectedTerritory || !selectedTerritoryInfo?.isMine) {
            alert('Selecciona un territorio propio primero');
            return;
        }

        if (totalCost > gameState.gold) {
            alert('No tienes suficiente oro');
            return;
        }

        // Filtrar unidades con count > 0
        const unitsToDeploy: Record<string, number> = {};
        Object.entries(selectedUnits).forEach(([rank, count]) => {
            if (count > 0) {
                unitsToDeploy[rank] = count;
            }
        });

        if (Object.keys(unitsToDeploy).length === 0) {
            alert('Selecciona al menos una unidad');
            return;
        }

        wsService.place({
            territoryId: selectedTerritory,
            units: unitsToDeploy,
        });

        // Reset
        setSelectedUnits({ d4: 0, d6: 0, d8: 0, d12: 0, d20: 0, d100: 0 });
        setSelectedTerritory(null);
    };

    const handleAttack = () => {
        if (!attackFrom || !selectedTerritory) {
            alert('Selecciona territorio origen y destino');
            return;
        }

        if (attackFrom === selectedTerritory) {
            alert('No puedes atacar tu propio territorio');
            return;
        }

        // Filtrar unidades con count > 0
        const unitsToCommit: Record<string, number> = {};
        Object.entries(selectedUnits).forEach(([rank, count]) => {
            if (count > 0) {
                unitsToCommit[rank] = count;
            }
        });

        if (Object.keys(unitsToCommit).length === 0) {
            alert('Selecciona al menos una unidad para atacar');
            return;
        }

        wsService.attack({
            fromId: attackFrom,
            toId: selectedTerritory,
            commit: unitsToCommit,
        });

        // Reset
        setSelectedUnits({ d4: 0, d6: 0, d8: 0, d12: 0, d20: 0, d100: 0 });
        setAttackFrom(null);
        setSelectedTerritory(null);
    };

    const handleFortify = () => {
        if (!fortifyFrom || !selectedTerritory) {
            alert('Selecciona territorio origen y destino');
            return;
        }

        if (fortifyFrom === selectedTerritory) {
            alert('Selecciona territorios diferentes');
            return;
        }

        // Filtrar unidades con count > 0
        const unitsToMove: Record<string, number> = {};
        Object.entries(selectedUnits).forEach(([rank, count]) => {
            if (count > 0) {
                unitsToMove[rank] = count;
            }
        });

        if (Object.keys(unitsToMove).length === 0) {
            alert('Selecciona al menos una unidad para mover');
            return;
        }

        wsService.fortify({
            fromId: fortifyFrom,
            toId: selectedTerritory,
            units: unitsToMove,
        });

        // Reset
        setSelectedUnits({ d4: 0, d6: 0, d8: 0, d12: 0, d20: 0, d100: 0 });
        setFortifyFrom(null);
        setSelectedTerritory(null);
    };

    const handleUpgradePath = (pathId: string) => {
        wsService.upgradePath({ pathId });
    };

    const handleReinforce = () => {
        if (!selectedTerritory || !selectedTerritoryInfo?.isMine) {
            alert('Selecciona un territorio propio para reforzar');
            return;
        }
        wsService.reinforce(selectedTerritory);
        setSelectedTerritory(null);
    };

    const handleUseZone = () => {
        if (!selectedTerritory || !selectedTerritoryInfo?.isMine) {
            alert('Selecciona un territorio propio con zona especial');
            return;
        }
        wsService.useZone(selectedTerritory);
        setSelectedTerritory(null);
    };

    const handleConsolidate = () => {
        if (!selectedTerritory || !selectedTerritoryInfo?.isMine) {
            alert('Selecciona un territorio propio para consolidar');
            return;
        }
        wsService.consolidate(selectedTerritory);
        setSelectedTerritory(null);
    };

    const handleStartMove = () => {
        if (!selectedTerritory || !selectedTerritoryInfo?.isMine) {
            alert('Selecciona un territorio propio para mover tropas');
            return;
        }
        setMoveFrom(selectedTerritory);
        setIsMoveMode(true);
        setMoveDestinations([]);
        setSelectedTerritory(null);
    };

    const handleAddMoveDestination = () => {
        if (!selectedTerritory || !selectedTerritoryInfo?.isMine) {
            alert('Selecciona un territorio propio como destino');
            return;
        }
        if (moveDestinations.length >= 4) {
            alert('Máximo 4 territorios destino');
            return;
        }
        if (moveDestinations.some(d => d.territoryId === selectedTerritory)) {
            alert('Este territorio ya está seleccionado como destino');
            return;
        }
        if (selectedTerritory === moveFrom) {
            alert('No puedes mover al mismo territorio de origen');
            return;
        }
        setMoveDestinations([...moveDestinations, {
            territoryId: selectedTerritory,
            units: { d4: 0, d6: 0, d8: 0, d12: 0, d20: 0, d100: 0 }
        }]);
        setSelectedTerritory(null);
    };

    const handleUpdateMoveDestinationUnits = (destIndex: number, rank: string, delta: number) => {
        setMoveDestinations(prev => {
            const newDests = [...prev];
            const currentUnits = newDests[destIndex].units[rank] || 0;
            newDests[destIndex].units[rank] = Math.max(0, currentUnits + delta);
            return newDests;
        });
    };

    const handleExecuteMove = () => {
        if (!moveFrom) {
            alert('Error: no hay territorio de origen');
            return;
        }
        if (moveDestinations.length === 0) {
            alert('Selecciona al menos un territorio destino');
            return;
        }

        // Validar que hay tropas asignadas
        const hasUnits = moveDestinations.some(dest =>
            Object.values(dest.units).some(count => count > 0)
        );
        if (!hasUnits) {
            alert('Asigna tropas a al menos un territorio destino');
            return;
        }

        // Obtener tropas totales del territorio origen
        const originTroops = gameState.troopsByTerritory[moveFrom] || {};
        const totalAssigned: Record<string, number> = {};

        // Calcular total de tropas asignadas
        moveDestinations.forEach(dest => {
            Object.entries(dest.units).forEach(([rank, count]) => {
                totalAssigned[rank] = (totalAssigned[rank] || 0) + count;
            });
        });

        // Validar que no se asignen más tropas de las disponibles
        for (const rank of Object.keys(totalAssigned)) {
            if (totalAssigned[rank] > (originTroops[rank] || 0)) {
                alert(`No tienes suficientes ${UNIT_NAMES[rank]} en el territorio origen`);
                return;
            }
        }

        // Preparar movimientos
        const movements = moveDestinations
            .filter(dest => Object.values(dest.units).some(count => count > 0))
            .map(dest => ({
                fromId: moveFrom,
                toId: dest.territoryId,
                units: dest.units
            }));

        wsService.move({ movements });

        // Reset
        setMoveFrom(null);
        setMoveDestinations([]);
        setIsMoveMode(false);
        setSelectedTerritory(null);
    };

    const handleCancelMove = () => {
        setMoveFrom(null);
        setMoveDestinations([]);
        setIsMoveMode(false);
        setSelectedTerritory(null);
    };

    const handleEndTurn = () => {
        if (confirm('¿Terminar turno?')) {
            wsService.endTurn();
        }
    };

    const resetSelection = () => {
        setSelectedUnits({ d4: 0, d6: 0, d8: 0, d12: 0, d20: 0, d100: 0 });
        setAttackFrom(null);
        setFortifyFrom(null);
        setSelectedTerritory(null);
        if (isMoveMode) {
            handleCancelMove();
        }
    };

    // Obtener información del jugador actual
    const currentPlayer = gameState.players
        ? Object.values(gameState.players).find((p: any) => p.userId === userId)
        : null;

    return (
        <div className="modern-panel space-y-3 h-full overflow-y-auto slide-in">
            {/* Turn Info */}
            <div className="border-b border-[#2a2a3e] pb-2 flex-shrink-0">
                <h2 className="modern-panel-header text-base mb-1">Turno {gameState.turn}</h2>
                <div className="text-sm text-[#b0b0b0] mb-1">
                    Fase: <span className="text-[#00d4ff] font-bold capitalize">{gameState.phase}</span>
                </div>
                {isMyTurn ? (
                    <div className="text-sm text-[#00ff88] font-bold flex items-center gap-1">
                        <span>✓</span> <span>Es tu turno</span>
                    </div>
                ) : (
                    <div className="text-sm text-[#707070]">
                        Esperando turno de otro jugador...
                    </div>
                )}
            </div>

            {/* Resources */}
            <div className="space-y-2 border-b border-[#2a2a3e] pb-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <span className="text-[#b0b0b0] flex items-center gap-2 font-semibold text-sm">
                        <span>💰</span> Oro
                    </span>
                    <span className="text-[#ffd700] font-bold text-lg">{(currentPlayer as any)?.gold || gameState.gold || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[#b0b0b0] flex items-center gap-2 font-semibold text-sm">
                        <span>⚡</span> Acciones
                    </span>
                    <span className="text-[#00d4ff] font-bold text-lg">{gameState.actionsLeft || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[#b0b0b0] flex items-center gap-2 font-semibold text-sm">
                        <span>⏳</span> Tiempo
                    </span>
                    <span className="text-[#ffaa00] font-bold text-lg font-mono">
                        {gameState.timers?.turnSecondsLeft
                            ? `${Math.floor(gameState.timers.turnSecondsLeft / 60)}:${(gameState.timers.turnSecondsLeft % 60).toString().padStart(2, '0')}`
                            : '--:--'
                        }
                    </span>
                </div>
            </div>

            {/* Selected Territory Info */}
            {selectedTerritoryInfo && !isMoveMode && (
                <div className="p-3 bg-[#0a0a0f] rounded-lg border border-[#2a2a3e] flex-shrink-0">
                    <p className="text-sm font-bold text-[#00d4ff] mb-2">{selectedTerritoryInfo.name}</p>
                    <div className="text-xs text-[#b0b0b0] space-y-1">
                        <div className="flex items-center gap-2">
                            <span>Propietario:</span>
                            <span className={`font-bold ${selectedTerritoryInfo.isMine ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>
                                {selectedTerritoryInfo.isMine ? 'Tú' : 'Enemigo'}
                            </span>
                        </div>
                        {selectedTerritoryInfo.zone && (
                            <div className="flex items-center gap-2">
                                <span>Zona:</span>
                                <span className="text-[#ffd700] font-bold capitalize">{selectedTerritoryInfo.zone}</span>
                            </div>
                        )}
                        <div className="mt-2">
                            <div className="text-xs font-semibold mb-1">Tropas:</div>
                            <div className="ml-2 space-y-0.5">
                                {Object.entries(selectedTerritoryInfo.troops).map(([rank, count]: [string, any]) => (
                                    count > 0 && (
                                        <div key={rank} className="flex justify-between text-xs">
                                            <span className="text-[#b0b0b0]">{UNIT_NAMES[rank]}:</span>
                                            <span className="font-bold text-[#00d4ff]">{count}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Mode Info */}
            {isMoveMode && selectedTerritoryInfo && (
                <div className="p-3 bg-[#0a0a0f] rounded-lg border border-[#00d4ff]">
                    <p className="text-sm font-bold text-[#00d4ff] mb-2">
                        {selectedTerritoryInfo.isMine
                            ? `✅ Territorio destino: ${selectedTerritoryInfo.name}`
                            : `❌ ${selectedTerritoryInfo.name} no es tuyo`}
                    </p>
                    {selectedTerritoryInfo.isMine && moveDestinations.length < 4 && (
                        <button
                            onClick={handleAddMoveDestination}
                            className="w-full modern-button text-sm py-2 px-3 mt-2"
                        >
                            + Añadir como Destino
                        </button>
                    )}
                </div>
            )}

            {/* Phase-specific actions */}
            {isMyTurn && (
                <>
                    {/* DEPLOY Phase */}
                    {gameState.phase === 'deploy' && (
                        <div className="space-y-4">
                            <h3 className="modern-panel-header text-sm">Acciones de Despliegue</h3>

                            {/* Acciones rápidas en territorio propio */}
                            {selectedTerritoryInfo?.isMine && (
                                <div className="space-y-2 p-3 bg-[#0a0a0f] rounded-lg border border-[#2a2a3e]">
                                    <p className="text-xs text-[#b0b0b0] mb-2">Acciones especiales:</p>
                                    <button
                                        onClick={handleReinforce}
                                        className="w-full modern-button secondary text-sm py-2"
                                    >
                                        <span>🛡️</span>
                                        <span>Reforzar (+1 eficacia defensa)</span>
                                    </button>
                                    <button
                                        onClick={handleConsolidate}
                                        className="w-full modern-button secondary text-sm py-2"
                                    >
                                        <span>⚔️</span>
                                        <span>Consolidar (+2 dados defensa)</span>
                                    </button>
                                    {selectedTerritoryInfo.zone && (selectedTerritoryInfo.zone === 'oro' || selectedTerritoryInfo.zone === 'reclutamiento') && (
                                        <button
                                            onClick={handleUseZone}
                                            className="w-full modern-button text-sm py-2"
                                        >
                                            <span>✨</span>
                                            <span>Utilizar Zona</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            <h3 className="text-sm text-[#b0b0b0] font-semibold mb-2">Desplegar Tropas</h3>

                            {/* Unit Selector */}
                            <div className="space-y-2">
                                {Object.entries(unitCosts).map(([rank, cost]) => (
                                    <div key={rank} className="flex items-center justify-between p-2 bg-[#0a0a0f] rounded border border-[#2a2a3e]">
                                        <div className="flex-1">
                                            <div className="text-sm text-[#ffffff]">{UNIT_NAMES[rank]}</div>
                                            <div className="text-xs text-[#b0b0b0]">{cost} oro</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUnitChange(rank, -1)}
                                                disabled={!selectedUnits[rank] || selectedUnits[rank] === 0}
                                                className="w-8 h-8 bg-[#ff4444] hover:bg-[#cc0000] disabled:bg-[#2a2a3e] disabled:cursor-not-allowed text-white rounded transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center text-[#ffffff] font-bold">
                                                {selectedUnits[rank] || 0}
                                            </span>
                                            <button
                                                onClick={() => handleUnitChange(rank, 1)}
                                                disabled={totalCost + cost > gameState.gold}
                                                className="w-8 h-8 bg-[#00ff88] hover:bg-[#00cc66] disabled:bg-[#2a2a3e] disabled:cursor-not-allowed text-[#0a0a0f] rounded transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between p-2 bg-[#0a0a0f] rounded border border-[#2a2a3e]">
                                <span className="text-[#ffffff] font-bold">Total:</span>
                                <span className={`font-bold ${totalCost > gameState.gold ? 'text-[#ff4444]' : 'text-[#ffd700]'}`}>
                                    {totalCost} oro
                                </span>
                            </div>

                            <button
                                onClick={handleDeploy}
                                disabled={!selectedTerritoryInfo?.isMine || totalCost === 0 || totalCost > gameState.gold}
                                className="w-full modern-button disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-2xl">🏰</span>
                                <span>Desplegar</span>
                            </button>
                        </div>
                    )}

                    {/* ATTACK Phase */}
                    {gameState.phase === 'attack' && (
                        <div className="space-y-4">
                            <h3 className="modern-panel-header text-sm">Acciones de Ataque</h3>

                            {/* Acciones rápidas en territorio propio */}
                            {selectedTerritoryInfo?.isMine && (
                                <div className="space-y-2 p-3 bg-[#0a0a0f] rounded-lg border border-[#2a2a3e]">
                                    <p className="text-xs text-[#b0b0b0] mb-2">Acciones especiales:</p>
                                    <button
                                        onClick={handleReinforce}
                                        className="w-full modern-button secondary text-sm py-2"
                                    >
                                        <span>🛡️</span>
                                        <span>Reforzar (+1 eficacia defensa)</span>
                                    </button>
                                    <button
                                        onClick={handleConsolidate}
                                        className="w-full modern-button secondary text-sm py-2"
                                    >
                                        <span>⚔️</span>
                                        <span>Consolidar (+2 dados defensa)</span>
                                    </button>
                                    {selectedTerritoryInfo.zone && (selectedTerritoryInfo.zone === 'oro' || selectedTerritoryInfo.zone === 'reclutamiento') && (
                                        <button
                                            onClick={handleUseZone}
                                            className="w-full modern-button text-sm py-2"
                                        >
                                            <span>✨</span>
                                            <span>Utilizar Zona</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            <h3 className="text-sm text-[#b0b0b0] font-semibold mb-2">Atacar</h3>

                            {!attackFrom ? (
                                <div className="p-3 bg-[#0a0a0f] rounded-lg border border-[#ffaa00]">
                                    <p className="text-sm text-[#ffaa00]">Selecciona tu territorio de origen en el mapa</p>
                                </div>
                            ) : (
                                <div className="p-3 bg-[#0a0a0f] rounded-lg border border-[#2a2a3e]">
                                    <p className="text-sm text-[#ffffff]">Origen: <span className="font-bold text-[#00d4ff]">{mapData.territories.find((t: any) => t.id === attackFrom)?.name || attackFrom}</span></p>
                                    <p className="text-xs text-[#b0b0b0] mt-1">Ahora selecciona el territorio enemigo a atacar</p>
                                </div>
                            )}

                            {/* Unit Selector */}
                            <div className="space-y-2">
                                {Object.entries(unitCosts).map(([rank]) => (
                                    <div key={rank} className="flex items-center justify-between p-2 bg-[#0a0a0f] rounded border border-[#2a2a3e]">
                                        <div className="flex-1">
                                            <div className="text-sm text-[#ffffff]">{UNIT_NAMES[rank]}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUnitChange(rank, -1)}
                                                disabled={!selectedUnits[rank] || selectedUnits[rank] === 0}
                                                className="w-8 h-8 bg-[#ff4444] hover:bg-[#cc0000] disabled:bg-[#2a2a3e] disabled:cursor-not-allowed text-white rounded transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center text-[#ffffff] font-bold">
                                                {selectedUnits[rank] || 0}
                                            </span>
                                            <button
                                                onClick={() => handleUnitChange(rank, 1)}
                                                className="w-8 h-8 bg-[#00ff88] hover:bg-[#00cc66] text-[#0a0a0f] rounded transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleAttack}
                                disabled={!attackFrom || !selectedTerritory || attackFrom === selectedTerritory || Object.values(selectedUnits).every(v => v === 0)}
                                className="w-full modern-button danger disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-2xl">⚔️</span>
                                <span>Atacar</span>
                            </button>
                        </div>
                    )}

                    {/* FORTIFY Phase */}
                    {gameState.phase === 'fortify' && (
                        <div className="space-y-4">
                            <h3 className="modern-panel-header text-sm">Acciones de Fortificación</h3>

                            {/* Botón para activar modo Mover */}
                            {!isMoveMode && (
                                <button
                                    onClick={handleStartMove}
                                    className="w-full modern-button secondary"
                                >
                                    <span>🚚</span>
                                    <span>Mover Tropas (hasta 4 territorios)</span>
                                </button>
                            )}

                            {/* Modo Mover */}
                            {isMoveMode && moveFrom && (
                                <div className="space-y-4 p-3 bg-[#0a0a0f] rounded-lg border border-[#2a2a3e]">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-md font-bold text-[#00d4ff]">Mover Tropas</h4>
                                        <button
                                            onClick={handleCancelMove}
                                            className="text-xs modern-button danger py-1 px-2"
                                        >
                                            Cancelar
                                        </button>
                                    </div>

                                    <div className="text-xs text-[#b0b0b0] mb-2">
                                        Origen: <span className="font-bold text-[#ffd700]">
                                            {mapData.territories.find((t: any) => t.id === moveFrom)?.name || moveFrom}
                                        </span>
                                    </div>

                                    {/* Tropas disponibles en origen */}
                                    <div className="text-xs text-[#b0b0b0] mb-2">
                                        Tropas disponibles:
                                        {Object.entries(gameState.troopsByTerritory[moveFrom] || {}).map(([rank, count]: [string, any]) => (
                                            count > 0 && (
                                                <span key={rank} className="ml-2">
                                                    {UNIT_NAMES[rank]}: <span className="font-bold text-[#00d4ff]">{count}</span>
                                                </span>
                                            )
                                        ))}
                                    </div>

                                    {/* Destinos seleccionados */}
                                    {moveDestinations.length > 0 && (
                                        <div className="space-y-3">
                                            {moveDestinations.map((dest, index) => {
                                                const destInfo = mapData.territories.find((t: any) => t.id === dest.territoryId);
                                                return (
                                                    <div key={index} className="p-2 bg-[#1a1a2e] rounded border border-[#2a2a3e]">
                                                        <div className="text-xs text-[#ffffff] font-bold mb-2">
                                                            Destino {index + 1}: {destInfo?.name || dest.territoryId}
                                                        </div>
                                                        <div className="space-y-1">
                                                            {Object.entries(unitCosts).map(([rank]) => {
                                                                const originCount = gameState.troopsByTerritory[moveFrom]?.[rank] || 0;
                                                                const assignedToOthers = moveDestinations
                                                                    .filter((_, i) => i !== index)
                                                                    .reduce((sum, d) => sum + (d.units[rank] || 0), 0);
                                                                const available = originCount - assignedToOthers;
                                                                const current = dest.units[rank] || 0;

                                                                return (
                                                                    <div key={rank} className="flex items-center justify-between text-xs">
                                                                        <span className="text-[#b0b0b0]">{UNIT_NAMES[rank]}:</span>
                                                                        <div className="flex items-center gap-1">
                                                                            <button
                                                                                onClick={() => handleUpdateMoveDestinationUnits(index, rank, -1)}
                                                                                disabled={current === 0}
                                                                                className="w-6 h-6 bg-[#ff4444] hover:bg-[#cc0000] disabled:bg-[#2a2a3e] disabled:cursor-not-allowed text-white rounded text-xs transition-colors"
                                                                            >
                                                                                -
                                                                            </button>
                                                                            <span className="w-8 text-center text-[#ffffff] font-bold">
                                                                                {current}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => handleUpdateMoveDestinationUnits(index, rank, 1)}
                                                                                disabled={current >= available}
                                                                                className="w-6 h-6 bg-[#00ff88] hover:bg-[#00cc66] disabled:bg-[#2a2a3e] disabled:cursor-not-allowed text-[#0a0a0f] rounded text-xs transition-colors"
                                                                            >
                                                                                +
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Botón para añadir destino */}
                                    {moveDestinations.length < 4 && (
                                        <button
                                            onClick={handleAddMoveDestination}
                                            className="w-full modern-button text-sm py-2"
                                        >
                                            <span>+</span>
                                            <span>Añadir Territorio Destino ({moveDestinations.length}/4)</span>
                                        </button>
                                    )}

                                    {/* Botón para ejecutar movimiento */}
                                    <button
                                        onClick={handleExecuteMove}
                                        disabled={moveDestinations.length === 0}
                                        className="w-full modern-button success disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span>✅</span>
                                        <span>Ejecutar Movimiento (1 acción)</span>
                                    </button>
                                </div>
                            )}

                            <h3 className="text-sm text-[#b0b0b0] font-semibold mb-2">Fortificar</h3>

                            {!fortifyFrom ? (
                                <div className="p-3 bg-[#0a0a0f] rounded-lg border border-[#00d4ff]">
                                    <p className="text-sm text-[#00d4ff]">Selecciona tu territorio de origen en el mapa</p>
                                </div>
                            ) : (
                                <div className="p-3 bg-[#0a0a0f] rounded-lg border border-[#2a2a3e]">
                                    <p className="text-sm text-[#ffffff]">Origen: <span className="font-bold text-[#00d4ff]">{mapData.territories.find((t: any) => t.id === fortifyFrom)?.name || fortifyFrom}</span></p>
                                    <p className="text-xs text-[#b0b0b0] mt-1">Ahora selecciona el territorio destino</p>
                                </div>
                            )}

                            {/* Unit Selector */}
                            <div className="space-y-2">
                                {Object.entries(unitCosts).map(([rank]) => (
                                    <div key={rank} className="flex items-center justify-between p-2 bg-[#0a0a0f] rounded border border-[#2a2a3e]">
                                        <div className="flex-1">
                                            <div className="text-sm text-[#ffffff]">{UNIT_NAMES[rank]}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUnitChange(rank, -1)}
                                                disabled={!selectedUnits[rank] || selectedUnits[rank] === 0}
                                                className="w-8 h-8 bg-[#ff4444] hover:bg-[#cc0000] disabled:bg-[#2a2a3e] disabled:cursor-not-allowed text-white rounded transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center text-[#ffffff] font-bold">
                                                {selectedUnits[rank] || 0}
                                            </span>
                                            <button
                                                onClick={() => handleUnitChange(rank, 1)}
                                                className="w-8 h-8 bg-[#00ff88] hover:bg-[#00cc66] text-[#0a0a0f] rounded transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleFortify}
                                disabled={!fortifyFrom || !selectedTerritory || fortifyFrom === selectedTerritory || Object.values(selectedUnits).every(v => v === 0)}
                                className="w-full modern-button secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-2xl">🛡️</span>
                                <span>Fortificar</span>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Paths */}
            <div className="flex-shrink-0">
                <h3 className="modern-panel-header text-sm mb-2">Caminos</h3>
                <div className="space-y-1">
                    {Object.entries(gameState.paths || {}).map(([path, level]) => (
                        <div key={path} className="flex items-center justify-between p-1 bg-[#0a0a0f] rounded border border-[#2a2a3e]">
                            <div>
                                <span className="text-xs text-[#b0b0b0]">{path}:</span>
                                <span className="ml-1 text-[#ffd700] font-bold text-xs">N{level}</span>
                            </div>
                            {isMyTurn && level < 3 && (
                                <button
                                    onClick={() => handleUpgradePath(path)}
                                    className="px-2 py-0.5 modern-button secondary text-xs"
                                >
                                    ↑
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* End Turn */}
            {isMyTurn && (
                <button
                    onClick={handleEndTurn}
                    className="w-full modern-button success text-xs py-2 flex-shrink-0"
                >
                    <span>⏳</span>
                    <span>Fin Turno</span>
                </button>
            )}

            {/* Reset Selection */}
            {(attackFrom || fortifyFrom || selectedTerritory || isMoveMode) && (
                <button
                    onClick={resetSelection}
                    className="w-full modern-button secondary"
                >
                    <span>{isMoveMode ? '❌' : '↩️'}</span>
                    <span>{isMoveMode ? 'Cancelar Movimiento' : 'Cancelar Selección'}</span>
                </button>
            )}
        </div>
    );
}

