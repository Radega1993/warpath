import { io, Socket } from 'socket.io-client';
import {
    CreateRoomDto,
    JoinRoomDto,
    PickFactionDto,
    PickHeroDto,
    PlaceDto,
    AttackDto,
    FortifyDto,
    UpgradePathDto,
    GameState,
    RoomState,
    CombatResult,
} from '../types';
import { getWebSocketURL } from '../config/env';

class WebSocketService {
    private authSocket: Socket | null = null;
    private lobbySocket: Socket | null = null;
    private gameSocket: Socket | null = null;
    private reconnectAttempts: Map<string, number> = new Map();
    private maxReconnectAttempts = 10;
    private reconnectDelay = 1000; // 1 segundo inicial
    private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private isManualDisconnect: Map<string, boolean> = new Map();
    private connectionCallbacks: Map<string, Array<() => void>> = new Map();

    // Auth namespace
    connectAuth() {
        if (this.authSocket?.connected) return this.authSocket;

        const socketKey = 'auth';
        this.isManualDisconnect.set(socketKey, false);
        this.reconnectAttempts.set(socketKey, 0);

        this.authSocket = io(getWebSocketURL(), {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: this.reconnectDelay,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.authSocket.on('connect', () => {
            console.log('✅ Connected to auth namespace');
            this.reconnectAttempts.set(socketKey, 0);
            this.clearReconnectTimeout(socketKey);
            this.notifyConnection(socketKey);
        });

        this.authSocket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from auth namespace:', reason);
            if (!this.isManualDisconnect.get(socketKey)) {
                this.handleReconnect(socketKey, () => this.connectAuth());
            }
        });

        this.authSocket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Reconnecting to auth namespace (attempt ${attemptNumber})...`);
        });

        this.authSocket.on('reconnect_failed', () => {
            console.error('❌ Failed to reconnect to auth namespace after all attempts');
            this.notifyConnectionError(socketKey);
        });

        return this.authSocket;
    }

    // Lobby namespace
    connectLobby() {
        if (this.lobbySocket?.connected) return this.lobbySocket;

        const socketKey = 'lobby';
        this.isManualDisconnect.set(socketKey, false);
        this.reconnectAttempts.set(socketKey, 0);

        // Obtener userId del store si está disponible
        const storeUserId = this.getUserIdFromStore();

        this.lobbySocket = io(getWebSocketURL('lobby'), {
            transports: ['websocket'],
            query: storeUserId ? { userId: storeUserId } : undefined,
            reconnection: true,
            reconnectionDelay: this.reconnectDelay,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.lobbySocket.on('connect', () => {
            console.log('✅ Connected to lobby namespace');
            this.reconnectAttempts.set(socketKey, 0);
            this.clearReconnectTimeout(socketKey);
            this.notifyConnection(socketKey);
        });

        this.lobbySocket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from lobby namespace:', reason);
            if (!this.isManualDisconnect.get(socketKey)) {
                this.handleReconnect(socketKey, () => {
                    // Reconectar con el mismo userId
                    const currentUserId = this.getUserIdFromStore();
                    this.lobbySocket = io(getWebSocketURL('lobby'), {
                        transports: ['websocket'],
                        query: currentUserId ? { userId: currentUserId } : undefined,
                        reconnection: true,
                        reconnectionDelay: this.reconnectDelay,
                        reconnectionDelayMax: 5000,
                        reconnectionAttempts: this.maxReconnectAttempts,
                    });
                    this.setupLobbyListeners();
                });
            }
        });

        this.lobbySocket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Reconnecting to lobby namespace (attempt ${attemptNumber})...`);
        });

        this.lobbySocket.on('reconnect_failed', () => {
            console.error('❌ Failed to reconnect to lobby namespace after all attempts');
            this.notifyConnectionError(socketKey);
        });

        this.setupLobbyListeners();

        return this.lobbySocket;
    }

    private setupLobbyListeners() {
        if (!this.lobbySocket) return;

        // Re-registrar listeners de eventos del lobby si es necesario
        // Los listeners ya están registrados en los componentes que usan onRoomUpdate, etc.
    }

    private getUserIdFromStore(): string | null {
        // Intentar obtener userId del store usando una función helper
        // Esto es un workaround ya que no podemos importar directamente el store aquí
        try {
            const store = (window as any).__WARPATH_STORE__;
            return store?.getState?.()?.userId || null;
        } catch {
            return null;
        }
    }

    setUserId(_userId: string) {
        // Método mantenido para compatibilidad, pero userId se obtiene del store
    }

    // Game namespace
    connectGame(roomId: string) {
        const socketKey = `game-${roomId}`;

        // Si ya está conectado al mismo room, no hacer nada
        if (this.gameSocket?.connected && this.gameSocket.nsp.name === `/room/${roomId}`) {
            return this.gameSocket;
        }

        // Desconectar socket anterior si existe
        if (this.gameSocket) {
            this.isManualDisconnect.set(socketKey, true);
            this.gameSocket.disconnect();
        }

        this.isManualDisconnect.set(socketKey, false);
        this.reconnectAttempts.set(socketKey, 0);

        // Obtener userId del store si está disponible
        const storeUserId = this.getUserIdFromStore();

        this.gameSocket = io(getWebSocketURL(`room/${roomId}`), {
            transports: ['websocket'],
            query: storeUserId ? { userId: storeUserId } : undefined,
            reconnection: true,
            reconnectionDelay: this.reconnectDelay,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.gameSocket.on('connect', () => {
            console.log(`✅ Connected to game namespace: /room/${roomId}`);
            this.reconnectAttempts.set(socketKey, 0);
            this.clearReconnectTimeout(socketKey);
            this.notifyConnection(socketKey);
            // El servidor enviará automáticamente el game_state al conectar
        });

        this.gameSocket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from game namespace:', reason);
            if (!this.isManualDisconnect.get(socketKey)) {
                this.handleReconnect(socketKey, () => {
                    // Reconectar con el mismo userId y roomId
                    const currentUserId = this.getUserIdFromStore();
                    this.gameSocket = io(getWebSocketURL(`room/${roomId}`), {
                        transports: ['websocket'],
                        query: currentUserId ? { userId: currentUserId } : undefined,
                        reconnection: true,
                        reconnectionDelay: this.reconnectDelay,
                        reconnectionDelayMax: 5000,
                        reconnectionAttempts: this.maxReconnectAttempts,
                    });
                    this.setupGameListeners(roomId);
                });
            }
        });

        this.gameSocket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Reconnecting to game namespace (attempt ${attemptNumber})...`);
        });

        this.gameSocket.on('reconnect_failed', () => {
            console.error('❌ Failed to reconnect to game namespace after all attempts');
            this.notifyConnectionError(socketKey);
        });

        this.setupGameListeners(roomId);

        return this.gameSocket;
    }

    private setupGameListeners(roomId: string) {
        if (!this.gameSocket) return;

        // Re-registrar listeners de eventos del juego si es necesario
        // Los listeners ya están registrados en los componentes que usan onGameState, etc.
    }

    // Lobby events
    createRoom(data: CreateRoomDto): Promise<RoomState> {
        return new Promise((resolve, reject) => {
            if (!this.lobbySocket) {
                this.connectLobby();
            }

            // Escuchar el evento room_created
            const onRoomCreated = (response: { roomId: string }) => {
                console.log('[WebSocket] room_created received:', response);
                // Una vez que recibimos el roomId, esperamos el room_update
                const onRoomUpdate = (room: RoomState) => {
                    console.log('[WebSocket] room_update received:', room);
                    this.lobbySocket!.off('room_created', onRoomCreated);
                    this.lobbySocket!.off('room_update', onRoomUpdate);
                    resolve(room);
                };

                this.lobbySocket!.once('room_update', onRoomUpdate);
            };

            this.lobbySocket!.once('room_created', onRoomCreated);

            this.lobbySocket!.once('error', (error) => {
                reject(error);
            });

            // Emitir el evento create_room
            this.lobbySocket!.emit('create_room', data);
        });
    }

    joinRoom(data: JoinRoomDto): Promise<RoomState> {
        return new Promise((resolve, reject) => {
            if (!this.lobbySocket) {
                this.connectLobby();
            }

            // Escuchar el evento room_update después de unirse
            const onRoomUpdate = (room: RoomState) => {
                console.log('[WebSocket] join_room - room_update received:', room);
                // Asegurar que el room tenga el id correcto
                if (data.roomId && (!room.id || room.id === 'undefined')) {
                    room.id = data.roomId;
                }
                this.lobbySocket!.off('room_update', onRoomUpdate);
                this.lobbySocket!.off('error', onError);
                resolve(room);
            };

            const onError = (error: { code: string; message: string }) => {
                this.lobbySocket!.off('room_update', onRoomUpdate);
                this.lobbySocket!.off('error', onError);
                reject(error);
            };

            this.lobbySocket!.once('room_update', onRoomUpdate);
            this.lobbySocket!.once('error', onError);

            // Emitir el evento join_room
            this.lobbySocket!.emit('join_room', data);
        });
    }

    pickFaction(data: PickFactionDto) {
        if (!this.lobbySocket) return;
        this.lobbySocket.emit('pick_faction', data);
    }

    pickHero(data: PickHeroDto) {
        if (!this.lobbySocket) return;
        this.lobbySocket.emit('pick_hero', data);
    }

    setReady(ready: boolean) {
        if (!this.lobbySocket) return;
        this.lobbySocket.emit('set_ready', { ready });
    }

    startMatch() {
        if (!this.lobbySocket) return;
        this.lobbySocket.emit('start_match');
    }

    // Game events
    place(data: PlaceDto) {
        if (!this.gameSocket) return;
        this.gameSocket.emit('place', data);
    }

    attack(data: AttackDto) {
        if (!this.gameSocket) return;
        this.gameSocket.emit('attack', data);
    }

    fortify(data: FortifyDto) {
        if (!this.gameSocket) return;
        this.gameSocket.emit('fortify', data);
    }

    upgradePath(data: UpgradePathDto) {
        if (!this.gameSocket) return;
        this.gameSocket.emit('upgrade_path', data);
    }

    move(data: { movements: Array<{ fromId: string; toId: string; units: Record<string, number> }> }) {
        if (!this.gameSocket) return;
        this.gameSocket.emit('move', data);
    }

    reinforce(territoryId: string) {
        if (!this.gameSocket) return;
        this.gameSocket.emit('reinforce', { territoryId });
    }

    useZone(territoryId: string) {
        if (!this.gameSocket) return;
        this.gameSocket.emit('use_zone', { territoryId });
    }

    consolidate(territoryId: string) {
        if (!this.gameSocket) return;
        this.gameSocket.emit('consolidate', { territoryId });
    }

    endTurn() {
        if (!this.gameSocket) return;
        this.gameSocket.emit('end_turn');
    }

    // Event listeners
    onRoomUpdate(callback: (room: RoomState) => void) {
        if (!this.lobbySocket) return;
        this.lobbySocket.on('room_update', callback);
    }

    onGameState(callback: (state: GameState) => void) {
        if (!this.gameSocket) return;
        this.gameSocket.on('game_state', callback);
    }

    onCombatResult(callback: (result: CombatResult) => void) {
        if (!this.gameSocket) return;
        this.gameSocket.on('combat_result', callback);
    }

    onEconomyUpdate(callback: (data: { goldChange: number; reason: string }) => void) {
        if (!this.gameSocket) return;
        this.gameSocket.on('economy_update', callback);
    }

    onTimerTick(callback: (data: { secondsLeft: number }) => void) {
        if (!this.gameSocket) return;
        this.gameSocket.on('timer_tick', callback);
    }

    onGameOver(callback: (data: { winnerId: string; stats: any }) => void) {
        if (!this.gameSocket) return;
        this.gameSocket.on('game_over', callback);
    }

    onError(callback: (error: { code: string; message: string }) => void) {
        if (this.lobbySocket) {
            this.lobbySocket.on('error', callback);
        }
        if (this.gameSocket) {
            this.gameSocket.on('error', callback);
        }
    }

    // Reconexión helpers
    private handleReconnect(socketKey: string, reconnectFn: () => void) {
        const attempts = this.reconnectAttempts.get(socketKey) || 0;

        if (attempts >= this.maxReconnectAttempts) {
            console.error(`❌ Max reconnection attempts reached for ${socketKey}`);
            this.notifyConnectionError(socketKey);
            return;
        }

        this.reconnectAttempts.set(socketKey, attempts + 1);
        const delay = Math.min(this.reconnectDelay * Math.pow(2, attempts), 5000);

        console.log(`🔄 Attempting to reconnect ${socketKey} in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);

        const timeout = setTimeout(() => {
            this.reconnectTimeouts.delete(socketKey);
            reconnectFn();
        }, delay);

        this.reconnectTimeouts.set(socketKey, timeout);
    }

    private clearReconnectTimeout(socketKey: string) {
        const timeout = this.reconnectTimeouts.get(socketKey);
        if (timeout) {
            clearTimeout(timeout);
            this.reconnectTimeouts.delete(socketKey);
        }
    }

    private notifyConnection(socketKey: string) {
        const callbacks = this.connectionCallbacks.get(socketKey) || [];
        callbacks.forEach(cb => cb());
    }

    private notifyConnectionError(socketKey: string) {
        // Emitir evento personalizado para que los componentes puedan escuchar
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('warpath:connection_error', {
                detail: { socketKey }
            }));
        }
    }

    // Registrar callbacks de conexión
    onConnection(socketKey: string, callback: () => void) {
        if (!this.connectionCallbacks.has(socketKey)) {
            this.connectionCallbacks.set(socketKey, []);
        }
        this.connectionCallbacks.get(socketKey)!.push(callback);
    }

    // Cleanup
    disconnect() {
        // Marcar como desconexión manual
        this.isManualDisconnect.set('auth', true);
        this.isManualDisconnect.set('lobby', true);
        if (this.gameSocket) {
            const roomId = this.gameSocket.nsp.name.replace('/room/', '');
            this.isManualDisconnect.set(`game-${roomId}`, true);
        }

        // Limpiar timeouts de reconexión
        this.reconnectTimeouts.forEach(timeout => clearTimeout(timeout));
        this.reconnectTimeouts.clear();

        if (this.authSocket) {
            this.authSocket.disconnect();
            this.authSocket = null;
        }
        if (this.lobbySocket) {
            this.lobbySocket.disconnect();
            this.lobbySocket = null;
        }
        if (this.gameSocket) {
            this.gameSocket.disconnect();
            this.gameSocket = null;
        }
    }

    // Verificar estado de conexión
    isConnected(socketKey?: string): boolean {
        if (socketKey === 'auth') return this.authSocket?.connected || false;
        if (socketKey === 'lobby') return this.lobbySocket?.connected || false;
        if (socketKey?.startsWith('game-')) {
            const roomId = socketKey.replace('game-', '');
            return this.gameSocket?.connected && this.gameSocket.nsp.name === `/room/${roomId}` || false;
        }
        return (this.authSocket?.connected || false) &&
            (this.lobbySocket?.connected || false) &&
            (this.gameSocket?.connected || false);
    }
}

export const wsService = new WebSocketService();

