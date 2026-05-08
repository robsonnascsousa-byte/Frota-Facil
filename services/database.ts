/**
 * Serviço de banco de dados com Supabase
 * Fornece operações CRUD genéricas para todas as tabelas
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type TableName =
    | 'veiculos'
    | 'motoristas'
    | 'planos'
    | 'contratos'
    | 'pagamentos'
    | 'manutencoes'
    | 'multas'
    | 'sinistros'
    | 'despesas'
    | 'receitas'
    | 'documentos'
    | 'configuracoes'
    | 'profiles';

// =====================================================
// GENERIC CRUD OPERATIONS
// =====================================================

/**
 * Busca todos os registros de uma tabela
 */
export async function getAll<T>(
    table: TableName,
    orderBy: string = 'created_at',
    ascending: boolean = false,
    selectQuery: string = '*'
): Promise<T[]> {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase não configurado, retornando dados vazios');
        return [];
    }

    const { data, error } = await supabase
        .from(table)
        .select(selectQuery)
        .order(orderBy, { ascending });

    if (error) {
        console.error(`Erro ao buscar ${table}:`, error);
        throw error;
    }

    return (data as T[]) || [];
}

/**
 * Busca um registro por ID
 */
export async function getById<T>(table: TableName, id: number | string): Promise<T | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error(`Erro ao buscar ${table}/${id}:`, error);
        throw error;
    }

    return data as T;
}

/**
 * Cria um novo registro
 */
export async function create<T>(table: TableName, data: Partial<T>): Promise<T> {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado');
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Inject user_id if authenticated and missing in data
    const payload = { ...data };
    // @ts-ignore - Dynamic injection of user_id
    if (user && !payload.user_id) {
        // @ts-ignore
        payload.user_id = user.id;
    }

    const { data: result, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error(`Erro ao criar ${table}:`, error);
        throw error;
    }

    return result as T;
}

/**
 * Atualiza um registro existente
 */
export async function update<T>(
    table: TableName,
    id: number | string,
    data: Partial<T>
): Promise<T> {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado');
    }

    const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error(`Erro ao atualizar ${table}/${id}:`, error);
        throw error;
    }

    return result as T;
}

/**
 * Remove um registro
 */
export async function remove(table: TableName, id: number | string): Promise<void> {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado');
    }

    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`Erro ao remover ${table}/${id}:`, error);
        throw error;
    }
}

// =====================================================
// SPECIFIC QUERIES
// =====================================================

/**
 * Busca veículos com filtro de status
 */
export async function getVeiculosByStatus(status: string) {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .eq('status', status)
        .order('modelo');

    if (error) throw error;
    return data || [];
}

/**
 * Busca contratos com dados relacionados
 */
export async function getContratosCompletos() {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('contratos')
        .select(`
            *,
            veiculo:veiculos(id, placa, modelo, marca),
            motorista:motoristas(id, nome, cpf),
            plano:planos(id, nome, valor_semanal)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Busca pagamentos de um contrato
 */
export async function getPagamentosByContrato(contratoId: number) {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('vencimento');

    if (error) throw error;
    return data || [];
}

/**
 * Busca manutenções de um veículo
 */
export async function getManutencoesByVeiculo(veiculoPlaca: string) {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('manutencoes')
        .select('*')
        .eq('veiculo_placa', veiculoPlaca)
        .order('data', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Busca documentos próximos do vencimento
 */
export async function getDocumentosVencendo(diasAntecedencia: number = 30) {
    if (!isSupabaseConfigured()) return [];

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + diasAntecedencia);

    const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .lte('vencimento', dataLimite.toISOString().split('T')[0])
        .order('vencimento');

    if (error) throw error;
    return data || [];
}

/**
 * Busca configurações do usuário atual
 */
/**
 * Busca configurações do usuário atual
 */
export async function getConfiguracoes() {
    if (!isSupabaseConfigured()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }

    // Map flat DB structure to nested AppSettings
    return {
        empresa: {
            nome: data.empresa_nome || '',
            cnpj: data.empresa_cnpj || '',
            endereco: data.empresa_endereco || '',
            telefone: data.empresa_telefone || '',
            email: data.empresa_email || ''
        },
        preferencias: {
            moeda: data.moeda || 'BRL',
            formatoData: data.formato_data || 'DD/MM/YYYY',
            itensPorPagina: data.itens_por_pagina || 10
        },
        alertas: {
            diasCNH: data.alerta_dias_cnh || 30,
            diasDocumentos: data.alerta_dias_documentos || 30,
            diasManutencao: data.alerta_dias_manutencao || 7,
            diasInadimplencia: data.alerta_dias_inadimplencia || 5,
            emailAtivo: data.email_ativo || false
        }
    };
}

/**
 * Atualiza configurações do usuário atual
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateConfiguracoes(config: any) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Map nested AppSettings to flat DB structure
    const dbConfig = {
        user_id: user.id,
        empresa_nome: config.empresa?.nome,
        empresa_cnpj: config.empresa?.cnpj,
        empresa_endereco: config.empresa?.endereco,
        empresa_telefone: config.empresa?.telefone,
        empresa_email: config.empresa?.email,
        moeda: config.preferencias?.moeda,
        formato_data: config.preferencias?.formatoData,
        itens_por_pagina: config.preferencias?.itensPorPagina,
        alerta_dias_cnh: config.alertas?.diasCNH,
        alerta_dias_documentos: config.alertas?.diasDocumentos,
        alerta_dias_manutencao: config.alertas?.diasManutencao,
        alerta_dias_inadimplencia: config.alertas?.diasInadimplencia,
        email_ativo: config.alertas?.emailAtivo
    };

    const { data, error } = await supabase
        .from('configuracoes')
        .upsert(dbConfig)
        .select()
        .single();

    if (error) throw error;

    // Return mapped data (reuse the mapping logic if needed, but for now specific return is fine or verify call site usage)
    return config;
}

// =====================================================
// DASHBOARD AGGREGATIONS
// =====================================================

/**
 * Busca estatísticas para o dashboard
 */
export async function getDashboardStats() {
    if (!isSupabaseConfigured()) {
        return {
            totalVeiculos: 0,
            veiculosLocados: 0,
            veiculosDisponiveis: 0,
            totalMotoristas: 0,
            contratosAtivos: 0,
            receitaMes: 0,
            despesasMes: 0
        };
    }

    try {
        // Total de veículos por status
        const { data: veiculos } = await supabase
            .from('veiculos')
            .select('status');

        const totalVeiculos = veiculos?.length || 0;
        const veiculosLocados = veiculos?.filter(v => v.status === 'Locado').length || 0;
        const veiculosDisponiveis = veiculos?.filter(v => v.status === 'Disponível').length || 0;

        // Total de motoristas ativos
        const { count: totalMotoristas } = await supabase
            .from('motoristas')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Ativo');

        // Contratos ativos
        const { count: contratosAtivos } = await supabase
            .from('contratos')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Ativo');

        // Receita do mês (pagamentos pagos)
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        const { data: pagamentos } = await supabase
            .from('pagamentos')
            .select('valor')
            .eq('status', 'Pago')
            .gte('data_pagamento', inicioMes.toISOString().split('T')[0]);

        const receitaMes = pagamentos?.reduce((sum, p) => sum + (p.valor || 0), 0) || 0;

        // Despesas do mês
        const { data: despesas } = await supabase
            .from('despesas')
            .select('valor')
            .eq('status', 'Paga')
            .gte('data', inicioMes.toISOString().split('T')[0]);

        const { data: manutencoes } = await supabase
            .from('manutencoes')
            .select('valor')
            .eq('status', 'Paga')
            .gte('data', inicioMes.toISOString().split('T')[0]);

        const despesasMes =
            (despesas?.reduce((sum, d) => sum + (d.valor || 0), 0) || 0) +
            (manutencoes?.reduce((sum, m) => sum + (m.valor || 0), 0) || 0);

        return {
            totalVeiculos,
            veiculosLocados,
            veiculosDisponiveis,
            totalMotoristas: totalMotoristas || 0,
            contratosAtivos: contratosAtivos || 0,
            receitaMes,
            despesasMes
        };
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        throw error;
    }
}

// =====================================================
// USER MANAGEMENT (Access Control)
// =====================================================

export async function getAllProfiles(): Promise<{ id: string; email: string; nome: string | null; role: string | null; created_at: string }[]> {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured');
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, nome, role, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar perfis:', error);
        return [];
    }
}

export async function updateProfileRole(userId: string, newRole: 'admin' | 'gerente' | 'operacao'): Promise<void> {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured');
        return;
    }
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) throw error;
    } catch (error) {
        console.error('Erro ao atualizar role:', error);
        throw error;
    }
}

export async function deleteUserProfile(userId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured');
        return;
    }
    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    } catch (error) {
        console.error('Erro ao deletar perfil:', error);
        throw error;
    }
}
