import { Module, OnModuleInit } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard } from './rate-limit.guard';

@Module({
    providers: [RateLimitService, RateLimitGuard],
    exports: [RateLimitService, RateLimitGuard],
})
export class CommonModule implements OnModuleInit {
    constructor(private rateLimitService: RateLimitService) { }

    onModuleInit() {
        // Iniciar limpieza automática de rate limits
        this.rateLimitService.startAutoCleanup();
    }
}

