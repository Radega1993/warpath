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

    async handleConnection(client: AuthenticatedSocket) {
        // Generar ID de usuario para guest mode
        const userId = this.authService.generateUserId();
        client.userId = userId;

        // Crear o obtener usuario invitado en la BD
        await this.authService.getOrCreateGuestUser(userId, `Guest_${userId.substring(0, 8)}`);

        console.log(`Client connected: ${client.id} (userId: ${client.userId})`);

        // Enviar userId al cliente
        client.emit('user_authenticated', { userId: client.userId });
    }

    handleDisconnect(client: AuthenticatedSocket) {
        console.log(`Client disconnected: ${client.id}`);
    }
}

