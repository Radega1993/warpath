import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from './auth.service';
import { AuthenticatedSocket } from '../common/types';

@WebSocketGateway({
    namespace: '/',
    cors: {
        origin: true,
        credentials: true,
    },
})
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private authService: AuthService) { }

    handleConnection(client: AuthenticatedSocket) {
        // Generar ID de usuario para guest mode
        client.userId = this.authService.generateUserId();
        console.log(`Client connected: ${client.id} (userId: ${client.userId})`);

        // Enviar userId al cliente
        client.emit('user_authenticated', { userId: client.userId });
    }

    handleDisconnect(client: AuthenticatedSocket) {
        console.log(`Client disconnected: ${client.id}`);
    }
}

