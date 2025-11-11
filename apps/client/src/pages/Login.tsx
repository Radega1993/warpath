import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useGameStore } from '../store/gameStore';

export default function Login() {
    const navigate = useNavigate();
    const { setUser, setToken, setUserId } = useGameStore();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [handle, setHandle] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;
            if (isLogin) {
                result = await authService.login({ email, password });
            } else {
                if (!handle.trim()) {
                    setError('El nombre de usuario es requerido');
                    setLoading(false);
                    return;
                }
                result = await authService.register({ email, password, handle });
            }

            setUser(result.user);
            setToken(result.token);
            setUserId(result.user.userId);

            // Redirigir según el rol
            if (result.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/lobby');
            }
        } catch (err: any) {
            setError(err.message || 'Error al autenticar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="modern-panel p-8 w-full max-w-md slide-in">
                <h1 className="font-['Orbitron'] text-4xl text-center mb-2 text-[#00d4ff] font-bold">
                    ⚔️ WARPATH
                </h1>
                <p className="text-center text-[#b0b0b0] mb-8 italic font-['Rajdhani']">
                    {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium font-['Orbitron'] mb-2 text-[#00d4ff] uppercase tracking-wider">
                                Nombre de usuario
                            </label>
                            <input
                                type="text"
                                value={handle}
                                onChange={(e) => setHandle(e.target.value)}
                                className="modern-input w-full"
                                placeholder="MiNombre"
                                maxLength={20}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium font-['Orbitron'] mb-2 text-[#00d4ff] uppercase tracking-wider">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="modern-input w-full"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium font-['Orbitron'] mb-2 text-[#00d4ff] uppercase tracking-wider">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="modern-input w-full"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="bg-[#ff4444]/20 border-2 border-[#ff4444] text-[#ffaaaa] px-4 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full modern-button disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="text-3xl">
                            {loading ? '⏳' : isLogin ? '🔐' : '📝'}
                        </span>
                        <span>{loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}</span>
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        className="text-[#00d4ff] hover:text-[#00aacc] text-sm transition-colors font-['Rajdhani']"
                    >
                        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-[#b0b0b0] hover:text-[#00d4ff] text-sm transition-colors font-['Rajdhani']"
                    >
                        ← Volver al inicio
                    </button>
                </div>

                {/* Credenciales de administrador (solo desarrollo) */}
                {import.meta.env.DEV && (
                    <div className="mt-6 p-4 bg-[#ffaa00]/20 border-2 border-[#ffaa00] rounded-lg">
                        <p className="text-xs text-[#ffaa00] font-bold mb-2 font-['Orbitron']">🔧 DESARROLLO - Credenciales Admin:</p>
                        <div className="text-xs text-[#ffcc88] space-y-1 font-['Rajdhani']">
                            <div>
                                <span className="font-semibold">Email:</span>{' '}
                                <span
                                    className="cursor-pointer hover:text-[#ffaa00] select-all"
                                    onClick={() => setEmail('admin@warpath.com')}
                                >
                                    admin@warpath.com
                                </span>
                            </div>
                            <div>
                                <span className="font-semibold">Password:</span>{' '}
                                <span
                                    className="cursor-pointer hover:text-[#ffaa00] select-all"
                                    onClick={() => setPassword('admin123')}
                                >
                                    admin123
                                </span>
                            </div>
                            <p className="text-[#ffaa00]/70 mt-2 italic">
                                Click en las credenciales para autocompletar
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

