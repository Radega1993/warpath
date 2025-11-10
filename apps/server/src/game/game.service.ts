import { Injectable } from '@nestjs/common';
import { GameFSM } from '@warpath/rules-engine';
import {
    GameState,
    GamePhase,
    Player,
    TerritoryState,
    Troops,
    PathType,
    UnitRank,
    RaceType,
    HeroType,
    createEmptyTroops,
} from '@warpath/rules-engine';
import { mapData } from '@warpath/shared';
import { MatchService } from '../match/match.service';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class GameService {
    private activeGames: Map<string, GameFSM> = new Map();

    constructor(
        private matchService: MatchService,
        private roomsService: RoomsService,
    ) { }

    /**
     * Inicia una nueva partida desde una sala
     */
    startGame(roomId: string): GameFSM | null {
        const room = this.roomsService.getRoom(roomId);
        if (!room || room.status !== 'in_progress') {
            return null;
        }

        // Crear estado inicial del juego
        const gameState = this.createInitialGameState(roomId, room);
        const fsm = new GameFSM(gameState);

        // Iniciar el juego
        fsm.startGame();

        // Guardar partida activa
        this.activeGames.set(roomId, fsm);

        // Crear registro de partida
        this.matchService.createMatch(roomId, gameState.seed);

        // Guardar snapshot inicial
        const state = fsm.getState();
        this.matchService.saveSnapshot(roomId, state.turn, state);

        return fsm;
    }

    /**
     * Obtiene el FSM de una partida activa
     */
    getGame(roomId: string): GameFSM | undefined {
        return this.activeGames.get(roomId);
    }

    /**
     * Crea el estado inicial del juego desde una sala
     */
    private createInitialGameState(roomId: string, room: any): GameState {
        const seed = Math.floor(Math.random() * 1000000);
        const players: Record<string, Player> = {};
        const territories: Record<string, TerritoryState> = {};

        // Crear jugadores desde la sala
        room.players.forEach((roomPlayer: any, index: number) => {
            const player: Player = {
                id: `p${index}`,
                userId: roomPlayer.userId,
                seat: roomPlayer.seat,
                raceId: roomPlayer.raceId || RaceType.HUMAN,
                heroId: roomPlayer.heroId || HeroType.MERCHANT,
                gold: 0,
                actions: 1,
                actionsLeft: 1,
                clanLevel: 1,
                paths: {
                    [PathType.CLAN]: 0,
                    [PathType.TREASURE]: 0,
                    [PathType.POWER]: 0,
                    [PathType.LUCK]: 0,
                    [PathType.LAND]: 0,
                    [PathType.WAR]: 0,
                },
                territories: [],
            };
            players[player.id] = player;
        });

        // Crear territorios desde el mapa
        mapData.territories.forEach((territory) => {
            const territoryState: TerritoryState = {
                id: territory.id,
                ownerId: null,
                troops: createEmptyTroops(),
                zone: territory.zone as any,
                isSpawn: territory.isSpawn || false,
            };
            territories[territory.id] = territoryState;
        });

        const gameState: GameState = {
            id: roomId,
            seed,
            turn: 0,
            currentPlayerId: room.players[0]?.userId || '',
            phase: GamePhase.LOBBY,
            players,
            territories,
        };

        return gameState;
    }

    /**
     * Convierte tropas del formato del cliente al formato del rules-engine
     */
    convertTroops(units: any): Troops {
        return {
            [UnitRank.EXPLORER]: units.d4 || 0,
            [UnitRank.WARRIOR]: units.d6 || 0,
            [UnitRank.ELITE]: units.d8 || 0,
            [UnitRank.HERO]: units.d12 || 0,
            [UnitRank.CHIEF]: units.d20 || 0,
            [UnitRank.LEGEND]: units.d100 || 0,
        };
    }

    /**
     * Convierte el estado del juego a formato para el cliente
     */
    serializeGameState(fsm: GameFSM): any {
        const state = fsm.getState();
        const currentPlayer = state.players[state.currentPlayerId];

        // Crear mapeo de playerId a userId para el cliente
        const players: Record<string, { userId: string; playerId: string }> = {};
        const playerIdToUserId: Record<string, string> = {};
        Object.values(state.players).forEach((player) => {
            players[player.id] = {
                userId: player.userId,
                playerId: player.id,
            };
            playerIdToUserId[player.id] = player.userId;
        });

        // Mapear owners usando userId en lugar de playerId
        const owners: Record<string, string> = {};
        const troopsByTerritory: Record<string, any> = {};
        const zones: Record<string, string> = {};

        Object.values(state.territories).forEach((territory) => {
            // Convertir playerId (p0, p1) a userId
            if (territory.ownerId) {
                owners[territory.id] = playerIdToUserId[territory.ownerId] || territory.ownerId;
            } else {
                owners[territory.id] = '';
            }
            troopsByTerritory[territory.id] = {
                d4: territory.troops[UnitRank.EXPLORER],
                d6: territory.troops[UnitRank.WARRIOR],
                d8: territory.troops[UnitRank.ELITE],
                d12: territory.troops[UnitRank.HERO],
                d20: territory.troops[UnitRank.CHIEF],
                d100: territory.troops[UnitRank.LEGEND],
            };
            if (territory.zone) {
                zones[territory.id] = territory.zone as string;
            }
        });

        const paths: Record<string, number> = {};
        if (currentPlayer) {
            Object.values(PathType).forEach((pathType) => {
                paths[pathType] = currentPlayer.paths[pathType];
            });
        }

        return {
            id: state.id,
            seed: state.seed,
            turn: state.turn,
            phase: state.phase,
            gold: currentPlayer?.gold || 0,
            actionsLeft: currentPlayer?.actionsLeft || 0,
            currentPlayerId: currentPlayer?.userId || '', // Enviar userId del jugador actual
            players, // Mapeo de playerId a userId
            owners, // Mapeo de territoryId a userId
            troopsByTerritory,
            paths,
            zones,
            timers: {
                turnSecondsLeft: 0, // Se actualizará con el timer
            },
        };
    }

    /**
     * Finaliza una partida
     */
    endGame(roomId: string): void {
        const fsm = this.activeGames.get(roomId);
        if (!fsm) {
            return;
        }

        const state = fsm.getState();
        if (state.winnerId) {
            this.matchService.endMatch(roomId, state.winnerId, state.turn);
        }

        this.activeGames.delete(roomId);
    }
}

