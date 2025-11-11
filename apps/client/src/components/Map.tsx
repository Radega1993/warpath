import { useGameStore } from '../store/gameStore';
import { mapData } from '@warpath/shared';

interface MapProps {
    onTerritoryClick?: (territoryId: string) => void;
}

export default function Map({ onTerritoryClick }: MapProps) {
    const { gameState, selectedTerritory, setSelectedTerritory, userId, attackFrom, setAttackFrom, fortifyFrom, setFortifyFrom } = useGameStore();

    // Obtener adyacencias de un territorio
    const getAdjacentTerritories = (territoryId: string): string[] => {
        const adjacencies = mapData.adjacencies || [];
        return adjacencies
            .filter(([from, to]: [string, string]) => from === territoryId || to === territoryId)
            .map(([from, to]: [string, string]) => from === territoryId ? to : from);
    };

    const getTerritoryColor = (territoryId: string) => {
        if (!gameState) return '#4B5563'; // gray-600

        const ownerUserId = gameState.owners[territoryId];
        if (!ownerUserId) return '#6B7280'; // gray-500

        // Obtener el playerId del owner usando el mapeo de players
        const players = gameState.players || {};
        let playerId: string | null = null;
        for (const [pid, data] of Object.entries(players)) {
            if (data.userId === ownerUserId) {
                playerId = pid;
                break;
            }
        }

        // Simple color mapping based on playerId
        const colors: Record<string, string> = {
            p0: '#EF4444', // red
            p1: '#3B82F6', // blue
            p2: '#10B981', // green
            p3: '#F59E0B', // yellow
        };

        return playerId ? (colors[playerId] || '#6B7280') : '#6B7280';
    };

    // Verificar si un territorio es adyacente al seleccionado
    const isAdjacent = (territoryId: string) => {
        if (!selectedTerritory || !attackFrom) return false;
        const adjacents = getAdjacentTerritories(attackFrom);
        return adjacents.includes(territoryId);
    };

    // Verificar si un territorio es mío
    const isMyTerritory = (territoryId: string) => {
        if (!gameState || !userId) return false;
        return gameState.owners[territoryId] === userId;
    };

    const getTroopCount = (territoryId: string) => {
        if (!gameState) return 0;
        const troops = gameState.troopsByTerritory[territoryId];
        if (!troops) return 0;

        return Object.values(troops).reduce((sum: number, count: any) => sum + (count || 0), 0);
    };

    const isSelected = (territoryId: string) => {
        return selectedTerritory === territoryId;
    };

    const handleTerritoryClick = (territoryId: string) => {
        if (onTerritoryClick) {
            onTerritoryClick(territoryId);
            return;
        }

        // Manejar selección según la fase
        if (!gameState) {
            setSelectedTerritory(isSelected(territoryId) ? null : territoryId);
            return;
        }

        const phase = gameState.phase;
        const isMyTurn = gameState.currentPlayerId === userId;

        if (!isMyTurn) {
            // Solo permitir seleccionar para ver información
            setSelectedTerritory(isSelected(territoryId) ? null : territoryId);
            return;
        }

        // Fase de ataque
        if (phase === 'attack') {
            if (!attackFrom) {
                // Seleccionar territorio origen (debe ser mío)
                if (isMyTerritory(territoryId)) {
                    setAttackFrom(territoryId);
                    setSelectedTerritory(null);
                } else {
                    alert('Selecciona uno de tus territorios primero');
                }
            } else {
                // Seleccionar territorio destino (debe ser enemigo y adyacente)
                if (isMyTerritory(territoryId)) {
                    alert('No puedes atacar tu propio territorio');
                    return;
                }
                const adjacents = getAdjacentTerritories(attackFrom);
                if (!adjacents.includes(territoryId)) {
                    alert('Solo puedes atacar territorios adyacentes');
                    return;
                }
                setSelectedTerritory(territoryId);
            }
            return;
        }

        // Fase de fortificar
        if (phase === 'fortify') {
            if (!fortifyFrom) {
                // Seleccionar territorio origen (debe ser mío)
                if (isMyTerritory(territoryId)) {
                    setFortifyFrom(territoryId);
                    setSelectedTerritory(null);
                } else {
                    alert('Selecciona uno de tus territorios primero');
                }
            } else {
                // Seleccionar territorio destino (debe ser mío)
                if (!isMyTerritory(territoryId)) {
                    alert('Solo puedes fortificar tus propios territorios');
                    return;
                }
                if (fortifyFrom === territoryId) {
                    alert('Selecciona un territorio diferente');
                    return;
                }
                setSelectedTerritory(territoryId);
            }
            return;
        }

        // Fase de deploy o cualquier otra: selección normal
        setSelectedTerritory(isSelected(territoryId) ? null : territoryId);
    };

    return (
        <div className="w-full h-full bg-gray-800 rounded-lg p-4 overflow-auto">
            <svg
                viewBox="0 0 1000 800"
                className="w-full h-full"
                style={{ minHeight: '600px' }}
            >
                {/* Render territories */}
                {mapData.territories.map((territory: any) => {
                    const x = (territory as any).x || (territory as any).coords?.[0] || 0;
                    const y = (territory as any).y || (territory as any).coords?.[1] || 0;
                    const color = getTerritoryColor(territory.id);
                    const troopCount = getTroopCount(territory.id);
                    const selected = isSelected(territory.id);
                    const isAttackOrigin = attackFrom === territory.id;
                    const isFortifyOrigin = fortifyFrom === territory.id;
                    const isAdjacentToOrigin = attackFrom ? isAdjacent(territory.id) : false;

                    // Determinar color del borde
                    let strokeColor = '#1F2937';
                    let strokeWidth = 2;
                    if (selected) {
                        strokeColor = '#FCD34D'; // Amarillo para seleccionado
                        strokeWidth = 4;
                    } else if (isAttackOrigin) {
                        strokeColor = '#EF4444'; // Rojo para origen de ataque
                        strokeWidth = 4;
                    } else if (isFortifyOrigin) {
                        strokeColor = '#3B82F6'; // Azul para origen de fortificar
                        strokeWidth = 4;
                    } else if (isAdjacentToOrigin && gameState?.phase === 'attack') {
                        strokeColor = '#F59E0B'; // Naranja para adyacentes en fase de ataque
                        strokeWidth = 3;
                    }

                    return (
                        <g key={territory.id}>
                            {/* Territory circle */}
                            <circle
                                cx={x}
                                cy={y}
                                r={40}
                                fill={color}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleTerritoryClick(territory.id)}
                            />

                            {/* Territory label */}
                            <text
                                x={x}
                                y={y - 50}
                                textAnchor="middle"
                                fill="white"
                                fontSize="12"
                                fontWeight="bold"
                                className="pointer-events-none"
                            >
                                {territory.name}
                            </text>

                            {/* Troop count */}
                            <text
                                x={x}
                                y={y + 5}
                                textAnchor="middle"
                                fill="white"
                                fontSize="16"
                                fontWeight="bold"
                                className="pointer-events-none"
                            >
                                {troopCount}
                            </text>

                            {/* Zone indicator */}
                            {territory.zone && territory.zone !== 'none' && (
                                <circle
                                    cx={x + 30}
                                    cy={y - 30}
                                    r={8}
                                    fill="#FCD34D"
                                    className="pointer-events-none"
                                />
                            )}
                        </g>
                    );
                })}

                {/* Render connections (adjacencies) */}
                {(mapData.adjacencies as [string, string][] | undefined)?.map((adjacency: [string, string]) => {
                    const [fromId, toId] = adjacency;
                    const from = mapData.territories.find((t: any) => t.id === fromId);
                    const to = mapData.territories.find((t: any) => t.id === toId);
                    if (!from || !to) return null;

                    const x1 = (from as any).x || 0;
                    const y1 = (from as any).y || 0;
                    const x2 = (to as any).x || 0;
                    const y2 = (to as any).y || 0;

                    return (
                        <line
                            key={`${fromId}-${toId}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#4B5563"
                            strokeWidth="2"
                            className="pointer-events-none"
                        />
                    );
                })}
            </svg>
        </div>
    );
}

