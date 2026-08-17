import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addMonthsClamped,
  calculateFleetReturn,
  classifyDreExpenseCategory,
  consolidateAssetSales,
  getBaseCategory,
  getCashDate,
  getCashAmount,
  getCompetenceDate,
  splitAmountInCents,
  isRecognizedByCutoff,
} from '../utils/financial.ts';

test('divide R$ 100 em três parcelas sem perder centavos', () => {
  const parcelas = splitAmountInCents(100, 3);
  assert.deepEqual(parcelas, [33.34, 33.33, 33.33]);
  assert.equal(parcelas.reduce((total, valor) => total + valor, 0), 100);
});

test('mantém a categoria estável para dados parcelados legados', () => {
  assert.equal(getBaseCategory('Seguro (1/12)'), 'Seguro');
  assert.equal(getBaseCategory('Financiamento (48/48)'), 'Financiamento');
  assert.equal(getBaseCategory('Venda de Veículo (ABC1D23) 2/10'), 'Venda de Veículo (ABC1D23)');
});

test('classifica financiamento e custos sem distorcer a DRE', () => {
  assert.equal(classifyDreExpenseCategory('Seguro (1/12)'), 'csp');
  assert.equal(classifyDreExpenseCategory('Juros e encargos (2/24)'), 'financeiro');
  assert.equal(classifyDreExpenseCategory('Principal de financiamento'), 'principal');
  assert.equal(classifyDreExpenseCategory('Financiamento (4/48)'), 'financiamento_nao_segregado');
  assert.equal(classifyDreExpenseCategory('Tributos sobre receita'), 'deducao');
});

test('soma meses preservando o último dia possível', () => {
  assert.equal(addMonthsClamped('2025-01-31', 1), '2025-02-28');
  assert.equal(addMonthsClamped('2024-01-31', 1), '2024-02-29');
  assert.equal(addMonthsClamped('2025-01-31', 2), '2025-03-31');
});

test('separa competência de liquidação e sinaliza fallback legado', () => {
  const novo = {
    data: '2025-01-10',
    data_competencia: '2025-01-05',
    data_pagamento: '2025-02-03',
    status: 'Paga',
  };
  assert.deepEqual(getCompetenceDate(novo), { date: '2025-01-05', inferred: false });
  assert.deepEqual(getCashDate(novo), { date: '2025-02-03', inferred: false });

  const legado = { data: '2025-01-10', status: 'Paga' };
  assert.deepEqual(getCompetenceDate(legado), { date: '2025-01-10', inferred: true });
  assert.deepEqual(getCashDate(legado), { date: '2025-01-10', inferred: true });
});

test('não leva data de liquidação inconsistente para o caixa aberto', () => {
  const aberto = { status: 'Em aberto', valor: 100, valor_liquidado: 80, data_pagamento: '2025-02-03' };
  assert.deepEqual(getCashDate(aberto), { date: null, inferred: false });
  assert.equal(getCashAmount(aberto), 0);
});

test('caixa usa o valor efetivamente liquidado', () => {
  assert.equal(getCashAmount({ status: 'Pago', valor: 100, valor_liquidado: 97.5 }), 97.5);
});

test('indicador acumulado não reconhece competência após a data de corte', () => {
  assert.equal(isRecognizedByCutoff('2025-06-30', '2025-06-30'), true);
  assert.equal(isRecognizedByCutoff('2025-07-01', '2025-06-30'), false);
});

test('consolida parcelas legadas da venda em uma única competência', () => {
  const sales = consolidateAssetSales([
    { id: 1, tipo: 'Venda de Veículo (ABC1D23) 1/2', veiculo_id: 7, data: '2025-01-10', valor: 50 },
    { id: 2, tipo: 'Venda de Veículo (ABC1D23) 2/2', veiculo_id: 7, data: '2025-02-10', valor: 50 },
  ]);
  assert.equal(sales.length, 1);
  assert.equal(sales[0].eventDate, '2025-01-10');
  assert.equal(sales[0].saleValue, 100);
});

test('não cria retorno fictício ao vender veículo pelo custo', () => {
  const retorno = calculateFleetReturn({
    acquisitionCost: 100_000,
    currentFleetValue: 100_000,
    operatingResult: 0,
  });
  assert.equal(retorno.result, 0);
  assert.equal(retorno.returnRate, 0);
});

test('não calcula retorno quando não existe base de investimento', () => {
  const retorno = calculateFleetReturn({
    acquisitionCost: 0,
    currentFleetValue: 0,
    operatingResult: 10_000,
  });
  assert.equal(retorno.returnRate, null);
});
