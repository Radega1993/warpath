import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initSentry } from './common/sentry.config';

// Inicializar Sentry ANTES de crear la aplicación
initSentry();

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Habilitar CORS para desarrollo
    app.enableCors({
        origin: true,
        credentials: true,
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);

    console.log(`🚀 Warpath server running on: http://localhost:${port}`);
    console.log(`📦 MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://warpath:warpath123@localhost:27018/warpath?authSource=admin'}`);
}

bootstrap();

