import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthGateway } from './auth.gateway';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { JwtStrategy } from './jwt.strategy';
import { AdminGuard } from './admin.guard';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'warpath-secret-key-change-in-production',
                signOptions: { expiresIn: '7d' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthGateway, JwtStrategy, AdminGuard],
    exports: [AuthService, AdminGuard],
})
export class AuthModule { }

