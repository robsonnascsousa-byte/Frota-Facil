import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHistoricalCostFleetReturn, calculateOverdueAmount, calculateRecordedCashFlow,
  getFinancialToday, getCompetenceDate, isRecognizedByCutoff, sumCashInPeriod, summarizeWeeklyPayments,
} from '../utils/financial.ts';
import { calculateVehicleCashRanking } from '../utils/dashboardFinancial.ts';
import { mergeContractPayment, removeContractPayment } from '../utils/contractPayments.ts';

const cutoff = '2026-10-08';
const payment = { id: 1, vencimento: '2026-09-30', data_competencia: '2026-09-30', valor: 600, status: 'Em aberto' };
const paid = { ...payment, status: 'Pago', data_pagamento: cutoff, data_liquidacao: cutoff, valor_liquidado: 600 };
const vehicle = { id: 1, placa: 'TEST001', modelo: 'Veículo de teste', status: 'Locado', valor_compra: 50000 };
const contract = { id: 1, veiculo_id: 1, veiculo_placa: vehicle.placa, pagamentos: [payment] };

test('baixa altera caixa e inadimplência; a mesma receita já reconhecida não duplica o retorno por competência', () => {
  const accruedReturn = (rows) => calculateHistoricalCostFleetReturn({
    assets: [{ status: 'Locado', acquisitionCost: 50000 }],
    operatingResult: rows.filter(p => isRecognizedByCutoff(getCompetenceDate(p).date, cutoff)).reduce((sum, p) => sum + p.valor, 0),
  });
  assert.deepEqual(accruedReturn([paid]), accruedReturn([payment]));
  assert.equal(calculateRecordedCashFlow([payment], [], cutoff).balance, 0);
  assert.equal(calculateRecordedCashFlow([paid], [], cutoff).balance, 600);
  assert.equal(sumCashInPeriod([paid], 2026, 10, cutoff), 600);
  assert.equal(sumCashInPeriod([paid], 2026, 9, cutoff), 0);
  assert.equal(calculateOverdueAmount([payment], cutoff), 600);
  assert.equal(calculateOverdueAmount([paid], cutoff), 0);
});

test('alterar valor liquidado muda os indicadores de caixa, sem usar o valor previsto', () => {
  const corrected = { ...paid, valor_liquidado: 575.5 };
  assert.equal(calculateRecordedCashFlow([corrected], [], cutoff).balance, 575.5);
  assert.equal(sumCashInPeriod([corrected], 2026, 10, cutoff), 575.5);
});

test('recebimento atrasado entra na semana de pagamento sem quitar cobranças de outra semana', () => {
  const currentWeek = { id: 2, vencimento: '2026-10-09', valor: 650, status: 'Em aberto' };
  const result = summarizeWeeklyPayments([paid, currentWeek], '2026-10-05', '2026-10-11', cutoff);
  assert.deepEqual(result, { received: 600, expected: 650, settled: 0, remaining: 650 });
});

test('cobrança paga antecipadamente está quitada, mas não conta como entrada de caixa na semana do vencimento', () => {
  const advance = { ...paid, vencimento: '2026-10-07', data_pagamento: '2026-10-01', data_liquidacao: '2026-10-01' };
  assert.deepEqual(summarizeWeeklyPayments([advance], '2026-10-05', '2026-10-11', cutoff), {
    received: 0, expected: 600, settled: 600, remaining: 0,
  });
});

test('totais de caixa incluem multas, financiamento e venda registrados; excluem abertos e liquidações futuras', () => {
  const receipts = [paid, { ...paid, valor: 9000, valor_liquidado: 1000, origem: 'venda_veiculo' },
    { ...paid, data_liquidacao: '2026-10-09', valor_liquidado: 300 }, { ...payment, valor: 400 }];
  const payments = [{ status: 'Paga', valor: 100, valor_liquidado: 80, data_liquidacao: cutoff, tipo: 'Financiamento' },
    { status: 'Paga', valor: 50, data_liquidacao: cutoff, tipo: 'Multa' },
    { status: 'Em aberto', valor: 500, data: cutoff }];
  assert.deepEqual(calculateRecordedCashFlow(receipts, payments, cutoff), { received: 1600, paid: 130, balance: 1470 });
});

test('ranking usa caixa pago, receitas manuais, multas e vínculo por ID, sem receita de venda nem custos futuros', () => {
  const data = { veiculos: [vehicle], contratos: [{ ...contract, pagamentos: [{ ...paid, valor_liquidado: 550 }] }],
    receitas: [{ veiculo_id: 1, status: 'Pago', data_liquidacao: cutoff, valor: 100 },
      { veiculo_id: 1, status: 'Pago', data_liquidacao: cutoff, valor: 30000, origem: 'venda_veiculo' }],
    despesas: [{ veiculo_id: 1, status: 'Paga', data: cutoff, valor: 200, valor_liquidado: 150 },
      { veiculo_placa: vehicle.placa, status: 'Em aberto', data: cutoff, valor: 2000 }],
    manutencoes: [{ veiculo_placa: vehicle.placa, status: 'Paga', data: cutoff, valor: 75 }],
    multas: [{ veiculo_id: 1, status: 'Paga', data: cutoff, valor: 25 }] };
  const [ranking] = calculateVehicleCashRanking(data, cutoff);
  assert.equal(ranking.received, 650);
  assert.equal(ranking.paid, 250);
  assert.equal(ranking.lucro, 400);
});

test('duas baixas no mesmo contrato preservam ambas, mesmo concluídas fora de ordem', () => {
  const original = [{ ...contract, pagamentos: [payment, { ...payment, id: 2 }] }];
  let state = mergeContractPayment(original, 1, { ...paid, id: 2 });
  state = mergeContractPayment(state, 1, { ...paid, valor: 650, valor_liquidado: 640 });
  assert.equal(state[0].pagamentos[0].valor_liquidado, 640);
  assert.equal(state[0].pagamentos[1].status, 'Pago');
  assert.equal(calculateRecordedCashFlow(state[0].pagamentos, [], cutoff).received, 1240);
  assert.equal(original[0].pagamentos[0].status, 'Em aberto');
});

test('excluir uma parcela não desfaz uma baixa concluída em outra parcela', () => {
  const original = [{ ...contract, pagamentos: [payment, { ...payment, id: 2 }] }];
  const state = removeContractPayment(mergeContractPayment(original, 1, paid), 1, 2);
  assert.equal(state[0].pagamentos.length, 1);
  assert.equal(state[0].pagamentos[0].status, 'Pago');
});

test('inadimplência considera vencimento real, incluindo aberto vencido, mas não hoje ou futuro', () => {
  assert.equal(calculateOverdueAmount([payment, { ...payment, vencimento: cutoff },
    { ...payment, status: 'Atrasado', vencimento: '2026-10-09' }, paid], cutoff), 600);
});

test('baixa feita à noite no Brasil permanece no dia e no mês locais', () => {
  assert.equal(getFinancialToday(new Date('2026-11-01T01:30:00Z')), '2026-10-31');
  assert.equal(getFinancialToday(new Date('2026-11-01T03:01:00Z')), '2026-11-01');
});
