import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { wsService } from '../services/websocket.service';
import { useGameStore } from '../store/gameStore';
import Map from '../components/Map';
import GamePanel from '../components/GamePanel';
import CombatLog from '../components/CombatLog';
import { GameState, CombatResult } from '../types';

export default function Game() {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { setGameState, setLastCombatResult, setError } = useGameStore();

    useEffect(() => {
        if (!roomId) return;

        // Connect to game namespace
        const gameSocket = wsService.connectGame(roomId);

        // Listen for game state updates
        const handleGameState = (state: GameState) => {
            console.log('[Game] game_state received:', state);
            setGameState(state);
        };

        wsService.onGameState(handleGameState);

        // Listen for connection to receive initial state
        if (gameSocket) {
            gameSocket.on('connect', () => {
                console.log('[Game] Connected to game namespace, waiting for initial state...');
            });
        }

        // Listen for combat results
        wsService.onCombatResult((result: CombatResult) => {
            setLastCombatResult(result);
            // Show combat result (could be a toast or modal)
            console.log('Combat result:', result);
        });

        // Listen for economy updates
        wsService.onEconomyUpdate((data) => {
            console.log('Economy update:', data);
        });

        // Listen for timer ticks
        wsService.onTimerTick((data) => {
            // Update game state with new timer
            // Get current state from store to avoid stale closure
            const currentState = useGameStore.getState().gameState;
            if (currentState) {
                setGameState({
                    ...currentState,
                    timers: {
                        turnSecondsLeft: data.secondsLeft,
                    },
                });
            }
        });

        // Listen for game over
        wsService.onGameOver((data) => {
            console.log('Game over:', data);
            // Navigate to results page
            navigate(`/results`);
        });

        // Listen for errors
        wsService.onError((error) => {
            setError(error.message);
            alert(error.message);
        });

        return () => {
            // Cleanup on unmount
        };
    }, [roomId, setGameState, setLastCombatResult, setError]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-4 text-yellow-400">
                    Partida: {roomId}
                </h1>

                <div className="grid lg:grid-cols-4 gap-4">
                    {/* Map - takes 2 columns */}
                    <div className="lg:col-span-2">
                        <Map />
                    </div>

                    {/* Game Panel and Combat Log - takes 2 columns */}
                    <div className="lg:col-span-2 space-y-4">
                        <GamePanel />
                        <CombatLog />
                    </div>
                </div>
            </div>
        </div>
    );
}

