import { useGameStore } from '../store/gameStore';
import { useState, useEffect } from 'react';

interface ActionBarProps {
    onActionSelect: (action: string) => void;
    currentPhase: string;
    isMyTurn: boolean;
}

export default function ActionBar({ onActionSelect, currentPhase, isMyTurn }: ActionBarProps) {
    const [activeAction, setActiveAction] = useState<string | null>(null);

    const actions = [
        { id: 'deploy', label: 'Desplegar', icon: '🏰', key: '1' },
        { id: 'attack', label: 'Atacar', icon: '⚔️', key: '2' },
        { id: 'fortify', label: 'Fortificar', icon: '🛡️', key: '3' },
        { id: 'path', label: 'Camino', icon: '🔺', key: '4' },
        { id: 'end_turn', label: 'Fin de Turno', icon: '⏳', key: '5' },
    ];

    const handleActionClick = (actionId: string) => {
        if (!isMyTurn && actionId !== 'end_turn') return;
        setActiveAction(actionId === activeAction ? null : actionId);
        onActionSelect(actionId);
    };

    // Atajos de teclado
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            const action = actions.find(a => a.key === e.key);
            if (action) {
                handleActionClick(action.id);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [activeAction, isMyTurn]);

    return (
        <div className="bg-[#1a1a2e] border-t border-[#2a2a3e] px-2 py-2 z-50">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    {actions.map((action) => {
                        const isActive = activeAction === action.id || currentPhase === action.id;
                        const isDisabled = !isMyTurn && action.id !== 'end_turn';

                        return (
                            <button
                                key={action.id}
                                onClick={() => handleActionClick(action.id)}
                                disabled={isDisabled}
                                className={`
                                    modern-button text-xs py-1.5 px-3
                                    ${isActive ? 'active' : ''}
                                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                    ${action.id === 'end_turn' ? 'ml-auto success' : ''}
                                    ${action.id === 'attack' ? 'danger' : ''}
                                `}
                                title={`${action.label} (${action.key})`}
                            >
                                <span className="text-lg">{action.icon}</span>
                                <span className="hidden sm:inline text-xs">{action.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
