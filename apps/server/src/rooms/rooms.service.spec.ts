import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService, RoomStatus } from './rooms.service';
import { RaceType, HeroType } from '@warpath/rules-engine';

describe('RoomsService', () => {
    let service: RoomsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RoomsService],
        }).compile();

        service = module.get<RoomsService>(RoomsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createRoom', () => {
        it('should create a room successfully', () => {
            const room = service.createRoom('standard', 4, 'creator1');

            expect(room).toBeDefined();
            expect(room.id).toBeDefined();
            expect(room.mode).toBe('standard');
            expect(room.maxPlayers).toBe(4);
            expect(room.status).toBe(RoomStatus.WAITING);
            expect(room.players).toEqual([]);
            expect(room.creatorId).toBe('creator1');
        });
    });

    describe('addPlayer', () => {
        it('should add a player to a room', () => {
            const room = service.createRoom('standard', 4, 'creator1');
            const player = service.addPlayer(room.id, 'user1', 'Player1');

            expect(player).toBeDefined();
            expect(player?.userId).toBe('user1');
            expect(player?.handle).toBe('Player1');
            expect(player?.seat).toBe(0);
            expect(room.players.length).toBe(1);
        });

        it('should change status to PICKING when 2 players join', () => {
            const room = service.createRoom('standard', 4, 'creator1');
            service.addPlayer(room.id, 'user1', 'Player1');
            service.addPlayer(room.id, 'user2', 'Player2');

            expect(room.status).toBe(RoomStatus.PICKING);
        });

        it('should return null if room is full', () => {
            const room = service.createRoom('standard', 2, 'creator1');
            service.addPlayer(room.id, 'user1', 'Player1');
            service.addPlayer(room.id, 'user2', 'Player2');
            const player = service.addPlayer(room.id, 'user3', 'Player3');

            expect(player).toBeNull();
        });

        it('should return null if room not found', () => {
            const player = service.addPlayer('non-existent', 'user1', 'Player1');
            expect(player).toBeNull();
        });
    });

    describe('removePlayer', () => {
        it('should remove a player from a room', () => {
            const room = service.createRoom('standard', 4, 'creator1');
            service.addPlayer(room.id, 'user1', 'Player1');
            const removed = service.removePlayer(room.id, 'user1');

            expect(removed).toBe(true);
            expect(room.players.length).toBe(0);
        });

        it('should return false if player not found', () => {
            const room = service.createRoom('standard', 4, 'creator1');
            const removed = service.removePlayer(room.id, 'non-existent');

            expect(removed).toBe(false);
        });
    });

    describe('pickFaction', () => {
        it('should pick faction for a player', () => {
            const room = service.createRoom('standard', 4, 'creator1');
            service.addPlayer(room.id, 'user1', 'Player1');
            const success = service.pickFaction(room.id, 'user1', RaceType.HUMAN);

            expect(success).toBe(true);
            expect(room.players[0].raceId).toBe(RaceType.HUMAN);
        });

        it('should prevent picking same race twice', () => {
            const room = service.createRoom('standard', 4, 'creator1');
            service.addPlayer(room.id, 'user1', 'Player1');
            service.addPlayer(room.id, 'user2', 'Player2');
            service.pickFaction(room.id, 'user1', RaceType.HUMAN);
            const success = service.pickFaction(room.id, 'user2', RaceType.HUMAN);

            expect(success).toBe(false);
        });
    });

    describe('pickHero', () => {
        it('should pick hero for a player', () => {
            const room = service.createRoom('standard', 4, 'creator1');
            service.addPlayer(room.id, 'user1', 'Player1');
            const success = service.pickHero(room.id, 'user1', HeroType.MERCHANT);

            expect(success).toBe(true);
            expect(room.players[0].heroId).toBe(HeroType.MERCHANT);
        });

        it('should prevent picking same hero twice', () => {
            const room = service.createRoom('standard', 4, 'creator1');
            service.addPlayer(room.id, 'user1', 'Player1');
            service.addPlayer(room.id, 'user2', 'Player2');
            service.pickHero(room.id, 'user1', HeroType.MERCHANT);
            const success = service.pickHero(room.id, 'user2', HeroType.MERCHANT);

            expect(success).toBe(false);
        });
    });

    describe('startMatch', () => {
        it('should start match when all players have race selected', () => {
            const room = service.createRoom('standard', 2, 'creator1');
            service.addPlayer(room.id, 'user1', 'Player1');
            service.addPlayer(room.id, 'user2', 'Player2');
            service.pickFaction(room.id, 'user1', RaceType.HUMAN);
            service.pickFaction(room.id, 'user2', RaceType.ORC);

            const success = service.startMatch(room.id);

            expect(success).toBe(true);
            expect(room.status).toBe(RoomStatus.IN_PROGRESS);
            expect(room.startedAt).toBeDefined();
        });

        it('should not start match if not all players have race', () => {
            const room = service.createRoom('standard', 2, 'creator1');
            service.addPlayer(room.id, 'user1', 'Player1');
            service.addPlayer(room.id, 'user2', 'Player2');
            service.pickFaction(room.id, 'user1', RaceType.HUMAN);
            // user2 no tiene raza seleccionada

            const success = service.startMatch(room.id);

            expect(success).toBe(false);
        });

        it('should not start match if not enough players', () => {
            const room = service.createRoom('standard', 2, 'creator1');
            service.addPlayer(room.id, 'user1', 'Player1');

            const success = service.startMatch(room.id);

            expect(success).toBe(false);
        });
    });
});

