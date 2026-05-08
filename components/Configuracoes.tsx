import React, { useState } from 'react';
import { Header, Modal } from './ui';
import { AppSettings, EmpresaConfig, PreferenciasConfig, AlertasConfig, defaultSettings } from '../types/settings';

interface ConfiguracoesProps {
    settings: AppSettings;
    onSaveSettings: (settings: AppSettings) => void;
    onExportData: () => void;
    onClearData: () => void;
}

const Configuracoes: React.FC<ConfiguracoesProps> = ({
    settings,
    onSaveSettings,
    onExportData,
    onClearData
}) => {
    const [empresa, setEmpresa] = useState<EmpresaConfig>(settings.empresa);
    const [preferencias, setPreferencias] = useState<PreferenciasConfig>(settings.preferencias);
    const [alertas, setAlertas] = useState<AlertasConfig>(settings.alertas);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showSavedToast, setShowSavedToast] = useState(false);

    const handleSave = () => {
        onSaveSettings({
            empresa,
            preferencias,
            alertas,
        });
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 3000);
    };

    const handleReset = () => {
        setEmpresa(defaultSettings.empresa);
        setPreferencias(defaultSettings.preferencias);
        setAlertas(defaultSettings.alertas);
    };

    const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b dark:border-slate-700">
                <div className="p-2 rounded-lg bg-petrol-blue-100 dark:bg-petrol-blue-900/30 text-petrol-blue-600 dark:text-petrol-blue-400">
                    {icon}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
            </div>
            {children}
        </div>
    );

    const FormField: React.FC<{
        label: string;
        name: string;
        type?: string;
        value: string | number;
        onChange: (value: string) => void;
        placeholder?: string;
    }> = ({ label, name, type = 'text', value, onChange, placeholder }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {label}
            </label>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-petrol-blue-500 focus:border-transparent transition-colors"
            />
        </div>
    );

    const SelectField: React.FC<{
        label: string;
        name: string;
        value: string | number;
        onChange: (value: string) => void;
        options: { value: string | number; label: string }[];
    }> = ({ label, name, value, onChange, options }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {label}
            </label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-petrol-blue-500 focus:border-transparent transition-colors"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );

    const ToggleField: React.FC<{
        label: string;
        description?: string;
        checked: boolean;
        onChange: (checked: boolean) => void;
    }> = ({ label, description, checked, onChange }) => (
        <div className="flex items-center justify-between py-3">
            <div>
                <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
                {description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-petrol-blue-500 focus:ring-offset-2 ${checked ? 'bg-petrol-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );

    return (
        <>
            <Header title="Configurações" description="Ajustes e configurações gerais do sistema." />

            {/* Toast de Sucesso */}
            {showSavedToast && (
                <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Configurações salvas com sucesso!
                </div>
            )}

            {/* Dados da Empresa */}
            <SectionCard
                title="Dados da Empresa"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <FormField
                            label="Nome da Empresa"
                            name="nome"
                            value={empresa.nome}
                            onChange={(v) => setEmpresa({ ...empresa, nome: v })}
                            placeholder="Ex: Locadora XYZ"
                        />
                    </div>
                    <FormField
                        label="CNPJ"
                        name="cnpj"
                        value={empresa.cnpj}
                        onChange={(v) => setEmpresa({ ...empresa, cnpj: v })}
                        placeholder="00.000.000/0000-00"
                    />
                    <FormField
                        label="Telefone / WhatsApp"
                        name="telefone"
                        type="tel"
                        value={empresa.telefone}
                        onChange={(v) => setEmpresa({ ...empresa, telefone: v })}
                        placeholder="(00) 00000-0000"
                    />
                    <div className="md:col-span-2">
                        <FormField
                            label="Endereço"
                            name="endereco"
                            value={empresa.endereco}
                            onChange={(v) => setEmpresa({ ...empresa, endereco: v })}
                            placeholder="Rua, número, bairro, cidade - UF"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <FormField
                            label="E-mail"
                            name="email"
                            type="email"
                            value={empresa.email}
                            onChange={(v) => setEmpresa({ ...empresa, email: v })}
                            placeholder="contato@empresa.com.br"
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Preferências do Sistema */}
            <SectionCard
                title="Preferências do Sistema"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField
                        label="Moeda"
                        name="moeda"
                        value={preferencias.moeda}
                        onChange={(v) => setPreferencias({ ...preferencias, moeda: v as 'BRL' | 'USD' | 'EUR' })}
                        options={[
                            { value: 'BRL', label: 'R$ - Real Brasileiro' },
                            { value: 'USD', label: '$ - Dólar Americano' },
                            { value: 'EUR', label: '€ - Euro' },
                        ]}
                    />
                    <SelectField
                        label="Formato de Data"
                        name="formatoData"
                        value={preferencias.formatoData}
                        onChange={(v) => setPreferencias({ ...preferencias, formatoData: v as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' })}
                        options={[
                            { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA' },
                            { value: 'MM/DD/YYYY', label: 'MM/DD/AAAA' },
                            { value: 'YYYY-MM-DD', label: 'AAAA-MM-DD' },
                        ]}
                    />
                    <SelectField
                        label="Itens por Página"
                        name="itensPorPagina"
                        value={preferencias.itensPorPagina}
                        onChange={(v) => setPreferencias({ ...preferencias, itensPorPagina: parseInt(v) as 10 | 25 | 50 })}
                        options={[
                            { value: 10, label: '10 itens' },
                            { value: 25, label: '25 itens' },
                            { value: 50, label: '50 itens' },
                        ]}
                    />
                </div>
            </SectionCard>

            {/* Alertas e Notificações */}
            <SectionCard
                title="Alertas e Notificações"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                }
            >
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Configure com quantos dias de antecedência o sistema deve alertar sobre vencimentos.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormField
                        label="Vencimento de CNH (dias antes)"
                        name="diasCNH"
                        type="number"
                        value={alertas.diasCNH}
                        onChange={(v) => setAlertas({ ...alertas, diasCNH: parseInt(v) || 0 })}
                    />
                    <FormField
                        label="Vencimento de Documentos (dias antes)"
                        name="diasDocumentos"
                        type="number"
                        value={alertas.diasDocumentos}
                        onChange={(v) => setAlertas({ ...alertas, diasDocumentos: parseInt(v) || 0 })}
                    />
                    <FormField
                        label="Manutenção Preventiva (dias antes)"
                        name="diasManutencao"
                        type="number"
                        value={alertas.diasManutencao}
                        onChange={(v) => setAlertas({ ...alertas, diasManutencao: parseInt(v) || 0 })}
                    />
                    <FormField
                        label="Inadimplência (dias após vencimento)"
                        name="diasInadimplencia"
                        type="number"
                        value={alertas.diasInadimplencia}
                        onChange={(v) => setAlertas({ ...alertas, diasInadimplencia: parseInt(v) || 0 })}
                    />
                </div>
                <div className="border-t dark:border-slate-700 pt-4">
                    <ToggleField
                        label="Notificações por E-mail"
                        description="Receber alertas automáticos por e-mail"
                        checked={alertas.emailAtivo}
                        onChange={(v) => setAlertas({ ...alertas, emailAtivo: v })}
                    />
                </div>
            </SectionCard>

            {/* Backup e Dados */}
            <SectionCard
                title="Backup e Dados"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                }
            >
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={onExportData}
                            className="inline-flex items-center px-4 py-2.5 bg-petrol-blue-600 hover:bg-petrol-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Exportar Todos os Dados
                        </button>
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restaurar Padrão
                        </button>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <h4 className="font-medium text-red-800 dark:text-red-200">Zona de Perigo</h4>
                                <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                                    Esta ação apagará todos os dados do sistema de forma permanente.
                                </p>
                                <button
                                    onClick={() => setShowClearModal(true)}
                                    className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                                >
                                    Limpar Todos os Dados
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Botão Salvar Fixo */}
            <div className="sticky bottom-4 flex justify-center sm:justify-end px-4 sm:px-0">
                <button
                    onClick={handleSave}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 sm:py-2.5 bg-petrol-blue-600 hover:bg-petrol-blue-700 text-white font-medium rounded-lg shadow-lg transition-all hover:shadow-xl min-h-[48px] sm:min-h-0"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Salvar Configurações
                </button>
            </div>

            {/* Modal Confirmar Limpeza */}
            <Modal isOpen={showClearModal} onClose={() => setShowClearModal(false)} title="Confirmar Limpeza de Dados">
                <div>
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
                        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <div>
                            <h4 className="font-semibold text-red-800 dark:text-red-200">Atenção!</h4>
                            <p className="text-sm text-red-600 dark:text-red-300">
                                Esta ação é irreversível. Todos os dados serão perdidos permanentemente.
                            </p>
                        </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Serão excluídos: Veículos, Motoristas, Contratos, Manutenções, Multas, Sinistros, Despesas e Documentos.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowClearModal(false)}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                onClearData();
                                setShowClearModal(false);
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
                        >
                            Sim, Limpar Tudo
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Configuracoes;
