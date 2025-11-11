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
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="modern-panel p-8 w-full max-w-md slide-in">
                <h1 className="font-['Orbitron'] text-5xl text-center mb-2 text-[#00d4ff] font-bold">
                    ⚔️ WARPATH
                </h1>
                <p className="text-center text-[#b0b0b0] mb-8 italic font-['Rajdhani']">
                    4X-lite Territorial
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium font-['Orbitron'] mb-2 text-[#00d4ff] uppercase tracking-wider">
                            Nombre de jugador
                        </label>
                        <input
                            type="text"
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                            className="modern-input w-full"
                            placeholder="Ingresa tu nombre"
                            maxLength={20}
                        />
                    </div>

                    <button
                        onClick={handleStart}
                        className="w-full modern-button"
                    >
                        <span className="text-3xl">🎮</span>
                        <span>Comenzar como Invitado</span>
                    </button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-[#2a2a3e]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#1a1a2e] text-[#b0b0b0]">o</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/login')}
                        className="w-full modern-button secondary"
                    >
                        <span className="text-3xl">🔐</span>
                        <span>Iniciar Sesión / Registrarse</span>
                    </button>
                </div>

                <div className="mt-8 text-center text-sm text-[#707070] italic font-['Rajdhani']">
                    <p>MVP - Semana 3</p>
                </div>
            </div>
        </div>
    );
}

