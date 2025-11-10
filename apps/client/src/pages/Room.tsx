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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8 text-yellow-400">
                    Sala: {roomId || currentRoom?.id || 'Cargando...'}
                </h1>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Player Selection */}
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                        <h2 className="text-2xl font-bold mb-4 text-white">Tu Selección</h2>

                        <div className="space-y-6">
                            {/* Race Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Raza
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {RACES.map((race) => (
                                        <button
                                            key={race.id}
                                            onClick={() => setSelectedRace(race.id)}
                                            className={`px-4 py-2 rounded-lg transition-colors ${selectedRace === race.id
                                                ? 'bg-yellow-500 text-gray-900'
                                                : 'bg-gray-700 text-white hover:bg-gray-600'
                                                }`}
                                        >
                                            {race.name}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handlePickFaction}
                                    disabled={!selectedRace || currentPlayer?.raceId === selectedRace}
                                    className="mt-2 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Seleccionar Raza
                                </button>
                            </div>

                            {/* Botón de Ready */}
                            {currentPlayer?.raceId && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => handleSetReady(!currentPlayer?.ready)}
                                        className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${currentPlayer?.ready
                                            ? 'bg-green-500 hover:bg-green-600 text-white'
                                            : 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                                            }`}
                                    >
                                        {currentPlayer?.ready ? '✓ Listo' : 'Marcar como Listo'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Players List */}
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                        <h2 className="text-2xl font-bold mb-4 text-white">
                            Jugadores ({currentRoom?.players.length || 0}/{currentRoom?.maxPlayers || 0})
                        </h2>

                        <div className="space-y-3">
                            {currentRoom?.players.map((player) => (
                                <div
                                    key={player.userId}
                                    className={`p-4 rounded-lg ${player.userId === userId ? 'bg-yellow-500/20 border-2 border-yellow-500' : 'bg-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-white">{player.handle}</span>
                                        {player.ready && (
                                            <span className="text-green-400 text-sm">✓ Listo</span>
                                        )}
                                    </div>
                                    {player.raceId && (
                                        <div className="text-sm text-gray-300 mt-1">
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
                                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                                >
                                    {canStart ? 'Iniciar Partida' : 'Esperando...'}
                                </button>
                            ) : (
                                <div className="w-full bg-gray-700 text-gray-400 text-center py-3 px-4 rounded-lg">
                                    Solo el creador de la sala puede iniciar la partida
                                </div>
                            )}

                            {/* Información de estado */}
                            {isCreator && !canStart && (
                                <div className="mt-2 text-sm text-gray-400 space-y-1">
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

