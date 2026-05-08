export type Page = 'dashboard' | 'veiculos' | 'motoristas' | 'planos' | 'contratos' | 'manutencoes' | 'multas' | 'financeiro' | 'dre' | 'documentos' | 'configuracoes' | 'acessos';

export type StatusVeiculo = "Disponível" | "Locado" | "Em manutenção" | "Vendido";
export type StatusContrato = "Em vigor" | "Encerrado" | "Em atraso";
export type StatusPagamento = "Pago" | "Em aberto" | "Atrasado";
export type StatusMotorista = "Ativo" | "Inadimplente" | "Histórico";
export type StatusGenerico = "Ativo" | "Inativo";
export type StatusMulta = "Paga" | "Em aberto" | "Em recurso";
export type StatusSinistro = "Em análise" | "Indenizado" | "Concluído";
export type StatusPagamentoDespesa = "Paga" | "Em aberto";

export type UserRole = 'admin' | 'gerente' | 'operacao';

export interface Profile {
    id: string;
    email: string;
    nome?: string;
    empresa?: string;
    role?: UserRole;
    created_at?: string;
}

export interface Veiculo {
    id: number;
    codigo: string;
    placa: string;
    modelo: string;
    marca: string;
    ano: number;
    cor: string;
    km_atual: number;
    status: StatusVeiculo;
    motorista_atual?: string;
    vencimento_seguro: string;
    valor_compra: number;
    data_compra: string;
    valor_fipe: number;
    foto_url?: string;
    valor_venda?: number;
    created_at?: string;
}

export interface Motorista {
    id: number;
    nome: string;
    cpf: string;
    whatsapp: string;
    cidade: string;
    status: StatusMotorista;
    vencimento_cnh: string;
}

export interface Plano {
    id: number;
    nome: string;
    tipo_cobranca: 'Semanal' | 'Mensal' | 'Diária';
    valor_base: number;
    franquia_km: string;
    status: StatusGenerico;
}

export interface Pagamento {
    id: number;
    contrato_id?: number;
    vencimento: string;
    valor: number;
    status: StatusPagamento;
}

export interface Contrato {
    id: number;
    veiculo_id: number;
    veiculo_placa: string;
    veiculo_modelo: string;
    motorista_nome: string;
    plano_nome: string;
    data_inicio: string;
    data_fim: string;
    status: StatusContrato;
    pagamentos: Pagamento[];
    documento_anexado?: string;
}

export interface DocumentoAnexado {
    id: number;
    nome: string;
}

export interface Manutencao {
    id: number;
    veiculo_id?: number;
    veiculo_placa: string;
    tipo: string;
    data: string;
    km: number;
    valor: number;
    fornecedor: string;
    status: StatusPagamentoDespesa;
    documentos_anexados?: DocumentoAnexado[];
}

export interface Multa {
    id: number;
    veiculo_id?: number;
    veiculo_placa: string;
    data: string;
    valor: number;
    motorista_nome: string;
    status: StatusMulta;
}

export interface Sinistro {
    id: number;
    veiculo_id?: number;
    veiculo_placa: string;
    tipo: string;
    data: string;
    status: StatusSinistro;
}

export interface Despesa {
    id: number;
    tipo: string;
    veiculo_placa?: string;
    data: string;
    valor: number;
    status: StatusPagamentoDespesa;
    parcelamento_id?: string;
    veiculo_id?: number;
}

export interface Receita {
    id: number;
    tipo: string;
    veiculo_placa?: string;
    data: string;
    valor: number;
    status: StatusPagamento;
    parcelamento_id?: string;
    veiculo_id?: number;
}

export interface Documento {
    id: number;
    tipo: string;
    referencia: string;
    vencimento: string;
    status: 'Válido' | 'Vencido' | 'Próximo Vencimento';
}