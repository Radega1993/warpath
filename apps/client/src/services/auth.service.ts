import { API_URL } from '../config/env';

export interface LoginResponse {
    user: {
        userId: string;
        email: string;
        handle: string;
        role: string;
        isGuest: boolean;
    };
    token: string;
}

export interface RegisterData {
    email: string;
    password: string;
    handle: string;
}

export interface LoginData {
    email: string;
    password: string;
}

class AuthService {
    private token: string | null = null;

    getToken(): string | null {
        if (!this.token) {
            this.token = localStorage.getItem('warpath_token');
        }
        return this.token;
    }

    setToken(token: string) {
        this.token = token;
        localStorage.setItem('warpath_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('warpath_token');
    }

    async register(data: RegisterData): Promise<LoginResponse> {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al registrar');
        }

        const result = await response.json();
        this.setToken(result.token);
        return result;
    }

    async login(data: LoginData): Promise<LoginResponse> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al iniciar sesión');
        }

        const result = await response.json();
        this.setToken(result.token);
        return result;
    }

    async getProfile() {
        const token = this.getToken();
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                this.clearToken();
            }
            throw new Error('Error al obtener perfil');
        }

        return await response.json();
    }

    async getBalance() {
        const token = this.getToken();
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${API_URL}/admin/balance`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Error al obtener balance');
        }

        return await response.json();
    }

    async getConfig() {
        // Endpoint público para obtener configuración (sin auth requerida)
        const response = await fetch(`${API_URL}/config`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Error al obtener configuración');
        }

        return await response.json();
    }

    async updateBalance(balance: any) {
        const token = this.getToken();
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${API_URL}/admin/balance`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(balance),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al actualizar balance');
        }

        return await response.json();
    }
}

export const authService = new AuthService();

