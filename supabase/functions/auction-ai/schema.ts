const number = { type: 'number', minimum: 0 };
const text = { type: 'string' };
export const analysisSchema = {
  type: 'object',
  properties: {
    brand: text, model: text, detectedDamageDescription: text, marketValueFipe: number,
    recommendedBid: number, profitAnalysis: text,
    damagedParts: { type: 'array', items: { type: 'object', properties: {
      partName: text, repairOrReplace: { type: 'string', enum: ['repair', 'replace'] },
      estimatedPriceRange: { type: 'array', items: number, minItems: 2, maxItems: 2 },
      confidenceScore: { type: 'number', minimum: 0, maximum: 1 },
    }, required: ['partName', 'repairOrReplace', 'estimatedPriceRange'] } },
    laborEstimate: { type: 'object', properties: { painting: number, bodywork: number, mechanics: number, electricity: number, general: number },
      required: ['painting', 'bodywork', 'mechanics', 'electricity', 'general'] },
  }, required: ['brand', 'model', 'detectedDamageDescription', 'marketValueFipe', 'recommendedBid', 'profitAnalysis', 'damagedParts', 'laborEstimate'],
};
export const marketSchema = {
  type: 'object', properties: { summary: text, offers: { type: 'array', items: {
    type: 'object', properties: { title: text, price: number, source: text, url: text },
    required: ['title', 'price', 'source', 'url'],
  } } }, required: ['summary', 'offers'],
};
