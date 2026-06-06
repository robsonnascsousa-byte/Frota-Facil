import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
    onSwitchToRegister?: () => void;
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

const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
    const { signIn, isConfigured } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message === 'Invalid login credentials'
                ? 'Email ou senha incorretos'
                : error.message);
        }

        setLoading(false);
    };

    if (!isConfigured) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0a0a' }}>
                <div className="p-8 rounded-lg max-w-md w-full" style={{ background: '#141414', border: '1px solid rgba(245,241,234,0.08)' }}>
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,42,42,0.1)' }}>
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#ff2a2a">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f1ea', fontFamily: '"Archivo Black", sans-serif' }}>
                            Supabase não configurado
                        </h2>
                        <p className="text-sm" style={{ color: '#8a8a8a' }}>
                            Configure as variáveis de ambiente para habilitar autenticação.
                        </p>
                    </div>
                    <div className="rounded p-4 text-sm" style={{ background: '#0a0a0a', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: '#8a8a8a' }}>
                        <p>VITE_SUPABASE_URL=...</p>
                        <p>VITE_SUPABASE_ANON_KEY=...</p>
                    </div>
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
                            ACESSE SUA CONTA
                        </h2>
                        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', letterSpacing: '0.15em', color: '#8a8a8a', marginTop: '8px' }}>
                            RODA · VIRA · LUCRA
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
                                <label htmlFor="email-address" className="block text-sm font-medium mb-1" style={{ color: '#8a8a8a', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.15em' }}>
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
                                    style={{ background: '#2a2a2a', border: '1px solid rgba(245,241,234,0.1)', color: '#f5f1ea', fontFamily: '"Inter", sans-serif' }}
                                    placeholder="seu@empresa.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: '#8a8a8a', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.15em' }}>
                                    SENHA
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded px-4 py-3 text-sm transition-all"
                                    style={{ background: '#2a2a2a', border: '1px solid rgba(245,241,234,0.1)', color: '#f5f1ea', fontFamily: '"Inter", sans-serif' }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded"
                                    style={{ accentColor: '#ff2a2a' }}
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm" style={{ color: '#8a8a8a' }}>
                                    Lembrar de mim
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" style={{ color: '#ff2a2a', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px' }} className="hover:opacity-80 transition-opacity">
                                    Esqueceu a senha?
                                </a>
                            </div>
                        </div>

                        {onSwitchToRegister && (
                            <div className="text-sm text-center mt-4">
                                <span style={{ color: '#8a8a8a' }}>Não tem uma conta? </span>
                                <button
                                    type="button"
                                    onClick={onSwitchToRegister}
                                    className="font-medium transition-opacity hover:opacity-80"
                                    style={{ color: '#ff2a2a' }}
                                >
                                    Cadastre-se
                                </button>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex w-full justify-center rounded py-3.5 px-4 text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                                style={{ 
                                    background: '#ff2a2a', 
                                    color: '#0a0a0a', 
                                    fontFamily: '"Archivo Black", sans-serif',
                                    letterSpacing: '0.05em',
                                    boxShadow: '0 4px 20px rgba(255,42,42,0.3)',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#0a0a0a' }}>
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        ACESSANDO...
                                    </>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        ENTRAR
                                        <svg className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(245,241,234,0.08)' }}>
                        <p className="text-center" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.2em', color: '#8a8a8a' }}>
                            © 2026 CARFLIPPING.BR — GESTÃO DE FROTA
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Brand Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a0a0a)' }}>
                {/* Red glow */}
                <div className="absolute right-[-200px] top-[-200px] w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(circle, #ff2a2a 0%, transparent 60%)', opacity: 0.12, filter: 'blur(40px)' }} />
                
                {/* Diagonal pattern */}
                <div className="absolute inset-0" style={{ 
                    backgroundImage: 'linear-gradient(135deg, transparent 49.5%, rgba(255,42,42,0.06) 49.5%, rgba(255,42,42,0.06) 50%, transparent 50%)',
                    backgroundSize: '40px 40px'
                }} />

                {/* Content */}
                <div className="relative z-10 max-w-md text-center px-12">
                    <LogoMonogram size={120} />
                    <h2 className="mt-8" style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: '0.9', letterSpacing: '-0.03em', color: '#f5f1ea', textTransform: 'uppercase' }}>
                        BUY<span style={{ color: '#ff2a2a' }}>.</span><br/>
                        DRIVE<span style={{ color: '#ff2a2a' }}>.</span><br/>
                        FLIP<span style={{ color: '#ff2a2a' }}>.</span>
                    </h2>
                    <div className="mt-6" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', letterSpacing: '0.15em', color: '#8a8a8a', lineHeight: '2' }}>
                        <p>GESTÃO DE FROTA</p>
                        <p>LOCAÇÃO INTELIGENTE</p>
                        <p>FLIP AUTOMOTIVO</p>
                    </div>
                    <div className="mt-8 mx-auto" style={{ width: '40px', height: '3px', background: '#ff2a2a' }} />
                </div>
            </div>
        </div>
    );

};

export default Login;
