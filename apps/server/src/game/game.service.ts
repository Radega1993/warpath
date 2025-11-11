import { Injectable } from '@nestjs/common';
import { GameFSM, GameConfig } from '@warpath/rules-engine';
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
import { ConfigService } from '../config/config.service';

@Injectable()
export class GameService {
    private activeGames: Map<string, GameFSM> = new Map();

    constructor(
        private matchService: MatchService,
        private roomsService: RoomsService,
        private configService: ConfigService,
    ) { }

    /**
     * Inicia una nueva partida desde una sala
     */
    async startGame(roomId: string): Promise<GameFSM | null> {
        const room = await this.roomsService.getRoom(roomId);
        if (!room || room.status !== 'in_progress') {
            return null;
        }

        // Cargar configuración desde BD
        const dbConfig = await this.configService.getConfig();
        const gameConfig = this.convertDbConfigToGameConfig(dbConfig);

        // Crear estado inicial del juego
        const gameState = this.createInitialGameState(roomId, room);
        const fsm = new GameFSM(gameState, gameConfig);

        // Iniciar el juego
        fsm.startGame();

        // Guardar partida activa
        this.activeGames.set(roomId, fsm);

        // Crear registro de partida
        await this.matchService.createMatch(roomId, gameState.seed);

        // Guardar snapshot inicial
        const state = fsm.getState();
        await this.matchService.saveSnapshot(roomId, state.turn, state);

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
            // Normalizar raceId y heroId para asegurar que sean valores válidos del enum
            let raceId = roomPlayer.raceId;
            if (raceId && typeof raceId === 'string') {
                const normalized = raceId.toLowerCase();
                raceId = Object.values(RaceType).includes(normalized as RaceType)
                    ? (normalized as RaceType)
                    : RaceType.HUMAN;
            } else {
                raceId = RaceType.HUMAN;
            }

            let heroId = roomPlayer.heroId;
            if (heroId && typeof heroId === 'string') {
                const normalized = heroId.toLowerCase();
                heroId = Object.values(HeroType).includes(normalized as HeroType)
                    ? (normalized as HeroType)
                    : HeroType.MERCHANT;
            } else {
                heroId = HeroType.MERCHANT;
            }

            const player: Player = {
                id: `p${index}`,
                userId: roomPlayer.userId,
                seat: roomPlayer.seat,
                raceId,
                heroId,
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
    async endGame(roomId: string): Promise<void> {
        const fsm = this.activeGames.get(roomId);
        if (!fsm) {
            return;
        }

        const state = fsm.getState();

        // Preparar información de jugadores para guardar
        const playersData = Object.values(state.players).map(player => {
            const territories = player.territories.length;
            const won = player.userId === state.winnerId;
            return {
                userId: player.userId,
                playerId: player.id,
                raceId: player.raceId,
                heroId: player.heroId,
                finalGold: player.gold,
                territories,
                won,
            };
        });

        if (state.winnerId) {
            await this.matchService.endMatch(roomId, state.winnerId, state.turn, playersData);
        }

        this.activeGames.delete(roomId);
    }

    /**
     * Convierte la configuración de MongoDB al formato GameConfig del rules-engine
     */
    private convertDbConfigToGameConfig(dbConfig: any): GameConfig {
        return {
            economy: {
                baseIncomePerTerritory: dbConfig.economy?.baseIncomePerTerritory || 50,
                merchantHeroBonus: dbConfig.economy?.merchantHeroBonus || 50,
            },
            zones: dbConfig.zones || {},
            paths: dbConfig.paths || {},
            clanLevels: dbConfig.clanLevels || {},
            unitCosts: {
                explorer: dbConfig.unitCosts?.explorer || 150,
                warrior: dbConfig.unitCosts?.warrior || 250,
                elite: dbConfig.unitCosts?.elite || 300,
                hero: dbConfig.unitCosts?.hero || 350,
                chief: dbConfig.unitCosts?.chief || 1000,
                legend: dbConfig.unitCosts?.legend || 5000,
            },
            unitLimits: {
                explorer: dbConfig.unitLimits?.explorer || 20,
                warrior: dbConfig.unitLimits?.warrior || 25,
                elite: dbConfig.unitLimits?.elite || 15,
                hero: dbConfig.unitLimits?.hero || 10,
                chief: dbConfig.unitLimits?.chief || 1,
                legend: dbConfig.unitLimits?.legend || 3,
            },
            combat: {
                damageThreshold: dbConfig.combat?.damageThreshold || 8,
                tieRule: dbConfig.combat?.tieRule || 'same_rank_both_die',
            },
            rankDice: {
                explorer: dbConfig.rankDice?.explorer || 4,
                warrior: dbConfig.rankDice?.warrior || 6,
                elite: dbConfig.rankDice?.elite || 8,
                hero: dbConfig.rankDice?.hero || 12,
                chief: dbConfig.rankDice?.chief || 20,
                legend: dbConfig.rankDice?.legend || 100,
            },
            gameSettings: {
                defaultTurnTime: dbConfig.gameSettings?.defaultTurnTime || 120,
                maxPlayers: dbConfig.gameSettings?.maxPlayers || 4,
                minPlayers: dbConfig.gameSettings?.minPlayers || 2,
                startingGold: dbConfig.gameSettings?.startingGold || 200,
                startingActions: dbConfig.gameSettings?.startingActions || 1,
            },
        };
    }
}

