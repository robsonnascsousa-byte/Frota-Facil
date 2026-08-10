import React, { useMemo } from 'react';
import { Veiculo, Contrato, estaNaOperacao } from '../types';
import { formatCurrency } from '../utils/formatters';

interface FleetStripProps {
    veiculos: Veiculo[];
    contratos: Contrato[];
}

type SlotEstado = 'pago' | 'a_vencer' | 'atrasado' | 'manutencao' | 'parado';

interface Slot {
    placa: string;
    modelo: string;
    motorista?: string;
    estado: SlotEstado;
    valor: number;
}

/** 'YYYY-MM-DD' como data local. `new Date(str)` interpretaria como UTC e,
 *  a oeste de Greenwich, jogaria o vencimento para o dia anterior. */
const parseData = (iso: string): Date => {
    const [a, m, d] = iso.split('-').map(Number);
    return new Date(a, (m || 1) - 1, d || 1);
};

/** Segunda a domingo da semana que contém `ref`. */
const semanaDe = (ref: Date): { inicio: Date; fim: Date } => {
    const dia = ref.getDay();                 // 0 = domingo
    const recuo = dia === 0 ? 6 : dia - 1;    // segunda é o marco zero
    const inicio = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - recuo);
    const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
    return { inicio, fim };
};

const ESTADO_STYLE: Record<SlotEstado, { barra: string; rotulo: string; cor: string }> = {
    pago:       { barra: '#f5f1ea', rotulo: 'PAGO',    cor: '#f5f1ea' },
    a_vencer:   { barra: '#8a8a8a', rotulo: 'A VENCER', cor: '#8a8a8a' },
    atrasado:   { barra: '#ff2a2a', rotulo: 'ATRASADO', cor: '#ff2a2a' },
    manutencao: { barra: '#c40000', rotulo: 'OFICINA',  cor: '#c40000' },
    parado:     { barra: '#2a2a2a', rotulo: 'PARADO',   cor: '#8a8a8a' },
};

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const FleetStrip: React.FC<FleetStripProps> = ({ veiculos, contratos }) => {
    const { slots, entrou, esperado, rodando, inicio, fim } = useMemo(() => {
        const agora = new Date();
        // Meia-noite de hoje: comparar com a hora corrente marcaria como atrasada
        // uma cobrança que vence hoje mesmo.
        const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        const { inicio, fim } = semanaDe(hoje);

        const naSemana = (iso: string) => {
            const d = parseData(iso);
            return d >= inicio && d <= fim;
        };

        const ativos = veiculos.filter(v => estaNaOperacao(v.status));

        const slots: Slot[] = ativos.map(v => {
            const contrato = contratos.find(c => c.veiculo_placa === v.placa && c.status === 'Em vigor');
            const cobranca = contrato?.pagamentos?.find(p => naSemana(p.vencimento));

            let estado: SlotEstado;
            if (v.status === 'Em manutenção') {
                estado = 'manutencao';
            } else if (!contrato || !cobranca) {
                estado = 'parado';
            } else if (cobranca.status === 'Pago') {
                estado = 'pago';
            } else if (parseData(cobranca.vencimento) < hoje) {
                estado = 'atrasado';
            } else {
                estado = 'a_vencer';
            }

            return {
                placa: v.placa,
                modelo: v.modelo,
                motorista: contrato?.motorista_nome,
                estado,
                valor: cobranca?.valor ?? 0,
            };
        });

        // Ordem estável e legível: quem exige ação primeiro.
        const peso: Record<SlotEstado, number> = { atrasado: 0, manutencao: 1, a_vencer: 2, pago: 3, parado: 4 };
        slots.sort((a, b) => peso[a.estado] - peso[b.estado] || a.placa.localeCompare(b.placa));

        const cobrancasDaSemana = contratos.flatMap(c => c.pagamentos || []).filter(p => naSemana(p.vencimento));
        const entrou = cobrancasDaSemana.filter(p => p.status === 'Pago').reduce((s, p) => s + p.valor, 0);
        const esperado = cobrancasDaSemana.reduce((s, p) => s + p.valor, 0);
        const rodando = slots.filter(s => s.estado !== 'parado' && s.estado !== 'manutencao').length;

        return { slots, entrou, esperado, rodando, inicio, fim };
    }, [veiculos, contratos]);

    const pct = esperado > 0 ? Math.min(100, (entrou / esperado) * 100) : 0;
    const periodo = `${inicio.getDate()}–${fim.getDate()} ${MESES[fim.getMonth()]}`.toUpperCase();

    const mono = { fontFamily: '"JetBrains Mono", monospace' } as const;

    return (
        <section
            className="rounded-lg mb-6 overflow-hidden"
            style={{ background: '#141414', border: '1px solid rgba(245,241,234,0.08)' }}
            aria-label="Situação da frota nesta semana"
        >
            {/* Cabeçalho: período e quantos carros estão na rua */}
            <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: '1px solid rgba(245,241,234,0.06)' }}
            >
                <span style={{ ...mono, fontSize: '10px', letterSpacing: '0.2em', color: '#8a8a8a' }}>
                    SEMANA {periodo}
                </span>
                <span style={{ ...mono, fontSize: '10px', letterSpacing: '0.15em', color: '#f5f1ea' }}>
                    {rodando} DE {slots.length} RODANDO
                </span>
            </div>

            {/* Herói: o que entrou na semana, contra o que era esperado */}
            <div className="px-5 pt-6 pb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
                <div className="min-w-0">
                    <p
                        className="tabular-nums truncate"
                        style={{
                            fontFamily: '"Archivo Black", sans-serif',
                            fontSize: 'clamp(38px, 6vw, 68px)',
                            lineHeight: 0.95,
                            letterSpacing: '-0.03em',
                            color: '#f5f1ea',
                        }}
                    >
                        {formatCurrency(entrou)}
                    </p>
                    <p className="mt-2" style={{ ...mono, fontSize: '10px', letterSpacing: '0.2em', color: '#8a8a8a' }}>
                        ENTROU ESTA SEMANA
                    </p>
                </div>

                {esperado > 0 && (
                    <div className="flex-1 min-w-[180px] max-w-sm">
                        <div className="flex items-baseline justify-between mb-2">
                            {/* Enquanto falta receber, o que importa é o saldo, não a meta:
                                no começo da semana o herói é sempre R$ 0 e o "previsto"
                                sozinho não diz o que fazer. */}
                            <span style={{ ...mono, fontSize: '10px', letterSpacing: '0.15em', color: '#8a8a8a' }}>
                                {entrou < esperado
                                    ? `FALTAM ${formatCurrency(esperado - entrou)}`
                                    : `PREVISTO ${formatCurrency(esperado)}`}
                            </span>
                            <span
                                className="tabular-nums"
                                style={{ ...mono, fontSize: '13px', fontWeight: 700, color: pct >= 100 ? '#f5f1ea' : '#ff2a2a' }}
                            >
                                {pct.toFixed(0)}%
                            </span>
                        </div>
                        <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: '#2a2a2a' }}
                            role="progressbar"
                            aria-valuenow={Math.round(pct)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Recebido em relação ao previsto na semana"
                        >
                            <div
                                className="h-full rounded-full motion-safe:transition-all motion-safe:duration-700"
                                style={{ width: `${pct}%`, background: '#f5f1ea' }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* A régua: um slot por carro. Placa é o identificador — o manual da
                marca trata placa como material tipográfico (JetBrains Mono). */}
            <div
                className="grid gap-px px-px pb-px"
                style={{
                    background: 'rgba(245,241,234,0.06)',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                }}
            >
                {slots.map(slot => {
                    const s = ESTADO_STYLE[slot.estado];
                    const cheio = slot.estado === 'pago' || slot.estado === 'atrasado' || slot.estado === 'manutencao';
                    return (
                        <div
                            key={slot.placa}
                            className="px-4 py-4"
                            style={{ background: '#141414' }}
                            title={`${slot.modelo}${slot.motorista ? ` — ${slot.motorista}` : ''}`}
                        >
                            <p style={{ ...mono, fontSize: '13px', letterSpacing: '0.08em', color: '#f5f1ea' }}>
                                {slot.placa}
                            </p>
                            <div className="my-2.5 h-1 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
                                <div
                                    className="h-full rounded-full motion-safe:transition-all motion-safe:duration-500"
                                    style={{ width: cheio ? '100%' : '18%', background: s.barra }}
                                />
                            </div>
                            <div className="flex items-baseline justify-between gap-2">
                                <span className="tabular-nums" style={{ ...mono, fontSize: '11px', color: '#8a8a8a' }}>
                                    {slot.valor > 0 ? formatCurrency(slot.valor).replace(/\s/g, ' ') : '—'}
                                </span>
                                <span style={{ ...mono, fontSize: '9px', letterSpacing: '0.1em', color: s.cor }}>
                                    {s.rotulo}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default FleetStrip;
