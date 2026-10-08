import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '../types';

/** A network failure is an unknown permission, never a different role. */
export async function loadUserRole(
    client: SupabaseClient,
    userId: string,
    signal: AbortSignal,
    timeoutMs = 10000,
): Promise<UserRole> {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) controller.abort();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
        const deadline = new Promise<never>((_, reject) => {
            timeout = setTimeout(() => {
                // Reject first, so abort cannot replace the actionable timeout message.
                reject(new Error('A consulta do seu nível de acesso demorou demais. Tente novamente.'));
                controller.abort();
            }, timeoutMs);
        });
        const request = client.from('profiles').select('role').eq('id', userId)
            .abortSignal(controller.signal).maybeSingle();
        const { data, error } = await Promise.race([request, deadline]);
        if (error) throw new Error('Não foi possível consultar seu nível de acesso. Tente novamente.');
        if (!data || !['admin', 'gerente', 'operacao'].includes(data.role)) {
            throw new Error('Seu perfil de acesso não está configurado. Solicite a verificação ao administrador.');
        }
        return data.role as UserRole;
    } finally {
        clearTimeout(timeout);
        signal.removeEventListener('abort', cancel);
    }
}
