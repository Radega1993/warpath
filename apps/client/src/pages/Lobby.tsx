import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wsService } from '../services/websocket.service';
import { useGameStore } from '../store/gameStore';
import { RoomState } from '../types';

export default function Lobby() {
    const navigate = useNavigate();
    const { setCurrentRoom, setError } = useGameStore();
    const [roomId, setRoomId] = useState('');
    const [mode, setMode] = useState('standard');
    const [maxPlayers, setMaxPlayers] = useState(2);

    useEffect(() => {
        // Connect to lobby
        const lobbySocket = wsService.connectLobby();

        // Escuchar el evento user_authenticated para obtener el userId si no lo tenemos
        if (lobbySocket) {
            lobbySocket.on('user_authenticated', (data: { userId: string }) => {
                console.log('[Lobby] user_authenticated received:', data.userId);
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

        return () => {
            // Cleanup on unmount
        };
    }, [navigate, setCurrentRoom, setError]);

    const handleCreateRoom = async () => {
        try {
            console.log('[Lobby] Creating room with:', { mode, maxPlayers });
            const room = await wsService.createRoom({ mode, maxPlayers });
            console.log('[Lobby] Room created:', room);
            setCurrentRoom(room);
            navigate(`/room/${room.id}`);
        } catch (error: any) {
            console.error('[Lobby] Error creating room:', error);
            setError(error.message);
            alert('Error al crear sala: ' + error.message);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomId.trim()) {
            alert('Por favor ingresa un ID de sala');
            return;
        }

        try {
            const room = await wsService.joinRoom({
                roomId,
                handle: 'Player', // TODO: Get from store
            });
            setCurrentRoom(room);
            navigate(`/room/${room.id}`);
        } catch (error: any) {
            setError(error.message);
            alert('Error al unirse a la sala: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8 text-yellow-400">
                    Lobby
                </h1>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Create Room */}
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                        <h2 className="text-2xl font-bold mb-4 text-white">Crear Sala</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Modo
                                </label>
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                >
                                    <option value="standard">Estándar</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Máximo de jugadores
                                </label>
                                <select
                                    value={maxPlayers}
                                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                >
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                </select>
                            </div>

                            <button
                                onClick={handleCreateRoom}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                Crear Sala
                            </button>
                        </div>
                    </div>

                    {/* Join Room */}
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                        <h2 className="text-2xl font-bold mb-4 text-white">Unirse a Sala</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    ID de Sala
                                </label>
                                <input
                                    type="text"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    placeholder="Ingresa el ID de la sala"
                                />
                            </div>

                            <button
                                onClick={handleJoinRoom}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                Unirse
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

