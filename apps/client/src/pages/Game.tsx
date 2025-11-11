import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { wsService } from '../services/websocket.service';
import { useGameStore } from '../store/gameStore';
import Map from '../components/Map';
import GamePanel from '../components/GamePanel';
import CombatLog from '../components/CombatLog';
import ClanPanel from '../components/ClanPanel';
import TerritoryHUD from '../components/TerritoryHUD';
import ActionBar from '../components/ActionBar';
import ConnectionStatus from '../components/ConnectionStatus';
import { GameState, CombatResult } from '../types';

export default function Game() {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { gameState, setGameState, setLastCombatResult, setError, userId } = useGameStore();

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
            console.log('Combat result:', result);
        });

        // Listen for economy updates
        wsService.onEconomyUpdate((data) => {
            console.log('Economy update:', data);
        });

        // Listen for timer ticks
        wsService.onTimerTick((data) => {
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
    }, [roomId, setGameState, setLastCombatResult, setError, navigate]);

    const isMyTurn = gameState?.currentPlayerId === userId;

    const handleActionSelect = (action: string) => {
        // Esta función se puede usar para cambiar el modo de interacción
        console.log('Action selected:', action);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
            {/* Connection Status Notification */}
            <ConnectionStatus />

            {/* Barra superior */}
            <div className="bg-[#1a1a2e] border-b border-[#2a2a3e] px-4 py-3 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-[#00d4ff] font-['Orbitron']">WARPATH</h1>
                    <span className="text-sm text-[#b0b0b0]">
                        Partida: {roomId?.substring(0, 8)}...
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-[#b0b0b0]">Turno {gameState?.turn || 0}</span>
                    <span className="text-[#00d4ff] font-mono">
                        {gameState?.timers?.turnSecondsLeft
                            ? `${Math.floor(gameState.timers.turnSecondsLeft / 60)}:${(gameState.timers.turnSecondsLeft % 60).toString().padStart(2, '0')}`
                            : '--:--'
                        }
                    </span>
                    {!isMyTurn && (
                        <span className="text-[#ffaa00] animate-pulse">
                            ⏳ Esperando turno...
                        </span>
                    )}
                </div>
            </div>

            {/* Layout principal - Grid responsive sin scroll */}
            <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden h-[calc(100vh-120px)]">
                {/* Panel izquierdo - Clan (compacto) */}
                <div className="hidden lg:block lg:col-span-2 h-full">
                    <ClanPanel />
                </div>

                {/* Mapa central - Ocupa más espacio */}
                <div className="col-span-12 lg:col-span-6 relative h-full">
                    <div className="w-full h-full bg-[#050508] rounded-lg border border-[#2a2a3e] overflow-hidden">
                        <Map />
                        <TerritoryHUD />
                    </div>
                </div>

                {/* Panel derecho - Combat Log y Game Panel apilados */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-2 h-full">
                    {/* Combat Log - compacto pero visible */}
                    <div className="flex-shrink-0 h-40">
                        <CombatLog />
                    </div>

                    {/* Game Panel - solo si es mi turno, ocupa el resto */}
                    {gameState && isMyTurn && (
                        <div className="flex-1 min-h-0 h-[calc(100%-168px)]">
                            <GamePanel />
                        </div>
                    )}
                </div>
            </div>

            {/* Barra de acciones inferior - siempre visible */}
            <ActionBar
                onActionSelect={handleActionSelect}
                currentPhase={gameState?.phase || ''}
                isMyTurn={isMyTurn || false}
            />
        </div>
    );
}
