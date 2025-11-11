import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { RaceType, HeroType } from '@warpath/rules-engine';
import { Room, RoomDocument, RoomStatus, RoomPlayer } from '../schemas/room.schema';

// Re-exportar tipos para compatibilidad
export { RoomStatus, RoomPlayer, Room };

@Injectable()
export class RoomsService {
    constructor(
        @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    ) { }

    /**
     * Crea una nueva sala
     */
    async createRoom(mode: string, maxPlayers: number, creatorId: string): Promise<Room> {
        const room = new this.roomModel({
            id: uuidv4(),
            mode,
            maxPlayers,
            status: RoomStatus.WAITING,
            players: [],
            creatorId,
        });
        return await room.save();
    }

    /**
     * Obtiene una sala por ID
     */
    async getRoom(roomId: string): Promise<Room | null> {
        return await this.roomModel.findOne({ id: roomId }).exec();
    }

    /**
     * Añade un jugador a una sala
     */
    async addPlayer(roomId: string, userId: string, handle: string): Promise<RoomPlayer | null> {
        const room = await this.roomModel.findOne({ id: roomId }).exec();
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

        await room.save();
        return player;
    }

    /**
     * Elimina un jugador de una sala
     */
    async removePlayer(roomId: string, userId: string): Promise<boolean> {
        const room = await this.roomModel.findOne({ id: roomId }).exec();
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

        await room.save();
        return true;
    }

    /**
     * Selecciona raza para un jugador
     */
    async pickFaction(roomId: string, userId: string, raceId: RaceType): Promise<boolean> {
        const room = await this.roomModel.findOne({ id: roomId }).exec();
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
        await room.save();
        return true;
    }

    /**
     * Selecciona jefe para un jugador
     */
    async pickHero(roomId: string, userId: string, heroId: HeroType): Promise<boolean> {
        const room = await this.roomModel.findOne({ id: roomId }).exec();
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
        await room.save();
        return true;
    }

    /**
     * Marca un jugador como listo
     */
    async setPlayerReady(roomId: string, userId: string, ready: boolean): Promise<boolean> {
        const room = await this.roomModel.findOne({ id: roomId }).exec();
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

        await room.save();
        return true;
    }

    /**
     * Inicia una partida
     */
    async startMatch(roomId: string): Promise<boolean> {
        const room = await this.roomModel.findOne({ id: roomId }).exec();
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
        await room.save();
        return true;
    }

    /**
     * Elimina una sala
     */
    async deleteRoom(roomId: string): Promise<boolean> {
        const result = await this.roomModel.deleteOne({ id: roomId }).exec();
        return result.deletedCount > 0;
    }
}

