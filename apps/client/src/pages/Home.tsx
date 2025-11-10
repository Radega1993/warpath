import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wsService } from '../services/websocket.service';
import { useGameStore } from '../store/gameStore';

export default function Home() {
    const navigate = useNavigate();
    const [handle, setHandle] = useState('');
    const { setUserId } = useGameStore();

    const handleStart = async () => {
        if (!handle.trim()) {
            alert('Por favor ingresa un nombre');
            return;
        }

        try {
            // Connect to auth namespace
            const authSocket = wsService.connectAuth();

            if (authSocket) {
                authSocket.on('connect', () => {
                    console.log('✅ Connected to auth namespace');
                });

                // Escuchar el evento user_authenticated para obtener el userId
                authSocket.on('user_authenticated', (data: { userId: string }) => {
                    console.log('✅ User authenticated:', data.userId);
                    setUserId(data.userId);
                    // Guardar userId en el servicio WebSocket también
                    wsService.setUserId(data.userId);
                    navigate('/lobby');
                });
            }
        } catch (error) {
            console.error('Error connecting:', error);
            alert('Error al conectar con el servidor');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-4xl font-bold text-center mb-2 text-yellow-400">
                    Warpath
                </h1>
                <p className="text-center text-gray-400 mb-8">
                    4X-lite Territorial
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nombre de jugador
                        </label>
                        <input
                            type="text"
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            placeholder="Ingresa tu nombre"
                            maxLength={20}
                        />
                    </div>

                    <button
                        onClick={handleStart}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        Comenzar
                    </button>
                </div>

                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>MVP - Semana 3</p>
                </div>
            </div>
        </div>
    );
}

