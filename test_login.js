
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wehywwjukbbbilmdsqej.supabase.co';
const supabaseAnonKey = 'sb_publishable_B9dGt1HGJUGwMspN7DiCHQ_in0x0UD6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
    const email = 'admin@teste.com';
    const password = 'password123';

    console.log(`Testando login para: ${email} ...`);

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('❌ Falha no login:', error.message);
        } else {
            console.log('✅ Login bem sucedido!');
            console.log('User ID:', data.user.id);
            console.log('Email:', data.user.email);
        }
    } catch (e) {
        console.error('Erro inesperado:', e);
    }
}

testLogin();
