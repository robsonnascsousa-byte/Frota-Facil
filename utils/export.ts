/**
 * Utilitários de exportação para Excel
 */

/**
 * Exporta dados para Excel usando SheetJS via CDN
 * @param data - Array de objetos a exportar
 * @param filename - Nome do arquivo (sem extensão)
 * @param sheetName - Nome da planilha
 */
export async function exportToExcel<T extends Record<string, unknown>>(
    data: T[],
    filename: string,
    sheetName: string = 'Dados'
): Promise<void> {
    try {
        // Carrega XLSX do CDN se não estiver disponível
        const XLSX = await loadXLSX();

        // Prepara os dados
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Auto-ajusta largura das colunas
        const columnWidths = getColumnWidths(data);
        worksheet['!cols'] = columnWidths;

        // Salva o arquivo
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        throw new Error('Falha ao exportar dados. Por favor, tente novamente.');
    }
}

/**
 * Carrega a biblioteca SheetJS dinamicamente
 */
async function loadXLSX(): Promise<typeof import('xlsx')> {
    // Verifica se já está carregado globalmente
    if ((window as unknown as { XLSX?: typeof import('xlsx') }).XLSX) {
        return (window as unknown as { XLSX: typeof import('xlsx') }).XLSX;
    }

    // Carrega o script do CDN
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
        script.onload = () => {
            const XLSX = (window as unknown as { XLSX?: typeof import('xlsx') }).XLSX;
            if (XLSX) {
                resolve(XLSX);
            } else {
                reject(new Error('Biblioteca XLSX não carregou corretamente'));
            }
        };
        script.onerror = () => reject(new Error('Falha ao carregar biblioteca XLSX'));
        document.head.appendChild(script);
    });
}

/**
 * Calcula largura ideal das colunas
 */
function getColumnWidths<T extends Record<string, unknown>>(data: T[]): Array<{ wch: number }> {
    if (data.length === 0) return [];

    const keys = Object.keys(data[0]);
    return keys.map(key => {
        const maxLength = Math.max(
            key.length,
            ...data.map(row => {
                const value = row[key];
                return String(value ?? '').length;
            })
        );
        return { wch: Math.min(maxLength + 2, 50) };
    });
}

/**
 * Prepara dados de veículos para exportação
 */
export function prepareVeiculosForExport(veiculos: Array<{
    codigo: string;
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
    cor: string;
    kmAtual: number;
    status: string;
    valorCompra: number;
    valorFipe: number;
}>): Array<Record<string, string | number>> {
    return veiculos.map(v => ({
        'Código': v.codigo,
        'Placa': v.placa,
        'Marca': v.marca,
        'Modelo': v.modelo,
        'Ano': v.ano,
        'Cor': v.cor,
        'KM Atual': v.kmAtual,
        'Status': v.status,
        'Valor de Compra': v.valorCompra,
        'Valor FIPE': v.valorFipe,
    }));
}

/**
 * Prepara dados de motoristas para exportação
 */
export function prepareMotoristasForExport(motoristas: Array<{
    nome: string;
    cpf: string;
    whatsapp: string;
    cidade: string;
    status: string;
    vencimento_cnh: string;
}>): Array<Record<string, string>> {
    return motoristas.map(m => ({
        'Nome': m.nome,
        'CPF': m.cpf,
        'WhatsApp': m.whatsapp,
        'Cidade': m.cidade,
        'Status': m.status,
        'Vencimento CNH': m.vencimento_cnh,
    }));
}

/**
 * Prepara dados de contratos para exportação
 */
export function prepareContratosForExport(contratos: Array<{
    veiculoPlaca: string;
    veiculoModelo: string;
    motoristaNome: string;
    planoNome: string;
    dataInicio: string;
    dataFim: string;
    status: string;
}>): Array<Record<string, string>> {
    return contratos.map(c => ({
        'Veículo (Placa)': c.veiculoPlaca,
        'Veículo (Modelo)': c.veiculoModelo,
        'Motorista': c.motoristaNome,
        'Plano': c.planoNome,
        'Início': c.dataInicio,
        'Fim': c.dataFim,
        'Status': c.status,
    }));
}

/**
 * Prepara dados financeiros para exportação
 */
export function prepareFinanceiroForExport(data: Array<{
    tipo: string;
    veiculoPlaca?: string;
    data: string;
    valor: number;
    status: string;
}>): Array<Record<string, string | number>> {
    return data.map(d => ({
        'Tipo': d.tipo,
        'Veículo': d.veiculoPlaca || '-',
        'Data': d.data,
        'Valor': d.valor,
        'Status': d.status,
    }));
}
