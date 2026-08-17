export interface FinancialDateSource {
    data_competencia?: string | null;
    data_vencimento?: string | null;
    data_pagamento?: string | null;
    data_liquidacao?: string | null;
    vencimento?: string | null;
    data?: string | null;
    status?: string | null;
    valor?: number | null;
    valor_liquidado?: number | null;
}

export interface ResolvedFinancialDate {
    date: string | null;
    inferred: boolean;
}

const PAID_STATUSES = new Set(['pago', 'paga', 'liquidado', 'liquidada']);

export const isPaid = (status?: string | null): boolean =>
    PAID_STATUSES.has((status || '').trim().toLocaleLowerCase('pt-BR'));

/**
 * Remove somente a marca legada de parcela. Parênteses que fazem parte da
 * descrição, como a placa de uma venda, são preservados.
 */
export const getBaseCategory = (tipo?: string | null): string =>
    (tipo || 'Não classificada')
        .replace(/\s+\(\d+\s*\/\s*\d+\)\s*$/u, '')
        .replace(/\s+\d+\s*\/\s*\d+\s*$/u, '')
        .trim() || 'Não classificada';

export const getCompetenceDate = (item: FinancialDateSource): ResolvedFinancialDate => {
    if (item.data_competencia) return { date: item.data_competencia, inferred: false };
    return { date: item.data || item.vencimento || null, inferred: true };
};

export const getDueDate = (item: FinancialDateSource): ResolvedFinancialDate => {
    if (item.data_vencimento) return { date: item.data_vencimento, inferred: false };
    return { date: item.vencimento || item.data || null, inferred: true };
};

/**
 * Registros novos usam liquidação/pagamento real. Para um registro legado já
 * pago, a data operacional é mantida como fallback explicitamente inferido.
 */
export const getCashDate = (item: FinancialDateSource): ResolvedFinancialDate => {
    if (!isPaid(item.status)) return { date: null, inferred: false };
    const actualDate = item.data_liquidacao || item.data_pagamento;
    if (actualDate) return { date: actualDate, inferred: false };
    const legacyDate = item.vencimento || item.data || item.data_competencia || null;
    return { date: legacyDate, inferred: legacyDate !== null };
};

export const getCashAmount = (item: FinancialDateSource): number =>
    isPaid(item.status) ? (item.valor_liquidado ?? item.valor ?? 0) : 0;

export const isRecognizedByCutoff = (
    date: string | null | undefined,
    cutoff: string = new Date().toISOString().slice(0, 10),
): boolean => Boolean(date && date <= cutoff);

export const isPeriodMatch = (
    date: string | null | undefined,
    year: number,
    month: number | 'all',
): boolean => {
    if (!date) return false;
    const [dateYear, dateMonth] = date.split('-').map(Number);
    return dateYear === year && (month === 'all' || dateMonth === month);
};

export const splitAmountInCents = (total: number, installments: number): number[] => {
    if (!Number.isInteger(installments) || installments < 1) {
        throw new Error('A quantidade de parcelas deve ser um inteiro maior que zero.');
    }
    const totalCents = Math.round(total * 100);
    const baseCents = Math.trunc(totalCents / installments);
    let remainder = totalCents - (baseCents * installments);
    return Array.from({ length: installments }, () => {
        const cents = baseCents + (remainder > 0 ? 1 : remainder < 0 ? -1 : 0);
        remainder += remainder > 0 ? -1 : remainder < 0 ? 1 : 0;
        return cents / 100;
    });
};

export const addMonthsClamped = (isoDate: string, months: number): string => {
    const [year, month, day] = isoDate.split('-').map(Number);
    const targetMonthStart = new Date(Date.UTC(year, (month - 1) + months, 1));
    const targetYear = targetMonthStart.getUTCFullYear();
    const targetMonth = targetMonthStart.getUTCMonth();
    const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    return new Date(Date.UTC(targetYear, targetMonth, Math.min(day, lastDay)))
        .toISOString()
        .slice(0, 10);
};

export const addDaysUtc = (isoDate: string, days: number): string => {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return date.toISOString().slice(0, 10);
};

export const isAssetSale = (tipo?: string | null, origem?: string | null): boolean =>
    origem === 'venda_veiculo' || getBaseCategory(tipo).toLocaleLowerCase('pt-BR').startsWith('venda de veículo');

export interface AssetSaleRecord extends FinancialDateSource {
    id: number;
    tipo?: string | null;
    origem?: string | null;
    veiculo_id?: number | null;
    veiculo_placa?: string | null;
    parcelamento_id?: string | null;
    valor: number;
}

export interface ConsolidatedAssetSale {
    key: string;
    eventDate: string | null;
    vehicleId?: number | null;
    vehiclePlate?: string | null;
    saleValue: number;
}

export const consolidateAssetSales = (
    records: AssetSaleRecord[],
    vehicleSaleDates: Map<number, string | undefined> = new Map(),
): ConsolidatedAssetSale[] => {
    const groups = new Map<string, AssetSaleRecord[]>();
    records.filter(r => isAssetSale(r.tipo, r.origem)).forEach(record => {
        const key = record.veiculo_id ? `id:${record.veiculo_id}`
            : record.veiculo_placa ? `placa:${record.veiculo_placa}`
                : record.parcelamento_id ? `parcelamento:${record.parcelamento_id}` : `receita:${record.id}`;
        groups.set(key, [...(groups.get(key) || []), record]);
    });
    return Array.from(groups, ([key, rows]) => {
        const first = rows[0];
        const firstCompetence = rows
            .map(row => getCompetenceDate(row).date)
            .filter((date): date is string => Boolean(date))
            .sort()[0] || null;
        return {
            key,
            eventDate: (first.veiculo_id && vehicleSaleDates.get(first.veiculo_id)) || firstCompetence,
            vehicleId: first.veiculo_id,
            vehiclePlate: first.veiculo_placa,
            saleValue: rows.reduce((total, row) => total + row.valor, 0),
        };
    });
};

export const isFinancingPrincipal = (tipo?: string | null): boolean => {
    const category = getBaseCategory(tipo).toLocaleLowerCase('pt-BR');
    return category === 'principal de financiamento' || category === 'financiamento - principal';
};

export const isUnsplitFinancing = (tipo?: string | null): boolean =>
    getBaseCategory(tipo).toLocaleLowerCase('pt-BR') === 'financiamento';

export type DreExpenseGroup =
    | 'csp'
    | 'financeiro'
    | 'administrativo'
    | 'deducao'
    | 'principal'
    | 'financiamento_nao_segregado'
    | 'nao_classificado';

export const classifyDreExpenseCategory = (tipo?: string | null): DreExpenseGroup => {
    const categoria = getBaseCategory(tipo).toLocaleLowerCase('pt-BR');
    if (categoria === 'tributos sobre receita') return 'deducao';
    if (categoria === 'principal de financiamento' || categoria === 'financiamento - principal') return 'principal';
    if (categoria === 'financiamento') return 'financiamento_nao_segregado';
    if (['juros', 'juros e encargos'].includes(categoria)) return 'financeiro';
    if ([
        'seguro', 'ipva', 'documentação', 'licenciamento', 'manutenção',
        'combustível', 'lavagem', 'estacionamento', 'pneus', 'rastreador',
    ].includes(categoria)) return 'csp';
    if ([
        'contabilidade', 'impostos', 'salários', 'marketing', 'aluguel', 'outros',
    ].includes(categoria)) return 'administrativo';
    return 'nao_classificado';
};

export interface FleetReturnInput {
    acquisitionCost: number;
    currentFleetValue: number;
    operatingResult: number;
}

export interface FleetReturnResult {
    result: number;
    returnRate: number | null;
}

export interface FleetAssetForReturn {
    status: string;
    acquisitionCost: number;
    saleValue?: number | null;
    marketValue?: number | null;
}

export interface HistoricalCostFleetReturnInput {
    assets: FleetAssetForReturn[];
    operatingResult: number;
}

export const calculateFleetReturn = ({
    acquisitionCost,
    currentFleetValue,
    operatingResult,
}: FleetReturnInput): FleetReturnResult => {
    const result = operatingResult + currentFleetValue - acquisitionCost;
    return {
        result,
        returnRate: acquisitionCost > 0 ? result / acquisitionCost : null,
    };
};

export const calculateHistoricalCostFleetReturn = ({
    assets,
    operatingResult,
}: HistoricalCostFleetReturnInput): FleetReturnResult => {
    const acquisitionCost = assets.reduce(
        (total, asset) => total + (asset.acquisitionCost || 0),
        0,
    );
    const recognizedAssetValue = assets.reduce((total, asset) => {
        if (asset.status === 'Vendido') return total + (asset.saleValue || 0);
        // Enquanto o ativo não é vendido, a estimativa de mercado permanece
        // informativa e o cálculo conserva o custo histórico.
        return total + (asset.acquisitionCost || 0);
    }, 0);

    return calculateFleetReturn({
        acquisitionCost,
        currentFleetValue: recognizedAssetValue,
        operatingResult,
    });
};
