/**
 * Utilitários de validação para formulários
 */

// Regex para placa no formato Mercosul (ABC1D23) ou antigo (ABC-1234)
const PLACA_MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/i;
const PLACA_ANTIGA = /^[A-Z]{3}-?[0-9]{4}$/i;

/**
 * Valida se uma placa é válida (Mercosul ou antiga)
 */
export function validatePlaca(placa: string): boolean {
    const cleaned = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return PLACA_MERCOSUL.test(cleaned) || PLACA_ANTIGA.test(placa.replace(/[^A-Z0-9]/gi, ''));
}

/**
 * Formata placa para exibição
 */
export function formatPlaca(placa: string): string {
    const cleaned = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Formato Mercosul: ABC1D23
    if (cleaned.length === 7 && PLACA_MERCOSUL.test(cleaned)) {
        return cleaned;
    }

    // Formato antigo: ABC-1234
    if (cleaned.length === 7) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }

    return cleaned;
}

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    // Validação dos dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cleaned[i]) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleaned[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cleaned[i]) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleaned[10])) return false;

    return true;
}

/**
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11) return cpf;

    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Valida se um valor é positivo
 */
export function validatePositiveNumber(value: number | string): boolean {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num >= 0;
}

/**
 * Valida ano do veículo (entre 1900 e próximo ano)
 */
export function validateAno(ano: number): boolean {
    const currentYear = new Date().getFullYear();
    return ano >= 1900 && ano <= currentYear + 1;
}

/**
 * Valida WhatsApp (formato brasileiro)
 */
export function validateWhatsApp(whatsapp: string): boolean {
    const cleaned = whatsapp.replace(/\D/g, '');
    // Aceita com ou sem código do país
    return cleaned.length >= 10 && cleaned.length <= 13;
}

/**
 * Formata WhatsApp para exibição
 */
export function formatWhatsApp(whatsapp: string): string {
    const cleaned = whatsapp.replace(/\D/g, '');

    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return whatsapp;
}

// Tipos para erros de validação
export interface ValidationErrors {
    [field: string]: string | undefined;
}

/**
 * Valida veículo e retorna erros
 */
export function validateVeiculo(data: {
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
    valor_compra?: number;
    valor_fipe?: number;
}): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!data.placa || !validatePlaca(data.placa)) {
        errors.placa = 'Placa inválida. Use formato ABC1D23 ou ABC-1234';
    }

    if (!data.marca || data.marca.trim().length < 2) {
        errors.marca = 'Marca é obrigatória';
    }

    if (!data.modelo || data.modelo.trim().length < 2) {
        errors.modelo = 'Modelo é obrigatório';
    }

    if (!validateAno(data.ano)) {
        errors.ano = 'Ano inválido';
    }

    if (data.valor_compra !== undefined && !validatePositiveNumber(data.valor_compra)) {
        errors.valor_compra = 'Valor de compra deve ser positivo';
    }

    if (data.valor_fipe !== undefined && !validatePositiveNumber(data.valor_fipe)) {
        errors.valor_fipe = 'Valor FIPE deve ser positivo';
    }

    return errors;
}

/**
 * Valida motorista e retorna erros
 */
export function validateMotorista(data: {
    nome: string;
    cpf: string;
    whatsapp: string;
}): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!data.nome || data.nome.trim().length < 3) {
        errors.nome = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!validateCPF(data.cpf)) {
        errors.cpf = 'CPF inválido';
    }

    if (!validateWhatsApp(data.whatsapp)) {
        errors.whatsapp = 'WhatsApp inválido. Use formato (XX) XXXXX-XXXX';
    }

    return errors;
}
