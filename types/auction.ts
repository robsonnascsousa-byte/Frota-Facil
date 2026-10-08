export interface DamagedPart {
  partName: string;
  repairOrReplace: 'repair' | 'replace';
  estimatedPriceRange: [number, number];
  confidenceScore?: number;
}

export interface AuctionAnalysis {
  brand: string;
  model: string;
  detectedDamageDescription: string;
  marketValueFipe: number;
  damagedParts: DamagedPart[];
  laborEstimate: { painting: number; bodywork: number; mechanics: number; electricity: number; general: number };
  recommendedBid: number;
  profitAnalysis: string;
}

export interface AuctionLot {
  id: string;
  user_id: string;
  marca: string;
  modelo: string;
  ano: number;
  valor_fipe: number;
  lance: number;
  comissao_percentual: number;
  taxas: number;
  custos_extras: number;
  reparos_estimados: number;
  revenda_estimada: number;
  data_leilao: string | null;
  leiloeiro: string;
  numero_lote: string;
  link: string;
  notas: string;
  status: 'monitorando' | 'arrematado' | 'perdido' | 'cancelado';
  analise: AuctionAnalysis | null;
  veiculo_id: number | null;
  created_at: string;
  updated_at: string;
}

export type NewAuctionLot = Omit<AuctionLot, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'veiculo_id'>;

export interface MarketSearch {
  summary: string;
  offers: { title: string; price: number; source: string; url: string }[];
  citations?: { title: string; uri: string }[];
}
