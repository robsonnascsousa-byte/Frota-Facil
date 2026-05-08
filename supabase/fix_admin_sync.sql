-- =====================================================
-- FIX DEFINITIVO: SINCRONIZAÇÃO DE USUÁRIOS E PERMISSÕES
-- =====================================================

-- 1. Garante que a coluna role existe na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' 
CHECK (role IN ('admin', 'gerente', 'operacao'));

-- 2. Cria ou atualiza a função que sincroniza novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nome', ''), 
    'admin' -- Todos novos usuários começam como admin neste setup inicial
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = COALESCE(EXCLUDED.nome, profiles.nome);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garante que o trigger está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. SINCRONIZA USUÁRIOS EXISTENTES (O passo mais importante agora)
-- Isso vai inserir você e qualquer outro usuário que já se cadastrou na tabela profiles
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 5. Verifica se funcionou
SELECT id, email, role FROM public.profiles;
