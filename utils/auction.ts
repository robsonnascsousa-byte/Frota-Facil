import type { AuctionAnalysis } from '../types/auction.ts';

const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function simulateAuction(input: {
  bid: number; commissionPercent: number; fees: number; extraCosts: number;
  repairs: number; resale: number; targetRoi: number;
}) {
  if (Object.values(input).some(n => !Number.isFinite(n) || n < 0)) {
    throw new Error('Informe valores finitos e não negativos.');
  }
  if (input.commissionPercent > 100 || input.targetRoi > 1000) {
    throw new Error('Percentual fora do intervalo permitido.');
  }
  const commission = money(input.bid * input.commissionPercent / 100);
  const acquisition = money(input.bid + commission + input.fees + input.extraCosts);
  const investment = money(acquisition + input.repairs);
  const profit = money(input.resale - investment);
  const maxBid = money(Math.max(0,
    (input.resale / (1 + input.targetRoi / 100) - input.fees - input.extraCosts - input.repairs)
      / (1 + input.commissionPercent / 100)));
  return { commission, acquisition, investment, profit, roi: investment > 0 ? profit / investment * 100 : null, maxBid };
}

export function analysisRepairCost(analysis: AuctionAnalysis): number {
  return money(analysis.damagedParts.reduce((sum, part) =>
    sum + (part.estimatedPriceRange[0] + part.estimatedPriceRange[1]) / 2, 0)
    + Object.values(analysis.laborEstimate).reduce((sum, cost) => sum + cost, 0));
}

export function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
