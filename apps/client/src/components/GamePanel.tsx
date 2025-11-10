import { useGameStore } from '../store/gameStore';
import { wsService } from '../services/websocket.service';

export default function GamePanel() {
    const { gameState, selectedTerritory, setSelectedTerritory, userId } = useGameStore();

    if (!gameState) {
        return (
            <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                <p className="text-gray-400">Esperando inicio de partida...</p>
            </div>
        );
    }

    const handleDeploy = () => {
        if (!selectedTerritory) {
            alert('Selecciona un territorio primero');
            return;
        }

        // Simple deployment - 1 warrior
        wsService.place({
            territoryId: selectedTerritory,
            units: { d6: 1 },
        });

        setSelectedTerritory(null);
    };

    const handleEndTurn = () => {
        if (confirm('¿Terminar turno?')) {
            wsService.endTurn();
        }
    };

    // Verificar si es el turno del jugador actual
    const isMyTurn = gameState.currentPlayerId && userId 
        ? gameState.currentPlayerId === userId 
        : false;

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-6">
            {/* Turn Info */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Turno {gameState.turn}</h2>
                <div className="text-sm text-gray-400 mb-2">
                    Fase: <span className="text-yellow-400 font-bold">{gameState.phase}</span>
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

            {/* Actions */}
            <div className="space-y-2">
                <button
                    onClick={handleDeploy}
                    disabled={!selectedTerritory || gameState.phase !== 'deploy'}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Desplegar Tropas
                </button>

                <button
                    onClick={handleEndTurn}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Terminar Turno
                </button>
            </div>

            {/* Selected Territory */}
            {selectedTerritory && (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-300">
                        Territorio seleccionado: <span className="text-yellow-400 font-bold">{selectedTerritory}</span>
                    </p>
                </div>
            )}

            {/* Paths */}
            <div>
                <h3 className="text-lg font-bold text-white mb-2">Caminos</h3>
                <div className="space-y-1">
                    {Object.entries(gameState.paths || {}).map(([path, level]) => (
                        <div key={path} className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">{path}:</span>
                            <span className="text-yellow-400 font-bold">N{level}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

