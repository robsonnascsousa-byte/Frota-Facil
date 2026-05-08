-- =====================================================
-- FIX DEFINITIVO: SINCRONIZAÇÃO DE USUÁRIOS E PERMISSÕES (V2)
-- =====================================================

-- 1. Garante que a coluna role existe na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'operacao' 
CHECK (role IN ('admin', 'gerente', 'operacao'));

-- 2. Cria ou atualiza a função que sincroniza novos usuários (Lê o role dos metadados)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nome', ''), 
    COALESCE(new.raw_user_meta_data->>'role', 'operacao') -- Pega o papel enviado no cadastro
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = COALESCE(EXCLUDED.nome, profiles.nome),
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garante que o trigger está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. SINCRONIZA USUÁRIOS EXISTENTES
-- (Opcional: Se você quiser garantir que todos existentes sejam Admin, rode a linha abaixo)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'seu-email-aqui';
