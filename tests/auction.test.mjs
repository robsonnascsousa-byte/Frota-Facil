import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateAuction, analysisRepairCost, safeHttpUrl } from '../utils/auction.ts';
import { validateAiRequest, validateAnalysis, validateMarketSearch, MAX_MEDIA_BYTES } from '../supabase/functions/auction-ai/validation.ts';

const analysis = {
  brand: 'Fiat', model: 'Argo', marketValueFipe: 60000, recommendedBid: 30000,
  detectedDamageDescription: 'Para-choque danificado.', profitAnalysis: 'Confirmar inspeção.',
  damagedParts: [{ partName: 'Para-choque', repairOrReplace: 'replace', estimatedPriceRange: [500, 900], confidenceScore: .8 }],
  laborEstimate: { painting: 300, bodywork: 200, mechanics: 0, electricity: 0, general: 100 },
};
test('simula comissão, taxas e recuperação sem confundir ROI com margem sobre venda', () => {
  const result = simulateAuction({ bid: 30000, commissionPercent: 5, fees: 1500, extraCosts: 2000, repairs: 5000, resale: 48000, targetRoi: 20 });
  assert.equal(result.acquisition, 35000);
  assert.equal(result.investment, 40000);
  assert.equal(result.profit, 8000);
  assert.equal(result.roi, 20);
  assert.equal(result.maxBid, 30000);
});
test('lance máximo considera a comissão e alcança o retorno desejado', () => {
  const input = { bid: 0, commissionPercent: 5, fees: 700, extraCosts: 1800, repairs: 7400, resale: 65000, targetRoi: 25 };
  const result = simulateAuction(input);
  const atMax = simulateAuction({ ...input, bid: result.maxBid });
  assert.ok(Math.abs(atMax.roi - 25) < .001);
});
test('inviabilidade e investimento vazio não produzem ROI infinito', () => {
  const result = simulateAuction({ bid: 0, commissionPercent: 0, fees: 0, extraCosts: 0, repairs: 0, resale: 0, targetRoi: 20 });
  assert.equal(result.roi, null);
  assert.equal(result.maxBid, 0);
  const loss = simulateAuction({ bid: 1000, commissionPercent: 5, fees: 200, extraCosts: 100, repairs: 2000, resale: 1000, targetRoi: 20 });
  assert.equal(loss.maxBid, 0);
  assert.ok(loss.profit < 0);
});
test('rejeita valores financeiros negativos e não finitos', () => {
  for (const bid of [-1, NaN, Infinity]) assert.throws(() => simulateAuction({ bid, commissionPercent: 5, fees: 0, extraCosts: 0, repairs: 0, resale: 0, targetRoi: 20 }));
});
test('custo de recuperação inclui média das peças e todas as rubricas de mão de obra', () => {
  assert.equal(analysisRepairCost(validateAnalysis(analysis)), 1300);
});
test('resposta incompleta ou preços invertidos da IA não viram avaliações válidas', () => {
  assert.throws(() => validateAnalysis({}));
  assert.throws(() => validateAnalysis({ ...analysis, damagedParts: [{ ...analysis.damagedParts[0], estimatedPriceRange: [900, 500] }] }));
  assert.throws(() => validateAnalysis({ ...analysis, marketValueFipe: -1 }));
  assert.throws(() => validateAnalysis({ ...analysis, damagedParts: [{ ...analysis.damagedParts[0], confidenceScore: 5 }] }));
});
test('valida ação, modelos, formatos e quantidade de mídias antes de consultar Gemini', () => {
  assert.throws(() => validateAiRequest({ action: 'delete' }));
  assert.throws(() => validateAiRequest({ action: 'search-vehicles', carModel: ' ' }));
  assert.throws(() => validateAiRequest({ action: 'search-parts', carModel: 'Argo', partName: '' }));
  assert.throws(() => validateAiRequest({ action: 'analyze', files: [] }));
  assert.throws(() => validateAiRequest({ action: 'analyze', files: [{ mimeType: 'text/html', data: 'YQ==' }] }));
  assert.throws(() => validateAiRequest({ action: 'analyze', files: Array(7).fill({ mimeType: 'image/jpeg', data: 'YQ==' }) }));
  assert.throws(() => validateAiRequest({ action: 'analyze', files: [{ mimeType: 'image/jpeg', data: 'invalid!' }] }));
  assert.equal(validateAiRequest({ action: 'analyze', files: [{ mimeType: 'image/jpeg', data: 'YQ==' }] }).files.length, 1);
});
test('limite de 12 MB aplica-se à soma das mídias decodificadas', () => {
  const data = 'AAAA'.repeat((MAX_MEDIA_BYTES / 3) / 2 + 1);
  assert.throws(() => validateAiRequest({ action: 'analyze', files: Array(2).fill({ mimeType: 'image/jpeg', data }) }), /12 MB/);
});
test('ofertas vazias são permitidas; preços fictícios de contingência não são gerados', () => {
  assert.deepEqual(validateMarketSearch({ summary: 'Sem fontes.', offers: [] }).offers, []);
  assert.throws(() => validateMarketSearch({ summary: 'Preço', offers: [{ title: 'Farol', source: 'Loja', url: '', price: NaN }] }));
});
test('links de mídia e anúncios permitem apenas HTTP e HTTPS', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), null);
  assert.equal(safeHttpUrl('data:text/html,unsafe'), null);
  assert.equal(safeHttpUrl('https://example.com/lote'), 'https://example.com/lote');
});
