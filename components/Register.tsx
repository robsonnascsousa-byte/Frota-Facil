import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterProps {
    onSwitchToLogin: () => void;
}

// Brand Logo Monogram
const LogoMonogram: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="none" stroke="#ff2a2a" strokeWidth="3"/>
    <circle cx="50" cy="50" r="38" fill="none" stroke="#f5f1ea" strokeWidth="1"/>
    <path d="M 28 50 L 72 50" stroke="#f5f1ea" strokeWidth="4" strokeLinecap="square"/>
    <path d="M 65 42 L 72 50 L 65 58" stroke="#ff2a2a" strokeWidth="4" fill="none" strokeLinecap="square" strokeLinejoin="miter"/>
    <path d="M 35 42 L 28 50 L 35 58" stroke="#ff2a2a" strokeWidth="4" fill="none" strokeLinecap="square" strokeLinejoin="miter"/>
    <line x1="50" y1="8" x2="50" y2="14" stroke="#f5f1ea" strokeWidth="2"/>
    <line x1="50" y1="86" x2="50" y2="92" stroke="#f5f1ea" strokeWidth="2"/>
    <line x1="8" y1="50" x2="14" y2="50" stroke="#f5f1ea" strokeWidth="2"/>
    <line x1="86" y1="50" x2="92" y2="50" stroke="#f5f1ea" strokeWidth="2"/>
  </svg>
);

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
    const { signUp } = useAuth();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        const { error } = await signUp(email, password, nome);

        if (error) {
            if (error.message.includes('already registered')) {
                setError('Este e-mail já está cadastrado');
            } else {
                setError(error.message);
            }
        } else {
            setSuccess(true);
        }

        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0a0a' }}>
                <div className="rounded-lg p-8 max-w-md w-full text-center" style={{ background: '#141414', border: '1px solid rgba(245,241,234,0.08)' }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.1)' }}>
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#22c55e">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Archivo Black", sans-serif', color: '#f5f1ea' }}>
                        CADASTRO REALIZADO
                    </h2>
                    <p className="mb-6" style={{ color: '#8a8a8a', fontSize: '14px' }}>
                        Verifique seu e-mail para confirmar a conta.
                    </p>
                    <button
                        onClick={onSwitchToLogin}
                        className="w-full py-3 font-bold rounded transition-all hover:-translate-y-0.5"
                        style={{ background: '#ff2a2a', color: '#0a0a0a', fontFamily: '"Archivo Black", sans-serif', letterSpacing: '0.05em', boxShadow: '0 4px 20px rgba(255,42,42,0.3)' }}
                    >
                        IR PARA LOGIN
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex" style={{ background: '#0a0a0a' }}>
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-md w-full space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <div className="inline-flex items-center gap-4 mb-4">
                            <LogoMonogram size={56} />
                        </div>
                        <div className="flex flex-col items-center gap-1 mb-2">
                            <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '32px', letterSpacing: '-0.03em', color: '#f5f1ea' }}>
                                CARFLIPPING<span style={{ color: '#ff2a2a' }}>.</span>BR
                            </h1>
                        </div>
                        <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '28px', letterSpacing: '0.05em', color: '#f5f1ea', marginTop: '8px' }}>
                            CRIE SUA CONTA
                        </h2>
                        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', letterSpacing: '0.15em', color: '#8a8a8a', marginTop: '8px' }}>
                            BUY · DRIVE · FLIP · REPEAT
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="p-4 rounded flex items-center gap-3" style={{ background: 'rgba(255,42,42,0.1)', border: '1px solid rgba(255,42,42,0.3)' }}>
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#ff2a2a">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium" style={{ color: '#ff6b6b' }}>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="nome" className="block mb-1" style={{ color: '#8a8a8a', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.15em' }}>
                                    NOME COMPLETO
                                </label>
                                <input
                                    id="nome"
                                    name="nome"
                                    type="text"
                                    required
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="block w-full rounded px-4 py-3 text-sm transition-all"
                                    style={{ background: '#2a2a2a', border: '1px solid rgba(245,241,234,0.1)', color: '#f5f1ea' }}
                                    placeholder="Seu nome"
                                />
                            </div>
                            <div>
                                <label htmlFor="email-address" className="block mb-1" style={{ color: '#8a8a8a', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.15em' }}>
                                    E-MAIL
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded px-4 py-3 text-sm transition-all"
                                    style={{ background: '#2a2a2a', border: '1px solid rgba(245,241,234,0.1)', color: '#f5f1ea' }}
                                    placeholder="seu@email.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block mb-1" style={{ color: '#8a8a8a', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.15em' }}>
                                    SENHA
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded px-4 py-3 text-sm transition-all"
                                    style={{ background: '#2a2a2a', border: '1px solid rgba(245,241,234,0.1)', color: '#f5f1ea' }}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block mb-1" style={{ color: '#8a8a8a', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.15em' }}>
                                    CONFIRMAR SENHA
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full rounded px-4 py-3 text-sm transition-all"
                                    style={{ background: '#2a2a2a', border: '1px solid rgba(245,241,234,0.1)', color: '#f5f1ea' }}
                                    placeholder="Repita a senha"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex w-full justify-center rounded py-3.5 px-4 text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                                style={{ background: '#ff2a2a', color: '#0a0a0a', fontFamily: '"Archivo Black", sans-serif', letterSpacing: '0.05em', boxShadow: '0 4px 20px rgba(255,42,42,0.3)' }}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" style={{ color: '#0a0a0a' }}>
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        CRIANDO CONTA...
                                    </>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        CRIAR CONTA
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm" style={{ color: '#8a8a8a' }}>
                        Já tem uma conta?{' '}
                        <button onClick={onSwitchToLogin} className="font-medium transition-opacity hover:opacity-80" style={{ color: '#ff2a2a' }}>
                            Entrar
                        </button>
                    </p>

                    <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(245,241,234,0.08)' }}>
                        <p className="text-center" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.2em', color: '#8a8a8a' }}>
                            © 2026 CARFLIPPING.BR — GESTÃO DE FROTA
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Brand Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a0a0a)' }}>
                <div className="absolute right-[-200px] top-[-200px] w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(circle, #ff2a2a 0%, transparent 60%)', opacity: 0.12, filter: 'blur(40px)' }} />
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(135deg, transparent 49.5%, rgba(255,42,42,0.06) 49.5%, rgba(255,42,42,0.06) 50%, transparent 50%)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 max-w-md text-center px-12">
                    <LogoMonogram size={120} />
                    <h2 className="mt-8" style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: '0.9', letterSpacing: '-0.03em', color: '#f5f1ea', textTransform: 'uppercase' }}>
                        RODA<span style={{ color: '#ff2a2a' }}>.</span><br/>
                        VIRA<span style={{ color: '#ff2a2a' }}>.</span><br/>
                        LUCRA<span style={{ color: '#ff2a2a' }}>.</span>
                    </h2>
                    <div className="mt-8 mx-auto" style={{ width: '40px', height: '3px', background: '#ff2a2a' }} />
                    <ul className="mt-8 space-y-3 text-left" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', letterSpacing: '0.1em', color: '#8a8a8a' }}>
                        <li className="flex items-center gap-3">
                            <span style={{ color: '#ff2a2a' }}>+</span>
                            <span style={{ color: '#f5f1ea' }}>Controle total de veículos</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span style={{ color: '#ff2a2a' }}>+</span>
                            <span style={{ color: '#f5f1ea' }}>Gestão financeira integrada</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span style={{ color: '#ff2a2a' }}>+</span>
                            <span style={{ color: '#f5f1ea' }}>Flip de leilão automatizado</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );

};

export default Register;
