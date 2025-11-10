import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
    /**
     * Genera un ID de usuario único (guest mode)
     */
    generateUserId(): string {
        return uuidv4();
    }

    /**
     * Valida un handle de usuario
     */
    validateHandle(handle: string): boolean {
        if (!handle || handle.trim().length === 0) {
            return false;
        }
        if (handle.length > 20) {
            return false;
        }
        // Permitir letras, números, guiones y guiones bajos
        return /^[a-zA-Z0-9_-]+$/.test(handle);
    }
}

