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
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <p className="text-[#00d4ff] font-['Orbitron']">Cargando resultados...</p>
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
        <div className="min-h-screen bg-[#0a0a0f] p-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="font-['Orbitron'] text-4xl font-bold text-center mb-8 text-[#ffd700]">
                    🏆 RESULTADOS DE LA PARTIDA
                </h1>

                {/* Resultado del jugador */}
                <div className={`mb-8 p-6 rounded-lg ${isWinner ? 'bg-[#00ff88]/20 border-2 border-[#00ff88]' : 'bg-[#ff4444]/20 border-2 border-[#ff4444]'}`}>
                    <h2 className={`text-2xl font-bold text-center font-['Orbitron'] ${isWinner ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>
                        {isWinner ? '🎉 ¡Victoria!' : '💀 Derrota'}
                    </h2>
                    <p className="text-center text-[#b0b0b0] mt-2 font-['Rajdhani']">
                        Turno final: {gameState.turn}
                    </p>
                </div>

                {/* Estadísticas de jugadores */}
                <div className="modern-panel p-6 mb-6">
                    <h3 className="modern-panel-header text-xl mb-4">Clasificación</h3>
                    <div className="space-y-3">
                        {playerStats.map((stat, index) => {
                            const isCurrentPlayer = stat.userId === userId;
                            const isThisWinner = stat.userId === winnerId;

                            return (
                                <div
                                    key={stat.userId}
                                    className={`p-4 rounded-lg flex items-center justify-between ${isThisWinner ? 'bg-[#ffd700]/20 border border-[#ffd700]' :
                                        isCurrentPlayer ? 'bg-[#00d4ff]/20 border border-[#00d4ff]' :
                                            'bg-[#050508] border border-[#2a2a3e]'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-['Orbitron'] ${index === 0 ? 'bg-[#ffd700] text-[#0a0a0f]' :
                                            index === 1 ? 'bg-[#b0b0b0] text-[#0a0a0f]' :
                                                index === 2 ? 'bg-[#ffaa00] text-white' :
                                                    'bg-[#2a2a3e] text-white'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className={`font-bold font-['Orbitron'] ${isCurrentPlayer ? 'text-[#00d4ff]' : 'text-white'}`}>
                                                Jugador {stat.playerId}
                                                {isCurrentPlayer && ' (Tú)'}
                                                {isThisWinner && ' 👑'}
                                            </p>
                                            <p className="text-sm text-[#b0b0b0] font-['Rajdhani']">
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
                        className="modern-button"
                    >
                        🏰 Volver al Lobby
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="modern-button secondary"
                    >
                        🏠 Ir al Inicio
                    </button>
                </div>
            </div>
        </div>
    );
}

