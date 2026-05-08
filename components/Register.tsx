import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterProps {
    onSwitchToLogin: () => void;
}

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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-petrol-blue-900 to-slate-900 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                        Cadastro realizado!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Verifique seu e-mail para confirmar a conta.
                    </p>
                    <button
                        onClick={onSwitchToLogin}
                        className="w-full py-3 bg-petrol-blue-600 hover:bg-petrol-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        Ir para Login
                    </button>
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
                            Crie sua conta
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Comece a usar agora mesmo, é grátis.
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
                                <label htmlFor="nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nome completo
                                </label>
                                <input
                                    id="nome"
                                    name="nome"
                                    type="text"
                                    required
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="relative block w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:z-10 focus:border-petrol-blue-500 focus:outline-none focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-800 transition-colors"
                                    placeholder="Seu nome"
                                />
                            </div>
                            <div>
                                <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    E-mail
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
                                    placeholder="seu@email.com"
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
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="relative block w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:z-10 focus:border-petrol-blue-500 focus:outline-none focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-800 transition-colors"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Confirmar Senha
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="relative block w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:z-10 focus:border-petrol-blue-500 focus:outline-none focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-800 transition-colors"
                                    placeholder="Repita a senha"
                                />
                            </div>
                        </div>

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
                                        Criando conta...
                                    </>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Criar Conta
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                        Já tem uma conta?{' '}
                        <button onClick={onSwitchToLogin} className="font-medium text-petrol-blue-600 hover:text-petrol-blue-500 transition-colors">
                            Entrar
                        </button>
                    </p>

                    <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                        <p className="text-xs text-center text-slate-500 dark:text-slate-500">
                            © 2026 FrotaFácil. Cadastre-se e assuma o controle.
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
                            Gestão profissional simplificada
                        </h2>
                        <p className="text-lg text-slate-200 drop-shadow-sm">
                            Crie sua conta em segundos e comece a controlar sua frota como uma grande empresa, sem burocracia.
                        </p>
                        <ul className="space-y-3 pt-4">
                            <li className="flex items-center gap-3">
                                <span className="bg-petrol-blue-500/20 p-1 rounded-full text-petrol-blue-200">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <span className="text-slate-100 font-medium">Controle total de veículos</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="bg-petrol-blue-500/20 p-1 rounded-full text-petrol-blue-200">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <span className="text-slate-100 font-medium">Gestão financeira integrada</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default Register;
