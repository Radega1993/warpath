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
        <div className="w-full h-full relative overflow-hidden bg-[#050508]">

            <svg
                viewBox="0 0 1000 800"
                className="w-full h-full relative z-10"
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

                    // Determinar color del borde y efectos
                    let strokeColor = '#2a2a3e'; // Color moderno por defecto
                    let strokeWidth = 2;
                    let filter = '';
                    let className = 'cursor-pointer transition-all duration-300';

                    if (selected) {
                        strokeColor = '#00d4ff'; // Cyan para seleccionado
                        strokeWidth = 4;
                        filter = 'url(#glow-cyan)';
                        className += ' pulse-glow';
                    } else if (isAttackOrigin) {
                        strokeColor = '#ff4444'; // Rojo para origen de ataque
                        strokeWidth = 4;
                        filter = 'url(#glow-red)';
                    } else if (isFortifyOrigin) {
                        strokeColor = '#00d4ff'; // Cyan para origen de fortificar
                        strokeWidth = 4;
                        filter = 'url(#glow-cyan)';
                    } else if (isAdjacentToOrigin && gameState?.phase === 'attack') {
                        strokeColor = '#ffaa00'; // Naranja para adyacentes en fase de ataque
                        strokeWidth = 3;
                    }

                    // Efecto hover
                    className += ' hover:opacity-90 hover:scale-110';

                    return (
                        <g key={territory.id}>
                            {/* Filtros de glow */}
                            <defs>
                                <filter id="glow-cyan">
                                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <filter id="glow-red">
                                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Sombra del territorio */}
                            <circle
                                cx={x + 2}
                                cy={y + 2}
                                r={40}
                                fill="rgba(0, 0, 0, 0.5)"
                                className="pointer-events-none"
                            />

                            {/* Territory circle */}
                            <circle
                                cx={x}
                                cy={y}
                                r={40}
                                fill={color}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                filter={filter}
                                className={className}
                                onClick={() => handleTerritoryClick(territory.id)}
                                style={{
                                    filter: selected ? 'drop-shadow(0 0 15px #00d4ff)' : undefined
                                }}
                            />

                            {/* Borde interior para profundidad */}
                            <circle
                                cx={x}
                                cy={y}
                                r={36}
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.15)"
                                strokeWidth={1}
                                className="pointer-events-none"
                            />

                            {/* Badge con número de tropas */}
                            <g className="pointer-events-none">
                                {/* Fondo del badge */}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={18}
                                    fill="#1a1a2e"
                                    stroke="#00d4ff"
                                    strokeWidth={2}
                                />
                                {/* Número de tropas */}
                                <text
                                    x={x}
                                    y={y + 6}
                                    textAnchor="middle"
                                    fill="#00d4ff"
                                    fontSize="16"
                                    fontWeight="bold"
                                    fontFamily="Orbitron, sans-serif"
                                >
                                    {troopCount}
                                </text>
                            </g>

                            {/* Nombre del territorio */}
                            <text
                                x={x}
                                y={y - 55}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="11"
                                fontWeight="600"
                                fontFamily="Rajdhani, sans-serif"
                                className="pointer-events-none"
                                style={{
                                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)'
                                }}
                            >
                                {territory.name}
                            </text>

                            {/* Zone indicator con icono */}
                            {territory.zone && territory.zone !== 'none' && (
                                <g className="pointer-events-none">
                                    <circle
                                        cx={x + 30}
                                        cy={y - 30}
                                        r={14}
                                        fill="#1a1a2e"
                                        stroke="#ffd700"
                                        strokeWidth={2}
                                    />
                                    <text
                                        x={x + 30}
                                        y={y - 25}
                                        textAnchor="middle"
                                        fontSize="16"
                                    >
                                        {territory.zone === 'oro' ? '💰' :
                                            territory.zone === 'reclutamiento' ? '⚔️' :
                                                territory.zone === 'veloz' ? '⚡' :
                                                    territory.zone === 'batalla' ? '🗡️' :
                                                        territory.zone === 'amurallada' ? '🏰' :
                                                            territory.zone === 'defensiva' ? '🛡️' : '⭐'}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Render connections (adjacencies) - solo visibles al hover */}
                {(mapData.adjacencies as [string, string][] | undefined)?.map((adjacency: [string, string]) => {
                    const [fromId, toId] = adjacency;
                    const from = mapData.territories.find((t: any) => t.id === fromId);
                    const to = mapData.territories.find((t: any) => t.id === toId);
                    if (!from || !to) return null;

                    const x1 = (from as any).x || 0;
                    const y1 = (from as any).y || 0;
                    const x2 = (to as any).x || 0;
                    const y2 = (to as any).y || 0;

                    // Mostrar conexiones solo si uno de los territorios está seleccionado o es adyacente
                    const shouldShow = selectedTerritory === fromId || selectedTerritory === toId ||
                        attackFrom === fromId || attackFrom === toId ||
                        fortifyFrom === fromId || fortifyFrom === toId;

                    return (
                        <line
                            key={`${fromId}-${toId}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={shouldShow ? 'rgba(0, 212, 255, 0.6)' : 'rgba(42, 42, 62, 0.3)'}
                            strokeWidth={shouldShow ? 2 : 1}
                            strokeDasharray={shouldShow ? '0' : '5,5'}
                            className="pointer-events-none transition-all duration-300"
                        />
                    );
                })}
            </svg>
        </div>
    );
}

