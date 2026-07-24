import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword: React.FC = () => {
    const { updatePassword, clearPasswordRecovery, signOut } = useAuth();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        if (password !== confirm) {
            setError('As senhas não coincidem');
            return;
        }

        setLoading(true);
        const { error } = await updatePassword(password);
        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
            setTimeout(() => {
                if (window.location.hash === '#trocar-senha') {
                    window.location.hash = '';
                }
                clearPasswordRecovery();
            }, 2000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0a' }}>
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '32px', letterSpacing: '-0.03em', color: '#f5f1ea' }}>
                        CARFLIPPING<span style={{ color: '#ff2a2a' }}>.</span>BR
                    </h1>
                    <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '28px', letterSpacing: '0.05em', color: '#f5f1ea', marginTop: '8px' }}>
                        DEFINIR NOVA SENHA
                    </h2>
                    <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', letterSpacing: '0.15em', color: '#8a8a8a', marginTop: '8px' }}>
                        ESCOLHA UMA SENHA NOVA PARA SUA CONTA
                    </p>
                </div>

                {error && (
                    <div className="p-4 rounded" style={{ background: 'rgba(255,42,42,0.1)', border: '1px solid rgba(255,42,42,0.3)' }}>
                        <span className="text-sm font-medium" style={{ color: '#ff6b6b' }}>{error}</span>
                    </div>
                )}

                {success ? (
                    <div className="p-4 rounded text-center" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)' }}>
                        <span className="text-sm font-medium" style={{ color: '#4ade80' }}>
                            Senha alterada com sucesso! Entrando...
                        </span>
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium mb-1" style={{ color: '#8a8a8a', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.15em' }}>
                                    NOVA SENHA
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded px-4 py-3 text-sm transition-all"
                                    style={{ background: '#2a2a2a', border: '1px solid rgba(245,241,234,0.1)', color: '#f5f1ea', fontFamily: '"Inter", sans-serif' }}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium mb-1" style={{ color: '#8a8a8a', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.15em' }}>
                                    CONFIRMAR SENHA
                                </label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className="block w-full rounded px-4 py-3 text-sm transition-all"
                                    style={{ background: '#2a2a2a', border: '1px solid rgba(245,241,234,0.1)', color: '#f5f1ea', fontFamily: '"Inter", sans-serif' }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full justify-center rounded py-3.5 px-4 text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                            style={{
                                background: '#ff2a2a',
                                color: '#0a0a0a',
                                fontFamily: '"Archivo Black", sans-serif',
                                letterSpacing: '0.05em',
                                boxShadow: '0 4px 20px rgba(255,42,42,0.3)',
                            }}
                        >
                            {loading ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
                        </button>

                        <button
                            type="button"
                            onClick={async () => {
                                if (window.location.hash === '#trocar-senha') {
                                    window.location.hash = '';
                                    clearPasswordRecovery();
                                    window.location.reload();
                                    return;
                                }
                                clearPasswordRecovery();
                                await signOut();
                            }}
                            className="block w-full text-center text-sm transition-opacity hover:opacity-80"
                            style={{ color: '#8a8a8a', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px' }}
                        >
                            Cancelar
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
