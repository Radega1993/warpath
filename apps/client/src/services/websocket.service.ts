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

class WebSocketService {
    private authSocket: Socket | null = null;
    private lobbySocket: Socket | null = null;
    private gameSocket: Socket | null = null;

    // Auth namespace
    connectAuth() {
        if (this.authSocket?.connected) return;

        this.authSocket = io('http://localhost:3001/', {
            transports: ['websocket'],
        });

        this.authSocket.on('connect', () => {
            console.log('✅ Connected to auth namespace');
            // userId will be set by the server
        });

        this.authSocket.on('disconnect', () => {
            console.log('❌ Disconnected from auth namespace');
        });

        return this.authSocket;
    }

    // Lobby namespace
    connectLobby() {
        if (this.lobbySocket?.connected) return this.lobbySocket;

        // Obtener userId del store si está disponible
        const storeUserId = this.getUserIdFromStore();

        this.lobbySocket = io('http://localhost:3001/lobby', {
            transports: ['websocket'],
            query: storeUserId ? { userId: storeUserId } : undefined,
        });

        this.lobbySocket.on('connect', () => {
            console.log('✅ Connected to lobby namespace');
        });

        this.lobbySocket.on('disconnect', () => {
            console.log('❌ Disconnected from lobby namespace');
        });

        return this.lobbySocket;
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
        if (this.gameSocket?.connected) {
            this.gameSocket.disconnect();
        }

        this.gameSocket = io(`http://localhost:3001/room/${roomId}`, {
            transports: ['websocket'],
        });

        this.gameSocket.on('connect', () => {
            console.log(`✅ Connected to game namespace: /room/${roomId}`);
        });

        this.gameSocket.on('disconnect', () => {
            console.log('❌ Disconnected from game namespace');
        });

        return this.gameSocket;
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

    // Cleanup
    disconnect() {
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
}

export const wsService = new WebSocketService();

