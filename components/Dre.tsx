import React, { useState, useMemo } from 'react';
import { Header } from './ui';
import { Contrato, Despesa, Manutencao, Multa, Receita, Veiculo } from '../types';
import { formatCurrency } from '../utils/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { classifyDreExpenseCategory, consolidateAssetSales, getCompetenceDate, isAssetSale } from '../utils/financial';

interface DREProps {
    contratos: Contrato[];
    despesas: Despesa[];
    manutencoes: Manutencao[];
    multas: Multa[];
    receitasManuais: Receita[];
    veiculos: Veiculo[];
}

const DRE: React.FC<DREProps> = ({ contratos, despesas, manutencoes, multas, receitasManuais, veiculos }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all'); // Default to all as requested
    const [selectedVeiculoId, setSelectedVeiculoId] = useState<number | 'all'>('all');
    const [viewMode, setViewMode] = useState<'total' | 'comparative'>('total');

    const years = useMemo(() => {
        const yearsSet = new Set<number>();
        yearsSet.add(new Date().getFullYear());

        contratos.forEach(c => (c.pagamentos || []).forEach(p => yearsSet.add(parseInt((getCompetenceDate(p).date || p.vencimento).split('-')[0]))));
        receitasManuais.forEach(r => yearsSet.add(parseInt((getCompetenceDate(r).date || r.data).split('-')[0])));
        despesas.forEach(d => yearsSet.add(parseInt((getCompetenceDate(d).date || d.data).split('-')[0])));
        manutencoes.forEach(m => yearsSet.add(parseInt((getCompetenceDate(m).date || m.data).split('-')[0])));
        multas.forEach(m => yearsSet.add(parseInt((getCompetenceDate(m).date || m.data).split('-')[0])));

        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [contratos, receitasManuais, despesas, manutencoes, multas]);

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Helper to calculate DRE for a specific period
    const calculateDRE = (year: number, month: number | 'all') => {
        const periodEnd = month === 'all'
            ? `${year}-12-31`
            : new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
        const today = new Date().toISOString().slice(0, 10);
        const cutoff = periodEnd < today ? periodEnd : today;
        const isPeriodMatch = (dateStr: string) => {
            const parts = dateStr.split('-');
            const dateYear = parseInt(parts[0]);
            const dateMonth = parseInt(parts[1]); // 1-12
            const yearMatch = dateYear === year;
            const monthMatch = month === 'all' || dateMonth === month;
            return yearMatch && monthMatch && dateStr <= cutoff;
        };

        const isVeiculoMatch = (vId?: number, vPlaca?: string) => {
            if (selectedVeiculoId === 'all') return true;
            if (vId) return vId === selectedVeiculoId;
            // Fallback to placa if ID is missing (compatibility with older data or specific cases)
            if (vPlaca) {
                const targetVeiculo = veiculos.find(v => v.id === selectedVeiculoId);
                return targetVeiculo?.placa === vPlaca;
            }
            return false;
        };

        // 1. Receita Bruta OPERACIONAL — só aluguel. Venda de veículo é
        //    desmobilização de ativo, não faturamento: entra no resultado
        //    não-operacional (abaixo), fora da receita e das margens.
        let receitaBruta = 0;
        contratos.forEach(c => {
            if (selectedVeiculoId !== 'all' && c.veiculo_id !== selectedVeiculoId) return;
            (c.pagamentos || []).forEach(p => {
                if (isPeriodMatch(getCompetenceDate(p).date || '')) receitaBruta += p.valor;
            });
        });
        receitasManuais.forEach(r => {
            if (!isPeriodMatch(getCompetenceDate(r).date || '') || !isVeiculoMatch(r.veiculo_id, r.veiculo_placa)) return;
            if (!isAssetSale(r.tipo, r.origem)) receitaBruta += r.valor;
        });

        // Consolida todas as parcelas da venda em um único evento. Para legado,
        // usa a primeira competência; assim a baixa do ativo ocorre uma vez e o
        // total anual fecha com a soma dos meses.
        const vehicleSaleDates = new Map<number, string | undefined>(
            veiculos.map(v => [v.id, v.data_venda] as [number, string | undefined])
        );
        const consolidatedSales = consolidateAssetSales(receitasManuais, vehicleSaleDates);
        let resultadoNaoOperacional = 0;
        consolidatedSales.forEach(sale => {
            const veiculo = sale.vehicleId
                ? veiculos.find(v => v.id === sale.vehicleId)
                : veiculos.find(v => v.placa === sale.vehiclePlate);
            if (!isPeriodMatch(sale.eventDate || '') || !isVeiculoMatch(sale.vehicleId || undefined, sale.vehiclePlate || undefined)) return;
            resultadoNaoOperacional += sale.saleValue - (veiculo?.valor_compra || 0);
        });

        // Tributos informados entram como dedução; não são mais fixados artificialmente em zero.
        const impostosDeducoes = despesas
            .filter(d => classifyDreExpenseCategory(d.tipo) === 'deducao'
                && isPeriodMatch(getCompetenceDate(d).date || '')
                && isVeiculoMatch(d.veiculo_id, d.veiculo_placa))
            .reduce((total, d) => total + d.valor, 0);
        const receitaLiquida = receitaBruta - impostosDeducoes;

        // 2. Classificação de despesas por grupo do DRE. A lista anterior só
        //    reconhecia 4 tipos e descartava o resto em silêncio (contabilidade,
        //    INSS, Simples, licenciamento, combustível sumiam do resultado).
        //    Agora todo tipo cai em algum grupo; o que não for CSP nem financeiro
        //    conta como despesa operacional — nada some.
        // Manutenções (tabela própria) são sempre custo direto da frota
        let custosManutencao = 0;
        manutencoes.forEach(m => {
            if (isPeriodMatch(getCompetenceDate(m).date || '') && isVeiculoMatch(m.veiculo_id, m.veiculo_placa)) custosManutencao += m.valor;
        });

        let custosFrotaFixos = 0;      // CSP vindo de despesas (seguro, IPVA, docs…)
        let despesasAdm = 0;           // administrativas e gerais
        let despesasFinanceiras = 0;   // juros de financiamento
        let despesasNaoClassificadas = 0; // tipos fora do mapa — contam como adm, mas ficam visíveis
        let financiamentoNaoSegregado = 0; // legado: principal e juros ainda misturados, fora da DRE
        despesas.forEach(d => {
            if (!isPeriodMatch(getCompetenceDate(d).date || '') || !isVeiculoMatch(d.veiculo_id, d.veiculo_placa)) return;
            switch (classifyDreExpenseCategory(d.tipo)) {
                case 'csp': custosFrotaFixos += d.valor; break;
                case 'financeiro': despesasFinanceiras += d.valor; break;
                case 'administrativo': despesasAdm += d.valor; break;
                case 'deducao':
                case 'principal': break;
                case 'financiamento_nao_segregado': financiamentoNaoSegregado += d.valor; break;
                default: despesasNaoClassificadas += d.valor; despesasAdm += d.valor; break;
            }
        });

        const totalCSP = custosManutencao + custosFrotaFixos;
        const resultadoBruto = receitaLiquida - totalCSP;

        let multasDespesas = 0;
        multas.forEach(m => {
            if (isPeriodMatch(getCompetenceDate(m).date || '') && isVeiculoMatch(m.veiculo_id, m.veiculo_placa)) multasDespesas += m.valor;
        });

        const totalDespesasOp = despesasAdm + multasDespesas;

        // 4. EBITDA (antes de juros; ainda sem depreciação — ver relatório)
        const ebitda = resultadoBruto - totalDespesasOp;

        // 5. Resultado operacional (depois dos juros de financiamento)
        const resultadoOperacional = ebitda - despesasFinanceiras;

        // 6. Resultado líquido = operacional + não-operacional (venda de ativos)
        const lucroLiquido = resultadoOperacional + resultadoNaoOperacional;

        return {
            receitaBruta,
            impostosDeducoes,
            receitaLiquida,
            custosManutencao,
            custosFrotaFixos,
            totalCSP,
            resultadoBruto,
            despesasAdm,
            despesasNaoClassificadas,
            financiamentoNaoSegregado,
            multasDespesas,
            totalDespesasOp,
            ebitda,
            despesasFinanceiras,
            resultadoOperacional,
            resultadoNaoOperacional,
            lucroLiquido,
            // Margens sobre a receita operacional (aluguel), agora sem a venda de carro distorcendo
            ebitdaMargin: receitaBruta > 0 ? (ebitda / receitaBruta) * 100 : 0,
            lucroMargin: receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0
        };
    };

    const currentDRE = useMemo(() => calculateDRE(selectedYear, selectedMonth), [selectedYear, selectedMonth, selectedVeiculoId, contratos, despesas, manutencoes, multas, receitasManuais]);

    const monthlyBreakdown = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => calculateDRE(selectedYear, i + 1));
    }, [selectedYear, selectedVeiculoId, contratos, despesas, manutencoes, multas, receitasManuais]);

    const chartData = useMemo(() => {
        return monthlyBreakdown.map((data, i) => ({
            name: months[i],
            receita: data.receitaBruta,
            ebitda: data.ebitda,
            lucro: data.lucroLiquido
        }));
    }, [monthlyBreakdown]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Header
                title="DRE gerencial por competência"
                description="Receitas e despesas são reconhecidas na competência, independentemente da liquidação."
            />

            {currentDRE.financiamentoNaoSegregado > 0 && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    {formatCurrency(currentDRE.financiamentoNaoSegregado)} em financiamentos legados estão fora da DRE até a separação entre principal e juros.
                </div>
            )}

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-300 uppercase">Ano</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-md text-sm font-black focus:ring-2 focus:ring-petrol-blue-500"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-300 uppercase">Período</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => {
                                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                                setSelectedMonth(val);
                                if (val !== 'all') setViewMode('total');
                            }}
                            className="bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-md text-sm font-black focus:ring-2 focus:ring-petrol-blue-500"
                        >
                            {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-300 uppercase">Veículo</label>
                        <select
                            value={selectedVeiculoId}
                            onChange={(e) => {
                                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                                setSelectedVeiculoId(val);
                            }}
                            className="bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-md text-sm font-black focus:ring-2 focus:ring-petrol-blue-500"
                        >
                            <option value="all">Consolidado (Frota Toda)</option>
                            {veiculos.map(v => (
                                <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedMonth === 'all' && (
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('total')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'total' ? 'bg-white dark:bg-slate-700 text-petrol-blue-600 dark:text-petrol-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Total Anual
                        </button>
                        <button
                            onClick={() => setViewMode('comparative')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'comparative' ? 'bg-white dark:bg-slate-700 text-petrol-blue-600 dark:text-petrol-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Comparativo Mensal
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Side - KPIs (25%) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-sm border-l-4 shadow-sm border-[rgba(245,241,234,0.25)]">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">Receita Líquida</p>
                        <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(currentDRE.receitaLiquida)}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-sm border-l-4 shadow-sm border-[rgba(245,241,234,0.5)]">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">EBITDA</p>
                        <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(currentDRE.ebitda)}
                        </p>
                        <div className="mt-1">
                            <span className="text-[10px] font-bold text-slate-400">{currentDRE.ebitdaMargin.toFixed(1)}% Margem EBITDA</span>
                        </div>
                    </div>

                    <div className={`bg-white dark:bg-slate-800 p-6 rounded-sm border-l-4 shadow-sm ${currentDRE.lucroLiquido >= 0 ? 'border-[#f5f1ea]' : 'border-[#ff2a2a]'}`}>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">Lucro Líquido</p>
                        <p className={`text-3xl font-mono font-bold tabular-nums ${currentDRE.lucroLiquido >= 0 ? 'text-[#f5f1ea]' : 'text-[#ff2a2a]'}`}>
                            {formatCurrency(currentDRE.lucroLiquido)}
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${currentDRE.lucroMargin >= 0 ? 'bg-[rgba(245,241,234,0.12)] text-[#f5f1ea]' : 'bg-[rgba(255,42,42,0.12)] text-[#ff2a2a]'}`}>
                                {currentDRE.lucroMargin.toFixed(1)}% de margem
                            </span>
                        </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-sm shadow-sm h-48">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">Desempenho {selectedYear}</p>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorEbitda" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', fontSize: '10px', color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="receita" stroke="#0891b2" fillOpacity={1} fill="url(#colorRec)" strokeWidth={1} />
                                <Area type="monotone" dataKey="ebitda" stroke="#10b981" fillOpacity={1} fill="url(#colorEbitda)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-1">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-600"></div><span className="text-[8px] text-slate-400">Rec</span></div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f5f1ea]"></div><span className="text-[8px] text-slate-400">EBITDA</span></div>
                        </div>
                    </div>
                </div>

                {/* Right Side - DRE Table (75%) */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-sm shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                            Demonstrativo de Resultados (DRE)
                        </h3>
                        {selectedMonth === 'all' && (
                            <span className="text-[10px] font-bold bg-petrol-blue-100 text-petrol-blue-600 px-2 py-0.5 rounded">CONSOLIDADO {selectedYear}</span>
                        )}
                    </div>

                    <div className="p-0 sm:p-6 overflow-x-auto">
                        <table className="w-full text-sm font-mono border-collapse min-w-[800px]">
                            <thead>
                                <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100 dark:border-slate-700">
                                    <th className="text-left py-3 px-4 font-bold sticky left-0 bg-white dark:bg-slate-800 z-10 w-64 border-r border-slate-50 dark:border-slate-700">Estrutura Financeira</th>
                                    {viewMode === 'comparative' ? (
                                        <>
                                            {months.map(m => <th key={m} className="text-right py-3 px-4 font-bold min-w-[100px]">{m}</th>)}
                                            <th className="text-right py-3 px-4 font-bold bg-slate-50 dark:bg-slate-900/50 min-w-[120px]">TOTAL</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="text-right py-3 px-4 font-bold">Valor (R$)</th>
                                            <th className="text-right py-3 px-4 font-bold">% Rec.</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {/* 1. RECEITA BRUTA */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-50 dark:border-slate-700">
                                        (+) RECEITA OPERACIONAL BRUTA
                                    </td>
                                    {viewMode === 'comparative' ? (
                                        <>
                                            {monthlyBreakdown.map((m, i) => <td key={i} className="text-right py-4 px-4 tabular-nums">{formatCurrency(m.receitaBruta)}</td>)}
                                            <td className="text-right py-4 px-4 font-bold bg-slate-50 dark:bg-slate-900/50 tabular-nums">{formatCurrency(currentDRE.receitaBruta)}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="text-right py-4 px-4 font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(currentDRE.receitaBruta)}</td>
                                            <td className="text-right py-4 px-4 text-slate-400 tabular-nums">100%</td>
                                        </>
                                    )}
                                </tr>

                                {/* 1.1 DEDUÇÕES */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="py-3 px-8 text-slate-500 dark:text-slate-400 italic sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-50 dark:border-slate-700">
                                        (-) Impostos e Deduções
                                    </td>
                                    {viewMode === 'comparative' ? (
                                        <>
                                            {monthlyBreakdown.map((m, i) => <td key={i} className="text-right py-3 px-4 tabular-nums text-[#ff2a2a]/80">({formatCurrency(m.impostosDeducoes)})</td>)}
                                            <td className="text-right py-3 px-4 font-medium bg-slate-50 dark:bg-slate-900/50 tabular-nums text-[#ff2a2a]">({formatCurrency(currentDRE.impostosDeducoes)})</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="text-right py-3 px-4 text-[#ff2a2a]/80 tabular-nums">({formatCurrency(currentDRE.impostosDeducoes)})</td>
                                            <td className="text-right py-3 px-4 text-slate-400 tabular-nums">0.0%</td>
                                        </>
                                    )}
                                </tr>

                                {/* 1.2 RECEITA LÍQUIDA */}
                                <tr className="bg-slate-50 dark:bg-slate-900/40 font-bold">
                                    <td className="py-4 px-4 text-slate-800 dark:text-white sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-700">
                                        (=) RECEITA OPERACIONAL LÍQUIDA
                                    </td>
                                    {viewMode === 'comparative' ? (
                                        <>
                                            {monthlyBreakdown.map((m, i) => <td key={i} className="text-right py-4 px-4 tabular-nums">{formatCurrency(m.receitaLiquida)}</td>)}
                                            <td className="text-right py-4 px-4 font-black tabular-nums">{formatCurrency(currentDRE.receitaLiquida)}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="text-right py-4 px-4 text-slate-900 dark:text-white tabular-nums">{formatCurrency(currentDRE.receitaLiquida)}</td>
                                            <td className="text-right py-4 px-4 text-slate-400 tabular-nums">
                                                {currentDRE.receitaBruta > 0 ? ((currentDRE.receitaLiquida / currentDRE.receitaBruta) * 100).toFixed(1) : 0}%
                                            </td>
                                        </>
                                    )}
                                </tr>

                                {/* 2. CSP */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-50 dark:border-slate-700">
                                        (-) CUSTO DOS SERVIÇOS (CSP)
                                    </td>
                                    {viewMode === 'comparative' ? (
                                        <>
                                            {monthlyBreakdown.map((m, i) => <td key={i} className="text-right py-4 px-4 tabular-nums">({formatCurrency(m.totalCSP)})</td>)}
                                            <td className="text-right py-4 px-4 font-bold bg-slate-50 dark:bg-slate-900/50 tabular-nums">({formatCurrency(currentDRE.totalCSP)})</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="text-right py-4 px-4 font-bold tabular-nums">({formatCurrency(currentDRE.totalCSP)})</td>
                                            <td className="text-right py-4 px-4 text-slate-400 tabular-nums">
                                                {currentDRE.receitaBruta > 0 ? ((currentDRE.totalCSP / currentDRE.receitaBruta) * 100).toFixed(1) : 0}%
                                            </td>
                                        </>
                                    )}
                                </tr>

                                {/* 3. MARGEM BRUTA */}
                                <tr className="bg-slate-100 dark:bg-slate-900 font-bold border-y border-slate-200 dark:border-slate-700">
                                    <td className="py-4 px-4 text-slate-800 dark:text-white sticky left-0 bg-slate-100 dark:bg-slate-950 z-10 border-r border-slate-200 dark:border-slate-800">
                                        (=) RESULTADO OPERACIONAL BRUTO
                                    </td>
                                    {viewMode === 'comparative' ? (
                                        <>
                                            {monthlyBreakdown.map((m, i) => <td key={i} className="text-right py-4 px-4 tabular-nums">{formatCurrency(m.resultadoBruto)}</td>)}
                                            <td className="text-right py-4 px-4 font-black tabular-nums">{formatCurrency(currentDRE.resultadoBruto)}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="text-right py-4 px-4 text-slate-900 dark:text-white tabular-nums">{formatCurrency(currentDRE.resultadoBruto)}</td>
                                            <td className="text-right py-4 px-4 text-slate-400 tabular-nums">
                                                {currentDRE.receitaBruta > 0 ? ((currentDRE.resultadoBruto / currentDRE.receitaBruta) * 100).toFixed(1) : 0}%
                                            </td>
                                        </>
                                    )}
                                </tr>

                                {/* 4. DESPESAS OPERACIONAIS */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-50 dark:border-slate-700">
                                        (-) DESPESAS OPERACIONAIS
                                    </td>
                                    {viewMode === 'comparative' ? (
                                        <>
                                            {monthlyBreakdown.map((m, i) => <td key={i} className="text-right py-4 px-4 tabular-nums">({formatCurrency(m.totalDespesasOp)})</td>)}
                                            <td className="text-right py-4 px-4 font-bold bg-slate-50 dark:bg-slate-900/50 tabular-nums">({formatCurrency(currentDRE.totalDespesasOp)})</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="text-right py-4 px-4 font-bold tabular-nums">({formatCurrency(currentDRE.totalDespesasOp)})</td>
                                            <td className="text-right py-4 px-4 text-slate-400 tabular-nums">
                                                {currentDRE.receitaBruta > 0 ? ((currentDRE.totalDespesasOp / currentDRE.receitaBruta) * 100).toFixed(1) : 0}%
                                            </td>
                                        </>
                                    )}
                                </tr>

                                {/* 5. EBITDA */}
                                <tr className="font-black border-y-2" style={{background:'rgba(245,241,234,0.05)', borderColor:'rgba(245,241,234,0.18)'}}>
                                    <td className="py-5 px-4 sticky left-0 z-10 border-r" style={{color:'#f5f1ea', background:'#141414', borderColor:'rgba(245,241,234,0.12)'}}>
                                        (=) EBITDA
                                    </td>
                                    {viewMode === 'comparative' ? (
                                        <>
                                            {monthlyBreakdown.map((m, i) => (
                                                <td key={i} className={`text-right py-5 px-4 tabular-nums ${m.ebitda < 0 ? 'text-[#ff2a2a]' : 'text-[#f5f1ea]'}`}>
                                                    {formatCurrency(m.ebitda)}
                                                </td>
                                            ))}
                                            <td className="text-right py-5 px-4 text-lg tabular-nums" style={{background:'rgba(245,241,234,0.08)', color:'#f5f1ea'}}>
                                                {formatCurrency(currentDRE.ebitda)}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="text-right py-5 px-4 text-lg tabular-nums" style={{color:'#f5f1ea'}}>{formatCurrency(currentDRE.ebitda)}</td>
                                            <td className="text-right py-5 px-4 tabular-nums" style={{color:'#f5f1ea'}}>
                                                {currentDRE.receitaBruta > 0 ? ((currentDRE.ebitda / currentDRE.receitaBruta) * 100).toFixed(1) : 0}%
                                            </td>
                                        </>
                                    )}
                                </tr>

                                {/* 6. RESULTADO FINANCEIRO */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-400 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-50 dark:border-slate-700">
                                        (+/-) RESULTADO FINANCEIRO (JUROS)
                                    </td>
                                    {viewMode === 'comparative' ? (
                                        <>
                                            {monthlyBreakdown.map((m, i) => <td key={i} className="text-right py-4 px-4 tabular-nums">({formatCurrency(m.despesasFinanceiras)})</td>)}
                                            <td className="text-right py-4 px-4 font-bold bg-slate-50 dark:bg-slate-900/50 tabular-nums">({formatCurrency(currentDRE.despesasFinanceiras)})</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="text-right py-4 px-4 tabular-nums">({formatCurrency(currentDRE.despesasFinanceiras)})</td>
                                            <td className="text-right py-4 px-4 text-slate-400 tabular-nums">
                                                {currentDRE.receitaBruta > 0 ? ((currentDRE.despesasFinanceiras / currentDRE.receitaBruta) * 100).toFixed(1) : 0}%
                                            </td>
                                        </>
                                    )}
                                </tr>

                                {/* 6.1 RESULTADO OPERACIONAL (subtotal, antes do não-operacional) */}
                                <tr className="bg-slate-100 dark:bg-slate-900 font-bold border-y border-slate-200 dark:border-slate-700">
                                    <td className="py-4 px-4 text-slate-800 dark:text-white sticky left-0 bg-slate-100 dark:bg-slate-950 z-10 border-r border-slate-200 dark:border-slate-800">
                                        (=) RESULTADO OPERACIONAL
                                    </td>
                                    {viewMode === 'comparative' ? (
                                        <>
                                            {monthlyBreakdown.map((m, i) => <td key={i} className="text-right py-4 px-4 tabular-nums">{formatCurrency(m.resultadoOperacional)}</td>)}
                                            <td className="text-right py-4 px-4 font-black tabular-nums">{formatCurrency(currentDRE.resultadoOperacional)}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="text-right py-4 px-4 text-slate-900 dark:text-white tabular-nums">{formatCurrency(currentDRE.resultadoOperacional)}</td>
                                            <td className="text-right py-4 px-4 text-slate-400 tabular-nums">
                                                {currentDRE.receitaBruta > 0 ? ((currentDRE.resultadoOperacional / currentDRE.receitaBruta) * 100).toFixed(1) : 0}%
                                            </td>
                                        </>
                                    )}
                                </tr>

                                {/* 6.2 RESULTADO NÃO-OPERACIONAL (venda de ativos) */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-400 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-50 dark:border-slate-700">
                                        (+/-) RESULTADO NÃO-OPERACIONAL (VENDA DE ATIVOS)
                                    </td>
                                    {viewMode === 'comparative' ? (
                                        <>
                                            {monthlyBreakdown.map((m, i) => <td key={i} className="text-right py-4 px-4 tabular-nums">{formatCurrency(m.resultadoNaoOperacional)}</td>)}
                                            <td className="text-right py-4 px-4 font-bold bg-slate-50 dark:bg-slate-900/50 tabular-nums">{formatCurrency(currentDRE.resultadoNaoOperacional)}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="text-right py-4 px-4 tabular-nums">{formatCurrency(currentDRE.resultadoNaoOperacional)}</td>
                                            <td className="text-right py-4 px-4 text-slate-400 tabular-nums">—</td>
                                        </>
                                    )}
                                </tr>

                                {/* 7. LUCRO LÍQUIDO */}
                                <tr className="bg-petrol-blue-800 dark:bg-petrol-blue-950 text-white font-black">
                                    <td className="py-6 px-4 text-xl tracking-tighter sticky left-0 bg-petrol-blue-900 dark:bg-slate-950 z-10 border-r border-petrol-blue-700">
                                        (=) RESULTADO LÍQUIDO DO EXERCÍCIO
                                    </td>
                                    {viewMode === 'comparative' ? (
                                        <>
                                            {monthlyBreakdown.map((m, i) => (
                                                <td key={i} className={`text-right py-6 px-4 tabular-nums ${m.lucroLiquido < 0 ? 'text-[#ff2a2a]' : 'text-[#f5f1ea]'}`}>
                                                    {formatCurrency(m.lucroLiquido)}
                                                </td>
                                            ))}
                                            <td className="text-right py-6 px-4 text-2xl tabular-nums bg-petrol-blue-700 shadow-inner">
                                                {formatCurrency(currentDRE.lucroLiquido)}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="text-right py-6 px-4 text-2xl tabular-nums">{formatCurrency(currentDRE.lucroLiquido)}</td>
                                            <td className="text-right py-6 px-4 text-petrol-blue-200 tabular-nums">
                                                {currentDRE.receitaBruta > 0 ? ((currentDRE.lucroLiquido / currentDRE.receitaBruta) * 100).toFixed(1) : 0}%
                                            </td>
                                        </>
                                    )}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-petrol-blue-100 dark:bg-petrol-blue-800 rounded-lg text-petrol-blue-600 dark:text-petrol-blue-300">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                                <p className="font-bold text-slate-700 dark:text-slate-200 mb-1 leading-none">Glossário e Boas Práticas Financeiras</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><strong>Receita Líquida:</strong> Receita bruta após impostos diretos (ISS/PIS/COFINS).</li>
                                    <li><strong>CSP (Custo dos Serviços Prestados):</strong> Despesas ligadas diretamente à disponibilidade dos veículos (Manutenção, Seguro, IPVA).</li>
                                    <li><strong>EBITDA:</strong> Representa a geração de caixa operacional antes de juros, impostos sobre o lucro e amortização.</li>
                                    <li><strong>Resultado Financeiro:</strong> Custos de capital, como juros de financiamento de veículos.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default DRE;
