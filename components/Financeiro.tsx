import React, { useMemo, useState } from 'react';
import { Contrato, Despesa, Receita, Pagamento, Manutencao, StatusPagamentoDespesa, StatusPagamento, Veiculo } from '../types';
import { Table, Header, Card, Modal } from './ui';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ContasAReceber {
    id: string;
    tipo: string;
    vencimento: string;
    valor: number;
    status: string;
    motorista_nome?: string;
    contratoId?: number;
    isManual: boolean;
}

// Combined type for the "Contas a Pagar" table
interface ContaAPagar {
    id: string; // Unique ID like "manutencao-1" or "despesa-2"
    tipo: string;
    veiculo_placa?: string;
    data: string;
    valor: number;
    status: StatusPagamentoDespesa;
    isManual: boolean; // Flag to identify manual expenses
}

const initialFormState = {
    tipo: 'Outros',
    veiculo_placa: '',
    veiculo_id: null as number | null,
    data: new Date().toISOString().split('T')[0],
    valor: 0,
    parcelas: 1,
    frequencia: 'mensal' as 'mensal' | 'semanal',
    transacaoTipo: 'despesa' as 'despesa' | 'receita'
};

interface FinanceiroProps {
    contratos: Contrato[];
    despesasManuais: Despesa[];
    receitasManuais: Receita[];
    manutencoes: Manutencao[];
    veiculos: Veiculo[];
    onAddDespesa: (despesa: Omit<Despesa, 'id' | 'status'>, parcelas: number, frequencia: 'mensal' | 'semanal') => void;
    onDeleteDespesa: (id: number) => void;
    onUpdateDespesaStatus: (id: number, status: StatusPagamentoDespesa) => void;
    onAddReceita: (receita: Omit<Receita, 'id' | 'status'>, parcelas: number, frequencia: 'mensal' | 'semanal') => void;
    onDeleteReceita: (id: number) => void;
    onUpdateReceitaStatus: (id: number, status: StatusPagamento) => void;
    onUpdateManutencaoStatus: (id: number, status: StatusPagamentoDespesa) => void;
    onUpdatePagamentoStatus: (contratoId: number, pagamentoId: number, status: StatusPagamento) => void;
    onDeletePagamento: (contratoId: number, pagamentoId: number) => void;
}

const Financeiro: React.FC<FinanceiroProps> = ({
    contratos,
    despesasManuais,
    receitasManuais,
    manutencoes,
    veiculos,
    onAddDespesa,
    onDeleteDespesa,
    onUpdateDespesaStatus,
    onAddReceita,
    onDeleteReceita,
    onUpdateReceitaStatus,
    onUpdateManutencaoStatus,
    onUpdatePagamentoStatus,
    onDeletePagamento
}) => {
    const [activeTab, setActiveTab] = useState<'receber' | 'pagar'>('receber');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, tipo: string, valor: number, category: 'receita' | 'despesa' | 'pagamento', contratoId?: number } | null>(null);

    const contasAReceber = useMemo<ContasAReceber[]>(() => {
        const pagamentosContratos: ContasAReceber[] = contratos.flatMap(contrato =>
            (contrato.pagamentos || []).map(pagamento => ({
                id: `pagamento-${pagamento.id}`,
                contratoId: contrato.id,
                motorista_nome: contrato.motorista_nome,
                tipo: 'Locação',
                vencimento: pagamento.vencimento,
                valor: pagamento.valor,
                status: pagamento.status,
                isManual: false
            }))
        );

        const receitasAvulsas: ContasAReceber[] = receitasManuais.map(r => ({
            id: `receita-${r.id}`,
            tipo: r.tipo,
            vencimento: r.data,
            valor: r.valor,
            status: r.status,
            isManual: true
        }));

        return [...pagamentosContratos, ...receitasAvulsas].sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());
    }, [contratos, receitasManuais]);

    const contasAPagar = useMemo<ContaAPagar[]>(() => {
        const despesasDeManutencoes: ContaAPagar[] = manutencoes.map(m => ({
            id: `manutencao-${m.id}`,
            tipo: `Manutenção (${m.tipo})`,
            veiculo_placa: m.veiculo_placa,
            data: m.data,
            valor: m.valor,
            status: m.status,
            isManual: false,
        }));
        const despesasManuaisFormatadas: ContaAPagar[] = despesasManuais.map(d => ({
            id: `despesa-${d.id}`,
            tipo: d.tipo,
            veiculo_placa: d.veiculo_placa,
            data: d.data,
            valor: d.valor,
            status: d.status,
            isManual: true,
        }));
        return [...despesasDeManutencoes, ...despesasManuaisFormatadas].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }, [manutencoes, despesasManuais]);


    const { receitaTotalMes, custosTotaisMes, lucroBrutoMes } = useMemo(() => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const receita = contasAReceber
            .filter(c => {
                const pagamentoDate = new Date(c.vencimento);
                return c.status === 'Pago' && pagamentoDate.getMonth() === currentMonth && pagamentoDate.getFullYear() === currentYear;
            })
            .reduce((sum, c) => sum + c.valor, 0);

        const custos = contasAPagar
            .filter(d => {
                const despesaDate = new Date(d.data);
                return d.status === 'Paga' && despesaDate.getMonth() === currentMonth && despesaDate.getFullYear() === currentYear;
            })
            .reduce((sum, d) => sum + d.valor, 0);

        return {
            receitaTotalMes: receita,
            custosTotaisMes: custos,
            lucroBrutoMes: receita - custos
        };
    }, [contasAReceber, contasAPagar]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let processedValue: string | number | null = value;
        if (type === 'number') {
            processedValue = value ? parseFloat(value) : 0;
        }
        if (name === 'veiculo_id') {
            processedValue = value === 'null' ? null : parseInt(value);
            const selectedVeiculo = veiculos.find(v => v.id === processedValue);
            setFormData(prev => ({
                ...prev,
                veiculo_id: processedValue as number | null,
                veiculo_placa: selectedVeiculo ? selectedVeiculo.placa : ''
            }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { transacaoTipo, parcelas, frequencia, ...data } = formData;

        if (transacaoTipo === 'despesa') {
            onAddDespesa({
                tipo: data.tipo,
                veiculo_placa: data.veiculo_placa,
                veiculo_id: data.veiculo_id ?? undefined,
                data: data.data,
                valor: data.valor
            }, parcelas, frequencia);
        } else {
            onAddReceita({
                tipo: data.tipo,
                veiculo_placa: data.veiculo_placa,
                veiculo_id: data.veiculo_id ?? undefined,
                data: data.data,
                valor: data.valor
            }, parcelas, frequencia);
        }

        setIsAddModalOpen(false);
        setFormData({ ...initialFormState, transacaoTipo });
    };

    const handleDeleteClick = (item: ContasAReceber | ContaAPagar, category: 'receita' | 'despesa' | 'pagamento') => {
        setItemToDelete({
            id: item.id,
            tipo: item.tipo,
            valor: item.valor,
            category,
            contratoId: (item as ContasAReceber).contratoId
        });
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        const originalId = parseInt(itemToDelete.id.split('-')[1]);
        if (itemToDelete.category === 'despesa') {
            onDeleteDespesa(originalId);
        } else if (itemToDelete.category === 'receita') {
            onDeleteReceita(originalId);
        } else if (itemToDelete.category === 'pagamento' && itemToDelete.contratoId) {
            onDeletePagamento(itemToDelete.contratoId, originalId);
        }
        setItemToDelete(null);
    };

    const getStatusColor = (status: string) => {
        const colorClasses: { [key: string]: string } = {
            'Paga': 'bg-green-500',
            'Pago': 'bg-green-500',
            'Em aberto': 'bg-yellow-500',
            'Atrasado': 'bg-red-500'
        };
        return colorClasses[status] || 'bg-gray-500';
    }


    return (
        <>
            <Header title="Financeiro" description="Controle as contas a receber e a pagar da sua frota." />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card title="Receita Realizada (Mês)" value={formatCurrency(receitaTotalMes)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} colorClass="text-green-600" />
                <Card title="Custos Pagos (Mês)" value={formatCurrency(custosTotaisMes)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>} colorClass="text-red-600" />
                <Card title="Saldo de Caixa (Mês)" value={formatCurrency(lucroBrutoMes)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} colorClass="text-blue-600" />
            </div>

            <div>
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('receber')}
                            className={`${activeTab === 'receber' ? 'border-petrol-blue-500 text-petrol-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Contas a Receber
                        </button>
                        <button
                            onClick={() => setActiveTab('pagar')}
                            className={`${activeTab === 'pagar' ? 'border-petrol-blue-500 text-petrol-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Contas a Pagar
                        </button>
                    </nav>
                </div>
                <div className="mt-6">
                    {activeTab === 'receber' && (
                        <>
                            <div className="mb-4 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recebimentos</h3>
                                <button
                                    onClick={() => {
                                        setFormData({ ...initialFormState, transacaoTipo: 'receita' });
                                        setIsAddModalOpen(true);
                                    }}
                                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                                >
                                    Adicionar Receita
                                </button>
                            </div>
                            <Table<ContasAReceber>
                                data={contasAReceber}
                                columns={[
                                    { header: 'Descrição', accessor: 'tipo' },
                                    { header: 'Motorista/Fonte', accessor: 'motorista_nome', render: (item) => item.motorista_nome || '-' },
                                    { header: 'Vencimento', accessor: 'vencimento', isDate: true },
                                    { header: 'Valor', accessor: 'valor', isCurrency: true },
                                    {
                                        header: 'Status', accessor: 'status', render: (item) => (
                                            <select
                                                value={item.status}
                                                onChange={(e) => {
                                                    const newStatus = e.target.value as StatusPagamento;
                                                    const originalId = parseInt(item.id.split('-')[1]);
                                                    if (item.isManual) {
                                                        onUpdateReceitaStatus(originalId, newStatus);
                                                    } else {
                                                        onUpdatePagamentoStatus(item.contratoId!, originalId, newStatus);
                                                    }
                                                }}
                                                className={`px-2.5 py-1 text-xs font-bold text-white rounded-full border-none appearance-none cursor-pointer uppercase tracking-wider focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500 ${getStatusColor(item.status)}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="Em aberto">Em aberto</option>
                                                <option value="Pago">Pago</option>
                                                <option value="Atrasado">Atrasado</option>
                                            </select>
                                        )
                                    },
                                    {
                                        header: 'Ações', accessor: 'id', render: (item) => (
                                            <div className="flex items-center gap-2">
                                                {!item.isManual && <span className="text-[10px] text-slate-400 italic bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-1">Contrato</span>}
                                                <button
                                                    onClick={() => handleDeleteClick(item, item.isManual ? 'receita' : 'pagamento')}
                                                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        </>
                    )}
                    {activeTab === 'pagar' && (
                        <>
                            <div className="mb-4 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Pagamentos</h3>
                                <button
                                    onClick={() => {
                                        setFormData({ ...initialFormState, transacaoTipo: 'despesa' });
                                        setIsAddModalOpen(true);
                                    }}
                                    className="inline-flex items-center justify-center rounded-md bg-petrol-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-petrol-blue-800"
                                >
                                    Adicionar Despesa
                                </button>
                            </div>
                            <Table<ContaAPagar>
                                data={contasAPagar}
                                columns={[
                                    { header: 'Tipo', accessor: 'tipo' },
                                    { header: 'Veículo', accessor: 'veiculo_placa' },
                                    { header: 'Data', accessor: 'data', isDate: true },
                                    { header: 'Valor', accessor: 'valor', isCurrency: true },
                                    {
                                        header: 'Status', accessor: 'status', render: (item) => (
                                            <select
                                                value={item.status}
                                                onChange={(e) => {
                                                    const newStatus = e.target.value as StatusPagamentoDespesa;
                                                    const originalId = parseInt(item.id.split('-')[1]);
                                                    if (item.isManual) {
                                                        onUpdateDespesaStatus(originalId, newStatus);
                                                    } else {
                                                        onUpdateManutencaoStatus(originalId, newStatus);
                                                    }
                                                }}
                                                className={`px-2.5 py-1 text-xs font-bold text-white rounded-full border-none appearance-none cursor-pointer uppercase tracking-wider focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500 ${getStatusColor(item.status)}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="Em aberto">Em aberto</option>
                                                <option value="Paga">Paga</option>
                                            </select>
                                        )
                                    },
                                    {
                                        header: 'Ações', accessor: 'id', render: (item) => (
                                            item.isManual ? (
                                                <button
                                                    onClick={() => handleDeleteClick(item, 'despesa')}
                                                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                                                >
                                                    Excluir
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Via Manutenção</span>
                                            )
                                        )
                                    }
                                ]}
                            />
                        </>
                    )}
                </div>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={`Adicionar Novo ${formData.transacaoTipo === 'despesa' ? 'Pagamento' : 'Recebimento'}`}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg mb-4">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, transacaoTipo: 'receita' }))}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${formData.transacaoTipo === 'receita' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            Recebimento (+)
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, transacaoTipo: 'despesa' }))}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${formData.transacaoTipo === 'despesa' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            Pagamento (-)
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label htmlFor="tipo" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição / Categoria</label>
                            {formData.transacaoTipo === 'despesa' ? (
                                <select name="tipo" id="tipo" value={formData.tipo} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                    <option>Financiamento</option>
                                    <option>Seguro</option>
                                    <option>IPVA</option>
                                    <option>Documentação</option>
                                    <option>Multa</option>
                                    <option>Manutenção</option>
                                    <option>Outros</option>
                                </select>
                            ) : (
                                <input type="text" name="tipo" id="tipo" value={formData.tipo} onChange={handleInputChange} placeholder="Ex: Venda de peça, Bônus, Estorno" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                            )}
                        </div>
                        <div>
                            <label htmlFor="veiculo_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Veículo / Conta</label>
                            <select
                                name="veiculo_id"
                                id="veiculo_id"
                                value={formData.veiculo_id === null ? 'null' : formData.veiculo_id}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                <option value="null">Conta Geral (Não vinculado)</option>
                                {veiculos.map(v => (
                                    <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="data" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data (1ª Parcela)</label>
                            <input type="date" name="data" id="data" value={formData.data} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="valor" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Valor Total (R$)</label>
                            <input type="number" step="0.01" name="valor" id="valor" value={formData.valor} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="parcelas" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Quantidade / Parcelas</label>
                            <div className="flex gap-2">
                                <input type="number" min="1" name="parcelas" id="parcelas" value={formData.parcelas} onChange={handleInputChange} className="mt-1 block w-24 rounded-md border-slate-300 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                                <select name="frequencia" id="frequencia" value={formData.frequencia} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                    <option value="mensal">Mensal</option>
                                    <option value="semanal">Semanal</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    {formData.parcelas > 1 && (
                        <p className="text-[10px] text-slate-500 italic mt-1">
                            Serão gerados {formData.parcelas} lançamentos mensais de {formatCurrency(formData.valor / formData.parcelas)} cada.
                        </p>
                    )}
                    <div className="pt-5 border-t mt-4 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" className={`py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${formData.transacaoTipo === 'despesa' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                            Salvar {formData.transacaoTipo === 'despesa' ? 'Pagamento' : 'Recebimento'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Confirmar Exclusão">
                <div className="p-1">
                    <p className="text-slate-600 dark:text-slate-400">Tem certeza que deseja excluir este lançamento?</p>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-4 my-4 rounded-lg border-l-4 border-rose-500 shadow-inner">
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white uppercase leading-none">{itemToDelete?.tipo}</p>
                            <p className="text-xl font-mono font-bold text-rose-600 tabular-nums">{formatCurrency(itemToDelete?.valor || 0)}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 italic">Atenção: Esta ação não pode ser desfeita.</p>
                    <div className="flex justify-end space-x-3">
                        <button onClick={() => setItemToDelete(null)} className="px-5 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                        <button onClick={confirmDelete} className="px-5 py-2 rounded-md font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all">Confirmar Exclusão</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Financeiro;