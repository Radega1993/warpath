import { Injectable } from '@nestjs/common';

export interface User {
    id: string;
    handle: string;
    connected: boolean;
    lastSeen: Date;
}

@Injectable()
export class UsersService {
    private users: Map<string, User> = new Map();

    /**
     * Crea o actualiza un usuario
     */
    createOrUpdateUser(userId: string, handle: string): User {
        const user: User = {
            id: userId,
            handle,
            connected: true,
            lastSeen: new Date(),
        };
        this.users.set(userId, user);
        return user;
    }

    /**
     * Obtiene un usuario por ID
     */
    getUser(userId: string): User | undefined {
        return this.users.get(userId);
    }

    /**
     * Marca un usuario como desconectado
     */
    markDisconnected(userId: string): void {
        const user = this.users.get(userId);
        if (user) {
            user.connected = false;
            user.lastSeen = new Date();
        }
    }

    /**
     * Marca un usuario como conectado
     */
    markConnected(userId: string): void {
        const user = this.users.get(userId);
        if (user) {
            user.connected = true;
            user.lastSeen = new Date();
        }
    }
}

