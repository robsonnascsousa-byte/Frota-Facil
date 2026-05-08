
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wehywwjukbbbilmdsqej.supabase.co';
const supabaseAnonKey = 'sb_publishable_B9dGt1HGJUGwMspN7DiCHQ_in0x0UD6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
    const email = 'admin@teste.com';
    const password = 'password123';
    const nome = 'Admin Teste';

    console.log(`Tentando criar usuário: ${email} ...`);

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nome,
                    role: 'admin' // Tentando passar role na criação, mas pode ser ignorado pelo trigger
                }
            }
        });

        if (error) {
            console.error('Erro ao criar usuário:', error.message);
            // Se o usuário já existe, tentar fazer login para verificar se a senha está correta (não podemos recuperar a senha, mas podemos testar)
            if (error.message.includes('already registered')) {
                console.log('Usuário já existe. Tentando login com a senha padrão...');
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (loginError) {
                    console.error('Falha no login com senha padrão:', loginError.message);
                } else {
                    console.log('✅ Login com senha padrão funcionou!');
                }
            }
            return;
        }

        if (data.user) {
            console.log('✅ Usuário criado com sucesso!');
            console.log(`Email: ${email}`);
            console.log(`Senha: ${password}`);
            console.log('ID:', data.user.id);

            // Tentar fazer update para garantir role admin
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', data.user.id);

            if (updateError) {
                console.log('Aviso: Não foi possível definir role admin via update direto (provavelmente RLS). Use o SQL Editor do Supabase se necessário.');
            } else {
                console.log('Role admin definido (ou update enviado).');
            }

        } else {
            console.log('Usuário criado, mas sem dados retornados (verifique confirmação de email se necessário).');
        }

    } catch (e) {
        console.error('Erro inesperado:', e);
    }
}

createTestUser();
