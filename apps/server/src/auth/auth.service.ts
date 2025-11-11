import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from '../schemas/user.schema';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
    ) { }

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

    /**
     * Valida un email
     */
    validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Registra un nuevo usuario
     */
    async register(email: string, password: string, handle: string): Promise<{ user: any; token: string }> {
        // Validar email
        if (!this.validateEmail(email)) {
            throw new ConflictException('Invalid email format');
        }

        // Validar handle
        if (!this.validateHandle(handle)) {
            throw new ConflictException('Invalid handle format');
        }

        // Validar password
        if (!password || password.length < 6) {
            throw new ConflictException('Password must be at least 6 characters');
        }

        // Verificar si el email ya existe
        const existingUser = await this.userModel.findOne({ email }).exec();
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Verificar si el handle ya existe
        const existingHandle = await this.userModel.findOne({ handle }).exec();
        if (existingHandle) {
            throw new ConflictException('Handle already taken');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Crear usuario
        const userId = this.generateUserId();
        const userDoc = new this.userModel({
            userId,
            email,
            passwordHash,
            handle,
            role: UserRole.USER,
            isGuest: false,
        });

        const savedUser = await userDoc.save();

        // Generar token (extraer campos necesarios para evitar problemas de tipos)
        const token = this.generateToken({
            userId: savedUser.userId,
            email: savedUser.email,
            role: savedUser.role,
            handle: savedUser.handle,
        });

        // Convertir a objeto plano para evitar problemas de tipos complejos
        const userObj: any = (savedUser as any).toObject ? (savedUser as any).toObject() : {
            userId: savedUser.userId,
            email: savedUser.email,
            handle: savedUser.handle,
            role: savedUser.role,
            isGuest: savedUser.isGuest,
        };
        return {
            user: userObj,
            token
        };
    }

    /**
     * Login de usuario
     */
    async login(email: string, password: string): Promise<{ user: any; token: string }> {
        const user: any = await this.userModel.findOne({ email }).exec();

        if (!user) {
            console.log(`[Auth] User not found for email: ${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.passwordHash) {
            console.log(`[Auth] User found but no passwordHash for email: ${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            console.log(`[Auth] Invalid password for email: ${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        console.log(`[Auth] Login successful for email: ${email}, role: ${user.role}`);

        // Actualizar lastSeen
        user.lastSeen = new Date();
        await user.save();

        const token = this.generateToken({
            userId: user.userId,
            email: user.email,
            role: user.role,
            handle: user.handle,
        });

        return {
            user: user as any,
            token
        };
    }

    /**
     * Genera un token JWT
     */
    generateToken(user: { userId: string; email?: string | null; role: string; handle: string }): string {
        const payload = {
            sub: user.userId,
            email: user.email || undefined,
            role: user.role,
            handle: user.handle,
        };
        return this.jwtService.sign(payload);
    }

    /**
     * Valida un token JWT
     */
    async validateToken(token: string): Promise<UserDocument | null> {
        try {
            const payload = this.jwtService.verify(token) as any;
            const user = await this.userModel.findOne({ userId: payload.sub }).exec();
            return (user as any) as UserDocument | null;
        } catch {
            return null;
        }
    }

    /**
     * Crea o obtiene un usuario invitado
     */
    async getOrCreateGuestUser(userId: string, handle: string): Promise<UserDocument> {
        let user: any = await this.userModel.findOne({ userId }).exec();

        if (!user) {
            const newUser = new this.userModel({
                userId,
                handle,
                role: UserRole.GUEST,
                isGuest: true,
            });
            user = await newUser.save();
        } else {
            // Actualizar lastSeen
            user.lastSeen = new Date();
            await user.save();
        }

        return user as UserDocument;
    }
}

