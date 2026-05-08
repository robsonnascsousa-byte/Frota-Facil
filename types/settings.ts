// Settings types
export interface EmpresaConfig {
    nome: string;
    cnpj: string;
    endereco: string;
    telefone: string;
    email: string;
}

export interface PreferenciasConfig {
    moeda: 'BRL' | 'USD' | 'EUR';
    formatoData: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    itensPorPagina: 10 | 25 | 50;
}

export interface AlertasConfig {
    diasCNH: number;
    diasDocumentos: number;
    diasManutencao: number;
    diasInadimplencia: number;
    emailAtivo: boolean;
}

export interface AppSettings {
    empresa: EmpresaConfig;
    preferencias: PreferenciasConfig;
    alertas: AlertasConfig;
}

export const defaultSettings: AppSettings = {
    empresa: {
        nome: 'FrotaFácil Locadora',
        cnpj: '',
        endereco: '',
        telefone: '',
        email: '',
    },
    preferencias: {
        moeda: 'BRL',
        formatoData: 'DD/MM/YYYY',
        itensPorPagina: 10,
    },
    alertas: {
        diasCNH: 30,
        diasDocumentos: 15,
        diasManutencao: 7,
        diasInadimplencia: 5,
        emailAtivo: false,
    },
};
