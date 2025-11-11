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
        <div className="min-h-screen bg-[#0a0a0f] p-8 relative overflow-hidden">
            <div className="max-w-4xl mx-auto relative z-10">
                <h1 className="font-['Orbitron'] text-5xl text-center mb-8 text-[#00d4ff] font-bold">
                    🏰 LOBBY
                </h1>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Create Room */}
                    <div className="modern-panel p-6 slide-in">
                        <h2 className="modern-panel-header text-2xl mb-4">Crear Sala</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium font-['Orbitron'] mb-2 text-[#00d4ff] uppercase tracking-wider">
                                    Modo
                                </label>
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value)}
                                    className="modern-input w-full"
                                >
                                    <option value="standard">Estándar</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium font-['Orbitron'] mb-2 text-[#00d4ff] uppercase tracking-wider">
                                    Máximo de jugadores
                                </label>
                                <select
                                    value={maxPlayers}
                                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                                    className="modern-input w-full"
                                >
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                </select>
                            </div>

                            <button
                                onClick={handleCreateRoom}
                                className="w-full modern-button"
                            >
                                <span className="text-3xl">🏰</span>
                                <span>Crear Sala</span>
                            </button>
                        </div>
                    </div>

                    {/* Join Room */}
                    <div className="modern-panel p-6 slide-in">
                        <h2 className="modern-panel-header text-2xl mb-4">Unirse a Sala</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium font-['Orbitron'] mb-2 text-[#00d4ff] uppercase tracking-wider">
                                    ID de Sala
                                </label>
                                <input
                                    type="text"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                                    className="modern-input w-full"
                                    placeholder="Ingresa el ID de la sala"
                                />
                            </div>

                            <button
                                onClick={handleJoinRoom}
                                className="w-full modern-button secondary"
                            >
                                <span className="text-3xl">🚪</span>
                                <span>Unirse</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

