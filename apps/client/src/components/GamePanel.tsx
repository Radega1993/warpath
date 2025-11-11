import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { wsService } from '../services/websocket.service';
import { mapData } from '@warpath/shared';

// Costes de unidades
const UNIT_COSTS: Record<string, number> = {
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

    if (!gameState) {
        return (
            <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                <p className="text-gray-400">Esperando inicio de partida...</p>
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
    } : null;

    // Calcular coste total de unidades seleccionadas
    const totalCost = Object.entries(selectedUnits).reduce((sum, [rank, count]) => {
        return sum + (UNIT_COSTS[rank] || 0) * count;
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
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
            {/* Turn Info */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Turno {gameState.turn}</h2>
                <div className="text-sm text-gray-400 mb-2">
                    Fase: <span className="text-yellow-400 font-bold capitalize">{gameState.phase}</span>
                </div>
                {isMyTurn ? (
                    <div className="text-sm text-green-400 font-bold">
                        ✓ Es tu turno
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">
                        Esperando turno de otro jugador...
                    </div>
                )}
            </div>

            {/* Resources */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">Oro:</span>
                    <span className="text-yellow-400 font-bold text-xl">{gameState.gold}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">Acciones:</span>
                    <span className="text-blue-400 font-bold text-xl">{gameState.actionsLeft}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">Tiempo:</span>
                    <span className="text-red-400 font-bold text-xl">
                        {Math.floor(gameState.timers.turnSecondsLeft / 60)}:
                        {(gameState.timers.turnSecondsLeft % 60).toString().padStart(2, '0')}
                    </span>
                </div>
            </div>

            {/* Selected Territory Info */}
            {selectedTerritoryInfo && (
                <div className="p-3 bg-gray-700 rounded-lg">
                    <p className="text-sm font-bold text-white mb-2">{selectedTerritoryInfo.name}</p>
                    <div className="text-xs text-gray-300 space-y-1">
                        <div>Propietario: {selectedTerritoryInfo.isMine ? 'Tú' : 'Enemigo'}</div>
                        <div>Tropas:</div>
                        <div className="ml-2 space-y-0.5">
                            {Object.entries(selectedTerritoryInfo.troops).map(([rank, count]: [string, any]) => (
                                count > 0 && (
                                    <div key={rank} className="flex justify-between">
                                        <span>{UNIT_NAMES[rank]}:</span>
                                        <span className="font-bold">{count}</span>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Phase-specific actions */}
            {isMyTurn && (
                <>
                    {/* DEPLOY Phase */}
                    {gameState.phase === 'deploy' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white">Desplegar Tropas</h3>

                            {/* Unit Selector */}
                            <div className="space-y-2">
                                {Object.entries(UNIT_COSTS).map(([rank, cost]) => (
                                    <div key={rank} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                                        <div className="flex-1">
                                            <div className="text-sm text-white">{UNIT_NAMES[rank]}</div>
                                            <div className="text-xs text-gray-400">{cost} oro</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUnitChange(rank, -1)}
                                                disabled={!selectedUnits[rank] || selectedUnits[rank] === 0}
                                                className="w-8 h-8 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center text-white font-bold">
                                                {selectedUnits[rank] || 0}
                                            </span>
                                            <button
                                                onClick={() => handleUnitChange(rank, 1)}
                                                disabled={totalCost + cost > gameState.gold}
                                                className="w-8 h-8 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                                <span className="text-white font-bold">Total:</span>
                                <span className={`font-bold ${totalCost > gameState.gold ? 'text-red-400' : 'text-yellow-400'}`}>
                                    {totalCost} oro
                                </span>
                            </div>

                            <button
                                onClick={handleDeploy}
                                disabled={!selectedTerritoryInfo?.isMine || totalCost === 0 || totalCost > gameState.gold}
                                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Desplegar
                            </button>
                        </div>
                    )}

                    {/* ATTACK Phase */}
                    {gameState.phase === 'attack' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white">Atacar</h3>

                            {!attackFrom ? (
                                <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-600">
                                    <p className="text-sm text-yellow-200">Selecciona tu territorio de origen en el mapa</p>
                                </div>
                            ) : (
                                <div className="p-3 bg-gray-700 rounded-lg">
                                    <p className="text-sm text-white">Origen: <span className="font-bold">{mapData.territories.find((t: any) => t.id === attackFrom)?.name || attackFrom}</span></p>
                                    <p className="text-xs text-gray-400 mt-1">Ahora selecciona el territorio enemigo a atacar</p>
                                </div>
                            )}

                            {/* Unit Selector */}
                            <div className="space-y-2">
                                {Object.entries(UNIT_COSTS).map(([rank]) => (
                                    <div key={rank} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                                        <div className="flex-1">
                                            <div className="text-sm text-white">{UNIT_NAMES[rank]}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUnitChange(rank, -1)}
                                                disabled={!selectedUnits[rank] || selectedUnits[rank] === 0}
                                                className="w-8 h-8 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center text-white font-bold">
                                                {selectedUnits[rank] || 0}
                                            </span>
                                            <button
                                                onClick={() => handleUnitChange(rank, 1)}
                                                className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded"
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
                                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Atacar
                            </button>
                        </div>
                    )}

                    {/* FORTIFY Phase */}
                    {gameState.phase === 'fortify' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white">Fortificar</h3>

                            {!fortifyFrom ? (
                                <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-600">
                                    <p className="text-sm text-blue-200">Selecciona tu territorio de origen en el mapa</p>
                                </div>
                            ) : (
                                <div className="p-3 bg-gray-700 rounded-lg">
                                    <p className="text-sm text-white">Origen: <span className="font-bold">{mapData.territories.find((t: any) => t.id === fortifyFrom)?.name || fortifyFrom}</span></p>
                                    <p className="text-xs text-gray-400 mt-1">Ahora selecciona el territorio destino</p>
                                </div>
                            )}

                            {/* Unit Selector */}
                            <div className="space-y-2">
                                {Object.entries(UNIT_COSTS).map(([rank]) => (
                                    <div key={rank} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                                        <div className="flex-1">
                                            <div className="text-sm text-white">{UNIT_NAMES[rank]}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUnitChange(rank, -1)}
                                                disabled={!selectedUnits[rank] || selectedUnits[rank] === 0}
                                                className="w-8 h-8 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center text-white font-bold">
                                                {selectedUnits[rank] || 0}
                                            </span>
                                            <button
                                                onClick={() => handleUnitChange(rank, 1)}
                                                className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded"
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
                                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Fortificar
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Paths */}
            <div>
                <h3 className="text-lg font-bold text-white mb-2">Caminos</h3>
                <div className="space-y-2">
                    {Object.entries(gameState.paths || {}).map(([path, level]) => (
                        <div key={path} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                            <div>
                                <span className="text-sm text-gray-300">{path}:</span>
                                <span className="ml-2 text-yellow-400 font-bold">N{level}</span>
                            </div>
                            {isMyTurn && level < 3 && (
                                <button
                                    onClick={() => handleUpgradePath(path)}
                                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                                >
                                    Subir
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
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Terminar Turno
                </button>
            )}

            {/* Reset Selection */}
            {(attackFrom || fortifyFrom || selectedTerritory) && (
                <button
                    onClick={resetSelection}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Cancelar Selección
                </button>
            )}
        </div>
    );
}

