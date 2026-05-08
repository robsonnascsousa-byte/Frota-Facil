import React, { useState, useEffect } from 'react';
import { Header, Badge } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { getAllProfiles, updateProfileRole, deleteUserProfile } from '../services/database';
import { UserRole } from '../types';

interface UserProfile {
    id: string;
    email: string;
    nome: string | null;
    role: string | null;
    created_at: string;
}

const ControleAcessos: React.FC = () => {
    const { user, role: currentUserRole } = useAuth();
    console.log('[ControleAcessos] Rendered with role:', currentUserRole);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // New User Form State
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>('operacao');
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const { signUp } = useAuth();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const profiles = await getAllProfiles();
        setUsers(profiles);
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        if (userId === user?.id) {
            alert('Você não pode alterar seu próprio papel.');
            return;
        }
        setUpdating(userId);
        try {
            await updateProfileRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert('Erro ao atualizar papel do usuário.');
        }
        setUpdating(null);
    };

    const handleDelete = async (userId: string, email: string) => {
        if (userId === user?.id) {
            alert('Você não pode excluir sua própria conta.');
            return;
        }
        if (!confirm(`Tem certeza que deseja remover o usuário ${email}?`)) return;

        try {
            await deleteUserProfile(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            alert('Erro ao remover usuário.');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        setCreateError(null);

        try {
            const { error } = await signUp(newUserEmail, newUserPassword, newUserName, newUserRole);

            if (error) {
                setCreateError(error.message);
            } else {
                // Success
                setShowCreateModal(false);
                // Reset form
                setNewUserName('');
                setNewUserEmail('');
                setNewUserPassword('');
                setNewUserRole('operacao');
                // Reload users to show the new one
                loadUsers();
                alert('Usuário criado com sucesso! Note que, dependendo das configurações do Supabase, o usuário pode precisar confirmar o e-mail.');
            }
        } catch (err: any) {
            setCreateError(err.message || 'Erro ao criar usuário');
        } finally {
            setCreateLoading(false);
        }
    };

    const getRoleBadgeColor = (role: string | null): 'green' | 'blue' | 'yellow' | 'gray' => {
        switch (role) {
            case 'admin': return 'green';
            case 'gerente': return 'blue';
            case 'operacao': return 'yellow';
            default: return 'gray';
        }
    };

    const getRoleLabel = (role: string | null): string => {
        switch (role) {
            case 'admin': return 'Administrador';
            case 'gerente': return 'Gerente';
            case 'operacao': return 'Operação';
            default: return 'Não definido';
        }
    };

    if (currentUserRole !== 'admin') {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Acesso Negado</h2>
                    <p className="text-slate-500 dark:text-slate-400">Apenas administradores podem acessar esta página.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Header
                title="Controle de Acessos"
                description="Gerencie os usuários e seus níveis de permissão no sistema."
                action={{
                    label: 'Novo Usuário',
                    onClick: () => setShowCreateModal(true),
                    icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    )
                }}
            />

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <svg className="animate-spin h-8 w-8 text-petrol-blue-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-slate-500 dark:text-slate-400">Carregando usuários...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        Nenhum usuário encontrado.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuário</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">E-mail</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Papel Atual</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alterar Papel</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {users.map((u) => (
                                    <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${u.id === user?.id ? 'bg-petrol-blue-50 dark:bg-petrol-blue-900/20' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-petrol-blue-100 dark:bg-petrol-blue-800 flex items-center justify-center text-petrol-blue-600 dark:text-petrol-blue-300 font-semibold">
                                                    {(u.nome || u.email)[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-white">
                                                        {u.nome || 'Sem nome'}
                                                        {u.id === user?.id && <span className="ml-2 text-xs text-petrol-blue-600">(Você)</span>}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Desde {new Date(u.created_at).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{u.email}</td>
                                        <td className="px-4 py-3">
                                            <Badge status={getRoleLabel(u.role)} color={getRoleBadgeColor(u.role)} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={u.role || 'admin'}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                                disabled={u.id === user?.id || updating === u.id}
                                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-petrol-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="admin">Administrador</option>
                                                <option value="gerente">Gerente</option>
                                                <option value="operacao">Operação</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDelete(u.id, u.email)}
                                                disabled={u.id === user?.id}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title={u.id === user?.id ? 'Não é possível excluir sua própria conta' : 'Excluir usuário'}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Cadastrar Novo Usuário</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            {createError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {createError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-petrol-blue-500 outline-none"
                                    placeholder="Ex: João Silva"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                                <input
                                    type="email"
                                    required
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-petrol-blue-500 outline-none"
                                    placeholder="joao@empresa.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha Inicial</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-petrol-blue-500 outline-none"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Papel / Nível de Acesso</label>
                                <select
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-petrol-blue-500 outline-none"
                                >
                                    <option value="operacao">Operação (Leitura)</option>
                                    <option value="gerente">Gerente (Edição)</option>
                                    <option value="admin">Administrador (Total)</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="flex-1 px-4 py-2 bg-petrol-blue-600 hover:bg-petrol-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-petrol-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {createLoading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : 'Cadastrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ControleAcessos;
