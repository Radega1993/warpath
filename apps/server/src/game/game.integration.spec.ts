import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { MatchService } from '../match/match.service';
import { RoomsService } from '../rooms/rooms.service';
import { GameFSM } from '@warpath/rules-engine';
import { UnitRank, PathType } from '@warpath/rules-engine';

describe('GameService Integration', () => {
    let gameService: GameService;
    let roomsService: RoomsService;
    let matchService: MatchService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GameService, MatchService, RoomsService],
        }).compile();

        gameService = module.get<GameService>(GameService);
        roomsService = module.get<RoomsService>(RoomsService);
        matchService = module.get<MatchService>(MatchService);
    });

    describe('Full Game Flow', () => {
        it('should complete a full game flow: create room -> start game -> play turn -> end turn', () => {
            // 1. Crear sala
            const room = roomsService.createRoom('standard', 2, 'creator1');
            expect(room).toBeDefined();

            // 2. Añadir jugadores
            const player1 = roomsService.addPlayer(room.id, 'user1', 'Player1');
            const player2 = roomsService.addPlayer(room.id, 'user2', 'Player2');
            expect(player1).toBeDefined();
            expect(player2).toBeDefined();

            // 3. Seleccionar raza y jefe
            roomsService.pickFaction(room.id, 'user1', 'human' as any);
            roomsService.pickFaction(room.id, 'user2', 'orc' as any);
            roomsService.pickHero(room.id, 'user1', 'merchant' as any);
            roomsService.pickHero(room.id, 'user2', 'battler' as any);

            // 4. Marcar como listos
            roomsService.setPlayerReady(room.id, 'user1', true);
            roomsService.setPlayerReady(room.id, 'user2', true);

            // 5. Iniciar partida (esto cambia el status a 'in_progress')
            roomsService.startMatch(room.id);

            // Verificar que el room está en estado 'in_progress'
            const roomAfterStart = roomsService.getRoom(room.id);
            expect(roomAfterStart?.status).toBe('in_progress');

            const fsm = gameService.startGame(room.id);
            expect(fsm).toBeDefined();
            expect(fsm).toBeInstanceOf(GameFSM);

            // 6. Verificar estado inicial
            const initialState = fsm.getState();
            expect(initialState.phase).toBe('deploy');
            expect(initialState.turn).toBe(1);
            expect(initialState.players).toBeDefined();

            // 7. Obtener jugador actual
            const currentPlayerId = initialState.currentPlayerId;
            const currentPlayer = initialState.players[currentPlayerId];
            expect(currentPlayer).toBeDefined();
            expect(currentPlayer.gold).toBeGreaterThan(0);

            // 8. Dar oro suficiente para desplegar
            currentPlayer.gold = 1000;

            // 9. Desplegar tropas
            const territoryId = currentPlayer.territories[0];
            expect(territoryId).toBeDefined();

            const troops = gameService.convertTroops({
                d6: 2, // 2 guerreros
            });

            fsm.deployTroops(territoryId, troops);

            // 10. Verificar despliegue
            const afterDeploy = fsm.getState();
            const territory = afterDeploy.territories[territoryId];
            expect(territory.troops[UnitRank.WARRIOR]).toBeGreaterThan(0);

            // 11. Dar oro suficiente para subir camino
            const playerAfterDeploy = afterDeploy.players[currentPlayerId];
            playerAfterDeploy.gold = 1000;

            // 12. Subir camino
            fsm.upgradePath(PathType.POWER);

            // 13. Terminar turno
            fsm.endTurn();

            // 14. Verificar siguiente turno
            const nextTurn = fsm.getState();
            expect(nextTurn.turn).toBe(2);
            expect(nextTurn.currentPlayerId).not.toBe(currentPlayerId);
        });

        it('should handle game state correctly', () => {
            // Setup: crear partida con 2 jugadores
            const room = roomsService.createRoom('standard', 2, 'creator1');
            roomsService.addPlayer(room.id, 'user1', 'Player1');
            roomsService.addPlayer(room.id, 'user2', 'Player2');
            roomsService.pickFaction(room.id, 'user1', 'human' as any);
            roomsService.pickFaction(room.id, 'user2', 'orc' as any);
            roomsService.pickHero(room.id, 'user1', 'merchant' as any);
            roomsService.pickHero(room.id, 'user2', 'battler' as any);
            roomsService.setPlayerReady(room.id, 'user1', true);
            roomsService.setPlayerReady(room.id, 'user2', true);
            roomsService.startMatch(room.id);

            // Verificar que el room está en estado 'in_progress'
            const roomAfterStart = roomsService.getRoom(room.id);
            expect(roomAfterStart?.status).toBe('in_progress');

            const fsm = gameService.startGame(room.id);
            expect(fsm).toBeDefined();
            expect(fsm).not.toBeNull();

            const state = fsm.getState();

            // Verificar que el juego se inició correctamente
            expect(state.phase).toBe('deploy');
            expect(state.turn).toBe(1);
            expect(state.players).toBeDefined();
            expect(Object.keys(state.players).length).toBe(2);
            expect(state.territories).toBeDefined();
            expect(Object.keys(state.territories).length).toBeGreaterThan(0);

            // Verificar que cada jugador tiene territorios
            Object.values(state.players).forEach(player => {
                expect(player.territories.length).toBeGreaterThan(0);
                expect(player.gold).toBeGreaterThanOrEqual(0);
            });
        });
    });
});

