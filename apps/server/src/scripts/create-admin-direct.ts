/**
 * Script para crear un usuario administrador directamente en MongoDB
 * Ejecutar con: npx ts-node src/scripts/create-admin-direct.ts
 */

import * as bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://warpath:warpath123@localhost:27018/warpath?authSource=admin';
const email = process.argv[2] || 'admin@warpath.com';
const password = process.argv[3] || 'admin123';
const handle = process.argv[4] || 'Admin';

async function createAdmin() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db('warpath');
        const usersCollection = db.collection('users');

        // Verificar si ya existe
        const existing = await usersCollection.findOne({ email });
        if (existing) {
            console.log('ℹ️  User already exists. Updating to admin...');
            const passwordHash = await bcrypt.hash(password, 10);
            await usersCollection.updateOne(
                { email },
                {
                    $set: {
                        passwordHash,
                        role: 'admin',
                        isGuest: false,
                        handle,
                    },
                }
            );
            console.log('✅ User updated to admin!');
        } else {
            // Crear nuevo admin
            const passwordHash = await bcrypt.hash(password, 10);
            const userId = `admin-${Date.now()}`;

            await usersCollection.insertOne({
                userId,
                email,
                passwordHash,
                handle,
                role: 'admin',
                isGuest: false,
                gamesPlayed: 0,
                gamesWon: 0,
                totalGoldEarned: 0,
                totalTerritoriesConquered: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            console.log('✅ Admin user created successfully!');
        }

        console.log(`\n📋 Credentials:`);
        console.log(`Email: ${email}`);
        console.log(`Handle: ${handle}`);
        console.log(`Password: ${password}`);
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

createAdmin();

