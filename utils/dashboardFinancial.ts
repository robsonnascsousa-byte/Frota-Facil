import type { Contrato, Despesa, Manutencao, Multa, Receita, Veiculo } from '../types';
import { getFinancialToday, isAssetSale, sumCashThroughCutoff } from './financial.ts';

export interface DashboardFinancialData {
    veiculos: Veiculo[];
    contratos: Contrato[];
    receitas: Receita[];
    despesas: Despesa[];
    manutencoes: Manutencao[];
    multas: Multa[];
}

export const matchesFinancialVehicle = (
    item: { veiculo_id?: number | null; veiculo_placa?: string | null }, vehicle: Veiculo,
): boolean => item.veiculo_id != null ? item.veiculo_id === vehicle.id : item.veiculo_placa === vehicle.placa;

/** Ranking de caixa registrado, sem misturar despesas abertas ou venda de ativos. */
export const calculateVehicleCashRanking = (data: DashboardFinancialData, cutoff = getFinancialToday()) =>
    data.veiculos.map(vehicle => {
        const rentals = data.contratos.filter(contract => matchesFinancialVehicle(contract, vehicle))
            .flatMap(contract => contract.pagamentos || []);
        const otherReceipts = data.receitas.filter(receipt => matchesFinancialVehicle(receipt, vehicle)
            && !isAssetSale(receipt.tipo, receipt.origem));
        const payments = [...data.despesas, ...data.manutencoes, ...data.multas]
            .filter(payment => matchesFinancialVehicle(payment, vehicle));
        const received = sumCashThroughCutoff([...rentals, ...otherReceipts], cutoff);
        const paid = sumCashThroughCutoff(payments, cutoff);
        return { id: vehicle.id, veiculo: `${vehicle.modelo} (${vehicle.placa})`, received, paid, lucro: received - paid };
    }).sort((a, b) => b.lucro - a.lucro).slice(0, 5);
