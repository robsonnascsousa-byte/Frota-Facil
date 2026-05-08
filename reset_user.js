import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wehywwjukbbbilmdsqej.supabase.co';
const supabaseAnonKey = 'sb_publishable_B9dGt1HGJUGwMspN7DiCHQ_in0x0UD6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetOrCreateUser() {
    const email = 'admin@frotafacil.com';
    const password = 'FrotaFacil@2026';
    const nome = 'Administrador';

    console.log('=== Reset/Criação de Usuário FrotaFácil ===\n');

    // 1. Tentar login com a senha antiga
    console.log('1. Tentando login com admin@teste.com / password123 ...');
    const { data: oldLogin, error: oldError } = await supabase.auth.signInWithPassword({
        email: 'admin@teste.com',
        password: 'password123'
    });

    if (!oldError && oldLogin.user) {
        console.log('   ✅ Login antigo funcionou! Atualizando senha...');
        const { error: updateErr } = await supabase.auth.updateUser({
            password: password
        });
        if (!updateErr) {
            console.log('   ✅ Senha atualizada com sucesso!');
            console.log(`\n   📧 Email: admin@teste.com`);
            console.log(`   🔑 Nova Senha: ${password}`);
        } else {
            console.log('   ❌ Erro ao atualizar senha:', updateErr.message);
        }
        await supabase.auth.signOut();
    } else {
        console.log('   ❌ Login antigo falhou:', oldError?.message);
    }

    // 2. Tentar criar novo usuário
    console.log(`\n2. Criando novo usuário: ${email} ...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                nome,
                role: 'admin'
            }
        }
    });

    if (signUpError) {
        if (signUpError.message.includes('already registered')) {
            console.log('   ⚠️ Usuário já existe. Tentando login...');
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (!loginError) {
                console.log('   ✅ Login funcionou com a senha atual!');
                console.log(`\n   📧 Email: ${email}`);
                console.log(`   🔑 Senha: ${password}`);
            } else {
                console.log('   ❌ Senha diferente:', loginError.message);
            }
        } else {
            console.log('   ❌ Erro:', signUpError.message);
        }
    } else if (signUpData.user) {
        console.log('   ✅ Usuário criado com sucesso!');
        console.log(`\n   📧 Email: ${email}`);
        console.log(`   🔑 Senha: ${password}`);
        console.log(`   👤 ID: ${signUpData.user.id}`);

        if (signUpData.user.identities?.length === 0) {
            console.log('\n   ⚠️ Email já registrado (identities vazio). Tente login com a senha anterior.');
        }
    }

    console.log('\n=== Fim ===');
}

resetOrCreateUser().catch(console.error);
