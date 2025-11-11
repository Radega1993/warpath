import { useState, useEffect } from 'react';
import { wsService } from '../services/websocket.service';

export default function ConnectionStatus() {
    const [isConnected, setIsConnected] = useState(true);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    useEffect(() => {
        // Verificar estado inicial
        const checkConnection = () => {
            const connected = wsService.isConnected();
            setIsConnected(connected);
        };

        checkConnection();

        // Escuchar eventos de conexión/desconexión
        const handleConnectionError = (event: CustomEvent) => {
            setIsConnected(false);
            setIsReconnecting(false);
            setNotificationMessage('Error de conexión. Por favor, recarga la página.');
            setShowNotification(true);
        };

        // Escuchar eventos de reconexión
        const handleReconnectAttempt = () => {
            setIsReconnecting(true);
            setIsConnected(false);
            setReconnectAttempts(prev => prev + 1);
            setNotificationMessage(`Reconectando... (intento ${reconnectAttempts + 1})`);
            setShowNotification(true);
        };

        // Escuchar eventos de conexión exitosa
        const handleConnection = () => {
            setIsConnected(true);
            setIsReconnecting(false);
            setReconnectAttempts(0);
            setNotificationMessage('Conexión restaurada');
            setShowNotification(true);
            // Ocultar notificación después de 3 segundos
            setTimeout(() => setShowNotification(false), 3000);
        };

        // Verificar conexión periódicamente
        const interval = setInterval(checkConnection, 2000);

        // Escuchar eventos personalizados
        window.addEventListener('warpath:connection_error', handleConnectionError as EventListener);

        // Usar eventos de socket.io directamente
        const gameSocket = (wsService as any).gameSocket;
        const lobbySocket = (wsService as any).lobbySocket;

        const setupSocketListeners = (socket: any, socketName: string) => {
            if (!socket) return;

            socket.on('reconnect_attempt', (attemptNumber: number) => {
                setIsReconnecting(true);
                setIsConnected(false);
                setReconnectAttempts(attemptNumber);
                setNotificationMessage(`Reconectando ${socketName}... (intento ${attemptNumber})`);
                setShowNotification(true);
            });

            socket.on('connect', () => {
                setIsConnected(true);
                setIsReconnecting(false);
                setReconnectAttempts(0);
                setNotificationMessage(`${socketName} conectado`);
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000);
            });

            socket.on('disconnect', (reason: string) => {
                if (reason !== 'io client disconnect') { // No es desconexión manual
                    setIsConnected(false);
                    setIsReconnecting(true);
                    setNotificationMessage(`${socketName} desconectado. Reconectando...`);
                    setShowNotification(true);
                }
            });
        };

        setupSocketListeners(gameSocket, 'Juego');
        setupSocketListeners(lobbySocket, 'Lobby');

        return () => {
            clearInterval(interval);
            window.removeEventListener('warpath:connection_error', handleConnectionError as EventListener);
            // Los listeners de socket.io se limpian automáticamente cuando el socket se desconecta
        };
    }, [reconnectAttempts]);

    // Si está conectado y no hay notificación, no mostrar nada
    if (isConnected && !showNotification) {
        return null;
    }

    // Si está desconectado (no reconectando), mostrar modal centrado
    if (!isConnected && !isReconnecting) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-[#1a1a2e] border-4 border-red-600 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 text-center">
                    <div className="mb-6">
                        <span className="text-6xl mb-4 block">❌</span>
                        <h2 className="text-2xl font-bold text-red-400 mb-2">Conexión Perdida</h2>
                        <p className="text-gray-300 mb-4">
                            Se ha perdido la conexión con el servidor. Por favor, recarga la página para reconectar.
                        </p>
                        {notificationMessage && (
                            <p className="text-sm text-gray-400 mb-6">{notificationMessage}</p>
                        )}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-lg"
                    >
                        🔄 Recargar Página
                    </button>
                </div>
            </div>
        );
    }

    // Si está reconectando o hay una notificación de conexión, mostrar notificación en esquina
    return (
        <div className="fixed top-4 right-4 z-50">
            <div
                className={`
                    px-4 py-3 rounded-lg shadow-lg border-2 flex items-center gap-3
                    ${isConnected
                        ? 'bg-green-900/90 border-green-600 text-green-100'
                        : 'bg-yellow-900/90 border-yellow-600 text-yellow-100'
                    }
                    slide-in
                `}
            >
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <span className="text-xl">✅</span>
                    ) : (
                        <span className="text-xl animate-spin">🔄</span>
                    )}
                    <div>
                        <p className="font-semibold text-sm">
                            {isConnected ? 'Conectado' : 'Reconectando'}
                        </p>
                        {notificationMessage && (
                            <p className="text-xs opacity-90">{notificationMessage}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

