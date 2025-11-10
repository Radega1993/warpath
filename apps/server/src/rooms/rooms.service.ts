import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RaceType, HeroType } from '@warpath/rules-engine';

export enum RoomStatus {
    WAITING = 'waiting',
    PICKING = 'picking',
    READY = 'ready',
    IN_PROGRESS = 'in_progress',
}

export interface RoomPlayer {
    userId: string;
    handle: string;
    seat: number;
    raceId?: RaceType;
    heroId?: HeroType;
    ready: boolean;
}

export interface Room {
    id: string;
    mode: string;
    maxPlayers: number;
    status: RoomStatus;
    players: RoomPlayer[];
    creatorId: string; // userId del creador de la sala
    createdAt: Date;
    startedAt?: Date;
}

@Injectable()
export class RoomsService {
    private rooms: Map<string, Room> = new Map();

    /**
     * Crea una nueva sala
     */
    createRoom(mode: string, maxPlayers: number, creatorId: string): Room {
        const room: Room = {
            id: uuidv4(),
            mode,
            maxPlayers,
            status: RoomStatus.WAITING,
            players: [],
            creatorId,
            createdAt: new Date(),
        };
        this.rooms.set(room.id, room);
        return room;
    }

    /**
     * Obtiene una sala por ID
     */
    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    /**
     * Añade un jugador a una sala
     */
    addPlayer(roomId: string, userId: string, handle: string): RoomPlayer | null {
        const room = this.rooms.get(roomId);
        if (!room) {
            return null;
        }

        if (room.players.length >= room.maxPlayers) {
            return null;
        }

        // Verificar si el jugador ya está en la sala
        const existingPlayer = room.players.find(p => p.userId === userId);
        if (existingPlayer) {
            return existingPlayer;
        }

        const player: RoomPlayer = {
            userId,
            handle,
            seat: room.players.length,
            ready: false,
        };

        room.players.push(player);

        // Cambiar estado si hay suficientes jugadores
        if (room.players.length >= 2 && room.status === RoomStatus.WAITING) {
            room.status = RoomStatus.PICKING;
        }

        return player;
    }

    /**
     * Elimina un jugador de una sala
     */
    removePlayer(roomId: string, userId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        const index = room.players.findIndex(p => p.userId === userId);
        if (index === -1) {
            return false;
        }

        room.players.splice(index, 1);

        // Actualizar estado si quedan menos de 2 jugadores
        if (room.players.length < 2 && room.status === RoomStatus.PICKING) {
            room.status = RoomStatus.WAITING;
        }

        return true;
    }

    /**
     * Selecciona raza para un jugador
     */
    pickFaction(roomId: string, userId: string, raceId: RaceType): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        const player = room.players.find(p => p.userId === userId);
        if (!player) {
            return false;
        }

        // Verificar que la raza no esté tomada
        const raceTaken = room.players.some(p => p.raceId === raceId && p.userId !== userId);
        if (raceTaken) {
            return false;
        }

        player.raceId = raceId;
        return true;
    }

    /**
     * Selecciona jefe para un jugador
     */
    pickHero(roomId: string, userId: string, heroId: HeroType): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        const player = room.players.find(p => p.userId === userId);
        if (!player) {
            return false;
        }

        // Verificar que el jefe no esté tomado
        const heroTaken = room.players.some(p => p.heroId === heroId && p.userId !== userId);
        if (heroTaken) {
            return false;
        }

        player.heroId = heroId;
        return true;
    }

    /**
     * Marca un jugador como listo
     */
    setPlayerReady(roomId: string, userId: string, ready: boolean): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        const player = room.players.find(p => p.userId === userId);
        if (!player) {
            return false;
        }

        player.ready = ready;

        // Verificar si todos están listos (solo requiere raza, no heroId)
        const allReady = room.players.every(p => p.ready && p.raceId);
        if (allReady && room.players.length >= 2) {
            room.status = RoomStatus.READY;
        }

        return true;
    }

    /**
     * Inicia una partida
     */
    startMatch(roomId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        // Verificar que haya al menos 2 jugadores
        if (room.players.length < 2) {
            return false;
        }

        // Verificar que todos los jugadores tengan raza seleccionada
        const allHaveRace = room.players.every(p => p.raceId);
        if (!allHaveRace) {
            return false;
        }

        // Permitir iniciar desde PICKING o READY
        if (room.status !== RoomStatus.PICKING && room.status !== RoomStatus.READY) {
            return false;
        }

        room.status = RoomStatus.IN_PROGRESS;
        room.startedAt = new Date();
        return true;
    }

    /**
     * Elimina una sala
     */
    deleteRoom(roomId: string): boolean {
        return this.rooms.delete(roomId);
    }
}

