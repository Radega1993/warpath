import { Injectable } from '@nestjs/common';
import { RaceType, HeroType, PathType } from '@warpath/rules-engine';

export interface TelemetryEvent {
    type: string;
    roomId: string;
    userId?: string;
    timestamp: Date;
    data: any;
}

@Injectable()
export class TelemetryService {
    private events: TelemetryEvent[] = [];

    /**
     * Registra un evento de telemetría
     */
    logEvent(type: string, roomId: string, data: any, userId?: string): void {
        const event: TelemetryEvent = {
            type,
            roomId,
            userId,
            timestamp: new Date(),
            data,
        };
        this.events.push(event);
        console.log(`[Telemetry] ${type} - Room: ${roomId}`, data);
    }

    /**
     * Registra inicio de partida
     */
    logMatchStart(roomId: string, players: any[]): void {
        this.logEvent('match_start', roomId, {
            players: players.map(p => ({
                userId: p.userId,
                raceId: p.raceId,
                heroId: p.heroId,
            })),
        });
    }

    /**
     * Registra fin de partida
     */
    logMatchEnd(roomId: string, winnerId: string, duration: number, turns: number): void {
        this.logEvent('match_end', roomId, {
            winnerId,
            duration,
            turns,
        });
    }

    /**
     * Registra duración de turno
     */
    logTurnDuration(roomId: string, userId: string, duration: number): void {
        this.logEvent('turn_duration', roomId, {
            userId,
            duration,
        }, userId);
    }

    /**
     * Obtiene estadísticas de telemetría
     */
    getStats(): any {
        const matchStarts = this.events.filter(e => e.type === 'match_start').length;
        const matchEnds = this.events.filter(e => e.type === 'match_end').length;
        const turnDurations = this.events
            .filter(e => e.type === 'turn_duration')
            .map(e => e.data.duration);

        const avgTurnDuration = turnDurations.length > 0
            ? turnDurations.reduce((a, b) => a + b, 0) / turnDurations.length
            : 0;

        return {
            matchStarts,
            matchEnds,
            avgTurnDuration,
            totalEvents: this.events.length,
        };
    }
}

