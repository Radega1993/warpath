import { create } from 'zustand';
import { GameState, RoomState, CombatResult } from '../types';

interface GameStore {
    // Connection
    userId: string | null;
    setUserId: (userId: string) => void;

    // Room state
    currentRoom: RoomState | null;
    setCurrentRoom: (room: RoomState | null) => void;

    // Game state
    gameState: GameState | null;
    setGameState: (state: GameState | null) => void;

    // Combat
    lastCombatResult: CombatResult | null;
    setLastCombatResult: (result: CombatResult | null) => void;

    // UI state
    selectedTerritory: string | null;
    setSelectedTerritory: (territoryId: string | null) => void;
    attackFrom: string | null;
    setAttackFrom: (territoryId: string | null) => void;
    fortifyFrom: string | null;
    setFortifyFrom: (territoryId: string | null) => void;

    // Errors
    error: string | null;
    setError: (error: string | null) => void;

    // Reset
    reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
    userId: null,
    setUserId: (userId) => {
        set({ userId });
        // Exponer userId globalmente para que WebSocketService pueda accederlo
        if (typeof window !== 'undefined') {
            (window as any).__WARPATH_STORE__ = {
                getState: () => ({ userId }),
            };
        }
    },

    currentRoom: null,
    setCurrentRoom: (room) => set({ currentRoom: room }),

    gameState: null,
    setGameState: (state) => set({ gameState: state }),

    lastCombatResult: null,
    setLastCombatResult: (result) => set({ lastCombatResult: result }),

    selectedTerritory: null,
    setSelectedTerritory: (territoryId) => set({ selectedTerritory: territoryId }),
    attackFrom: null,
    setAttackFrom: (territoryId) => set({ attackFrom: territoryId }),
    fortifyFrom: null,
    setFortifyFrom: (territoryId) => set({ fortifyFrom: territoryId }),

    error: null,
    setError: (error) => set({ error }),

    reset: () =>
        set({
            currentRoom: null,
            gameState: null,
            lastCombatResult: null,
            selectedTerritory: null,
            attackFrom: null,
            fortifyFrom: null,
            error: null,
        }),
}));

