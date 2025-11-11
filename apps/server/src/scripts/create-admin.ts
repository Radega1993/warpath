/**
 * Script para crear el primer usuario administrador
 * Ejecutar con: npx ts-node src/scripts/create-admin.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../schemas/user.schema';

async function createAdmin() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);

    const email = process.argv[2] || 'admin@warpath.com';
    const password = process.argv[3] || 'admin123';
    const handle = process.argv[4] || 'Admin';

    try {
        // Intentar registrar como usuario normal primero
        const { user } = await authService.register(email, password, handle);

        // Actualizar a admin
        user.role = UserRole.ADMIN;
        user.isGuest = false;
        await user.save();

        console.log('✅ Admin user created successfully!');
        console.log(`Email: ${email}`);
        console.log(`Handle: ${handle}`);
        console.log(`Password: ${password}`);
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    } catch (error) {
        if (error.message.includes('already registered')) {
            console.log('ℹ️  User already exists. Updating to admin...');
            // Si ya existe, actualizar a admin
            const { userModel } = authService as any;
            const user = await userModel.findOne({ email }).exec();
            if (user) {
                user.role = UserRole.ADMIN;
                user.isGuest = false;
                await user.save();
                console.log('✅ User updated to admin!');
            }
        } else {
            console.error('❌ Error creating admin:', error.message);
        }
    }

    await app.close();
}

createAdmin();

