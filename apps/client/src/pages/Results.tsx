import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export default function Results() {
    const navigate = useNavigate();
    const { gameState, userId } = useGameStore();

    // Si no hay gameState, redirigir al lobby
    useEffect(() => {
        if (!gameState) {
            navigate('/lobby');
        }
    }, [gameState, navigate]);

    if (!gameState) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <p className="text-gray-400">Cargando resultados...</p>
            </div>
        );
    }

    // Determinar ganador (simplificado: el jugador con más territorios)
    const getWinner = () => {
        const territoryCounts: Record<string, number> = {};
        Object.values(gameState.owners).forEach((ownerId) => {
            territoryCounts[ownerId] = (territoryCounts[ownerId] || 0) + 1;
        });

        let maxCount = 0;
        let winnerId: string | null = null;
        Object.entries(territoryCounts).forEach(([id, count]) => {
            if (count > maxCount) {
                maxCount = count;
                winnerId = id;
            }
        });

        return winnerId;
    };

    const winnerId = getWinner();
    const isWinner = winnerId === userId;

    // Calcular estadísticas por jugador
    const getPlayerStats = () => {
        const players = gameState.players || {};
        const stats: Array<{
            userId: string;
            playerId: string;
            territories: number;
            totalTroops: number;
        }> = [];

        Object.entries(players).forEach(([playerId, data]: [string, any]) => {
            const ownerId = data.userId;
            const territories = Object.values(gameState.owners).filter((id) => id === ownerId).length;

            let totalTroops = 0;
            Object.values(gameState.troopsByTerritory).forEach((troops: any) => {
                Object.values(troops).forEach((count: any) => {
                    totalTroops += count || 0;
                });
            });

            stats.push({
                userId: ownerId,
                playerId,
                territories,
                totalTroops,
            });
        });

        return stats.sort((a, b) => b.territories - a.territories);
    };

    const playerStats = getPlayerStats();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8 text-yellow-400">
                    Resultados de la Partida
                </h1>

                {/* Resultado del jugador */}
                <div className={`mb-8 p-6 rounded-lg ${isWinner ? 'bg-green-900/30 border-2 border-green-500' : 'bg-red-900/30 border-2 border-red-500'}`}>
                    <h2 className={`text-2xl font-bold text-center ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                        {isWinner ? '🎉 ¡Victoria!' : '💀 Derrota'}
                    </h2>
                    <p className="text-center text-gray-300 mt-2">
                        Turno final: {gameState.turn}
                    </p>
                </div>

                {/* Estadísticas de jugadores */}
                <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-white mb-4">Clasificación</h3>
                    <div className="space-y-3">
                        {playerStats.map((stat, index) => {
                            const isCurrentPlayer = stat.userId === userId;
                            const isThisWinner = stat.userId === winnerId;

                            return (
                                <div
                                    key={stat.userId}
                                    className={`p-4 rounded-lg flex items-center justify-between ${isThisWinner ? 'bg-yellow-900/30 border border-yellow-600' :
                                            isCurrentPlayer ? 'bg-blue-900/30 border border-blue-600' :
                                                'bg-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500 text-gray-900' :
                                                index === 1 ? 'bg-gray-400 text-gray-900' :
                                                    index === 2 ? 'bg-orange-600 text-white' :
                                                        'bg-gray-600 text-white'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className={`font-bold ${isCurrentPlayer ? 'text-blue-400' : 'text-white'}`}>
                                                Jugador {stat.playerId}
                                                {isCurrentPlayer && ' (Tú)'}
                                                {isThisWinner && ' 👑'}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {stat.territories} territorios • {stat.totalTroops} tropas
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => navigate('/lobby')}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
                    >
                        Volver al Lobby
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                    >
                        Ir al Inicio
                    </button>
                </div>
            </div>
        </div>
    );
}

