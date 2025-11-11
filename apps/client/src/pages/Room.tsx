import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { wsService } from '../services/websocket.service';
import { useGameStore } from '../store/gameStore';
import { RoomState } from '../types';

const RACES = [
    { id: 'HUMAN', name: 'Humano' },
    { id: 'ORC', name: 'Orco' },
    { id: 'ELF', name: 'Elfo' },
    { id: 'DWARF', name: 'Enano' },
];


export default function Room() {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { currentRoom, setCurrentRoom, userId, setError } = useGameStore();
    const [selectedRace, setSelectedRace] = useState<string>('');

    useEffect(() => {
        if (!roomId) return;

        // Connect to lobby if not already connected
        const lobbySocket = wsService.connectLobby();

        // Escuchar el evento user_authenticated para obtener el userId si no lo tenemos
        if (lobbySocket) {
            lobbySocket.on('user_authenticated', (data: { userId: string }) => {
                console.log('[Room] user_authenticated received:', data.userId);
                const { setUserId } = useGameStore.getState();
                const currentUserId = useGameStore.getState().userId;
                if (!currentUserId || currentUserId !== data.userId) {
                    setUserId(data.userId);
                    wsService.setUserId(data.userId);
                }
            });
        }

        // Listen for room updates
        wsService.onRoomUpdate((room: RoomState) => {
            console.log('[Room] room_update received:', room);
            // Asegurar que el room tenga el id del parámetro si no lo tiene o es undefined
            if (roomId && (!room.id || room.id === 'undefined')) {
                room.id = roomId;
            }
            setCurrentRoom(room);
            if (room.status === 'in_progress') {
                // Connect to game namespace
                wsService.connectGame(room.id);
                navigate(`/game/${room.id}`);
            }
        });

        // Listen for errors
        wsService.onError((error) => {
            setError(error.message);
            alert(error.message);
        });
    }, [roomId, navigate, setCurrentRoom, setError]);

    const handlePickFaction = () => {
        if (!selectedRace) {
            alert('Por favor selecciona una raza');
            return;
        }
        wsService.pickFaction({ raceId: selectedRace });
    };

    const handleSetReady = (ready: boolean) => {
        wsService.setReady(ready);
    };

    const handleStartMatch = () => {
        wsService.startMatch();
    };

    const currentPlayer = currentRoom?.players.find((p) => p.userId === userId);
    const allReady = currentRoom?.players.every((p) => p.ready && p.raceId);
    const isCreator = currentRoom?.creatorId === userId;
    const hasEnoughPlayers = (currentRoom?.players.length || 0) >= 2;
    const canStart = isCreator && allReady && hasEnoughPlayers && currentRoom?.players.length === currentRoom?.maxPlayers;

    // Debug logs
    console.log('[Room] Debug:', {
        userId,
        creatorId: currentRoom?.creatorId,
        isCreator,
        allReady,
        hasEnoughPlayers,
        playersCount: currentRoom?.players.length,
        maxPlayers: currentRoom?.maxPlayers,
        canStart,
    });

    return (
        <div className="min-h-screen bg-[#0a0a0f] p-8 relative overflow-hidden">
            <div className="max-w-6xl mx-auto relative z-10">
                <h1 className="font-['Orbitron'] text-4xl text-center mb-8 text-[#00d4ff] font-bold">
                    🏰 SALA: {roomId || currentRoom?.id || 'Cargando...'}
                </h1>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Player Selection */}
                    <div className="modern-panel p-6 slide-in">
                        <h2 className="modern-panel-header text-2xl mb-4">Tu Selección</h2>

                        <div className="space-y-6">
                            {/* Race Selection */}
                            <div>
                                <label className="block text-sm font-medium font-['Orbitron'] mb-2 text-[#00d4ff] uppercase tracking-wider">
                                    Raza
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {RACES.map((race) => (
                                        <button
                                            key={race.id}
                                            onClick={() => setSelectedRace(race.id)}
                                            className={`px-4 py-2 rounded-lg transition-colors font-['Rajdhani'] ${selectedRace === race.id
                                                ? 'modern-button active'
                                                : 'modern-button secondary'
                                                }`}
                                        >
                                            {race.name}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handlePickFaction}
                                    disabled={!selectedRace || currentPlayer?.raceId === selectedRace}
                                    className="mt-2 w-full modern-button disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="text-3xl">⚔️</span>
                                    <span>Seleccionar Raza</span>
                                </button>
                            </div>

                            {/* Botón de Ready */}
                            {currentPlayer?.raceId && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => handleSetReady(!currentPlayer?.ready)}
                                        className={`w-full modern-button ${currentPlayer?.ready ? 'success' : ''}`}
                                    >
                                        {currentPlayer?.ready ? '✓ Listo' : 'Marcar como Listo'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Players List */}
                    <div className="modern-panel p-6 slide-in">
                        <h2 className="modern-panel-header text-2xl mb-4">
                            Jugadores ({currentRoom?.players.length || 0}/{currentRoom?.maxPlayers || 0})
                        </h2>

                        <div className="space-y-3">
                            {currentRoom?.players.map((player) => (
                                <div
                                    key={player.userId}
                                    className={`p-4 rounded-lg border-2 ${player.userId === userId
                                        ? 'bg-[#ffd700]/20 border-[#ffd700]'
                                        : 'bg-[#050508] border-[#2a2a3e]'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold font-['Orbitron'] text-[#00d4ff]">{player.handle}</span>
                                        {player.ready && (
                                            <span className="text-[#00ff88] text-sm">✓ Listo</span>
                                        )}
                                    </div>
                                    {player.raceId && (
                                        <div className="text-sm text-[#b0b0b0] mt-1 font-['Rajdhani']">
                                            Raza: {RACES.find((r) => r.id === player.raceId)?.name || player.raceId}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Botón de Iniciar Partida - siempre visible pero deshabilitado si no se cumplen condiciones */}
                        <div className="mt-6">
                            {isCreator ? (
                                <button
                                    onClick={handleStartMatch}
                                    disabled={!canStart}
                                    className="w-full modern-button success disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="text-3xl">{canStart ? '⚔️' : '⏳'}</span>
                                    <span>{canStart ? 'Iniciar Partida' : 'Esperando...'}</span>
                                </button>
                            ) : (
                                <div className="w-full bg-[#050508] text-[#b0b0b0] text-center py-3 px-4 rounded-lg border-2 border-[#2a2a3e] font-['Rajdhani']">
                                    Solo el creador de la sala puede iniciar la partida
                                </div>
                            )}

                            {/* Información de estado */}
                            {isCreator && !canStart && (
                                <div className="mt-2 text-sm text-[#b0b0b0] space-y-1 font-['Rajdhani']">
                                    {!allReady && (
                                        <div>⏳ Esperando que todos los jugadores seleccionen su raza</div>
                                    )}
                                    {!hasEnoughPlayers && (
                                        <div>⏳ Esperando más jugadores (mínimo 2)</div>
                                    )}
                                    {allReady && hasEnoughPlayers && currentRoom?.players.length !== currentRoom?.maxPlayers && (
                                        <div>⏳ Esperando que se complete la sala ({currentRoom?.players.length}/{currentRoom?.maxPlayers})</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

