import { Injectable } from '@nestjs/common';

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
    private readonly DEFAULT_TURN_TIME = 120; // 2 minutos por turno

    /**
     * Inicia un timer para una sala
     */
    startTimer(roomId: string, seconds: number = this.DEFAULT_TURN_TIME, onTick?: (secondsLeft: number) => void, onExpire?: () => void): void {
        // Detener timer existente si hay uno
        this.stopTimer(roomId);

        const timer: Timer = {
            roomId,
            secondsLeft: seconds,
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
            timer.secondsLeft = seconds || this.DEFAULT_TURN_TIME;
        }
    }
}

