import { supabase } from '../lib/supabase';
import type { Veiculo } from '../types';
import type { AuctionLot, NewAuctionLot, AuctionAnalysis, MarketSearch } from '../types/auction';
import { validateAnalysis, validateMarketSearch } from '../supabase/functions/auction-ai/validation';

export async function getAuctionLots(): Promise<AuctionLot[]> {
  const { data, error } = await supabase.from('leilao_lotes').select('*').order('created_at', { ascending: false });
  if (error) {
    if (['42P01', 'PGRST205'].includes(error.code)) {
      throw new Error('Leilões e revenda ainda não foi ativado. Solicite ao administrador a conclusão da configuração do módulo.');
    }
    throw error;
  }
  return data || [];
}

export async function saveAuctionLot(lot: NewAuctionLot): Promise<AuctionLot> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Entre na sua conta para salvar o lote.');
  const { data, error } = await supabase.from('leilao_lotes').insert({ ...lot, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function changeAuctionLotStatus(id: string, status: 'monitorando' | 'perdido' | 'cancelado') {
  const { error } = await supabase.from('leilao_lotes').update({ status }).eq('id', id).select().single();
  if (error) throw error;
}

export async function acquireAuctionLot(id: string, details: { placa: string; data_compra: string; lance: number }) {
  const { data, error } = await supabase.rpc('arrematar_lote', { p_lote_id: id, p_placa: details.placa, p_data_compra: details.data_compra, p_lance: details.lance });
  if (error) throw error;
  return data as { lote: AuctionLot; veiculo: Veiculo };
}

async function invokeAi(body: object): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke('auction-ai', { body });
  if (error) {
    const context = 'context' in error ? error.context : null;
    if (context instanceof Response) {
      const response = await context.json().catch(() => null);
      if (response?.error) throw new Error(response.error);
    }
    throw new Error('Não foi possível consultar a IA. Verifique a publicação da função auction-ai e a configuração do Gemini no Supabase.');
  }
  return data;
}

export async function analyzeAuctionMedia(files: { data: string; mimeType: string }[], carModelSuggestion: string): Promise<AuctionAnalysis> {
  const data = await invokeAi({ action: 'analyze', files, carModelSuggestion });
  return validateAnalysis(data);
}

export async function searchAuctionMarket(carModel: string, partName?: string): Promise<MarketSearch> {
  return validateMarketSearch(await invokeAi({ action: partName ? 'search-parts' : 'search-vehicles', carModel, partName }));
}
