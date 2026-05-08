import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';
import { Veiculo, Contrato, Documento, Despesa, Manutencao } from '../types';
import { Card, Header } from './ui';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DashboardProps {
    veiculos: Veiculo[];
    contratos: Contrato[];
    documentos: Documento[];
    despesas: Despesa[];
    manutencoes: Manutencao[];
}

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label, isCurrency = true }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-xl border border-slate-700/50">
                <p className="text-slate-300 text-sm font-medium mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        <span className="font-semibold">{entry.name}:</span>{' '}
                        {isCurrency ? formatCurrency(entry.value) : `${entry.value}%`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Custom legend
const CustomLegend = ({ payload }: any) => {
    return (
        <div className="flex justify-center gap-6 mt-4">
            {payload?.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ veiculos, contratos, documentos, despesas, manutencoes }) => {
    const totalVeiculos = veiculos.length;
    const locados = veiculos.filter(v => v.status === 'Locado').length;
    const parados = totalVeiculos - locados;
    const taxaOcupacao = totalVeiculos > 0 ? (locados / totalVeiculos * 100).toFixed(1) : 0;

    const receitaMes = contratos.flatMap(c => c.pagamentos || [])
        .filter(p => p.status === 'Pago' && new Date(p.vencimento).getUTCMonth() === new Date().getUTCMonth() && new Date(p.vencimento).getUTCFullYear() === new Date().getUTCFullYear())
        .reduce((sum, p) => sum + p.valor, 0);

    const custosMes = useMemo(() => {
        const custosManuais = despesas
            .filter(d => d.status === 'Paga' && new Date(d.data).getUTCMonth() === new Date().getUTCMonth() && new Date(d.data).getUTCFullYear() === new Date().getUTCFullYear())
            .reduce((sum, d) => sum + d.valor, 0);

        const custosManutencao = manutencoes
            .filter(m => m.status === 'Paga' && new Date(m.data).getUTCMonth() === new Date().getUTCMonth() && new Date(m.data).getUTCFullYear() === new Date().getUTCFullYear())
            .reduce((sum, m) => sum + m.valor, 0);

        return custosManuais + custosManutencao;
    }, [despesas, manutencoes]);


    const inadimplencia = contratos.flatMap(c => c.pagamentos || [])
        .filter(p => p.status === 'Atrasado')
        .reduce((sum, p) => sum + p.valor, 0);

    const dataGraficoReceitaDespesa = useMemo(() => {
        const data: { name: string, Receita: number, Despesas: number }[] = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const month = date.getMonth();
            const year = date.getFullYear();

            const receita = contratos.flatMap(c => c.pagamentos || [])
                .filter(p => {
                    const pDate = new Date(p.vencimento);
                    return p.status === 'Pago' && pDate.getMonth() === month && pDate.getFullYear() === year;
                })
                .reduce((sum, p) => sum + p.valor, 0);

            const despesa = [...despesas, ...manutencoes]
                .filter(d => {
                    const dDate = new Date(d.data);
                    return d.status === 'Paga' && dDate.getMonth() === month && dDate.getFullYear() === year;
                })
                .reduce((sum, d) => sum + d.valor, 0);

            data.push({ name: monthName.charAt(0).toUpperCase() + monthName.slice(1), Receita: receita, Despesas: despesa });
        }
        return data;
    }, [contratos, despesas, manutencoes]);

    const dataGraficoOcupacao = useMemo(() => {
        const data: { name: string, Ocupação: number }[] = [];
        const today = new Date();

        // Loop last 7 months (including current)
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            // Vehicles that existed by the end of this month
            const totalVehiclesAtMonth = veiculos.filter(v => {
                const createdDate = v.created_at ? new Date(v.created_at) : new Date(v.data_compra);
                return createdDate <= monthEnd;
            }).length;

            if (totalVehiclesAtMonth === 0) {
                data.push({ name: monthName.charAt(0).toUpperCase() + monthName.slice(1), Ocupação: 0 });
                continue;
            }

            // Vehicles occupied during this month
            // A vehicle is occupied if it has a contract active in that month
            const occupiedVehicleIds = new Set<number>();
            contratos.forEach(c => {
                const start = new Date(c.data_inicio);
                const end = c.data_fim ? new Date(c.data_fim) : new Date();

                if (start <= monthEnd && end >= monthStart) {
                    occupiedVehicleIds.add(c.veiculo_id);
                }
            });

            const occupationRate = (occupiedVehicleIds.size / totalVehiclesAtMonth) * 100;
            data.push({ name: monthName.charAt(0).toUpperCase() + monthName.slice(1), Ocupação: parseFloat(occupationRate.toFixed(1)) });
        }
        return data;
    }, [veiculos, contratos]);

    // Calculate occupation rate change vs previous month
    const ocupacaoChange = useMemo(() => {
        if (dataGraficoOcupacao.length < 2) return 0;
        const currentMonth = dataGraficoOcupacao[dataGraficoOcupacao.length - 1]?.Ocupação || 0;
        const previousMonth = dataGraficoOcupacao[dataGraficoOcupacao.length - 2]?.Ocupação || 0;
        return parseFloat((currentMonth - previousMonth).toFixed(1));
    }, [dataGraficoOcupacao]);

    // Data for vehicle status pie chart
    const statusVeiculos = useMemo(() => {
        const disponivel = veiculos.filter(v => v.status === 'Disponível').length;
        const locado = veiculos.filter(v => v.status === 'Locado').length;
        const manutencao = veiculos.filter(v => v.status === 'Em manutenção').length;
        return [
            { name: 'Locados', value: locado, color: '#22c55e' },
            { name: 'Disponíveis', value: disponivel, color: '#0ea5e9' },
            { name: 'Em Manutenção', value: manutencao, color: '#f59e0b' },
        ].filter(item => item.value > 0);
    }, [veiculos]);

    const documentosVencendo = documentos.filter(d => d.status === 'Próximo Vencimento' || d.status === 'Vencido');

    const veiculosRentaveis = useMemo(() => {
        const rentabilidade: { [key: number]: { veiculo: Veiculo, receita: number, custo: number } } = {};

        veiculos.forEach(v => {
            rentabilidade[v.id] = { veiculo: v, receita: 0, custo: 0 };
        });

        contratos.forEach(c => {
            const pagamentos = c.pagamentos || [];
            const receitaContrato = pagamentos
                .filter(p => p.status === 'Pago')
                .reduce((sum, p) => sum + p.valor, 0);
            if (rentabilidade[c.veiculo_id]) {
                rentabilidade[c.veiculo_id].receita += receitaContrato;
            }
        });

        const todosCustos = [...manutencoes, ...despesas];
        todosCustos.forEach(custo => {
            const veiculo = veiculos.find(v => v.placa === (custo as any).veiculo_placa);
            if (veiculo && rentabilidade[veiculo.id]) {
                rentabilidade[veiculo.id].custo += custo.valor;
            }
        });

        return Object.values(rentabilidade)
            .map(item => ({
                veiculo: `${item.veiculo.modelo} (${item.veiculo.placa})`,
                lucro: item.receita - item.custo
            }))
            .sort((a, b) => b.lucro - a.lucro)
            .slice(0, 5);
    }, [veiculos, contratos, despesas, manutencoes]);


    return (
        <div>
            <Header title="Dashboard" description="Visão geral do desempenho e saúde da sua frota." />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                <Card title="Veículos na Frota" value={totalVeiculos} description={`${locados} locados / ${parados} parados`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                <Card title="Taxa de Ocupação" value={`${taxaOcupacao}%`} description="No mês atual" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>} colorClass="text-green-600" />
                <Card title="Receita do Mês" value={formatCurrency(receitaMes)} description="Receita confirmada" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} colorClass="text-blue-600" />
                <Card title="Inadimplência" value={formatCurrency(inadimplencia)} description="Valor em aberto" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} colorClass="text-orange-600" />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                {/* Revenue vs Expenses Bar Chart */}
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-white">Receitas vs Despesas</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Últimos 7 meses</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/30 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">Ao vivo</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={dataGraficoReceitaDespesa} barGap={8}>
                            <defs>
                                <linearGradient id="receitaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.8} />
                                </linearGradient>
                                <linearGradient id="despesaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" vertical={false} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                            <Legend content={<CustomLegend />} />
                            <Bar dataKey="Receita" fill="url(#receitaGradient)" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="Despesas" fill="url(#despesaGradient)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Occupation Area Chart */}
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-white">Taxa de Ocupação</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Evolução mensal (%)</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{taxaOcupacao}%</p>
                            {ocupacaoChange !== 0 && (
                                <p className={`text-xs ${ocupacaoChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {ocupacaoChange >= 0 ? '+' : ''}{ocupacaoChange}% vs mês anterior
                                </p>
                            )}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={dataGraficoOcupacao}>
                            <defs>
                                <linearGradient id="ocupacaoGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" vertical={false} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                domain={[70, 100]}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip content={<CustomTooltip isCurrency={false} />} />
                            <Area
                                type="monotone"
                                dataKey="Ocupação"
                                stroke="#0ea5e9"
                                strokeWidth={3}
                                fill="url(#ocupacaoGradient)"
                                dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2, fill: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 - Pie Chart and Top Vehicles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {/* Vehicle Status Pie Chart */}
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Status da Frota</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Distribuição atual</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={statusVeiculos}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusVeiculos.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-slate-900/95 px-3 py-2 rounded-lg shadow-lg">
                                                <p className="text-white text-sm font-medium">
                                                    {payload[0].name}: {payload[0].value} veículo(s)
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-4 mt-2">
                        {statusVeiculos.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm text-slate-600 dark:text-slate-400">{item.name} ({item.value})</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Vehicles */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-white">Top 5 Veículos Rentáveis</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Lucro líquido por veículo</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-petrol-blue-100 dark:bg-petrol-blue-900/30 text-petrol-blue-700 dark:text-petrol-blue-300 rounded-full">
                            Lucro total
                        </span>
                    </div>
                    <div className="space-y-3">
                        {veiculosRentaveis.map((v, i) => {
                            const maxLucro = Math.max(...veiculosRentaveis.map(x => x.lucro));
                            const percentage = maxLucro > 0 ? (v.lucro / maxLucro) * 100 : 0;
                            const colors = ['bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500'];
                            return (
                                <div key={i} className="relative">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-full ${colors[i]} text-white text-xs flex items-center justify-center font-bold`}>
                                                {i + 1}
                                            </span>
                                            <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{v.veiculo}</span>
                                        </div>
                                        <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(v.lucro)}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${colors[i]} rounded-full transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Alerts */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">Alertas Importantes</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Itens que requerem sua atenção</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {documentosVencendo.length > 0 ? documentosVencendo.slice(0, 3).map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50">
                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-800 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{doc.tipo}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{doc.referencia} • {formatDate(doc.vencimento)}</p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${doc.status === 'Vencido' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                {doc.status === 'Vencido' ? 'Vencido' : 'Próximo'}
                            </span>
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-6 text-slate-500 dark:text-slate-400">
                            <svg className="w-12 h-12 mx-auto mb-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>Nenhum alerta no momento. Tudo em dia!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;