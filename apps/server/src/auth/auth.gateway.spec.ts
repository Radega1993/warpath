import { Test, TestingModule } from '@nestjs/testing';
import { AuthGateway } from './auth.gateway';
import { AuthService } from './auth.service';
import { AuthenticatedSocket } from '../common/types';

describe('AuthGateway', () => {
    let gateway: AuthGateway;
    let authService: AuthService;
    let mockSocket: Partial<AuthenticatedSocket>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthGateway,
                {
                    provide: AuthService,
                    useValue: {
                        generateUserId: jest.fn(() => 'user-123'),
                    },
                },
            ],
        }).compile();

        gateway = module.get<AuthGateway>(AuthGateway);
        authService = module.get<AuthService>(AuthService);

        mockSocket = {
            id: 'socket-123',
            userId: undefined,
            emit: jest.fn(),
            on: jest.fn(),
            disconnect: jest.fn(),
        };
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleConnection', () => {
        it('should generate userId for guest connection', () => {
            gateway.handleConnection(mockSocket as AuthenticatedSocket);

            expect(authService.generateUserId).toHaveBeenCalled();
            expect(mockSocket.userId).toBe('user-123');
        });

        it('should assign unique userId to each connection', () => {
            const socket1 = { ...mockSocket, id: 'socket-1' } as AuthenticatedSocket;
            const socket2 = { ...mockSocket, id: 'socket-2' } as AuthenticatedSocket;

            (authService.generateUserId as jest.Mock)
                .mockReturnValueOnce('user-1')
                .mockReturnValueOnce('user-2');

            gateway.handleConnection(socket1);
            gateway.handleConnection(socket2);

            expect(socket1.userId).toBe('user-1');
            expect(socket2.userId).toBe('user-2');
        });
    });

    describe('handleDisconnect', () => {
        it('should handle disconnect without errors', () => {
            expect(() => {
                gateway.handleDisconnect(mockSocket as AuthenticatedSocket);
            }).not.toThrow();
        });
    });
});

