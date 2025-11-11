import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useGameStore } from '../store/gameStore';

export default function Admin() {
    const navigate = useNavigate();
    const { user, token } = useGameStore();
    const [balance, setBalance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!token || !user || user.role !== 'admin') {
            navigate('/login');
            return;
        }

        loadBalance();
    }, [token, user, navigate]);

    const loadBalance = async () => {
        try {
            setLoading(true);
            const data = await authService.getBalance();
            setBalance(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar balance');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');
            await authService.updateBalance(balance);
            setSuccess('Balance actualizado correctamente');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const updateValue = (path: string[], value: any) => {
        const newBalance = { ...balance };
        let current: any = newBalance;
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) {
                current[path[i]] = {};
            }
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        setBalance(newBalance);
    };

    const renderEditableField = (label: string, path: string[], value: any) => {
        const isNumber = typeof value === 'number';
        const isBoolean = typeof value === 'boolean';

        return (
            <div className="mb-4">
                <label className="block text-sm font-medium font-['Orbitron'] text-[#00d4ff] mb-1 uppercase tracking-wider">
                    {label}
                </label>
                {isBoolean ? (
                    <select
                        value={value ? 'true' : 'false'}
                        onChange={(e) => updateValue(path, e.target.value === 'true')}
                        className="modern-input w-full"
                    >
                        <option value="true">true</option>
                        <option value="false">false</option>
                    </select>
                ) : (
                    <input
                        type={isNumber ? 'number' : 'text'}
                        value={value}
                        onChange={(e) => updateValue(path, isNumber ? parseFloat(e.target.value) || 0 : e.target.value)}
                        className="modern-input w-full"
                    />
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-[#00d4ff] text-xl font-['Orbitron']">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] p-4">
            <div className="max-w-6xl mx-auto">
                <div className="modern-panel p-6 mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold text-[#ffd700] font-['Orbitron']">⚙️ PANEL DE ADMINISTRACIÓN</h1>
                        <button
                            onClick={() => navigate('/lobby')}
                            className="modern-button secondary"
                        >
                            ← Volver al Lobby
                        </button>
                    </div>

                    {error && (
                        <div className="bg-[#ff4444]/20 border-2 border-[#ff4444] text-[#ffaaaa] px-4 py-2 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-[#00ff88]/20 border-2 border-[#00ff88] text-[#88ffcc] px-4 py-2 rounded-lg mb-4">
                            {success}
                        </div>
                    )}

                    <div className="mb-4 flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="modern-button active"
                        >
                            {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                        </button>
                        <button
                            onClick={loadBalance}
                            className="modern-button secondary"
                        >
                            🔄 Recargar
                        </button>
                    </div>
                </div>

                {balance && (
                    <div className="modern-panel p-6 space-y-6">
                        <div>
                            <h2 className="modern-panel-header text-2xl mb-4">Economía</h2>
                            {renderEditableField('Ingreso base por territorio', ['economy', 'baseIncomePerTerritory'], balance.economy?.baseIncomePerTerritory || 0)}
                            {renderEditableField('Bonus héroe comerciante', ['economy', 'merchantHeroBonus'], balance.economy?.merchantHeroBonus || 0)}
                        </div>

                        <div>
                            <h2 className="modern-panel-header text-2xl mb-4">Costos de Unidades</h2>
                            {balance.unitCosts && Object.entries(balance.unitCosts).map(([key, value]: [string, any]) =>
                                renderEditableField(key, ['unitCosts', key], value)
                            )}
                        </div>

                        <div>
                            <h2 className="modern-panel-header text-2xl mb-4">Límites de Unidades</h2>
                            {balance.unitLimits && Object.entries(balance.unitLimits).map(([key, value]: [string, any]) =>
                                renderEditableField(key, ['unitLimits', key], value)
                            )}
                        </div>

                        <div>
                            <h2 className="modern-panel-header text-2xl mb-4">Combate</h2>
                            {renderEditableField('Umbral de daño', ['combat', 'damageThreshold'], balance.combat?.damageThreshold || 0)}
                            {renderEditableField('Regla de empate', ['combat', 'tieRule'], balance.combat?.tieRule || 'same_rank_both_die')}
                        </div>

                        <div>
                            <h2 className="modern-panel-header text-2xl mb-4">Configuración de Juego</h2>
                            {renderEditableField('Tiempo por turno (segundos)', ['gameSettings', 'defaultTurnTime'], balance.gameSettings?.defaultTurnTime || 120)}
                            {renderEditableField('Máximo de jugadores', ['gameSettings', 'maxPlayers'], balance.gameSettings?.maxPlayers || 4)}
                            {renderEditableField('Mínimo de jugadores', ['gameSettings', 'minPlayers'], balance.gameSettings?.minPlayers || 2)}
                            {renderEditableField('Oro inicial', ['gameSettings', 'startingGold'], balance.gameSettings?.startingGold || 0)}
                            {renderEditableField('Acciones iniciales', ['gameSettings', 'startingActions'], balance.gameSettings?.startingActions || 1)}
                        </div>

                        <div>
                            <h2 className="modern-panel-header text-2xl mb-4">Dados por Rango</h2>
                            {balance.rankDice && Object.entries(balance.rankDice).map(([key, value]: [string, any]) =>
                                renderEditableField(key, ['rankDice', key], value)
                            )}
                        </div>

                        <div>
                            <h2 className="modern-panel-header text-2xl mb-4">Zonas</h2>
                            {balance.zones && Object.entries(balance.zones).map(([zoneKey, zoneData]: [string, any]) => (
                                <div key={zoneKey} className="mb-6 p-4 modern-panel">
                                    <h3 className="text-xl font-bold text-[#ffd700] mb-3 font-['Orbitron']">{zoneKey}</h3>
                                    {zoneData && typeof zoneData === 'object' && Object.entries(zoneData).map(([key, value]: [string, any]) =>
                                        renderEditableField(key, ['zones', zoneKey, key], value)
                                    )}
                                </div>
                            ))}
                        </div>

                        <div>
                            <h2 className="modern-panel-header text-2xl mb-4">Caminos</h2>
                            {balance.paths && Object.entries(balance.paths).map(([pathKey, pathData]: [string, any]) => (
                                <div key={pathKey} className="mb-6 p-4 modern-panel">
                                    <h3 className="text-xl font-bold text-[#ffd700] mb-3 font-['Orbitron']">{pathKey}</h3>
                                    {pathData && typeof pathData === 'object' && Object.entries(pathData).map(([nodeKey, nodeData]: [string, any]) => (
                                        <div key={nodeKey} className="mb-4 p-3 bg-[#050508] rounded-lg border border-[#2a2a3e]">
                                            <h4 className="text-lg font-semibold text-[#00d4ff] mb-2 font-['Orbitron']">{nodeKey}</h4>
                                            {nodeData && typeof nodeData === 'object' && Object.entries(nodeData).map(([key, value]: [string, any]) =>
                                                renderEditableField(key, ['paths', pathKey, nodeKey, key], value)
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

