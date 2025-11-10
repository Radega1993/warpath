import {
    GameState,
    GamePhase,
    Player,
    TerritoryState,
    Troops,
    PathType,
    UnitRank,
    HeroType,
    ZoneType
} from './types';
import { SeededRNG } from './rng';
import { resolveCombat, createEmptyTroops, sumTroops } from './combat';
import { calculateIncome, calculateActions, canAffordUnit, canDeployRank, calculateUnitCost } from './economy';
import { CombatModifiers } from './types';

/**
 * Máquina de estados finitos (FSM) para el juego
 */
export class GameFSM {
    private state: GameState;
    private rng: SeededRNG;

    constructor(state: GameState) {
        this.state = state;
        this.rng = new SeededRNG(state.seed);
    }

    /**
     * Obtiene el estado actual
     */
    getState(): GameState {
        return { ...this.state };
    }

    /**
     * Inicia una nueva partida
     */
    startGame(): void {
        if (this.state.phase !== GamePhase.LOBBY) {
            throw new Error('Game can only start from LOBBY phase');
        }

        // Asignar spawns a jugadores
        const players = Object.values(this.state.players);
        const spawnTerritories = Object.values(this.state.territories)
            .filter(t => t.isSpawn)
            .sort((a, b) => {
                const aSpawn = this.state.territories[a.id]?.isSpawn ? 0 : 1;
                const bSpawn = this.state.territories[b.id]?.isSpawn ? 0 : 1;
                return aSpawn - bSpawn;
            });

        players.forEach((player, index) => {
            if (spawnTerritories[index]) {
                const spawn = spawnTerritories[index];
                spawn.ownerId = player.id;
                spawn.troops = { ...createEmptyTroops(), [UnitRank.WARRIOR]: 3 };
                player.territories.push(spawn.id);
            }
        });

        // Inicializar oro y acciones
        players.forEach(player => {
            player.gold = 200; // Oro inicial
            player.actions = calculateActions(player);
            player.actionsLeft = player.actions;
        });

        // Primer turno: fase de despliegue
        this.state.turn = 1;
        this.state.currentPlayerId = players[0].id;
        this.state.phase = GamePhase.DEPLOY;
    }

    /**
     * Despliega tropas en un territorio
     */
    deployTroops(territoryId: string, troops: Troops): void {
        if (this.state.phase !== GamePhase.DEPLOY) {
            throw new Error('Can only deploy in DEPLOY phase');
        }

        const player = this.state.players[this.state.currentPlayerId];
        if (!player) {
            throw new Error('Current player not found');
        }

        const territory = this.state.territories[territoryId];
        if (!territory) {
            throw new Error('Territory not found');
        }

        if (territory.ownerId !== player.id) {
            throw new Error('Can only deploy to own territories');
        }

        // Verificar costes y límites
        let totalCost = 0;
        for (const rank of Object.keys(troops) as UnitRank[]) {
            const count = troops[rank];
            if (count <= 0) continue;

            if (!canDeployRank(player, rank)) {
                throw new Error(`Cannot deploy ${rank} - path not unlocked`);
            }

            if (!canAffordUnit(player, rank, count)) {
                throw new Error(`Cannot afford ${count} ${rank}`);
            }

            totalCost += calculateUnitCost(rank, player) * count;
        }

        // Aplicar despliegue
        player.gold -= totalCost;
        for (const rank of Object.keys(troops) as UnitRank[]) {
            territory.troops[rank] += troops[rank];
        }

        player.actionsLeft--;
    }

    /**
     * Ataca un territorio
     */
    attackTerritory(
        fromId: string,
        toId: string,
        attackerCommits: Troops,
        defenderCommits: Troops
    ): void {
        if (this.state.phase !== GamePhase.ATTACK) {
            throw new Error('Can only attack in ATTACK phase');
        }

        const player = this.state.players[this.state.currentPlayerId];
        if (!player) {
            throw new Error('Current player not found');
        }

        const fromTerritory = this.state.territories[fromId];
        const toTerritory = this.state.territories[toId];

        if (!fromTerritory || !toTerritory) {
            throw new Error('Territory not found');
        }

        if (fromTerritory.ownerId !== player.id) {
            throw new Error('Can only attack from own territories');
        }

        // Verificar adyacencia (esto debería venir del mapa)
        // Por ahora asumimos que es válido

        // Verificar que hay tropas suficientes
        for (const rank of Object.keys(attackerCommits) as UnitRank[]) {
            if (attackerCommits[rank] > fromTerritory.troops[rank]) {
                throw new Error(`Not enough ${rank} troops`);
            }
        }

        // Calcular modificadores de combate
        const modifiers = this.calculateCombatModifiers(player, toTerritory);

        // Resolver combate
        const result = resolveCombat(attackerCommits, defenderCommits, modifiers, this.rng);

        // Aplicar pérdidas
        for (const rank of Object.keys(result.attackerLosses) as UnitRank[]) {
            fromTerritory.troops[rank] -= result.attackerLosses[rank];
        }

        if (toTerritory.ownerId) {
            const defender = this.state.players[toTerritory.ownerId];
            if (defender) {
                for (const rank of Object.keys(result.defenderLosses) as UnitRank[]) {
                    toTerritory.troops[rank] -= result.defenderLosses[rank];
                }
            }
        }

        // Si hubo conquista
        if (result.conquest) {
            if (toTerritory.ownerId) {
                const oldOwner = this.state.players[toTerritory.ownerId];
                if (oldOwner) {
                    oldOwner.territories = oldOwner.territories.filter(id => id !== toId);
                }
            }

            toTerritory.ownerId = player.id;
            player.territories.push(toId);

            // Mover tropas atacantes al territorio conquistado
            for (const rank of Object.keys(attackerCommits) as UnitRank[]) {
                const moved = attackerCommits[rank] - result.attackerLosses[rank];
                fromTerritory.troops[rank] -= moved;
                toTerritory.troops[rank] += moved;
            }
        }

        player.actionsLeft--;
    }

    /**
     * Fortifica (mueve tropas entre territorios propios)
     */
    fortify(fromId: string, toId: string, troops: Troops): void {
        if (this.state.phase !== GamePhase.FORTIFY) {
            throw new Error('Can only fortify in FORTIFY phase');
        }

        const player = this.state.players[this.state.currentPlayerId];
        if (!player) {
            throw new Error('Current player not found');
        }

        const fromTerritory = this.state.territories[fromId];
        const toTerritory = this.state.territories[toId];

        if (!fromTerritory || !toTerritory) {
            throw new Error('Territory not found');
        }

        if (fromTerritory.ownerId !== player.id || toTerritory.ownerId !== player.id) {
            throw new Error('Can only fortify between own territories');
        }

        // Verificar que hay tropas suficientes
        for (const rank of Object.keys(troops) as UnitRank[]) {
            if (troops[rank] > fromTerritory.troops[rank]) {
                throw new Error(`Not enough ${rank} troops`);
            }
        }

        // Mover tropas
        for (const rank of Object.keys(troops) as UnitRank[]) {
            fromTerritory.troops[rank] -= troops[rank];
            toTerritory.troops[rank] += troops[rank];
        }

        player.actionsLeft--;
    }

    /**
     * Sube de nivel un Camino
     */
    upgradePath(pathType: PathType): void {
        if (this.state.phase !== GamePhase.DEPLOY && this.state.phase !== GamePhase.ATTACK) {
            throw new Error('Can only upgrade path in DEPLOY or ATTACK phase');
        }

        const player = this.state.players[this.state.currentPlayerId];
        if (!player) {
            throw new Error('Current player not found');
        }

        const currentLevel = player.paths[pathType];
        if (currentLevel >= 3) {
            throw new Error('Path already at maximum level');
        }

        // Coste: 100 * (nivel + 1)
        const cost = 100 * (currentLevel + 1);
        if (player.gold < cost) {
            throw new Error('Not enough gold');
        }

        player.gold -= cost;
        player.paths[pathType] = (currentLevel + 1) as 1 | 2 | 3;

        // Actualizar nivel de clan si es necesario
        this.updateClanLevel(player);

        player.actionsLeft--;
    }

    /**
     * Termina el turno del jugador actual
     */
    endTurn(): void {
        const player = this.state.players[this.state.currentPlayerId];
        if (!player) {
            throw new Error('Current player not found');
        }

        // Calcular ingresos
        const income = calculateIncome(player, this.state.territories);
        player.gold += income;

        // Pasar al siguiente jugador
        const players = Object.values(this.state.players);
        const currentIndex = players.findIndex(p => p.id === player.id);
        const nextIndex = (currentIndex + 1) % players.length;
        const nextPlayer = players[nextIndex];

        this.state.turn++;
        this.state.currentPlayerId = nextPlayer.id;
        this.state.phase = GamePhase.DEPLOY;

        // Resetear acciones
        nextPlayer.actions = calculateActions(nextPlayer);
        nextPlayer.actionsLeft = nextPlayer.actions;

        // Verificar condición de victoria
        this.checkVictoryCondition();
    }

    /**
     * Calcula los modificadores de combate
     */
    private calculateCombatModifiers(
        attacker: Player,
        defenderTerritory: TerritoryState
    ): CombatModifiers {
        const modifiers: CombatModifiers = {
            attackerEfficiency: false,
            defenderEfficiency: false,
            attackerRerolls: 0,
            defenderRerolls: 0,
            defenderDefenseBonus: 0,
            maxTroopsPerSide: undefined
        };

        // Eficacia del atacante
        if (attacker.heroId === HeroType.STRATEGIST || attacker.paths[PathType.WAR] >= 1) {
            modifiers.attackerEfficiency = true;
        }

        // Rerolls del atacante
        if (attacker.heroId === HeroType.MASTER) {
            modifiers.attackerRerolls = 3;
        }

        // Eficacia del defensor
        if (defenderTerritory.zone === ZoneType.BATTLE) {
            modifiers.defenderEfficiency = true;
        }

        // Bonificación de defensa (Zona Amurallada)
        if (defenderTerritory.zone === ZoneType.WALLED) {
            modifiers.defenderDefenseBonus = 2;
        }

        // Límite de tropas (Zona Defensiva)
        if (defenderTerritory.zone === ZoneType.DEFENSIVE) {
            modifiers.maxTroopsPerSide = 10;
        }

        return modifiers;
    }

    /**
     * Actualiza el nivel del clan según los caminos
     */
    private updateClanLevel(player: Player): void {
        const clanLevel = player.paths[PathType.CLAN];

        if (clanLevel >= 1 && player.clanLevel < 2) {
            player.clanLevel = 2;
        }
        if (clanLevel >= 2 && player.clanLevel < 3) {
            player.clanLevel = 3;
        }
    }

    /**
     * Verifica condición de victoria
     */
    private checkVictoryCondition(): void {
        const players = Object.values(this.state.players);

        // Condición: controlar más del 50% de territorios
        const totalTerritories = Object.keys(this.state.territories).length;
        const threshold = Math.floor(totalTerritories * 0.5) + 1;

        for (const player of players) {
            if (player.territories.length >= threshold) {
                this.state.phase = GamePhase.GAME_OVER;
                this.state.winnerId = player.id;
                break;
            }
        }
    }
}

