import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

export interface Timer {
    roomId: string;
    secondsLeft: number;
    intervalId?: NodeJS.Timeout;
    onTick?: (secondsLeft: number) => void;
    onExpire?: () => void;
}

@Injectable()
export class TimerService {
    private timers: Map<string, Timer> = new Map();
    private defaultTurnTime: number = 120;

    constructor(private configService: ConfigService) {
        // Cargar de forma asíncrona
        this.loadDefaultTurnTime().catch(err => {
            console.error('Error loading default turn time:', err);
        });
    }

    private async loadDefaultTurnTime() {
        try {
            const config = await this.configService.getConfig();
            this.defaultTurnTime = config.gameSettings?.defaultTurnTime || 120;
        } catch (error) {
            // Si falla, usar valor por defecto
            this.defaultTurnTime = 120;
        }
    }

    private getDefaultTurnTime(): number {
        return this.defaultTurnTime;
    }

    /**
     * Inicia un timer para una sala
     */
    startTimer(roomId: string, seconds?: number, onTick?: (secondsLeft: number) => void, onExpire?: () => void): void {
        const defaultTime = this.getDefaultTurnTime();
        const timerSeconds = seconds ?? defaultTime;
        // Detener timer existente si hay uno
        this.stopTimer(roomId);

        const timer: Timer = {
            roomId,
            secondsLeft: timerSeconds,
            onTick,
            onExpire,
        };

        timer.intervalId = setInterval(() => {
            timer.secondsLeft--;

            if (timer.onTick) {
                timer.onTick(timer.secondsLeft);
            }

            if (timer.secondsLeft <= 0) {
                this.stopTimer(roomId);
                if (timer.onExpire) {
                    timer.onExpire();
                }
            }
        }, 1000);

        this.timers.set(roomId, timer);
    }

    /**
     * Detiene un timer
     */
    stopTimer(roomId: string): void {
        const timer = this.timers.get(roomId);
        if (timer && timer.intervalId) {
            clearInterval(timer.intervalId);
            this.timers.delete(roomId);
        }
    }

    /**
     * Obtiene los segundos restantes de un timer
     */
    getSecondsLeft(roomId: string): number {
        const timer = this.timers.get(roomId);
        return timer ? timer.secondsLeft : 0;
    }

    /**
     * Resetea un timer
     */
    resetTimer(roomId: string, seconds?: number): void {
        const timer = this.timers.get(roomId);
        if (timer) {
            timer.secondsLeft = seconds || this.getDefaultTurnTime();
        }
    }
}

