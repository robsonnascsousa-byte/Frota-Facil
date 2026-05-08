
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wehywwjukbbbilmdsqej.supabase.co';
const supabaseAnonKey = 'sb_publishable_B9dGt1HGJUGwMspN7DiCHQ_in0x0UD6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAdmin() {
    console.log('Verificando usuários na tabela profiles...');
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, nome, role');

        if (error) {
            console.error('Erro ao buscar perfis:', error.message);
            return;
        }

        if (!data || data.length === 0) {
            console.log('Nenhum usuário encontrado na tabela profiles.');
            return;
        }

        console.table(data);

        const adminExists = data.some(user => user.role === 'admin');
        if (adminExists) {
            console.log('\n✅ Usuário(s) encontrado(s) com papel "admin":', data.filter(u => u.role === 'admin').map(u => u.email).join(', '));
        } else {
            console.log('\n❌ Nenhum usuário encontrado com o papel "admin".');
        }
    } catch (e) {
        console.error('Erro inesperado:', e);
    }
}

verifyAdmin();
