/**
 * Serviço de integração com a API FIPE (gratuita)
 * API: https://parallelum.com.br/fipe/api/v1
 */

const FIPE_API_BASE = 'https://parallelum.com.br/fipe/api/v1';

export type TipoVeiculo = 'carros' | 'motos' | 'caminhoes';

export interface FipeMarca {
    codigo: string;
    nome: string;
}

export interface FipeModelo {
    codigo: number;
    nome: string;
}

export interface FipeAno {
    codigo: string;
    nome: string;
}

export interface FipeValor {
    Valor: string;
    Marca: string;
    Modelo: string;
    AnoModelo: number;
    Combustivel: string;
    CodigoFipe: string;
    MesReferencia: string;
    TipoVeiculo: number;
    SiglaCombustivel: string;
}

// Cache para evitar requisições repetidas
const cache: Record<string, { data: unknown; timestamp: number }> = {};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

async function fetchWithCache<T>(url: string): Promise<T> {
    const now = Date.now();

    // Verifica cache
    if (cache[url] && (now - cache[url].timestamp) < CACHE_DURATION) {
        return cache[url].data as T;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro na API FIPE: ${response.status}`);
        }
        const data = await response.json();

        // Salva no cache
        cache[url] = { data, timestamp: now };

        return data as T;
    } catch (error) {
        console.error('Erro ao consultar API FIPE:', error);
        throw error;
    }
}

/**
 * Busca todas as marcas disponíveis
 */
export async function getMarcas(tipo: TipoVeiculo = 'carros'): Promise<FipeMarca[]> {
    const url = `${FIPE_API_BASE}/${tipo}/marcas`;
    return fetchWithCache<FipeMarca[]>(url);
}

/**
 * Busca modelos de uma marca específica
 */
export async function getModelos(tipo: TipoVeiculo, marcaCodigo: string): Promise<{ modelos: FipeModelo[] }> {
    const url = `${FIPE_API_BASE}/${tipo}/marcas/${marcaCodigo}/modelos`;
    return fetchWithCache<{ modelos: FipeModelo[] }>(url);
}

/**
 * Busca anos disponíveis para um modelo
 */
export async function getAnos(tipo: TipoVeiculo, marcaCodigo: string, modeloCodigo: number): Promise<FipeAno[]> {
    const url = `${FIPE_API_BASE}/${tipo}/marcas/${marcaCodigo}/modelos/${modeloCodigo}/anos`;
    return fetchWithCache<FipeAno[]>(url);
}

/**
 * Busca o valor FIPE de um veículo específico
 */
export async function getValorFipe(
    tipo: TipoVeiculo,
    marcaCodigo: string,
    modeloCodigo: number,
    anoCodigo: string
): Promise<FipeValor> {
    const url = `${FIPE_API_BASE}/${tipo}/marcas/${marcaCodigo}/modelos/${modeloCodigo}/anos/${anoCodigo}`;
    return fetchWithCache<FipeValor>(url);
}

/**
 * Converte string de valor FIPE para número
 * "R$ 45.000,00" -> 45000
 */
export function parseValorFipe(valor: string): number {
    return parseFloat(
        valor
            .replace('R$ ', '')
            .replace(/\./g, '')
            .replace(',', '.')
    );
}

/**
 * Busca valor FIPE simplificado por marca e modelo (texto)
 * Útil para busca rápida
 */
export async function buscarValorPorTexto(
    marca: string,
    modelo: string,
    ano: number,
    tipo: TipoVeiculo = 'carros'
): Promise<FipeValor | null> {
    try {
        // 1. Busca marcas e encontra a correspondente
        const marcas = await getMarcas(tipo);
        const marcaEncontrada = marcas.find(m =>
            m.nome.toLowerCase().includes(marca.toLowerCase())
        );

        if (!marcaEncontrada) return null;

        // 2. Busca modelos da marca
        const { modelos } = await getModelos(tipo, marcaEncontrada.codigo);
        const modeloEncontrado = modelos.find(m =>
            m.nome.toLowerCase().includes(modelo.toLowerCase())
        );

        if (!modeloEncontrado) return null;

        // 3. Busca anos disponíveis
        const anos = await getAnos(tipo, marcaEncontrada.codigo, modeloEncontrado.codigo);
        const anoEncontrado = anos.find(a => a.nome.includes(String(ano)));

        if (!anoEncontrado) return null;

        // 4. Busca valor
        return await getValorFipe(
            tipo,
            marcaEncontrada.codigo,
            modeloEncontrado.codigo,
            anoEncontrado.codigo
        );
    } catch (error) {
        console.error('Erro ao buscar valor FIPE:', error);
        return null;
    }
}

/**
 * Limpa o cache da API FIPE
 */
export function limparCacheFipe(): void {
    Object.keys(cache).forEach(key => delete cache[key]);
}
