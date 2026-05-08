import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
    onSwitchToRegister?: () => void;
}

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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-petrol-blue-900 to-slate-900 p-4">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                            Supabase não configurado
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Configure as variáveis de ambiente para habilitar autenticação.
                        </p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-sm font-mono">
                        <p className="text-slate-600 dark:text-slate-300">VITE_SUPABASE_URL=...</p>
                        <p className="text-slate-600 dark:text-slate-300">VITE_SUPABASE_ANON_KEY=...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white dark:bg-slate-900">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-md w-full space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <div className="inline-flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-petrol-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-petrol-blue-500/20">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">FrotaFácil</h1>
                        </div>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Acesse sua conta
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Gerencie sua frota com inteligência e eficiência
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4 rounded-md shadow-sm">
                            <div>
                                <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    E-mail corporativo
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="relative block w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:z-10 focus:border-petrol-blue-500 focus:outline-none focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-800 transition-colors"
                                    placeholder="seu@empresa.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Senha
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="relative block w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:z-10 focus:border-petrol-blue-500 focus:outline-none focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-800 transition-colors"
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
                                    className="h-4 w-4 rounded border-slate-300 text-petrol-blue-600 focus:ring-petrol-blue-500 bg-white dark:bg-slate-700"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-400">
                                    Lembrar de mim
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-petrol-blue-600 hover:text-petrol-blue-500">
                                    Esqueceu a senha?
                                </a>
                            </div>
                        </div>

                        {onSwitchToRegister && (
                            <div className="text-sm text-center mt-4">
                                <span className="text-slate-600 dark:text-slate-400">Não tem uma conta? </span>
                                <button
                                    type="button"
                                    onClick={onSwitchToRegister}
                                    className="font-medium text-petrol-blue-600 hover:text-petrol-blue-500 transition-colors"
                                >
                                    Cadastre-se
                                </button>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex w-full justify-center rounded-lg border border-transparent bg-petrol-blue-600 py-3 px-4 text-sm font-semibold text-white hover:bg-petrol-blue-700 focus:outline-none focus:ring-2 focus:ring-petrol-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-petrol-blue-500/30 transition-all hover:-translate-y-0.5"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Acessando...
                                    </>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Entrar
                                        <svg className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                        <p className="text-xs text-center text-slate-500 dark:text-slate-500">
                            © 2026 FrotaFácil. Protegido por autenticação segura.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Image */}
            <div className="hidden lg:block lg:w-1/2 relative bg-slate-900">
                <img
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    src="/login-car.png"
                    alt="FrotaFácil Car"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
                    <div className="max-w-lg space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                            Comece a organizar sua frota hoje
                        </h2>
                        <p className="text-lg text-slate-200 drop-shadow-sm">
                            Simplifique a gestão dos seus veículos, motoristas e manutenções em uma plataforma única e intuitiva.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default Login;
