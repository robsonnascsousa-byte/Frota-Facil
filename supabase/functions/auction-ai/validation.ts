import type { AuctionAnalysis, MarketSearch } from '../../../types/auction.ts';

export const MAX_MEDIA_BYTES = 12 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']);
const object = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Resposta inválida da IA.');
  return v as Record<string, unknown>;
};
const string = (v: unknown, max = 10000): string => {
  if (typeof v !== 'string' || v.length > max) throw new Error('Texto inválido.');
  return v;
};
const amount = (v: unknown): number => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100000000) throw new Error('Valor inválido na resposta da IA.');
  return v;
};
export function validateAnalysis(value: unknown): AuctionAnalysis {
  const a = object(value);
  const labor = object(a.laborEstimate);
  if (!Array.isArray(a.damagedParts) || a.damagedParts.length > 100) throw new Error('Lista de peças inválida.');
  return {
    brand: string(a.brand, 200), model: string(a.model, 300),
    detectedDamageDescription: string(a.detectedDamageDescription), marketValueFipe: amount(a.marketValueFipe),
    recommendedBid: amount(a.recommendedBid), profitAnalysis: string(a.profitAnalysis),
    laborEstimate: {
      painting: amount(labor.painting), bodywork: amount(labor.bodywork), mechanics: amount(labor.mechanics),
      electricity: amount(labor.electricity), general: amount(labor.general),
    },
    damagedParts: a.damagedParts.map(value => {
      const p = object(value);
      if (!Array.isArray(p.estimatedPriceRange) || p.estimatedPriceRange.length !== 2
          || !['repair', 'replace'].includes(String(p.repairOrReplace))) throw new Error('Peça inválida.');
      const min = amount(p.estimatedPriceRange[0]);
      const max = amount(p.estimatedPriceRange[1]);
      if (max < min) throw new Error('Faixa de preço inválida.');
      const confidence = p.confidenceScore == null ? undefined : amount(p.confidenceScore);
      if (confidence != null && confidence > 1) throw new Error('Confiança inválida.');
      return { partName: string(p.partName, 300), repairOrReplace: p.repairOrReplace as 'repair' | 'replace',
        estimatedPriceRange: [min, max], confidenceScore: confidence };
    }),
  };
}
export function validateMarketSearch(value: unknown): MarketSearch {
  const a = object(value);
  if (!Array.isArray(a.offers) || a.offers.length > 30) throw new Error('Ofertas inválidas.');
  return { summary: string(a.summary), offers: a.offers.map(value => {
    const offer = object(value);
    return { title: string(offer.title, 300), price: amount(offer.price), source: string(offer.source, 300), url: string(offer.url, 2000) };
  }), citations: Array.isArray(a.citations) ? a.citations.slice(0, 30).map(value => {
    const citation = object(value);
    return { title: string(citation.title, 300), uri: string(citation.uri, 2000) };
  }) : [] };
}
export function validateAiRequest(value: unknown) {
  const body = object(value);
  const action = string(body.action, 30);
  if (!['analyze', 'search-parts', 'search-vehicles'].includes(action)) throw new Error('Ação inválida.');
  if (action === 'analyze') {
    if (!Array.isArray(body.files) || body.files.length < 1 || body.files.length > 6) throw new Error('Envie de 1 a 6 imagens ou vídeos.');
    let size = 0;
    const files = body.files.map(value => {
      const file = object(value);
      const mimeType = string(file.mimeType, 50);
      if (!allowedMimeTypes.has(mimeType)) throw new Error('Formato de mídia não permitido.');
      const data = string(file.data, MAX_MEDIA_BYTES * 4 / 3 + 4);
      if (!data || data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new Error('Mídia inválida.');
      size += data.length * 3 / 4 - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0);
      return { data, mimeType };
    });
    if (size > MAX_MEDIA_BYTES) throw new Error('As mídias devem somar no máximo 12 MB.');
    return { action, files, carModelSuggestion: string(body.carModelSuggestion || '', 300) };
  }
  const carModel = string(body.carModel, 300).trim();
  if (!carModel) throw new Error('Informe o modelo do veículo.');
  const partName = action === 'search-parts' ? string(body.partName, 300).trim() : '';
  if (action === 'search-parts' && !partName) throw new Error('Informe a peça.');
  return { action, carModel, partName };
}
